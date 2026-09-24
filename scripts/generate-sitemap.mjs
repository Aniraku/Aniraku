// scripts/generate-sitemap.mjs — SEO sitemap generator for https://www.aniraku.tech
//
// Ported from the Aniraku reference implementation (~/Aniraku/scripts/generate-sitemap.js)
// and adapted to THIS app's route space. Zero dependencies (node >= 18 for global fetch).
// Never writes under src/.
//
// AniList API constraints (empirically verified, see report):
//   * Page depth hard-capped at 5000 entries (page > 100 => HTTP 400
//     "Page depth exceeds maximum allowed"). The reference script silently
//     inherits this and only ever covers the first ~5000 entries; we instead
//     partition the catalog into strict startDate windows (each << 5000).
//   * startDate_greater / startDate_lesser are STRICT (>/<) FuzzyDateInt
//     (integer yyyymmdd). Windows tile the integer range exactly:
//     window [a,b] => query (startDate_greater: a-1, startDate_lesser: b+1),
//     with b+1 === next window's a asserted before fetching. No gaps, no overlap.
//   * startDate has TWO "no date" representations (empirically proven): SQL NULL
//     (excluded by every date filter) and stored 0 (field ALSO renders
//     {year:null} but matches filters as 0 < bound). Both sort first under
//     sort:[START_DATE] => null-catcher owned both, the lt-only lower job also
//     matched the 0-class => their intersection was the 338 historical duplicate
//     rows. Fix: absorb-time + load-time ID dedupes absorb the overlap (a
//     structural gt 0 is impossible — FuzzyDateInt rejects literal 0, HTTP 400).
//   * Null job sorts [START_DATE, ID] — a proven total order (ascending,
//     repeat-identical); no startDate_is_null comparator exists in the schema.
//   * pageInfo.total is UNUSABLE as ground truth (verified): non-empty pages
//     return 5000/5051 sentinels, empty pages return (page-1)*perPage — the
//     OFFSET, not the count. lastPage lies the same way. Pagination stops on
//     hasNextPage=false OR an empty overshoot page; miss-verification therefore
//     uses deterministic set-refetch (see verifyNoMisses) instead of totals.
//   * Rate limit: X-RateLimit-Limit=30 per sliding ~60s window; Reset is
//     unusable (null/0) on 200 responses but present on 429s.
//
// Output structure (matches the reference's sitemap-index shape):
//   public/sitemap.xml           -> sitemap INDEX
//   public/sitemaps/pages.xml    -> curated static routes
//   public/sitemaps/anime-N.xml  -> /info/{id}/{slug} shards (1000 URLs each,
//                                   well under the 50k-URL-per-file sitemap limit)
//
// Checkpoint: .sitemap-checkpoint.json in the repo root (process cwd). Written
// atomically after EVERY completed page (job index + page + accumulated items),
// so an interrupted run resumes exactly where it stopped — never from scratch,
// never re-emitting rows. Deleted automatically after a fully successful run.

import fs from 'node:fs'
import path from 'node:path'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const ANILIST_ENDPOINT = 'https://graphql.anilist.co'
const SITE = 'https://www.aniraku.tech'
const OUT_DIR = path.resolve('public')
const CHECKPOINT_FILE = path.resolve('.sitemap-checkpoint.json')
const USER_AGENT =
  'AnirakuSitemapGen/1.0 (+https://www.aniraku.tech; contact via repo issues)'

const PER_PAGE = 50                       // reference: PER_PAGE = 50 (AniList max)
const CHUNK_SIZE = 1000                   // reference: CHUNK_SIZE = 1000 (also << 50k limit)

// Rate limiting — AniList ToS-friendly pacing.
const MIN_INTERVAL_MS = 2600              // politeness FLOOR: ~23 req/min (limit is 30/60s)
const LOW_WATER_FRACTION = 0.2            // proactive: Remaining < 20% of Limit -> sleep
const BACKOFF_BASE_MS = 5000              // backoff ladder: 2^(n-1) * base
const BACKOFF_CAP_MS = 5 * 60 * 1000      // ... capped at 5 minutes
const MAX_ATTEMPTS_PER_PAGE = 8           // per-page attempt ceiling, then fail loudly

