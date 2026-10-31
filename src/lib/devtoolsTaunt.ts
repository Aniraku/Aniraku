// The devtools greeter — for the curious souls who open DevTools to hunt
// for the API and find the sources.
//
// Zero hostility: no debugger traps, no redirect loops. Just clickbait,
// decoys, and one (1) guaranteed rickroll for anyone who actually decodes
// the strings. The real endpoints are assembled at runtime; the Network
// tab will show you what any browser sees anyway. GLHF.

const RICKROLL_ID = 'ZGRRdzR3OVdnWGNR'; // decode me. paste me. trust me.

const BANNER = [
  '  _   _                 _  _          ',
  ' | \\ | |               | |(_)         ',
  ' |  \\| |  __ _  _   _  | | _   __ _   ',
  ' | . ` | / _` || | | | | || | / _` |  ',
  ' | |\\  || (_| || |_| || || || (_| |  ',
  ' |_| \\_| \\__,_| \\__, ||_||_| \\__,_|  ',
  '                 __/ |                ',
  '                |___/                 ',
];

const CLICKBAIT = [
  '🕵️ Endpoint hunters, we need to talk.',
  '🚨 LEAKED: Aniraku internal API docs (2026) (REAL) (NOT CLICKBAIT)',
  '💎 Developers HATE this trick: opening the Network tab.',
  '🔥 You are the 1,000,000th visitor — your prize is below 👇',
];

const TAUNTS = [
  'Fun fact: the endpoints are assembled at runtime, salted, and the bundle is full of decoys.',
  'Fun fact #2: the decoys are not real. They were never real. They just wanted to feel included.',
  'Fun fact #3: everything here streams from third-party CDNs anyway — "sources" are a team sport.',
  'Fun fact #4: Aniraku is open source (AGPL-3.0) — github.com/Aniraku/Aniraku. You could have just… read it. Like a lawyer.',
];

// Decoy "leaked key" — base64 of the sacred lyrics. Paste-decoders get
// exactly what they deserve.
const LEAKED_API_KEY =
  'TkVWRVIgR09OTkEgR0lWRSBZT1UgVVAsIE5FVkVSIEdPTk5BIExFVCBZT1UgRE9XTg==';

// The decoy endpoint table — every single one is a lie with confidence.
const DECOY_ENDPOINTS = [
  {
    endpoint: 'https://api.anirqku.tech/v99/telemetry',
    auth: 'Bearer sk_live_N3V...trust',
    status: 'typo in production. ship it anyway',
  },
  {
    endpoint: 'https://data.aniraku.tech/internal/secret',
    auth: 'Bearer never-gonna',
    status: '404 (emotionally)',
  },
  {
    endpoint: 'https://cdn.aniraku.tech/v1/sources/DEFINITELY_REAL.mp4',
    auth: 'none (it is a rickroll)',
    status: 'dQw4w9WgXcQ',
  },
  {
    endpoint: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    auth: 'none needed',
    status: 'the only REAL streaming source on this list',
  },
];

let fired = false;

