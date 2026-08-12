# I Let an LLM Do My Security Reading — But Only Where It Earns Its Keep

*How a local model, 90 RSS feeds and a lot of cheap filtering produce a daily threat briefing I
actually trust.*

This is a companion piece to the [CrushFTP harness write-up](blog.html?post=crushftpharness) — same
underlying conviction, different problem. There, the question was how to stop an agent hallucinating
findings. Here it's how to stop one hallucinating the news.

---

## The problem with reading the news

Security news is a firehose with a terrible signal-to-noise ratio. Ninety feeds — vendor advisories,
national CERTs, threat-intel labs, the big security newsrooms — produce a few hundred items a day,
and most of them are the same six stories told six times, wrapped in roundups, syndicated, and
re-syndicated. The work isn't reading. The work is deciding what's worth reading, and then finding
the thing the article is *about*: the advisory, the research writeup, the CVE record.

That's a judgement task, which is exactly what LLMs are good at. It's also an enormous volume task,
which is exactly what LLMs are bad at — slow, expensive, and prone to confidently making things up
when you ask them to summarize the world. So I built a pipeline around a simple rule:

> **Cheap deterministic code narrows the field, the model is only asked questions that genuinely
> require judgement, and every model verdict that affects published output gets verified.**

The result is a daily briefing: the ten stories that mattered, each with a real primary source, each
summarized in a few sentences, published as a post. A full run over ~260 articles takes about two and
a half minutes on a single self-hosted GPU box.

---

## The funnel: narrow first, think later

The pipeline is a funnel, and the LLM doesn't get to see the wide end of it.

```
  90 feeds        ~260 new articles
     │                   │
     ▼                   ▼
┌──────────┐      ┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│  fetch   │─────►│  dedup +    │─────►│  embed +     │─────►│ pre-filter  │
│ parallel │ 304  │  seen-state │ TTL  │  cluster     │ cos  │ (non-LLM)   │
│ ETag/LM  │      │  14 days    │      │  MiniLM/ONNX │      │ drop noise  │
└──────────┘      └─────────────┘      └──────────────┘      └──────┬──────┘
                                                                    │
   ╔════════════════════ LLM starts here ════════════════════╗      │
   ║                                                         ║◄─────┘
   ║  merge / split clusters · drop roundups · is it         ║
   ║  security-relevant?      (+ keyword guard behind it)    ║
   ╚════════════════════════════╤════════════════════════════╝
                                ▼
                       ┌──────────────────┐
                       │ rank (arithmetic)│  breadth · diversity · recency
                       │   → top 10       │  CVE named · exploitation language
                       └────────┬─────────┘
                                ▼
              source hunt → VERIFY → research → summarize → publish
```

**Fetch and dedup.** Ninety feeds pulled in parallel, with an ETag/Last-Modified cache so unchanged
feeds return HTTP 304 and cost nothing. URLs are normalized and duplicates dropped.

**Remember yesterday.** A small state file records what was already reported, with a 14-day TTL.
Today's run only considers what's new. This one boring feature does more for output quality than any
prompt I've written — nothing kills a daily briefing faster than repeating itself.

**Embed and cluster.** Every article is vectorized locally (a multilingual MiniLM running on ONNX —
no PyTorch, no API cost) and clustered by cosine similarity. The multilingual part matters more than
it sounds: a Polish CERT bulletin, a German BSI advisory and the English coverage of the same
incident land in one cluster, and the briefing is written in English at the end. Six retellings of
one story become one story before any token is spent.

**Then, and only then, the model.** A cheap non-LLM pre-filter drops low-signal singletons, and what
survives goes to the LLM for the things code can't do: merging clusters that describe the same event
under different names, splitting ones that got glued together, dropping newsletters and roundups, and
deciding what is actually security-relevant. A keyword guard sits behind the security filter to catch
anything the model waves through.

**Rank, and cut early.** Coverage breadth, feed diversity, recency, whether a CVE is named, whether
the language suggests active exploitation. The expensive stages — source hunting, research,
summarization — only ever run on the shortlist. Ranking is deliberately deterministic arithmetic: I
want to be able to explain why a story made the cut.

---

## The part I care about most: sources

A briefing that links to another blog post about the thing is a briefing that wasted your time. So
the pipeline hunts for the origin — and this is where the LLM does its best work, in a role I'd
describe as *judge* rather than *author*.

It goes in escalating order of cost:

| Step | Mechanism | Cost |
|---|---|---|
| 1. CVE resolution | CVE ID in text → NVD record, with a date sanity check | free |
| 2. Link harvesting | Article's own outbound links scored against ~30 primary-source rules | cheap |
| 3. Model proposal | Only what's left goes to the LLM | tokens |
| 4. **Verification** | Fetch the candidate page, ask the model if it covers *this* story | tokens |
| 5. Agentic hunt | Model writes its own queries — bounded to 3 searches, 4 fetches | tokens |

