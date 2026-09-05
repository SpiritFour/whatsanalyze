# Use-case landing pages

Apple/Peak-Design-style landing pages for the highest-intent use cases of the
product. Each page targets a specific search intent, converts to the analyzer
(`/`), and is fully prerendered for all six locales.

## Pages in the Tools Hierarchy

| Route | Intent | Hero visual |
| --- | --- | --- |
| `/tools/inactivity` | Inactivity & last message tracker | Client-side dropzone (`ToolDropzone`) |
| `/tools/court-evidence` | Legal evidence: harassment, divorce/custody, work disputes | CSS transcript mockup (`LandingDocMock`) |
| `/tools/proof-of-relationship` | Visa/immigration: proving a genuine relationship | CSS stats mockup (`LandingStatsMock`) |

All tools pages are indexable, carry per-locale SEO meta and JSON-LD, and are cross-linked via the `/tools` hub and breadcrumbs. Root URLs `/court-evidence` and `/proof-of-relationship` redirect via 301.

## Shared components (`components/landing/`)

- `LandingHero` — dark hero, eyebrow/title/subtitle/CTA/note + visual slot
- `LandingSection` — themed section (`light`/`white`/`dark`) with scroll reveal
- `LandingCards` — feature/use-case card grid (cards can be links)
- `LandingSteps` — numbered 3-step explainer
- `LandingQuotes` — testimonial cards
- `LandingFaq` — `<details>`-based FAQ
- `LandingCta` — final dark CTA with note + legal disclaimer
- `LandingButton` — pill CTA button
- `LandingDocMock` / `LandingStatsMock` — CSS-only product visuals (no photos,
  no over-claiming about the real PDF output)

Design tokens: dark `#0d1418`, light `#f5f5f7`, accent `$c-blue-accent`
(`#21a68d`). Scroll reveals use `IntersectionObserver` and respect
`prefers-reduced-motion`.

## i18n

Namespaces `courtEvidence` and `relationshipProof` in `utils/translations.js`,
fully translated for **en, de, es**. fr/pt/it fall back to English (same
precedent as the `wrapped` namespace). Footer link labels: `pageNameCourt`,
`pageNameRelationship` (en/de/es).

## Competitor research (2026-09)

Direct competitors for the "chat → court-ready PDF" intent:

- **chattocourt.com** — "Turn WhatsApp Chats into Court-Ready PDFs"
- **chatformats.com** — professional evidence software for law firms (Bates
  stamping, SHA-256 verification)
- **wachattopdf.com** — "Court-Ready WhatsApp Documents in Minutes" + legal
  blog content
- **printchat.app** — WhatsApp to PDF converter; also publishes
  immigration/relationship-evidence blog posts

Adjacent (analytics, not evidence): chatpeek.app, whatory.com, chatstats.io.
Printed-memory niche: zapptales.com, printmychats.com.

WhatsAnalyze's differentiators to keep pushing on these pages:

1. **100% local processing** — no upload, no account, open source. Competitors
   mostly require uploading the chat file.
2. **Statistics included** — message counts and activity charts in the same
   document (strong for the relationship-proof use case).
3. **Free preview** before the one-time full-PDF purchase.

## Candidate pages for follow-up MRs

Ranked by expected search volume × conversion fit:

1. **`/print-whatsapp-chat`** — generic "print my WhatsApp chat" page;
   highest-volume head term, feeds the other two pages.
2. **`/chat-memories`** — keepsake/memorial angle (anniversary gift,
   remembering a lost loved one); emotional, low-legal-risk copy.
3. **`/for-lawyers`** — B2B page for law firms (bulk exports, client
   handover); pairs with chatformats.com positioning.
4. **`/harassment-evidence`** — dedicated harassment/stalking page; high
   intent, sensitive — needs careful, empathetic copy.

## Open items before/after launch

- [ ] Testimonials on `/court-evidence` are anonymized paraphrases of real
      customer reports — replace with verified, attributable quotes if
      possible.
- [ ] Consider a real (blurred) PDF screenshot for the hero once the mockup
      has been validated.
- [ ] Track conversions per landing page (gtag events on the CTA buttons).