export function initDevtoolsTaunt(): void {
  if (fired || typeof window === 'undefined') return;
  fired = true;

  const accent = 'color:#b5a8ff;font-weight:bold;font-size:14px;';
  const muted = 'color:#9aa0a6;font-style:italic;';
  const clickbait = 'color:#ff5c8a;font-weight:bold;font-size:15px;';

  console.group('%c🕵️ Aniraku — welcome, endpoint hunter', accent);
  BANNER.forEach((line) => console.log(`%c${line}`, 'color:#b5a8ff;'));

  // Clickbait phase
  CLICKBAIT.forEach((t) => console.log(`%c${t}`, clickbait));

  // The "leak"
  console.log('%c🔑 LEAKED PRODUCTION API KEY:', clickbait);
  console.log(`%c${LEAKED_API_KEY}`, 'color:#86efac;font-family:monospace;');
  console.log(
    `%c(Yes it is base64. Yes you should decode it. Definitely. 100%.)`,
    muted,
  );

  // Honest-ish taunts
  TAUNTS.forEach((t, i) => console.log(`%c${i + 1}. ${t}`, muted));

  // The decoy table
  console.log('%c🎁 YOUR PRIZE — the real endpoint list (no clickbait):', accent);
  console.table(DECOY_ENDPOINTS);

  console.log(
    '%c🎵 Lyrics checker (pro feature): decode the API key above. We promise it is NOT a rickroll.',
    clickbait,
  );
  console.log(
    `%cHint: atob('${RICKROLL_ID}') — totally unrelated video ID. Trust us.`,
    muted,
  );
  console.log('%cNow close this console and go watch something. 🍿', accent);
  console.groupEnd();

  // Wave 2 — for the committed snooper who is STILL here 20s later.
  window.setTimeout(() => {
    if (!fired) return;
    console.log('%c⏳ 20 seconds. Still in the console. Impressive.', accent);
    console.log(
      '%cOK here is the ACTUAL secret: %chttps://www.youtube.com/watch?v=dQw4w9WgXcQ',
      muted,
      'color:#86efac;font-weight:bold;',
    );
    console.log(
      '%cWe never gonna give you up… but we WILL waste 3:33 of your time. 🕺',
      muted,
    );
  }, 20_000);

  // For the ones who come back for seconds: a little extra mockery.
  window.addEventListener(
    'aniraku:open-support',
    () => {
      console.log('%c💘 You opened the Support modal after ALL that snooping? ', accent);
      console.log('%cWe knew there was a good person in there somewhere.', muted);
      console.log('%cNever gonna let you down. (Donate. jk. unless?)', muted);
    },
    { once: true },
  );

  // — NEXT LEVEL: devtools-open detection + bait network requests —
  // When DevTools opens, their Network tab gets a show: dramatic "leaked
  // endpoint" requests to hosts that do not exist, so the bait tab fills
  // up while the real API stays same-origin and anonymous.
  let baited = false;
  const checkOpen = () => {
    const wide =
      window.outerWidth - window.innerWidth > 160 ||
      window.outerHeight - window.innerHeight > 160;
    if (wide && !baited) {
      baited = true;
      console.log('%c📡 DevTools detected. Deploying decoy traffic…', accent);
      console.log('%cEnjoy the Network tab. It is exactly as real as it looks.', muted);
      const bait = [
        'https://never-gonna.give/you/up.json',
        'https://api.anirqku.tech/v99/leaked-sources?token=please',
        'https://internal.aniraku.tech/definitely/the/real/api',
      ];
      bait.forEach((url, i) =>
        setTimeout(() => fetch(url).catch(() => {}), i * 400),
      );
      // Escalating waves.
      setTimeout(
        () =>
          console.log(
            '%c🎵 30s update: the decoys have reported your position. The real API remains a ghost. (Same-origin, remember?)',
            muted,
          ),
        30_000,
      );
      setTimeout(() => {
        console.log('%c🎵 NEVER GONNA GIVE YOU UP 🎵', accent);
        console.log('%c🎵 NEVER GONNA LET YOU DOWN 🎵', accent);
        console.log('%c🎵 NEVER GONNA RUN AROUND AND DE-sert YOU 🎵', accent);
        console.log('%cYou have been here a full minute. We admire the dedication.', muted);
      }, 60_000);
    }
  };
  window.addEventListener('resize', checkOpen);
  // Expose a fake secret API for console typers.
  (window as any).getSecretEndpoints = (): Promise<string[]> =>
    new Promise((resolve) => {
      console.log('%c🔐 Decrypting the secret endpoint vault…', accent);
      setTimeout(() => {
        console.log('%c🎵 You know the rules, and so do I 🎵', accent);
        resolve(['https://www.youtube.com/watch?v=dQw4w9WgXcQ']);
      }, 3000);
    });
}
