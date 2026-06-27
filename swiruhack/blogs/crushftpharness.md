# Building an Agentic Pentest Harness — Notes From Pointing One at CrushFTP

*A write-up on the architecture of a tiered multi-agent security-testing harness: how it's wired,
why the model tiers are split the way they are, the "separation of powers" that keeps it honest, and
— most usefully — the things that actually broke when I ran it for real.*

This post is about the **harness**, not the bugs. [CrushFTP](https://www.crushftp.com) 11 was just the crash-test dummy. If you
want the findings, they're a single paragraph near the end; everything else is engineering.

> **Scope & ethics.** Everything ran against a **local, self-owned** CrushFTP instance in Docker —
> no third-party systems. Binary analysis is permitted by the CrushFTP license (it preserves
> *"reverse engineering"* as fair use).

---

## Why build a harness at all

A single "do a pentest" prompt against a big model gives you a confident wall of text that mixes
real observations, plausible-sounding inferences, and outright hallucinations — and you can't tell
which is which. Vendors have learned to bin exactly this; they get AI reports daily and the
hardcoded-key finding is *always* item one.

So the goal wasn't "an AI that finds bugs." It was **an AI workflow you can trust the *output* of** —
one that gathers broadly but only surfaces claims that survived adversarial review, with verbatim
evidence attached. That requirement drove every design choice below.

---

## The architecture

### 1. The target rig
Boring on purpose, because the target should be reproducible and disposable:

- One Docker image: CrushFTP 11 on `eclipse-temurin:21-jdk`, bound to **localhost only**, exposing
  the web admin UI, SFTP, FTP and WebDAV.
- `init.sh` builds/runs it, waits for health, and prints a **target map** the agents consume.
- JARs are decompiled with **CFR** into a source tree for static analysis.
- Dynamic side is driven through **MCP**: Burp (raw HTTP crafting, Collaborator) and Playwright
  (the JS-heavy admin SPA). Paramiko handles SFTP scripting.

Nothing clever here — the cleverness is in who looks at it.

### 2. Tiered models: match the tier to the cognition
The central bet: **most pentest work is cheap gathering; only a little is expensive judgement.** So
split the labour by the cognition each step actually needs.

```
enumerate (Haiku)  →  analyze + self-verify (Sonnet)  →  adjudicate / challenge (Opus)  →  PoC (live)
 raw inventories       proposed findings + evidence       CONFIRMED / NEEDS-PoC / REJECTED   proof
```

- **Haiku — the enumerator.** Deterministic, single-correct-answer jobs only: run the decompiler,
  build call-site / endpoint / sink inventories, bulk greps, encode/decode. *No judgement.* It
  produces raw material; it never decides whether anything is a bug.
- **Sonnet — the analyst / proposer.** Reads the code and live responses, forms hypotheses, and runs
  a **self-verification gate** before writing anything down.
- **Opus — the adjudicator.** Takes the opposite stance to the proposer: assume each finding is
  wrong until its own evidence forces agreement. Verify the cited code says what's claimed, hunt the
  guard the analyst missed, then rule CONFIRMED / NEEDS-PoC / REJECTED.

The orchestrator (also Opus) spawns these as **async subagents**, each pinned to its model tier, each
handed a role brief and the shared protocol. A subagent's transcript stays out of the orchestrator's
context — only its final report comes back — which keeps the coordinator's context clean across a
long engagement.

### 3. Separation of powers — the load-bearing idea
The rule that makes the whole thing work: **the agent that *finds* a bug is never the agent that
*confirms* it.**

A single agent that both proposes and ratifies its own findings will talk itself into false
positives — it's motivated to have found something. Splitting proposer (Sonnet) from disposer (Opus)
turns "I think this is exploitable" into "prove it, against an adversary." Concretely, the
adjudicator's job description is *adversarial*: falsify first.

### 4. The validation protocol — one contract for every tier
A short shared document every agent obeys:

- **Quote or drop.** No claim exists without a verbatim quote of its ground truth (the exact
  decompiled `file:line`, or the raw HTTP response bytes).
- **Re-open the source before asserting.** Decompiled code misleads; your memory of it is not
  evidence. Re-read the cited lines *this pass*.
- **Observed vs inferred.** Label every statement. "Calls `Runtime.exec` on line 412" is observed;
  "therefore RCE" is inferred and must name its assumptions.
- **Hunt the guard before claiming impact.** The #1 false positive is a mitigation that exists.
- **Calibrate confidence.** "I couldn't find a guard" ≠ "there is no guard."
- **Self-disclosure doesn't count.** If your test leaked *your own* test account's data, it's not a
  finding. (This one mattered — see below.)

---

## What actually broke (the useful part)

A glossy "my AI pipeline is amazing" post is worthless. Here's what went wrong in practice and what I
changed.

**Agents don't reliably persist their work.** The RE and dynamic agents both produced excellent
findings *in their final chat message* and never wrote the files I asked for. Lesson: have the
orchestrator **capture and persist** every subagent's output itself, and instruct agents to write
**incrementally** (create the file first, append as you go) rather than batching at the end.

**Long async runs stall silently.** One agent went quiet mid-run; what looked like a hang was a
usage-limit pause that never resumed, with no output written. Lesson: don't poll transcripts (you
overflow your own context); instead **watch a lightweight liveness signal** — output-file growth and
the *latest* timestamp in the transcript tail — and treat "timestamp not advancing + no completion"
as the stall signature. And, again, incremental writes so a pause doesn't lose everything.