// Curated static routes — ONLY routes that exist in this app's App.tsx.
// changefreq/priority classes mirror the Aniraku reference STATIC_URLS:
//   home      -> daily / 1.0   (reference: '/')
//   browse    -> daily / 0.8   (reference: '/catalog' mapped to our /trending;
//                               /search gets the same class at 0.7 as a secondary surface)
//   schedule  -> weekly / 0.7  (reference: '/schedule')
//   legal     -> monthly / 0.3 (reference: '/privacy', '/terms', '/dmca')
//   license   -> yearly / 0.2  (reference: '/license')
// NOT included: /history, /profile, /settings, /login, /signup, /auth/*, /callback,
// /sync/callback (private/auth), /home + /airing-schedule (redirects), and every
// Aniraku-only route we lack (/catalog, /random, /top-airing, /most-popular,
// /movies, /tv-series, /anime/, genre/filter query URLs).
const STATIC_URLS = [
  { loc: '/', freq: 'daily', priority: '1.0' },
  { loc: '/trending', freq: 'daily', priority: '0.8' },
  { loc: '/schedule', freq: 'weekly', priority: '0.7' },
  { loc: '/search', freq: 'daily', priority: '0.7' },
  { loc: '/privacy', freq: 'monthly', priority: '0.3' },
  { loc: '/terms', freq: 'monthly', priority: '0.3' },
  { loc: '/dmca', freq: 'monthly', priority: '0.3' },
  { loc: '/license', freq: 'yearly', priority: '0.2' },
  { loc: '/community-guidelines', freq: 'monthly', priority: '0.3' },
]

// Anime entries: minimal fields, type=ANIME, sorted on the IMMUTABLE ID column
// inside each window so mid-run catalog churn cannot shift rows between pages.
// Reference used lastmod=generation date (it never fetches updatedAt) — we match.
const today = new Date().toISOString().slice(0, 10)

function pageQuery(job, page) {
  const filters = ['type: ANIME']
  if (job.gt != null) filters.push(`startDate_greater: ${job.gt}`)
  if (job.lt != null) filters.push(`startDate_lesser: ${job.lt}`)
  const sort = job.kind === 'nulls' ? 'START_DATE, ID' : 'ID'
  // ^ null job needs a TOTAL order: START_DATE ties (all-null block) were the
  //   instability risk; ID breaks ties (verified: ascending, repeat-identical).
  //   No startDate_is_null comparator exists in AniList's schema (verified).
  // The null-catcher must see startDate to tell null rows from dated rows
  // (date-filtered jobs already guarantee non-null rows).
  const fields =
    job.kind === 'nulls'
      ? 'id title { english romaji } startDate { year }'
      : 'id title { english romaji }'
  return `{ Page(page: ${page}, perPage: ${PER_PAGE}) {
    pageInfo { hasNextPage }
    media(${filters.join(', ')}, sort: [${sort}]) { ${fields} }
  } }`
}

