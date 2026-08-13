# I Deleted My Whole Cluster on Purpose

*Rebuilding a homelab Kubernetes cluster from a backup script — and ending up with an identity layer
that reaches into AWS.*

Two weeks ago my cluster was one Ubuntu VM doing everything: control plane, workloads, ingress, CA,
storage. It worked. It had also accumulated three years of decisions I'd stopped being able to
justify, an ingress controller I'd already migrated away from but never removed, and a Helm release
pointing at a service that hadn't existed for months.

So I backed it up and deleted it.

This is what replaced it, what the migration actually looked like, and the part I find most
interesting — that every pod now gets an X.509 identity from the same CA that AWS already trusts,
which turns a homelab into an extension of my cloud IAM boundary.

---

## The architecture

Three nodes on a single Proxmox host, split by what they're actually for:

```
┌─────────────────────────── Proxmox host ────────────────────────────────┐
│                                                                         │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────────────┐  │
│  │  LXC container   │  │  VM              │  │  VM + PCIe passthrough│  │
│  │  control plane   │  │  CPU worker      │  │  GPU worker           │  │
│  │                  │  │                  │  │                       │  │
│  │  k3s server      │  │  k3s agent       │  │  k3s agent            │  │
│  │  etcd/sqlite     │  │                  │  │  nvidia runtime       │  │
│  │  OIDC apiserver  │  │  budget app      │  │  device plugin        │  │
│  └────────┬─────────┘  └────────┬─────────┘  └───────────┬───────────┘  │
│           └─────────────────────┴────────────────────────┘              │
│                                 │                                       │
└─────────────────────────────────┼───────────────────────────────────────┘
                                  │
   ┌──────────────────────────────┴──────────────────────────────┐
   │                        in-cluster                           │
   │                                                             │
   │   MetalLB (L2)  ──►  Envoy Gateway  ──►  HTTPRoutes         │
   │                           │                                 │
   │                      cert-manager ──► step-ca (two-tier)    │
   │                           │                │                │
   │                        server certs     autocert webhook    │
   │                                            │                │
   │                                    per-pod client certs     │
   └─────────────────────────────────────────────────────────────┘
```

**Why LXC for the control plane.** It boots in about a second, costs almost no memory, and the
control plane needs no kernel modules of its own. Workers are full VMs because they need real
isolation and, in one case, a physical GPU.

**Why the GPU is a VM.** PCIe passthrough only works cleanly with a VM. The GPU node runs the local
model that backs my [daily threat briefing](blog.html?post=llmbriefing) and the LLM UI; the CPU node
runs everything that would otherwise sit idle on expensive silicon.

**Ingress is Envoy Gateway, not an Ingress controller.** k3s ships Traefik by default and I disable
it, along with the built-in load balancer. MetalLB hands out addresses from a small reserved range in
the lab subnet, and Envoy Gateway implements the Gateway API — `Gateway` and `HTTPRoute` objects
instead of an annotation soup on `Ingress`. This was a migration in its own right, done before the
rebuild; the rebuild just meant I finally deleted the leftovers.

**PKI is a two-tier step-ca.** Root offline, intermediate online in the cluster, both from my
[YubiKey root CA setup](blog.html?post=yubica). cert-manager talks to it over ACME for anything with a
hostname. Everything internal is real HTTPS with a CA my machines actually trust — no browser warnings,
no `--insecure`, no self-signed exceptions to remember.

---

## The interesting part: every pod gets a certificate

The piece I care about most is the smallest to describe. A mutating admission webhook watches for a
single annotation on a pod spec. When it sees one, it injects an init container and a sidecar, and
that pod starts life with a private key and a certificate signed by my intermediate CA — CN taken from
the annotation, renewed automatically for as long as the pod lives, never written to a Secret and never
leaving the pod's own volume.

