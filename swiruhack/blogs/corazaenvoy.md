# Coraza WAF on Envoy Gateway

*Putting the OWASP Core Rule Set in front of a whole cluster with one Kubernetes manifest — no
sidecars, no second proxy, no changes to the applications.*

Everything in my [homelab cluster](blog.html?post=k3scluster) sits behind a single Envoy Gateway:
one load balancer address, one TLS listener, five hostnames. That's a natural place to put a web
application firewall — one filter, everything behind it.

This post covers what Coraza is, how it attaches to Envoy, how to install and configure it, and a
simple test to prove it's working.

---

## What Coraza is

[Coraza](https://coraza.io) is an OWASP project: a web application firewall engine written in Go.
Two things make it interesting.

**It speaks SecLang.** That's the ModSecurity configuration language, which means it runs the
**OWASP Core Rule Set** unmodified — the same generic ruleset for SQL injection, XSS, path
traversal, RCE and so on that people have been running on ModSecurity for years. You aren't learning
a vendor DSL.

**It compiles to WebAssembly.** Coraza ships a build targeting the **proxy-wasm** ABI, which is the
plugin interface Envoy exposes for HTTP filters. So it loads *into* Envoy rather than sitting in
front of it.

CRS is anomaly-scoring rather than a list of independent blocks: each matching rule contributes
points, and a request is rejected when the total crosses a threshold. The default inbound threshold
is 5, and a critical-severity rule such as SQL injection contributes exactly 5.

---

## How it attaches to Envoy

The Wasm module is loaded into Envoy's HTTP filter chain, inside the same worker that was already
going to forward the request. No sidecar, no extra network hop, nothing to change in the apps.

```
                     ┌──────────────── Envoy pod ─────────────────┐
  client ──TLS───────►  listener :443                             │
                     │      │                                     │
                     │      ▼                                     │
                     │  ┌────────────────────┐                    │
                     │  │ coraza wasm filter │ ◄── OWASP CRS      │
                     │  └─────────┬──────────┘     compiled in    │
                     │            │ pass                          │
                     │            ▼                               │
                     │        HTTPRoute ──► upstream Service      │
                     └────────────────────────────────────────────┘
                                  │ block
                                  ▼
                            403, upstream never contacted
```

Envoy Gateway exposes this through the **`EnvoyExtensionPolicy`** CRD, which attaches a Wasm module
to a `Gateway` or an `HTTPRoute`. The controller pulls the module from an OCI registry, caches it,
and serves it to the data plane internally — so the Envoy pods don't need registry credentials.

**Attach at the Gateway, not per route.** Envoy Gateway doesn't share Wasm VMs across policies yet,
so a policy per `HTTPRoute` loads a separate copy of the ruleset for each one. One Gateway-scoped
policy with per-host behaviour inside it is much cheaper. Budget roughly 500–600 MB of extra RSS on
the Envoy pod for a full CRS load.

---

## Installing it

You need Envoy Gateway already running with a `Gateway` and at least one `HTTPRoute`. I'm on Envoy
Gateway v1.7.1 with Envoy 1.37.1. No CRDs to install — `EnvoyExtensionPolicy` ships with Envoy
Gateway, and the Wasm cache server is enabled by default.

Check the CRD is there:

```console
$ kubectl api-resources --api-group=gateway.envoyproxy.io | grep -i extension
envoyextensionpolicies   eep   gateway.envoyproxy.io/v1alpha1   true   EnvoyExtensionPolicy
```

Then apply the policy. This is the whole installation:

```yaml
apiVersion: gateway.envoyproxy.io/v1alpha1
kind: EnvoyExtensionPolicy
metadata:
  name: coraza-waf
  namespace: envoy-gateway-system    # must be the Gateway's namespace
spec:
  targetRefs:
    - group: gateway.networking.k8s.io
      kind: Gateway
      name: envoy-gateway
  wasm:
    - name: coraza
      rootID: coraza-waf
      failOpen: true
      code:
        type: Image
        pullPolicy: IfNotPresent
        image:
          url: ghcr.io/corazawaf/coraza-proxy-wasm:0.6.0
          sha256: 65d6009b9da2e8965e592a08b74a86725435fc01aa39c756dce0bd5ea64b3f4e
      config:
        default_directives: detect
        directives_map:
          detect:
            - "Include @recommended-conf"
            - "Include @crs-setup-conf"
            - "SecRuleEngine DetectionOnly"
            - "Include @owasp_crs/*.conf"
```

The Core Rule Set is compiled into the module, so `@owasp_crs/*.conf` needs no ConfigMap, volume or
init container. Version 0.6.0 carries Coraza 3.3.3 and CRS 4.14.0.

Confirm it was accepted:

```console
$ kubectl get envoyextensionpolicy -n envoy-gateway-system coraza-waf \
    -o jsonpath='{.status.ancestors[0].conditions[0].type}={.status.ancestors[0].conditions[0].status}'
Accepted=True
```

### Two things that will bite you

**Pin the per-platform digest, not the index digest.** The image is a multi-platform OCI index.
Envoy Gateway verifies the **child manifest** for linux/amd64, not the index. Get it with:

```console
$ crane digest --platform linux/amd64 ghcr.io/corazawaf/coraza-proxy-wasm:0.6.0
```

Use the index digest instead and the policy is rejected with a checksum mismatch — which, to its
credit, prints the digest it actually wanted.

**`Accepted=True` only means the YAML was valid.** It does not mean the data plane loaded the
module. If the fetch fails, Envoy gives up quickly and does not retry. Always confirm in the Envoy
container log that there's no `Plugin coraza failed to load`. To force a reload, change
`wasm[].name` — Envoy treats a renamed filter as new and builds a fresh VM.

---

## Configuring it

### Detection before blocking

`SecRuleEngine` takes three values, and this is the most important setting in the file:

| Value | Behaviour |
|---|---|
| `DetectionOnly` | Evaluates rules, logs matches, **blocks nothing** |
| `On` | Blocks when the anomaly score crosses the threshold |
| `Off` | Disabled |

Start on `DetectionOnly` and leave it there until you've read the log for a while. CRS at default
paranoia will match things you didn't expect, and finding that out through 403s on live traffic is
the wrong way round.

### Per-application behaviour

A gateway fronting several apps needs different answers per app. Coraza's proxy-wasm build supports
`per_authority_directives`, which maps the `Host` header to a named directive set:

```yaml
config:
  default_directives: detect
  per_authority_directives:
    falco.kscsc.local:      block
    myfinance.kscsc.local:  block
    bloodhound.kscsc.local: detect
    ca.kscsc.local:         disabled
  directives_map:
    disabled:
      - "SecRuleEngine Off"
    detect:
      - "Include @recommended-conf"
      - "Include @crs-setup-conf"
      - "SecRuleEngine DetectionOnly"
      - "Include @owasp_crs/*.conf"
    block:
      - "Include @recommended-conf"
      - "Include @crs-setup-conf"
      - "SecRuleEngine On"
      - "Include @owasp_crs/*.conf"
```

Any host without an entry falls back to `default_directives`, so a newly routed app is logged rather
than blocked until someone looks at it.

Two of those choices are deliberate. **step-ca is off entirely** — it issues every certificate in
the cluster over ACME, including the one on the gateway running this WAF, so a false positive there
breaks renewal everywhere rather than breaking one app. **BloodHound stays in detection** because
`@recommended-conf` caps request bodies at 128 KiB and rejects anything larger, and BloodHound
ingests multi-megabyte JSON.

Deciding what you will *not* protect is part of the design.

---

## A simple test

`myfinance` is a budget tracker — frontend on `/`, API on `/api` — and it's set to `block`.

Normal traffic is untouched:

```console
$ curl -s -o /dev/null -w "HTTP %{http_code}  %{size_download} bytes  %{time_total}s\n" \
    https://myfinance.kscsc.local/
HTTP 200  2264 bytes  0.021982s
```

A SQL injection attempt is not:

```console
$ curl -si "https://myfinance.kscsc.local/api/accounts?id=1'%20OR%20'1'='1"
HTTP/2 403
date: Tue, 22 Sep 2026 17:19:59 GMT
```

XSS and path traversal, same result:

```console
$ curl -s -o /dev/null -w "%{http_code}\n" "https://myfinance.kscsc.local/?q=<script>alert(1)</script>"
403
$ curl -s -o /dev/null -w "%{http_code}\n" "https://myfinance.kscsc.local/?file=../../../../etc/passwd"
403
```

The matching rule, from the Envoy container log:

```
Coraza: Warning. SQL Injection Attack Detected via libinjection
  [file "@owasp_crs/REQUEST-942-APPLICATION-ATTACK-SQLI.conf"] [id "942100"]
  [data "Matched Data: s&sos found within ARGS_GET:id: 1' OR '1'='1"]
  [severity "critical"] [ver "OWASP_CRS/4.14.0"] [tag "paranoia-level/1"]
  [uri "/api/accounts?id=1%27%20OR%20%271%27=%271"]
```

Because CRS is score-based, `942100` doesn't block on its own — it contributes points, and a
separate rule makes the decision:

```
Coraza: Access denied (phase 1). Inbound Anomaly Score Exceeded in phase 1 (Total Score: 20)
  [file "@owasp_crs/REQUEST-949-BLOCKING-EVALUATION.conf"] [id "949111"]
```

The detail I like most is in Envoy's own access log for that request:

```json
{ "response_code": 403,
  "x-envoy-origin-path": "/?file=../../../../etc/passwd",
  "upstream_host": null,
  "duration": 4 }
```

`upstream_host` is `null`. The application was never contacted at all — the request died at the
edge in four milliseconds.

---

## Where to go next

That's a working WAF: one manifest, the full Core Rule Set, per-application policy, and blocking
that provably never reaches the backend.

What it isn't yet is *tuned*. Running CRS against real traffic raises questions this post
deliberately skips — how to handle an app whose normal input looks like an attack, what the false
positives actually cost, and how to verify the filter is inspecting everything it should rather than
just the requests you happened to test. Those are the next post.

For now: install it, leave it in `DetectionOnly`, and go and read the log.