// ---------------------------------------------------------------------------
// Job list: null-catcher + exactly-tiling startDate windows
// Windows are inclusive int ranges [a, b] with b + 1 === next.a.
// Query for [a, b] with strict operators: gt = a-1, lt = b+1.
// ---------------------------------------------------------------------------
function buildJobs() {
  const ranges = []
  const push = (a, b, label) => ranges.push({ a, b, label })

  // Decades 1900..1989 (sparse catalog — e.g. all of 1985 has ~100 entries,
  // empirically verified — so decades stay far below the 5000 depth cap)
  for (let y = 1900; y <= 1980; y += 10) push(y * 10000 + 101, (y + 10) * 10000 + 100, `decade ${y}-${y + 9}`)
  // 5-year blocks 1990..1999
  push(19900101, 19950100, '1990-1994')
  push(19950101, 20000100, '1995-1999')
  // Single years 2000..2019 (~800-2500 entries each — safely under the cap)
  for (let y = 2000; y <= 2019; y++) push(y * 10000 + 101, (y + 1) * 10000 + 100, `year ${y}`)
  // Quarters 2020..2036 (heavy recent years; quarters stay far below the 5000 cap)
  for (let y = 2020; y <= 2036; y++) {
    push(y * 10000 + 101, y * 10000 + 400, `Q1 ${y}`)
    push(y * 10000 + 401, y * 10000 + 700, `Q2 ${y}`)
    push(y * 10000 + 701, y * 10000 + 1000, `Q3 ${y}`)
    push(y * 10000 + 1001, (y + 1) * 10000 + 100, `Q4 ${y}`)
  }

  // Self-verification: exact tiling (no gap, no overlap) over the int space.
  for (let i = 1; i < ranges.length; i++) {
    if (ranges[i - 1].b + 1 !== ranges[i].a) {
      throw new Error(`window tiling broken between ${ranges[i - 1].label} and ${ranges[i].label}`)
    }
  }

  const jobs = [{ kind: 'nulls', label: 'null-startDate catch-all' }]
  // Lower catch-all: lt-only (proven working in run3). The stored-0 "pseudo-null"
  // class matches this job AND the null-catcher (field renders {year:null} for
  // both) — that overlap was the 338 historical duplicate rows. A strict gt 0
  // would separate them structurally, but FuzzyDateInt rejects literal 0
  // (HTTP 400 "found 00000000"), so the overlap is instead absorbed by the
  // absorb-time and load-time ID dedupes.
  jobs.push({ kind: 'dates', lt: ranges[0].a, label: `< ${ranges[0].a}` })
  for (const r of ranges) {
    jobs.push({ kind: 'dates', gt: r.a - 1, lt: r.b + 1, label: r.label })
  }
  const last = ranges[ranges.length - 1]
  jobs.push({ kind: 'dates', gt: last.b, label: `> ${last.b}` })
  return jobs
}

// ---------------------------------------------------------------------------
// Byte-exact port of src/hooks/useApi.ts animeSlug()/infoPath() (read-only port)
// ---------------------------------------------------------------------------
function animeSlug(title, fallback = 'anime') {
  const raw = (title && (title.english || title.romaji)) || fallback
  const slug = raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || fallback
}

function infoPath(id, title) {
  return `/info/${id}/${animeSlug(title)}`
}

// ---------------------------------------------------------------------------
// XML helpers (ported verbatim from the reference)
// ---------------------------------------------------------------------------
function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function urlEntry(loc, lastmod, freq, priority) {
  return `  <url>
    <loc>${SITE}${escapeXml(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${freq}</changefreq>
    <priority>${priority}</priority>
  </url>`
}

function writeSitemap(filePath, urls) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, xml, 'utf-8')
  return Buffer.byteLength(xml, 'utf-8')
}