```
pod created with annotation
        │
        ▼
 admission webhook ──► init container ──► requests cert from step-ca
        │                                    (one-time bootstrap token)
        ▼
 sidecar renews on a timer ──► /var/run/autocert/{cert,key,root}.pem
```

Opting a workload in is one line in the pod template. Opting out is deleting it. There's no
per-service key material in git, no secret to rotate, no credential that outlives the process
holding it.

Inside the cluster, this gives me mutual TLS between services where I want it — both sides present a
certificate, both verify against the same root, and identity is the certificate subject rather than
"whatever IP the request came from". I verified it the boring way, with a manual TLS handshake
against a workload, checking the chain validated to depth two and the peer certificate carried the
name I expected.

That's useful on its own. But it's not the reason I built it.

---

## Where it gets useful: on-prem pods with AWS IAM roles

I already run [AWS IAM Roles Anywhere with X.509 device identity](blog.html?post=macoslogs) for my
laptops. My intermediate CA is registered in AWS as a **Trust Anchor**: AWS will exchange a
certificate signed by that CA for temporary IAM credentials, and the IAM trust policy can be
conditioned on the certificate's subject.

The consequence is worth stating plainly:

> **The certificate autocert injects into a pod is issued by the same CA that AWS already trusts.
> A pod in my homelab can assume an AWS role with no static credentials anywhere in the path.**

The workload calls the signing helper with the certificate it was born holding, gets back credentials
that expire within the hour, and uses them like any other AWS caller. And because AWS surfaces the
certificate subject as a principal tag, the policy can scope access dynamically:

```json
{
  "Effect": "Allow",
  "Action": "s3:PutObject",
  "Resource": "arn:aws:s3:::example-bucket/${aws:PrincipalTag/x509Subject/CN}/*"
}
```

One role, many workloads, each confined to its own prefix by its own certificate name. Adding a
workload means issuing it a name — which the webhook already does at pod creation. Removing one means
revoking at the CA. AWS doesn't change.

What that adds up to:

| | |
|---|---|
| **Identity source** | My CA — not an AWS access key, not a long-lived secret |
| **Credential lifetime** | Minutes to an hour, refreshed from the cert |
| **Revocation** | At the CA, once, for cloud and on-prem simultaneously |
| **Blast radius** | One certificate subject, scoped by policy condition |
| **Audit** | The certificate subject appears in CloudTrail |

The same X.509 identity now covers laptops, on-prem pods, and AWS API calls. That's an IAM layer that
spans the boundary rather than stopping at it — and it took a webhook and a Trust Anchor, not a
federation product.

---

## The migration

The rebuild was the easy half. Not losing anything was the hard half.

I wrote a backup script before touching anything — one command that captures Helm values per release,
rendered manifests, custom resources, RBAC, CRDs, webhook configurations, the k3s server
configuration, and the persistent volume contents. It optionally quiesces workloads first: scale the
owning controller to zero, copy the volume at the filesystem level, scale it back, with a single
cleanup trap so a failure mid-copy doesn't leave things scaled down.

Then everything came back in dependency order:

```
k3s → MetalLB → Envoy Gateway → cert-manager → step-ca → autocert → DNS → apps
```

That order matters more than it looks. It's also not the order my own install script had.

### What the rebuild taught me

Four things nearly cost me the cluster, and every one of them was invisible until the restore:

**Configuration hides in more than one file.** My OIDC settings weren't in the k3s config file at all
— they were in a systemd drop-in that my first backup didn't capture. The cluster would have rebuilt
perfectly and locked me out of it. Back up the *unit*, not just the config.

**Statefulness isn't only in `volumes`.** My quiesce logic looked for pods mounting a PVC. StatefulSets
declare storage through volume claim templates instead, so my CA's database was going to be copied
live, mid-write. A backup that silently produces a corrupt database is worse than no backup.

**A backup you haven't restored is a hypothesis.** The first PVC pass copied one volume out of four
and reported success — the copy loop was reading from the same stream the remote command was
consuming. Nothing errored. The only reason I know is that I looked at the sizes.