The date check on step 1 exists because models and regexes both love a plausible-looking wrong CVE.
Step 2 works because journalists always link to what they're reporting on; harvesting those links
beats asking a model to recall a URL, which is a hallucination generator.

Step 4 is the gate that makes the whole thing trustworthy. Each candidate source page is fetched, and
the model is asked one narrow question — does this page actually cover *this* story? Generic landing
pages, evergreen product pages and "security advisories" index pages get rejected. On a mismatch, the
agentic hunt takes over: the model writes its own search queries for that specific story, judges the
results by title, URL and snippet *before* a fetch is spent, verifies its pick, and tries a fresh
angle when rejected — bounded so one stubborn story can't eat the run. If nothing verifies, the
source is dropped and the story publishes bare.

> **Publishing no link beats publishing a wrong one.**

There's one sanctioned exception, added last: some stories have no upstream document, because the
outlet *is* the origin — a Krebs investigation, a newsroom exclusive. For those, and only after
everything else has failed, the model is asked whether the article is genuinely first-hand reporting
rather than relaying someone else's disclosure. If it is, that article becomes the source, labelled
**Original reporting** rather than pretending to be an advisory. Pure syndicators are never eligible,
and a real primary source is never displaced.

---

## Designing for the model being wrong

Every LLM stage in this pipeline fails safe. Unparseable JSON, an empty response, a degenerate answer
— the stage keeps its input unchanged and moves on instead of crashing. That's the only way a daily
job survives unattended.

But silent degradation is its own failure mode, so every swallowed failure is recorded and surfaces
as a `degradation` block in the output (and, optionally, a webhook alert). A run that half-worked
says so out loud. Combined with a failing publish exiting non-zero — so the CronJob retries rather
than quietly dropping the day — the system's worst case is *"less news today"*, never *"wrong news
today"*.

The same instinct shows up in the smaller decisions:

| Decision | Why |
|---|---|
| SSRF guard on every outbound fetch | The pipeline follows links from pages it doesn't control |
| XXE-safe feed parsing | The feed list arrives from a mounted config |
| UTF-16 code units when counting post length | That's how the platform counts; otherwise a post that looks fine locally gets truncated |

---

## The other half: LLMs building the thing

The pipeline is one use of LLMs. Building it was another, and the working model I settled on mirrors
the pipeline's own philosophy — **use the expensive thinking where judgement is needed, and verify
everything that ships.** It's the same tiering argument as the
[pentest harness](blog.html?post=crushftpharness), applied to my own commits.

The largest model designs and makes the calls. Small, mechanical, precisely-specified work — config
edits, doc fixes, tightly-scoped changes — gets delegated to a fast model that makes no design
decisions. Anything non-trivial then goes through a dedicated review agent that validates the diff
against the spec it was meant to satisfy and reports findings without rewriting anything. Review and
implementation stay separate on purpose; an author reviewing their own work has the same blind spot
whether it's human or not.

Prompts that gate published output get treated as code with behaviour worth testing. The
origin-judging prompt — the one deciding whether an outlet's article counts as first-hand reporting —
has a live evaluation against the real model, skipped in normal CI and re-run whenever that prompt
changes, because the verdicts are model-sensitive in a way unit tests can't capture. Everything else
is stubbed and offline, so the suite runs in under a second.

And none of it merges without the boring gates: secret scanning over full history, SAST, dependency
audit, filesystem and container image scans, a lockfile-sync check, and a smoke test that the built
image's entry point actually runs. LLMs write a lot of code quickly. That's precisely why the
verification around them has to be automatic rather than aspirational.

---

## What I'd tell someone building the same thing

- **Spend your model budget at the narrow end of the funnel.** Embeddings and regexes are thousands
  of times cheaper than tokens. Let them do the volume work.
- **Ask the model narrow, verifiable questions.** *"Does this page cover this story?"* is answerable.
  *"Summarize today's security news"* is an invitation to invent.
- **Never let an unverified model claim reach the reader.** A source that isn't checked is a rumour
  with a hyperlink.
- **Design for wrong answers, then make degradation loud.** Fail safe, and report that you did.
- **Give it memory.** Incremental state is what turns a summarizer into a daily briefing.

The most useful thing I've learned from this project is that the interesting engineering isn't in the
prompts. It's in everything around them — the ordering, the cheap filters, the verification gates,
the failure modes. The model is a component. Treating it like one is what makes the output worth
reading over morning coffee.
