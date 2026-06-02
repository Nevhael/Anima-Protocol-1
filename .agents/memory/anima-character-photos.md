---
name: Anima character photo lookup
description: How auto character portraits are fetched, and the Wikipedia API gotcha that makes fictional characters work.
---

# Character photo auto-lookup

Created characters auto-get a portrait via api-server `GET /api/character-image?name=&universe=`.

**Key Wikipedia gotcha:** the PageImages API (`prop=pageimages`) only returns *freely-licensed* (Commons) images, so it returns nothing for almost every fictional character (their lead images are fair-use). Use the **REST summary endpoint** (`/api/rest_v1/page/summary/<title>`) instead — it returns the article's actual lead image including fair-use art. Resolve the right title first via the search API (`list=search`), then hit the summary endpoint.
**Why:** spent a debug cycle getting `{url:null}` for every character before discovering PageImages excludes non-free images.

**Transient-vs-definitive retry rule:** `findCharacterPhoto` THROWS on network/non-OK; returns null only for a definitive no-match. The seedCharacters backfill marks a character "attempted" (localStorage `anima_photo_attempts_v1`) only after a definitive answer, and stops the run on a throw — so a temporary outage never permanently suppresses retries.
**Why:** original version marked attempted unconditionally, permanently leaving characters photoless after any transient failure.

Obscure characters legitimately return null → leave avatar_url empty (placeholder); do NOT generate images.