**Ordering constraints only appear when the cluster is empty.** cert-manager was configured with
Gateway API support enabled, which means it needs those CRDs at startup. On a running cluster they
were always already there. On an empty one it crash-looped until I installed the gateway first.

The GPU had its own surprise: a current-generation card refuses to initialise against the
proprietary kernel modules and requires the open ones. The driver installs, loads, binds — and then
reports no devices found. The answer was in `dmesg`, one line, saying exactly that.

### The repository split

I also split the repo while I was in there. Charts are public; values are a private submodule mounted
inside them. The public side ships `values.example.yaml` with every real identifier replaced by a
placeholder, so the charts are readable and reusable without leaking a tenant ID or a token, and the
private side holds exactly one thing: what makes it *my* cluster.

---

## Pros and cons, honestly

**What got better**

- Failures are now isolated. A GPU driver problem doesn't take the API server with it.
- Scheduling is intentional — GPU work lands on the GPU node because it asks for the resource.
- The whole cluster is described by charts and values in git. The rebuild proved that, because the
  rebuild *was* that.
- Every internal service has a real certificate, and every pod can have an identity.
- Backup and restore are one script each, and both have now been run in anger.

**What got worse**

- Three nodes is three times the patching, three kubelets, three sets of logs.
- It's one physical host. Node-level fault tolerance is real; host-level is a story I'm telling
  myself.
- A single control plane node with local storage is still a single point of failure.
- Local-path storage is node-affine — a pod with a volume is pinned to the node holding it.
- More moving parts: gateway, CA, webhook, device plugin. Each is another thing that can be
  misconfigured at 11pm.

I think that trade is right for a lab whose purpose is to be a place to try things. I wouldn't ship
this shape to production without a second host and real shared storage.

---

## How it was built

I architected this. I decided the node topology, the ingress migration, the PKI design, the identity
model, and the order things had to come back in. I also decided what the risks were and which ones I
was willing to take.

An LLM executed it — and executed a great deal of it, across a session that ran for hours: writing
the backup script, provisioning the virtual machines, installing and configuring every component,
diagnosing failures, and restoring the data. The working model was the same one I use for
[everything else I build with models](blog.html?post=llmbriefing): the expensive reasoning does the
design and the diagnosis, mechanical work gets delegated to a faster model, and verification is a
separate step from the work being verified.

What that felt like in practice: I made the decisions, and the failures still came to me. When the
GPU node hung at boot with no console output, the fix was a design call — the passed-through card had
become the primary display and the firmware was looking for a video BIOS that didn't exist. When a
restored application refused its own values file, it was because the chart's schema had changed shape
since the backup and someone had to decide whether to migrate the values or pin the chart.

Two habits mattered more than any prompt. **Verify claims against the system, not the transcript** —
more than once I was told something was fine when the underlying state said otherwise, and more than
once I was told something was broken when it wasn't. And **check the thing you didn't ask about** —
the PVC copy that reported success while doing a quarter of the work would have passed any test that
trusted the exit code.

An LLM is very good at the part where you know what you want and it's twenty steps of yaml, ssh and
package management away. It's not a substitute for knowing what you want.

---

## What I'd tell someone doing the same

- **Restore before you destroy.** Every backup I had was fine right up until I read it carefully.
- **Write the rebuild order down, then test it on something empty.** Dependency constraints are
  invisible on a running system.
- **Back up the platform, not just the apps.** Auth configuration, CRDs, RBAC, and the service unit
  are the parts that lock you out when they're missing.
- **Split secrets from structure early.** It makes the interesting half of your infrastructure
  publishable.
- **Give workloads identity, not credentials.** A certificate that expires is easier to live with
  than a key that doesn't.

The rebuild took a day. The part that will still matter in a year is that a pod in my basement and a
laptop on my desk now authenticate to AWS the same way, from the same root of trust, with nothing
static in between.