**Haiku is the wrong tier for judgement — and that's fine if you scope it.** Asked to "analyze
exploitability," Haiku flails. Asked to "enumerate every call site of this function with surrounding
context and write it to a file," it's fast, cheap, and correct. When a teammate said *"can you give
this to Haiku?"* the honest answer was: yes — for the **enumeration**, then Sonnet reasons over its
map, then Opus challenges. Respecting the tier boundary is the difference between useful and useless.

**Live setup is the real time sink.** Provisioning a properly *isolated* multi-tenant test (so any
"cross-tenant access" is unambiguously a product bug and not my misconfig) ate more effort than the
analysis. Hand-editing config didn't take; it had to go through the product's own admin layer. The
meta-lesson: **a sloppy test environment manufactures false positives**, so the setup deserves the
same rigour as the attack.

**The separation of powers earned its keep — twice.** The adjudicator rejected two confident Sonnet
findings:
- *"Any authenticated user can read the server config."* → **False.** A normal file-transfer user
  gets `Access Denied`; the agent had hand-granted its test account an admin token. The accurate
  scope was much narrower.
- *"SFTP username traversal gives cross-tenant access."* → **False.** Standing up a genuine second
  tenant group showed cross-group auth simply fails; the "traversal" collapses to a basename inside
  the connection's own group. The earlier "successes" were same-group users all along.

Both were *negative* results — disproving our own scary claims — and they are the most valuable thing
the harness produced. An AI pentester that can't do this just generates confident nonsense.

---

## The findings, briefly (so you know it produced real output)

In one paragraph: the harness confirmed that CrushFTP stores integration secrets (DB/SMTP/SSO/S3/PGP
passphrases, 2FA seeds) under a **hardcoded, publicly-derivable default DES key**, and that **any
admin-area account — including read-only `(PREF_VIEW)`/`(SERVER_VIEW)` roles** — can read those
secrets via the config API and decrypt them offline. The vendor **rejected it as by-design** (their
cryptography arguments were largely correct — credentials a server uses unattended must be stored
reversibly) but **added a clear note to their hardening docs** stating that *"even view accounts can
see the values… the encryption is mainly cosmetic."* For a known, by-design behaviour, that
documentation outcome is the right result — and the harness also produced a clean set of *negatives*
(patched CVEs, a robust path-canonicalizer, a solid VFS jail, modern admin-panel TLS) that made the
report credible.

---

## Lessons for building these

- **Separate proposing from disposing.** This is the single highest-leverage design choice. Without
  an adversarial adjudicator, you ship hallucinations.
- **Tier by cognition, not by cost alone.** Haiku for deterministic gathering, Sonnet for grounded
  reasoning, Opus for adversarial judgement. Mis-tiering (Haiku doing judgement, Opus doing greps)
  wastes money *and* quality.
- **Make evidence mandatory and re-verified.** "Quote or drop" + "re-open the source this pass" kills
  most confabulation at the source.
- **Treat the test environment as part of the attack surface.** A mis-provisioned lab fabricates
  findings; isolation rigour is not optional.
- **Engineer for failure: persist incrementally, watch liveness, never trust a single async run.**
- **Optimise for trustworthy output, not finding count.** The negatives and the honest scoping are
  what make a vendor read the next report instead of binning it.

The uncomfortable truth is that the hard part of agentic security work isn't getting a model to
*find* things — it's building the scaffolding that stops it from lying to you. The findings were
ordinary; the harness that could tell which of them were real is the interesting artifact.

*The harness earns the human's time; it doesn't replace their judgement. Vendors are drowning
in AI noise, so the deliverable can never be the model's raw output. Every run has to end with a
human doing the context-specific risk analysis, deciding what's even worth reporting, and standing
behind the few findings that are — because a tired vendor reads a name they can argue with, not a
transcript.*

---

*Thanks to the CrushFTP team for engaging seriously and updating their documentation. Testing was
performed against a local, self-owned instance under the terms of the CrushFTP license.*
