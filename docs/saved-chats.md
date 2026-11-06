# Saved chats

Design, 2026-11-03. Nothing here is built yet.

Decided so far:

- Chats are **saved on the device by default**. They never leave it, so keeping
  them is the expected behaviour, with a one-tap way out.
- The **lock is optional**.
- This ships **before** the new situation landing pages
  ([landing-pages.md](landing-pages.md)), which then build on it.
- **Pro grows beyond sync**, and Free stays a fulfilling preview of all of it.
- **Group chats are saved like any other chat** (see
  [Group chats](#group-chats)).
- **An updated PDF is a new purchase.** Pro includes every update.
- **Forgetting chats that haven't been opened in 90 days is offered**, off by
  default.

## Why

Every visit starts from zero today, on purpose:

- The messages live in `sessionStorage` for at most six hours
  (`utils/chatSession.ts`). Big chats don't fit at all: `sessionStorage` holds
  about 5 MB, which is why `AskAiCard` hands the chat over in memory.
- The export kept in IndexedDB for the court PDF is wiped on the next visit
  (`utils/uploadStore.ts`).
- An AI reading survives only its tab (`REPORT_KEY` in
  `pages/tools/ai-chat-analyzer.vue`). A coach conversation doesn't even survive
  a reload (`turns` in `components/ai/AiCoach.vue`).

Within one visit the tools already share one chat (`useSharedChat` in
`composables/useChatTool.ts`), so switching tools needs no new upload. Saved
chats extend that across visits:

- upload once, use every tool on it;
- come back and continue where you left off;
- add a newer export and see what changed;
- give the on-device AI time: it can work through a long chat over several
  visits and remember what it found.

Tens of thousands of chats are uploaded every quarter, and every one of those
people has to start over to come back. The number this exists to move is
**returning visitors who open a saved chat**.

## What people see

1. **Saving.** Every upload is saved on this device. A line under the drop box
   says so, with undo: "Saved on this device · Don't keep". The sample chat is
   never saved. In a private window, or when the browser refuses storage, the
   line says "Not kept on this device" and everything works as it does today.
2. **Your chats.** Returning visitors see their saved chats on the homepage,
   above the upload box: name, people, date range, "updated 3 days ago".
   Opening one goes straight to the results. Every tool page offers "Use a saved
   chat" in its drop box (`components/tools/ToolDropzone.vue`), defaulting to the
   last one opened. The list renders only in the browser, so the prerendered
   pages search engines see don't change.
3. **Continue where you left off.** Each chat remembers its last AI reading,
   older readings with their dates, coach conversations, which participant is
   "me" (so the AI never asks twice), and the last tool used.
4. **Updating.** Dropping a newer export of a saved chat asks "Update 'Anna'?
   312 new messages since 12 Oct" and merges it. On Android the installed app
   can receive the export straight from WhatsApp's share menu: the share target
   in `nuxt.config.js` and `static/custom-sw.js` already exists. A "Since last
   time" card shows what changed.
5. **Privacy panel.** It opens from a "Saved on this device" chip next to the
   chat's name and shows:
   - storage used, and whether the browser keeps it reliably;
   - Add to Home Screen, on iOS;
   - set a lock;
   - download or restore a backup file;
   - forget this chat, or forget everything;
   - forget chats that haven't been opened in 90 days (off by default, see
     [Safety](#safety)).

Open tabs stay in step through a `BroadcastChannel`, so a chat saved or
forgotten in one tab updates the list in the others.

## Storage

One IndexedDB database, `whatsanalyze_library`. Nothing in it is ever sent
anywhere.

| Store       | Key                                  | Holds                                                                                                                                                                    |
| ----------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `chats`     | chat id (random UUID)                | title, participants and their aliases, which one is "me", first and last date, counts, created / updated / last opened, last tool, locked, the exports it was built from |
| `months`    | chat id, `YYYY-MM`                   | that month's messages, gzipped JSON (`pako` is already a dependency)                                                                                                     |
| `derived`   | chat id, month, kind, version        | the per-month numbers the over-time views need: messages and conversation starts per person, median reply time, emoji markers                                            |
| `artifacts` | id, indexed by chat id               | AI readings, coach conversations, notes and pinned messages, purchases                                                                                                   |
| `memory`    | chat id, period, kind, model         | what the on-device AI worked out (step 5)                                                                                                                                |
| `media`     | chat id                              | the export file, for court evidence chats only                                                                                                                           |
| `meta`      | name                                 | settings; the lock's salt and check value                                                                                                                                |

Each export a chat was built from is recorded with its name, size, SHA-256,
date range and import time. `ChatSource` already produces the first three.

Why months:

- an update rewrites only the months it touches;
- the over-time views read one small record per month;
- a long chat can open on its latest months first.

The `derived` key carries the analyzer version, so changing an analyzer
recomputes its numbers instead of showing stale ones.

**Size isn't the constraint.** The sample chat (`static/chat_example.txt`) takes
74 bytes per message as JSON and 20 gzipped. Real chats compress less than that
repetitive sample. Even at three times worse, a 40,000-message chat (WhatsApp's
export cap without media) is about 3 MB. Safari allows a site up to 60% of the
disk (WebKit storage policy, Safari 17+).

Messages are stored as `ChatMessage` (`composables/useChatTool.ts`) with the
date as a number, revived on read the way `chatSession.ts` already does it.
Attachments keep only their names, except in court evidence chats (below).

`chatSession.ts` and `uploadStore.ts` stay. They carry chats that aren't saved,
and the round trip through Stripe Checkout.

## Updating a saved chat

WhatsApp exports at most the 10,000 most recent messages with media, or 40,000
without. That's widely documented; WhatsApp's own help page wouldn't load to
confirm it. A long chat therefore loses its oldest messages from each new
export. Merging keeps what was saved before, so **a saved chat can hold more
history than WhatsApp will export again**.

`mergeMessages(saved, incoming)` is a pure function with its own tests:

- **Which chat.** Candidates are saved chats with the same export name
  ("WhatsApp Chat with Anna", or the group's name) or mostly the same
  participants after aliases. Group members join and leave, so sharing most
  participants is enough; the message overlap decides. An export that overlaps
  none of them is saved as a new chat.
- **Where they overlap.** Messages are compared as (minute, author, text hash),
  participant messages only, because WhatsApp's own notices change with the
  exporter's phone language. The longest common run between saved chat and
  export anchors the merge. It must be a minimum length (about 20 messages, or
  all of a shorter export), and it tolerates a few mismatches for deleted or
  edited messages. A per-message match would trip over two identical messages
  in the same minute; a run doesn't.
- **The cases.**
  - The usual one: the export is the saved chat plus newer messages.
  - An export that starts later (the cap cut its oldest messages) or covers only
    a date range just adds what's new. WhatsApp's help page lists a "custom date
    range" export, which needs checking on phones.
  - Two exports of the same people that don't overlap: ask whether to join
    them.
- **Renamed contacts.** WhatsApp writes each name as it's saved in the
  exporter's contacts, so "Anna" can come back as "Anna ❤️". Ask once ("Is Anna
  ❤️ the same person as Anna?") and store the alias.

## Group chats

Group chats are saved by default, like any other chat:

- **Same data, same place.** The messages are ones the visitor already has on
  their phone, and they stay on the device. Saving a group sends nothing more
  anywhere than saving a two-person chat does.
- **Proven demand.** Group searches ("whatsapp group chat analyzer", "whatsapp
  group analytics", "whatsapp group statistics", and in Spanish "contador de
  mensajes whatsapp en grupos") already rank near the top of the results and
  get clicked far more often than the site's average.
- **A reason to come back that two-person chats don't have.** People search
  for "group chat summary today", and nothing on the site answers it yet. A
  saved group can be caught up: after an update, "since last time" summarizes
  only the new messages, which is short enough for the on-device model. Group
  Wrapped every December is the other reason.

What groups need on top:

- Matching tolerates members joining and leaving (above).
- The AI reading names at most eight people (`insightsSchema` in
  `functions/src/ai/insights.ts`). Which participant is "me" matters more in a
  group, so it's asked once and kept.
- How many uploads are groups isn't in the data yet. `chat_analyzed` already
  sends `chat_type` (`group` or `pair`), but it isn't registered as a GA4 custom
  dimension. Register it to see the share, and how often groups come back.

## Keeping it in the browser

Browsers can evict stored data, so the design treats browser storage as
fragile:

- After the first save, ask for persistent storage with
  `navigator.storage.persist()`. Chrome decides silently from how the site is
  used. Firefox asks the user, so call it there only after an explicit action.
- Safari evicts a site's data after a while without visits, and grants
  persistent storage mainly to Home Screen web apps (WebKit's storage policy).
  On iOS, the first save and the privacy panel suggest Add to Home Screen. The
  PWA already runs standalone.
- **Backup file:** download the whole library as one gzipped file (encrypted
  if a lock is set), and restore it by dropping it on the page. It's free. Until
  sync exists, it's the only copy that survives clearing the browser.
- Catch `QuotaExceededError` and refused storage, and fall back to today's
  behaviour of keeping the chat for the tab only.

## Lock (optional)

- A passcode derives an AES-GCM key with PBKDF2-SHA256 (WebCrypto, a high
  iteration count). `utils/wrapped/sharing/crypto.ts` already does AES-GCM with
  keys that never leave the browser.
- A locked chat encrypts its months, artifacts, memory and media, and its title
  and participants too. The list shows "Locked chat" until it's unlocked.
- The key lives in memory only. It's dropped when the tab closes and after a
  stretch of inactivity.
- A forgotten passcode can't be recovered; the only way out is to forget the
  chat. Say so when the lock is set.
- Without a lock, anyone using this browser profile can open the saved chats,
  and the privacy panel says so plainly.

## Safety

Saving by default is right for most people. But a relationship tool also gets
used on shared devices, and by people who are afraid of a partner. A saved "is
there anything I should worry about?" reading, found by that partner, can make
things worse.

- "Saved on this device" is visible wherever a saved chat is open, with "Don't
  keep" one tap away.
- "Forget everything" sits in the header menu and needs one confirmation. It
  deletes the database, not just the list.
- **Forget after 90 days** is offered in the privacy panel and is off by
  default, because Wrapped brings people back once a year and disputes run for
  months. When it's on, chats not opened for 90 days are deleted at the start of
  the next visit, before the list renders. A browser can't run anything while
  the site is closed, so until that visit the data stays on the device.
- When the coach hands over to support resources (`needsSupport` and
  `isSafetyReply` in `utils/ai/coach.js`), it also points to the lock and to
  "forget this chat".
- Worth a quick legal check: storing visitors' own uploads on their own device,
  for a feature they're using, should fall under the "strictly necessary"
  exception in §25 TDDDG. What makes that hold is the default being visible and
  the opt-out being one tap.

## How the on-device AI uses this

Today the on-device model reads one sample of the chat in a single pass
(`localTranscriptChars` in `utils/ai/localModel.ts`), and most AI runs don't
finish. Saved chats change what the model is asked to do:

- **Never twice.** A finished reading is kept, so the same question is never
  run again on the same chat.
- **Remember the device.** If on-device AI failed in this browser, the next run
  offers the cloud preview first instead of failing again.
- **Small steps, remembered.** The model summarizes one month at a time, while
  the chat is open and the device is idle, and keeps each summary in `memory`.
  Questions and the coach then read those summaries plus the matching messages,
  so even a 1–2B model can draw on years of chat. Work picks up where it
  stopped on the next visit.
- **Search by meaning** with a small embedding model that runs without WebGPU
  (needs a prototype), so devices that can't run the chat model still get it.
- **Re-read with a better model.** When a newer on-device model ships, a saved
  chat can be read again. The library outlives any one model.

Finding out why runs fail is separate work. The GA4 extras pull breaks failures
down by mode and reason.

## Court evidence

Court evidence is the page that converts best by far, and the disputes behind it
run for months. Saved chats turn its PDF into an evidence file you keep adding
to: update the chat, then regenerate the PDF with the new messages and an
updated exhibit index.

- The court PDF hashes media, so court chats keep the export file in `media`.
  Today's `uploadStore.ts` keeps it for one tab only. Since it's large, ask
  once: "Keep the media for your evidence file?"
- **A purchase unlocks one version of one chat.** Today purchases are matched
  by `chatFingerprint` (`composables/useOneTimePurchase.ts`), which changes as
  soon as the chat gains a message, and the unlock lasts only the browser
  session. Saved chats keep the purchase with the chat (an `artifacts` record
  with the chat id and the fingerprint that was bought), so **the paid version
  can be downloaded again at any time**.
- **An updated chat is a new purchase.** Once new messages arrive, the new
  version of the PDF is bought again, and Pro includes every update. The
  checkout says so: "This version costs {price}, or Pro includes every
  update."
- The same rule covers every one-time PDF (chat, court evidence, proof of
  relationship), since they're all sold at one price (`ONE_TIME_PRICE` in
  `utils/pricing.ts`).
- Each PDF names its date range and the exports it was built from, so two
  versions of an evidence file can't be confused.

## Wrapped

Wrapped drives the site's biggest month (December), and the next one is weeks
away. Wrapped parses on its own (`utils/wrapped/parsing`) and keeps its result
in `sessionStorage` (`stores/wrapped/stats.ts`). If step 1 also saves Wrapped
uploads and ships before the December peak, that peak turns into people who
come back.

Opening a saved chat's Wrapped must not use up the day's free analysis. That
limit counts uploads (`stores/wrapped/uploadAccessStore.ts`).

## Free and Pro

Free is a fulfilling preview of everything, on the user's own chat. Pro adds the
depth, the continuity and the outputs.

|                             | Free                                                         | Pro                                                         |
| --------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------- |
| Saved chats, stats, trends  | All of it, every chat                                        | Same                                                        |
| On-device AI, where it runs | Full                                                         | Full                                                        |
| Cloud AI reading            | Preview: one profile and a taste of each section (as today) | Full reading, every relationship mode, re-read any time     |
| What changed                | The numbers since last time                                  | An AI reading of what changed                               |
| Coach                       | A few cloud replies a day; on-device where it runs           | Unlimited, and it remembers earlier conversations           |
| Search the whole history    | By words                                                     | By meaning, years back                                      |
| Devices                     | Backup file                                                  | Encrypted sync between phone and laptop                     |
| Documents                   | Previews; each PDF version is a one-time purchase            | Unlimited chat, court and visa PDFs, every update included  |
| Wrapped                     | As today                                                     | Every slide, for every saved chat                           |
| Several chats               | Each on its own                                              | Your circle over time: who you talk to more, less, differently |

Sync needs an identity, and there are no accounts
([firebase-and-payments.md](firebase-and-payments.md)). A subscription already
has an email and a subscription id. The encryption key would come from the
user's passcode or a recovery code, never from the server.

The feature list on the subscribe page (`subscribePage` in
`utils/translations.js`) doesn't mention the AI at all today. It should follow
this table.

## Copy that changes

In all six locales:

- `pillar3Title` / `pillar3Text` on the What Brandon Thinks page: "Nothing kept
  … nothing to delete because nothing was saved" stops being true.
- `privacyFAQContent` on the homepage: "No data is ever sent to a server" is
  already wrong for the cloud AI, which sends anonymized excerpts. Fix both at
  once.
- `messagesRestored` ("restored from this session").
- New strings for saving, the privacy panel, the lock and updates.
- The privacy policy in `pages/impressum.vue` needs a section on what's stored
  on the device and why. It's legally binding text, so have it reviewed.

Still true and unchanged: "never stored on our servers", "never leaves your
device".

## Analytics

New events in `composables/useAnalytics.ts`, never with chat content:

| Event              | When                                                |
| ------------------ | --------------------------------------------------- |
| `library_saved`    | a chat is saved                                     |
| `library_not_kept` | the visitor opts out, or the browser refuses storage |
| `library_opened`   | a saved chat is opened, with days since last opened |
| `library_updated`  | an export is merged, with messages added            |
| `library_forgotten` | a chat or everything is forgotten, by hand or after 90 days |
| `library_locked`   | a lock is set                                       |
| `library_backup`   | a backup is downloaded or restored                  |

## Steps

| Step | What                                                                                                                                                                                                  | Done when                                                                     |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 1    | Saved chats, groups included: storage, saving by default with undo, "Your chats" on the homepage, open in any tool, forget (and the 90-day option), persistent storage, backup file, copy and privacy policy, Wrapped uploads included | A returning visitor opens a saved chat in two taps, before the December peak |
| 2    | Continue where you left off: AI readings and coach conversations kept per chat, "me" and last tool remembered, the device's AI capability remembered                                                 | No reading is ever run twice on the same chat                                 |
| 3    | Updates and over time: merging, "since last time" (a catch-up summary for groups), per-month numbers, a trends view, updated PDFs sold per version, the bought version kept                         | An updated export adds only new messages, and the court PDF regenerates from it |
| 4    | Lock                                                                                                                                                                                                  | A locked chat shows nothing until the passcode is entered                     |
| 5    | On-device memory: month summaries, search by meaning, questions and coach over the whole history                                                                                                    | Ask can answer about a month the old sample never covered                     |
| 6    | Pro continuity: encrypted sync, "what changed" readings, several chats                                                                                                                               | A chat updated on the laptop opens on the phone                               |

Code that changes in step 1:

- new: `utils/library/` (database, chats, merge, backup), `composables/useLibrary.ts`,
  and the chat list and saved-chat chip in `components/library/`;
- `components/FileHandler.vue` and `pages/index.vue` (`newMessages`, and
  restoring on mount);
- `components/tools/ToolDropzone.vue` (save, restore, picker);
- `pages/pwa-results.vue` (the share target);
- the Wrapped upload.

## Open questions

- What do people call it? The proposal: "Your chats" for the list, "Saved on
  this device" for the state, and no "library" anywhere in the UI.