function writeSitemapIndex(filePath, children) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${children.join('\n')}
</sitemapindex>`
  fs.writeFileSync(filePath, xml, 'utf-8')
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function fatal(msg, detail) {
  console.error(`\nFATAL: ${msg}`)
  if (detail) console.error(detail)
  process.exit(1)
}

// ---------------------------------------------------------------------------
// Checkpoint (resume safety) — atomic, saved after every completed page
// ---------------------------------------------------------------------------
function loadCheckpoint() {
  if (!fs.existsSync(CHECKPOINT_FILE)) return null
  try {
    const cp = JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf-8'))
    if (
      cp.site !== SITE ||
      !Array.isArray(cp.items) ||
      !Number.isInteger(cp.nextJob) ||
      !Number.isInteger(cp.nextPage)
    ) {
      console.log('  Checkpoint shape mismatch (older run?) — ignoring it, starting fresh.')
      return null
    }
    // Load-time dedupe by ID (belt-and-braces; keeps FIRST occurrence — array
    // order puts null-job rows first, so stored-0 rows stay owned by the null job).
    const seenIds = new Set()
    const deduped = []
    for (const it of cp.items) {
      if (!seenIds.has(it.id)) {
        seenIds.add(it.id)
        deduped.push(it)
      }
    }
    if (deduped.length !== cp.items.length) {
      console.log(
        `  checkpoint dedupe: removed ${cp.items.length - deduped.length} duplicate rows by ID (${cp.items.length} -> ${deduped.length})`,
      )
    }
    cp.items = deduped
    return cp
  } catch (err) {
    console.log(`  Checkpoint unreadable (${err.message}) — starting fresh.`)
    return null
  }
}

function saveCheckpoint(nextJob, nextPage, items) {
  const tmp = `${CHECKPOINT_FILE}.tmp`
  fs.writeFileSync(
    tmp,
    JSON.stringify({ site: SITE, savedAt: new Date().toISOString(), nextJob, nextPage, items }),
    'utf-8',
  )
  fs.renameSync(tmp, CHECKPOINT_FILE) // atomic: never a torn checkpoint
}

// ---------------------------------------------------------------------------
// Rate-limited AniList client
// ---------------------------------------------------------------------------
let lastRequestAt = 0
let rateSnapshotLogged = false
let http429Count = 0
let requestCount = 0

function parseRateHeaders(res) {
  const num = name => {
    const v = Number(res.headers.get(name))
    return Number.isFinite(v) ? v : null
  }
  return {
    limit: num('x-ratelimit-limit'),
    remaining: num('x-ratelimit-remaining'),
    reset: num('x-ratelimit-reset'), // unix seconds; null/0 on 200s, set on 429s
  }
}

function backoffMs(attempt) {
  return Math.min(BACKOFF_BASE_MS * 2 ** (attempt - 1), BACKOFF_CAP_MS)
}

function delayFor429(res, rate, attempt) {
  const back = backoffMs(attempt)
  let delay = null
  const retryAfter = res.headers.get('retry-after')
  if (retryAfter != null && retryAfter !== '' && Number.isFinite(Number(retryAfter))) {
    delay = Number(retryAfter) * 1000 // (a) honor Retry-After when present
  } else if (rate.reset) {
    delay = Math.max(0, rate.reset * 1000 - Date.now()) + 1000 // (b) else sleep until Reset
  }
  if (delay == null) delay = back
  if (attempt > 1) delay = Math.max(delay, back) // escalate on repeated 429s
  return Math.min(delay, BACKOFF_CAP_MS)
}

function delayForLowWater(rate) {
  // Reset is unusable (null/0) on 200 responses -> estimate sliding-window refill:
  // the window frees one slot every (60000 / limit) ms; sleep just long enough to
  // restore Remaining to the 20% headroom target. If Reset IS present, honor it.
  if (rate.reset) return Math.max(0, rate.reset * 1000 - Date.now()) + 250
  const target = Math.max(1, Math.floor(rate.limit * LOW_WATER_FRACTION))
  const deficit = Math.max(0, target - rate.remaining)
  return deficit * Math.ceil(60000 / rate.limit) + 500
}

/**
 * One GraphQL POST. Handles: floor pacing, low-water proactive sleep,
 * 429 (Retry-After / Reset / exponential backoff), 5xx + network errors
 * (same backoff ladder), and non-retryable 4xx (fail loudly with body snippet).
 * Returns parsed `data`, never null.
 */
async function anilistRequest(query, label) {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS_PER_PAGE; attempt++) {
    // (d) fixed politeness floor regardless of header headroom
    const since = Date.now() - lastRequestAt
    if (since < MIN_INTERVAL_MS) await sleep(MIN_INTERVAL_MS - since)
    lastRequestAt = Date.now()

    let res
    requestCount++
    try {
      res = await fetch(ANILIST_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'User-Agent': USER_AGENT, // (c) AniList ToS: identify the app
        },
        body: JSON.stringify({ query }),
      })
    } catch (err) {
      // network error (ECONNRESET etc.) -> backoff ladder
      const d = backoffMs(attempt)
      console.error(`  network error: ${err.message} — retry ${attempt}/${MAX_ATTEMPTS_PER_PAGE} in ${d}ms`)
      await sleep(d)
      continue
    }

    const rate = parseRateHeaders(res) // (a) parsed from EVERY response
    if (!rateSnapshotLogged && rate.limit != null) {
      rateSnapshotLogged = true
      console.log(
        `  rate-limit snapshot: Limit=${rate.limit} Remaining=${rate.remaining} Reset=${rate.reset}`,
      )
    }

    if (res.status === 429) {
      http429Count++
      const d = delayFor429(res, rate, attempt)
      console.error(`  HTTP 429 — sleeping ${d}ms (attempt ${attempt}/${MAX_ATTEMPTS_PER_PAGE})`)
      await sleep(d)
      continue
    }

    if (res.status >= 500) {
      const d = backoffMs(attempt)
      console.error(`  HTTP ${res.status} — retry ${attempt}/${MAX_ATTEMPTS_PER_PAGE} in ${d}ms`)
      await sleep(d)
      continue
    }

    if (!res.ok) {
      // non-retryable 4xx (400/401/403/404/…) -> fail loudly with body snippet
      const body = (await res.text().catch(() => '')).slice(0, 300)
      fatal(
        `non-retryable HTTP ${res.status} from AniList (job: ${label}).`,
        `Response snippet: ${body}\nIf this is "Page depth exceeds maximum", split the window.`,
      )
    }

    let json
    try {
      json = await res.json()
    } catch (err) {
      const d = backoffMs(attempt)
      console.error(`  bad JSON body (${err.message}) — retry ${attempt}/${MAX_ATTEMPTS_PER_PAGE} in ${d}ms`)
      await sleep(d)
      continue
    }

    if (!json.data) {
      fatal(
        `GraphQL response carried errors and no data (job: ${label}).`,
        JSON.stringify(json.errors || json).slice(0, 300),
      )
    }

    // (a) adaptive pacing: low Remaining headroom -> proactively sleep
    if (
      rate.limit != null &&
      rate.remaining != null &&
      rate.remaining < Math.max(1, Math.floor(rate.limit * LOW_WATER_FRACTION))
    ) {
      const d = delayForLowWater(rate)
      if (d > 0) {
        console.log(`  low-water: Remaining=${rate.remaining}/${rate.limit} < 20% — sleeping ${d}ms`)
        await sleep(d)
      }
    }

    return json.data
  }
  fatal(
    `page request failed after ${MAX_ATTEMPTS_PER_PAGE} attempts (job: ${label}).`,
    'Checkpoint preserved — re-run to resume from the last completed page.',
  )
}

// ---------------------------------------------------------------------------
// Fetch loop (resumes from checkpoint)
// ---------------------------------------------------------------------------
async function fetchAllAnime(jobs) {
  const cp = loadCheckpoint()
  const items = cp ? cp.items : []
  const seen = new Set(items.map(m => m.id)) // absorb-time dedupe state
  let jobIndex = cp ? cp.nextJob : 0
  let page = cp ? cp.nextPage : 1

  if (cp) {
    const where =
      jobIndex < jobs.length ? `job ${jobIndex + 1}/${jobs.length} (${jobs[jobIndex].label}) page ${page}` : 'past the last job'
    console.log(`  checkpoint found: resuming at ${where} — ${items.length} items already collected`)
  }

  const startMs = Date.now()
  while (jobIndex < jobs.length) {
    const job = jobs[jobIndex]
    const data = await anilistRequest(pageQuery(job, page), `${job.label} page ${page}`)
    const media = data.Page.media || []
    const hasNext = data.Page.pageInfo ? data.Page.pageInfo.hasNextPage !== false : true

    // Rows this job OWNS (null job: only the year==null block; date jobs: all).
    let rows = media
    if (job.kind === 'nulls') {
      // Two "no date" representations exist in AniList (verified): SQL NULL and
      // stored-0 — both render {year:null} and both sort first, so both are owned
      // here; the stored-0 class also matches the lt-only lower date job, an
      // overlap absorbed by the two ID dedupes (FuzzyDateInt rejects gt 0).
      rows = media.filter(m => !m.startDate || m.startDate.year == null)
    }

    // Unified stop rule: first fully-dated page (null job), empty overshoot page,
    // or hasNextPage=false. Evaluated on PRE-dedupe rows so resume never mis-stops.
    const jobContinues = rows.length > 0 && hasNext

    // Absorb-time dedupe by ID — belt-and-braces so no pagination quirk can ever
    // inflate totalCount past uniqueCount (the assertion stays a hard gate).
    let freshCount = 0
    for (const m of rows) {
      if (!seen.has(m.id)) {
        seen.add(m.id)
        items.push(m)
        freshCount++
      }
    }

    // Advance bookkeeping: save AFTER the page is fully absorbed.
    const nextJob = jobContinues ? jobIndex : jobIndex + 1
    const nextPage = jobContinues ? page + 1 : 1
    saveCheckpoint(nextJob, nextPage, items)

    if (page === 1 || page % 10 === 0 || !jobContinues) {
      const elapsed = Math.round((Date.now() - startMs) / 1000)
      const dupNote = freshCount < rows.length ? ` (−${rows.length - freshCount} dup rows)` : ''
      console.log(
        `  [job ${jobIndex + 1}/${jobs.length}: ${job.label}] page ${page} — ${media.length} rows, ${items.length} items total${dupNote} (${elapsed}s this run)`,
      )
    }

    if (!jobContinues) jobIndex++
    page = jobContinues ? page + 1 : 1
  }
  return { items, seen }
}

// ---------------------------------------------------------------------------
// Miss-verification — deterministic refetch (totals proven unreliable, see header)
// ---------------------------------------------------------------------------
async function refetchJob(job) {
  const map = new Map()
  for (let page = 1; page <= 200; page++) {
    const data = await anilistRequest(pageQuery(job, page), `verify ${job.label} p${page}`)
    const media = data.Page.media || []
    let rows = media
    if (job.kind === 'nulls') rows = media.filter(m => !m.startDate || m.startDate.year == null)
    for (const m of rows) map.set(m.id, m)
    const hasNext = data.Page.pageInfo ? data.Page.pageInfo.hasNextPage !== false : true
    if (rows.length === 0 || !hasNext) return map
  }
  fatal(`verification refetch of "${job.label}" exceeded 200 pages.`)
}

async function verifyNoMisses(jobs, items, seen) {
  console.log('\n--- Step 1b: Miss-verification (set-refetch — pageInfo.total proven unusable) ---')
  const t0 = Date.now()
  const reqBefore = requestCount
  const rows = []
  let merged = 0

  // (a) null job: FULL refetch under the new total order -> exact set compare.
  //     (Only job with a historical anomaly; also re-proves 0 misses under [START_DATE, ID].)
  const nullJob = jobs[0]
  const truth = await refetchJob(nullJob)
  const cpNullIds = new Set(items.filter(i => 'startDate' in i).map(i => i.id))
  let nullMiss = 0
  let nullExtra = 0
  for (const [id, row] of truth) {
    if (!cpNullIds.has(id)) {
      nullMiss++
      if (!seen.has(id)) {
        items.push(row)
        seen.add(id)
        merged++
      }
    }
  }
  for (const id of cpNullIds) if (!truth.has(id)) nullExtra++
  rows.push({ job: nullJob.label, truth: truth.size, checkpoint: cpNullIds.size, missing: nullMiss })

  // (b) date-job spot checks across the era spectrum: refetch set must be a
  //     SUBSET of what we hold (any miss gets merged). Date rows carry no
  //     startDate, so per-job extras are undetectable from the checkpoint —
  //     covered structurally instead: sort [ID] total order + disjoint tiling
  //     (asserted in buildJobs) + zero unexplained anomalies in 101 date jobs.
  const spotLabels = ['< 19000101', 'decade 1900-1909', 'year 2000', 'Q4 2036', '> 20370100']
  for (const label of spotLabels) {
    const job = jobs.find(j => j.label === label)
    if (!job) {
      rows.push({ job: label, truth: 'N/A', checkpoint: '-', missing: 0, note: 'label not found' })
      continue
    }
    const rset = await refetchJob(job)
    let miss = 0
    for (const [id, row] of rset) {
      if (!seen.has(id)) {
        items.push(row)
        seen.add(id)
        miss++
        merged++
      }
    }
    rows.push({ job: label, truth: rset.size, checkpoint: rset.size - miss, missing: miss })
  }

  console.log('  miss-verification table (truth = full deterministic refetch):')
  console.log('  job                        truth   in-checkpoint   missing(merged)')
  for (const r of rows) {
    console.log(
      `  ${String(r.job).padEnd(26)} ${String(r.truth).padEnd(7)} ${String(r.checkpoint).padEnd(15)} ${r.missing}${r.note ? '  (' + r.note + ')' : ''}`,
    )
  }
  const reqs = requestCount - reqBefore
  const elapsed = Math.round((Date.now() - t0) / 1000)
  console.log(
    `  verification pass: ${reqs} requests, ${elapsed}s, cumulative HTTP 429s: ${http429Count}, rows merged: ${merged}, unique now: ${items.length}`,
  )
  if (nullExtra > 0) {
    console.log(`  WARNING: ${nullExtra} checkpoint null-row(s) absent from refetched truth — kept, inspect manually.`)
  }
}

// ---------------------------------------------------------------------------
// Write phase
// ---------------------------------------------------------------------------
async function main() {
  const jobs = buildJobs()
  console.log('Generating sitemaps...')
  console.log(`AniList endpoint: ${ANILIST_ENDPOINT}`)
  console.log(
    `Rate policy: UA="${USER_AGENT}"; floor=${MIN_INTERVAL_MS}ms/req (~${Math.round(60000 / MIN_INTERVAL_MS)}/min vs Limit 30/60s); ` +
      `low-water=${LOW_WATER_FRACTION * 100}% of Limit -> sleep until Reset (or estimated window refill when Reset unusable); ` +
      `backoff=2^(n-1)*${BACKOFF_BASE_MS}ms cap=${BACKOFF_CAP_MS}ms; ` +
      `checkpoint=${CHECKPOINT_FILE}`,
  )
  console.log('lastmod: generation date (matches reference script — it does not fetch updatedAt)')
  console.log(`Jobs: ${jobs.length} (null-catcher + lower catch + startDate windows + upper catch)`)

  // Step 1: fetch catalog (checkpoint-resumable, window-tiling verified above)
  console.log('\n--- Step 1: Fetching anime catalog from AniList ---')
  const { items: rawItems, seen } = await fetchAllAnime(jobs)
  console.log(`Fetched ${rawItems.length} anime entries (totalCount)`)

  // Step 1b: prove no rows were silently skipped (set-refetch; totals unusable)
  await verifyNoMisses(jobs, rawItems, seen)

  // Step 2: dedupe assertion — hard gate before any file is written.
  // URL = /info/{id}/{slug}: URL-unique <=> id-unique, so this catches any
  // duplicate row emitted across job/page boundaries.
  const urlSet = new Set(rawItems.map(m => infoPath(m.id, m.title)))
  const uniqueCount = urlSet.size
  const totalCount = rawItems.length
  console.log(`\nUnique check: uniqueCount (${uniqueCount}) === totalCount (${totalCount})`)
  if (uniqueCount !== totalCount) {
    console.error(
      'DUPLICATE ASSERTION FAILED — refusing to write sitemap files.\n' +
        `uniqueCount=${uniqueCount} totalCount=${totalCount}\n` +
        `Remediation: delete ${CHECKPOINT_FILE} and re-run (full refetch).`,
    )
    process.exit(1)
  }

  // Step 3: static shard
  console.log('\n--- Step 2: Writing sitemap files ---')
  const staticUrls = STATIC_URLS.map(u => urlEntry(u.loc, today, u.freq, u.priority))
  const staticSize = writeSitemap(path.join(OUT_DIR, 'sitemaps', 'pages.xml'), staticUrls)
  console.log(`  sitemaps/pages.xml — ${staticUrls.length} URLs, ${staticSize} bytes`)

  // Step 4: anime shards — deduped list, deterministically sorted, chunked
  const sortedAnime = [...urlSet].sort()
  const chunks = []
  for (let i = 0; i < sortedAnime.length; i += CHUNK_SIZE) {
    chunks.push(sortedAnime.slice(i, i + CHUNK_SIZE))
  }

  const written = new Set(['pages.xml'])
  const indexChildren = [{ loc: '/sitemaps/pages.xml', lastmod: today }]
  for (let i = 0; i < chunks.length; i++) {
    const name = `anime-${i + 1}.xml`
    const urls = chunks[i].map(loc => urlEntry(loc, today, 'monthly', '0.6'))
    const size = writeSitemap(path.join(OUT_DIR, 'sitemaps', name), urls)
    console.log(`  sitemaps/${name} — ${urls.length} URLs, ${size} bytes`)
    written.add(name)
    indexChildren.push({ loc: `/sitemaps/${name}`, lastmod: today })
  }

  // Step 5: sitemap index at public/sitemap.xml
  const children = indexChildren.map(
    c => `  <sitemap>
    <loc>${SITE}${escapeXml(c.loc)}</loc>
    <lastmod>${c.lastmod}</lastmod>
  </sitemap>`,
  )
  writeSitemapIndex(path.join(OUT_DIR, 'sitemap.xml'), children)
  console.log(`  sitemap.xml (index) — ${indexChildren.length} children`)

  // Step 6: remove stale shard files this run no longer produces
  const sitemapsDir = path.join(OUT_DIR, 'sitemaps')
  for (const f of fs.readdirSync(sitemapsDir)) {
    if (f.endsWith('.xml') && !written.has(f)) {
      fs.unlinkSync(path.join(sitemapsDir, f))
      console.log(`  removed stale sitemaps/${f}`)
    }
  }

  // Step 7: sample URLs for route/slug cross-check
  console.log('\nSample generated URLs (raw title -> slug):')
  for (const m of rawItems.slice(0, 5)) {
    const raw = (m.title && (m.title.english || m.title.romaji)) || '(fallback)'
    console.log(`  id=${m.id} title="${raw}" -> ${SITE}${infoPath(m.id, m.title)}`)
  }

  // Success: checkpoint no longer needed
  if (fs.existsSync(CHECKPOINT_FILE)) fs.unlinkSync(CHECKPOINT_FILE)
  console.log(
    `\nDone. ${uniqueCount} unique anime URLs across ${chunks.length} shard(s) + ` +
      `${staticUrls.length} static URLs. ${requestCount} AniList requests this run, ` +
      `HTTP 429 responses: ${http429Count}. Checkpoint removed.`,
  )
}

process.on('SIGINT', () => {
  console.error('\nInterrupted — checkpoint already saved after the last completed page; re-run to resume.')
  process.exit(130)
})
process.on('SIGTERM', () => {
  console.error('\nTerminated — checkpoint saved; re-run to resume.')
  process.exit(143)
})

await main()
