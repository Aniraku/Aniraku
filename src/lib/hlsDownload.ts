// Internal episode download: HLS → MKV, entirely client-side.
//
// Pipeline: fetch the media playlist (direct first, backend proxy fallback),
// pick the highest-bandwidth variant off a master playlist, download every
// segment with bounded concurrency + retries (AES-128 streams are decrypted
// via WebCrypto), concatenate into one media blob, then lazily import
// mediabunny to remux it into a real Matroska (.mkv) file — video and audio
// are copied, never re-encoded.
//
// mediabunny is imported only when a download actually reaches the muxing
// stage, so the player bundle never pays for it. Progress flows through
// onProgress; AbortSignal cancels both the fetch and the mux.

export interface DownloadProgress {
  phase: 'manifest' | 'segments' | 'muxing' | 'done';
  segmentsDone: number;
  segmentsTotal: number;
  bytes: number;
  /** 0..1 during muxing. */
  muxProgress: number;
}

export interface HlsDownloadOptions {
  url: string;
  headers?: Record<string, string> | null;
  /** Aniraku API base — enables the proxy fallback for blocked fetches. */
  proxyBase?: string;
  /** Filename without extension (".mkv" is appended). */
  filename: string;
  /** External subtitle tracks to mux INTO the MKV (soft subs). */
  subtitles?: DownloadSubtitle[];
  /** Variant height (e.g. 720) to download; highest when omitted. */
  qualityHeight?: number | null;
  onProgress: (progress: DownloadProgress) => void;
  signal: AbortSignal;
}

export interface DownloadSubtitle {
  label: string;
  language?: string;
  url: string;
}

export interface HlsDownloadResult {
  ok: boolean;
  error?: string;
  fileName?: string;
}

const SEGMENT_CONCURRENCY = 4;
const SEGMENT_RETRIES = 3;
const MAX_MANIFEST_BYTES = 4 * 1024 * 1024;

class AbortedError extends Error {
  constructor() {
    super('Download canceled');
    this.name = 'AbortedError';
  }
}

function throwIfAborted(signal: AbortSignal): void {
  if (signal.aborted) throw new AbortedError();
}

function resolveUrl(base: string, target: string): string {
  try {
    return new URL(target, base).toString();
  } catch {
    return target;
  }
}

function proxyWrap(
  url: string,
  headers: Record<string, string> | null | undefined,
  proxyBase?: string,
): string | null {
  if (!proxyBase) return null;
  const base = proxyBase.replace(/\/+$/, '');
  const h =
    headers && Object.keys(headers).length > 0
      ? `&headers=${encodeURIComponent(JSON.stringify(headers))}`
      : '';
  return `${base}/api/v1/proxy?url=${encodeURIComponent(url)}${h}`;
}

async function fetchBuffer(
  url: string,
  headers: Record<string, string> | null | undefined,
  proxyBase: string | undefined,
  signal: AbortSignal,
): Promise<ArrayBuffer> {
  const attempts: string[] = [url];
  const viaProxy = proxyWrap(url, headers, proxyBase);
  // The proxy hop is the fallback, not the default — direct keeps bytes off
  // the backend (and matches what the player itself does).
  if (viaProxy) attempts.push(viaProxy);
  let lastError: unknown = null;
  for (const attempt of attempts) {
    try {
      const res = await fetch(attempt, {
        headers: attempt === url ? headers ?? undefined : undefined,
        signal,
        cache: 'default',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.arrayBuffer();
    } catch (err) {
      if (signal.aborted || (err as Error)?.name === 'AbortError') {
        throw new AbortedError();
      }
      lastError = err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Fetch failed');
}

async function fetchText(
  url: string,
  headers: Record<string, string> | null | undefined,
  proxyBase: string | undefined,
  signal: AbortSignal,
): Promise<string> {
  const buf = await fetchBuffer(url, headers, proxyBase, signal);
  if (buf.byteLength > MAX_MANIFEST_BYTES) {
    throw new Error('Manifest too large');
  }
  return new TextDecoder().decode(buf);
}

interface MediaPlaylist {
  segmentUrls: string[];
  initUrl: string | null;
  /** Total playlist duration in seconds (0 when absent). */
  durationSeconds: number;
  encryption: { keyUrl: string; ivHex: string | null } | null;
  byterange: boolean;
}

function parseMediaPlaylist(text: string, manifestUrl: string): MediaPlaylist {
  const lines = text.split(/\r?\n/);
  const segmentUrls: string[] = [];
  let initUrl: string | null = null;
  let durationSeconds = 0;
  let encryption: MediaPlaylist['encryption'] = null;
  let byterange = false;
  let pendingDuration = 0;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('#EXTINF:')) {
      pendingDuration = parseFloat(line.slice(8)) || 0;
      continue;
    }
    if (line.startsWith('#EXT-X-MAP:')) {
      const uri = /URI="([^"]+)"/.exec(line)?.[1];
      if (uri) initUrl = resolveUrl(manifestUrl, uri);
      continue;
    }
    if (line.startsWith('#EXT-X-KEY:')) {
      const method = /METHOD=([A-Z0-9-]+)/.exec(line)?.[1] ?? 'NONE';
      if (method === 'AES-128') {
        const uri = /URI="([^"]+)"/.exec(line)?.[1];
        const iv = /IV=0[xX]([0-9a-fA-F]+)/.exec(line)?.[1] ?? null;
        if (uri) {
          encryption = {
            keyUrl: resolveUrl(manifestUrl, uri),
            ivHex: iv,
          };
        }
      } else if (method !== 'NONE') {
        throw new Error(`Unsupported HLS encryption: ${method}`);
      }
      continue;
    }
    if (line.startsWith('#EXT-X-BYTERANGE:')) {
      byterange = true;
      continue;
    }
    if (line.startsWith('#')) continue;
    // Playlist URL line (a media segment).
    segmentUrls.push(resolveUrl(manifestUrl, line));
    durationSeconds += pendingDuration;
    pendingDuration = 0;
  }
  if (segmentUrls.length === 0 && !initUrl) {
    throw new Error('No segments found in playlist');
  }
  return { segmentUrls, initUrl, durationSeconds, encryption, byterange };
}

interface Variant {
  bandwidth: number;
  height: number;
  url: string;
  /** Rendition-group id of the separate audio track ("a1"), if any. */
  audioGroupId: string | null;
}

/**
 * Master playlists on providers like settlar/YUI carry video-only variants
 * plus a separate `#EXT-X-MEDIA:TYPE=AUDIO` group — a playable download
 * needs BOTH. Returns the variants and the audio-group URI map.
 */
function parseMasterPlaylist(
  text: string,
  manifestUrl: string,
): {
  variants: Variant[];
  audioGroups: Map<string, string>;
  subtitles: DownloadSubtitle[];
} {
  const lines = text.split(/\r?\n/);
  const variants: Variant[] = [];
  const audioGroups = new Map<string, string>();
  const subtitles: DownloadSubtitle[] = [];
  let pending: { bandwidth: number; height: number; audioGroupId: string | null } | null = null;
  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith('#EXT-X-MEDIA:')) {
      const type = /TYPE=([A-Z]+)/.exec(line)?.[1];
      const uri = /URI="([^"]+)"/.exec(line)?.[1];
      if (type === 'AUDIO') {
        const groupId = /GROUP-ID="([^"]+)"/.exec(line)?.[1];
        if (groupId && uri) audioGroups.set(groupId, resolveUrl(manifestUrl, uri));
      } else if (type === 'SUBTITLES' && uri) {
        // Subtitle renditions advertised by the stream itself are the same
        // source the user is watching — mux them in instead of relying on
        // the API's per-source subtitle list.
        subtitles.push({
          url: resolveUrl(manifestUrl, uri),
          label: /NAME="([^"]+)"/.exec(line)?.[1] ?? 'Subtitles',
          language: /LANGUAGE="([^"]+)"/.exec(line)?.[1],
        });
      }
      continue;
    }
    if (line.startsWith('#EXT-X-STREAM-INF:')) {
      const bandwidth = parseInt(
        /BANDWIDTH=(\d+)/.exec(line)?.[1] ?? '0',
        10,
      );
      pending = {
        bandwidth,
        height: Number(/RESOLUTION=\d+x(\d+)/.exec(line)?.[1] ?? 0),
        audioGroupId: /AUDIO="([^"]+)"/.exec(line)?.[1] ?? null,
      };
      continue;
    }
    if (!line.startsWith('#') && line && pending) {
      variants.push({
        bandwidth: pending.bandwidth,
        height: pending.height,
        url: resolveUrl(manifestUrl, line),
        audioGroupId: pending.audioGroupId,
      });
      pending = null;
    }
  }
  return { variants, audioGroups, subtitles };
}

async function resolveMediaPlaylist(
  url: string,
  headers: Record<string, string> | null | undefined,
  proxyBase: string | undefined,
  signal: AbortSignal,
  qualityHeight?: number | null,
): Promise<{
  video: MediaPlaylist;
  videoManifestUrl: string;
  /** Separate-audio playlist when the master ships one (YUI/settlar). */
  audioUrl: string | null;
  /** Subtitle renditions declared in the master (same source as playback). */
  subtitles: DownloadSubtitle[];
}> {
  let manifestUrl = url;
  let audioUrl: string | null = null;
  const subtitles: DownloadSubtitle[] = [];
  for (let depth = 0; depth < 3; depth++) {
    throwIfAborted(signal);
    const text = await fetchText(manifestUrl, headers, proxyBase, signal);
    if (text.includes('#EXT-X-STREAM-INF')) {
      const parsed = parseMasterPlaylist(text, manifestUrl);
      const { variants, audioGroups } = parsed;
      subtitles.push(...parsed.subtitles);
      if (variants.length === 0) throw new Error('Master playlist has no variants');
      variants.sort((a, b) => b.bandwidth - a.bandwidth);
      const chosen =
        (qualityHeight
          ? variants.find((v) => v.height === qualityHeight)
          : null) ?? variants[0]; // highest quality variant
      manifestUrl = chosen.url;
      audioUrl = chosen.audioGroupId
        ? audioGroups.get(chosen.audioGroupId) ?? null
        : null;
      continue;
    }
    const video = parseMediaPlaylist(text, manifestUrl);
    return { video, videoManifestUrl: manifestUrl, audioUrl, subtitles };
  }
  throw new Error('Playlist nesting too deep');
}

/**
 * Variant ladder of a (proxied) master playlist, for the download dialog.
 * Best-effort: returns [] when the URL is not a readable master.
 */
export async function probeHlsVariants(
  url: string,
): Promise<{ height: number; bandwidth: number }[]> {
  try {
    const res = await fetch(url, { cache: 'default' });
    if (!res.ok) return [];
    const text = await res.text();
    if (!text.includes('#EXT-X-STREAM-INF')) return [];
    const byHeight = new Map<number, number>();
    for (const line of text.split(/\r?\n/)) {
      if (!line.startsWith('#EXT-X-STREAM-INF:')) continue;
      const height = Number(/RESOLUTION=\d+x(\d+)/.exec(line)?.[1] ?? 0);
      if (!height) continue;
      const bandwidth = parseInt(
        /BANDWIDTH=(\d+)/.exec(line)?.[1] ?? '0',
        10,
      );
      byHeight.set(height, Math.max(byHeight.get(height) ?? 0, bandwidth));
    }
    return [...byHeight.entries()]
      .map(([height, bandwidth]) => ({ height, bandwidth }))
      .sort((a, b) => b.height - a.height);
  } catch {
    return [];
  }
}

async function fetchSegmentBlob(
  playlist: MediaPlaylist,
  headers: Record<string, string> | null | undefined,
  proxyBase: string | undefined,
  signal: AbortSignal,
  onSegment: (done: number, total: number, bytes: number) => void,
): Promise<Blob> {
  const parts: BlobPart[] = [];
  const total = playlist.segmentUrls.length;
  let done = 0;
  let bytes = 0;
  const progress = () =>
    onSegment(done, total, bytes);

  // AES-128 support: fetch the 16-byte key once, decrypt every segment.
  let cryptoKey: CryptoKey | null = null;
  let staticIv: Uint8Array | null = null;
  if (playlist.encryption) {
    const keyBuf = await fetchBuffer(
      playlist.encryption.keyUrl,
      headers,
      proxyBase,
      signal,
    );
    if (keyBuf.byteLength !== 16) throw new Error('Unexpected HLS key size');
    cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBuf,
      'AES-CBC',
      false,
      ['decrypt'],
    );
    if (playlist.encryption.ivHex) {
      staticIv = hexToBytes(playlist.encryption.ivHex);
    }
  }

  if (playlist.initUrl) {
    const init = await fetchBuffer(playlist.initUrl, headers, proxyBase, signal);
    parts.push(init);
    bytes += init.byteLength;
  }

  const queue = [...playlist.segmentUrls];
  const results = new Map<number, ArrayBuffer>();
  const worker = async () => {
    for (;;) {
      throwIfAborted(signal);
      if (queue.length === 0) return;
      // Before shifting, the queue holds the not-yet-fetched tail; the item
      // being taken is at position total - queue.length.
      const index = total - queue.length;
      const segmentUrl = queue.shift() as string;
      let buf: ArrayBuffer | null = null;
      let lastError: unknown = null;
      for (let attempt = 0; attempt < SEGMENT_RETRIES; attempt++) {
        try {
          buf = await fetchBuffer(segmentUrl, headers, proxyBase, signal);
          break;
        } catch (err) {
          if (signal.aborted || (err as Error)?.name === 'AbortError') {
            throw new AbortedError();
          }
          lastError = err;
          await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
        }
      }
      if (buf === null) {
        throw lastError instanceof Error
          ? new Error(`Segment ${index + 1}/${total} failed: ${lastError.message}`)
          : new Error(`Segment ${index + 1}/${total} failed`);
      }
      if (cryptoKey) {
        const iv =
          staticIv ?? sequenceIv(index);
        const plain = await crypto.subtle.decrypt(
          { name: 'AES-CBC', iv: iv as BufferSource },
          cryptoKey,
          buf,
        );
        results.set(index, plain);
      } else {
        results.set(index, buf);
      }
      done += 1;
      bytes += buf.byteLength;
      progress();
    }
  };
  const workers = Array.from(
    { length: Math.min(SEGMENT_CONCURRENCY, Math.max(total, 1)) },
    () => worker(),
  );
  await Promise.all(workers);

  for (let i = 0; i < total; i++) {
    const part = results.get(i);
    if (part === undefined) throw new Error(`Missing segment ${i + 1}/${total}`);
    parts.push(part);
  }
  return new Blob(parts);
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.length % 2 ? `0${hex}` : hex;
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

// — External subtitles: normalize to WebVTT (Matroska's native text codec —

const vttTime = (h: string, m: string, s: string): string => {
  const pad = (n: string, len: number) => n.padStart(len, '0');
  const [sec, ms = '0'] = s.split('.');
  return `${pad(h, 2)}:${pad(m, 2)}:${pad(sec, 2)}.${pad(ms.slice(0, 3), 3)}`;
};

// mediabunny only accepts ISO 639-2/T codes; the API sends 2-letter codes.
const ISO_639_2: Record<string, string> = {
  en: 'eng',
  id: 'ind',
  th: 'tha',
  fr: 'fra',
  de: 'deu',
  it: 'ita',
  es: 'spa',
  pt: 'por',
  ja: 'jpn',
  ko: 'kor',
  zh: 'zho',
  ar: 'ara',
  ru: 'rus',
  hi: 'hin',
  tr: 'tur',
  vi: 'vie',
  ms: 'msa',
  tl: 'tgl',
};

function toIso639_2(code?: string): string | undefined {
  if (!code) return undefined;
  const lower = code.toLowerCase();
  return lower.length === 3 ? lower : ISO_639_2[lower];
}

function srtToVtt(text: string): string {
  return `WEBVTT\n\n${text
    .replace(/\r/g, '')
    .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2')
    .trim()}\n`;
}

// Best-effort ASS/SSA → VTT: keeps timing + plain text, drops styling
// (Matroska-via-mediabunny only carries WebVTT).
function assToVtt(text: string): string {
  const lines = text.split(/\r?\n/);
  const formatFields: string[] = [];
  const cues: string[] = [];
  const stripTags = (s: string) =>
    s
      .replace(/\{[^}]*\}/g, '')
      .replace(/\\N|\\n/g, '\n')
      .trim();
  for (const line of lines) {
    if (line.startsWith('Format:')) {
      // Both [V4+ Styles] and [Events] carry Format lines; only the Events
      // one contains start/end/text, so this guard skips the Styles one.
      const fields = line.slice(7).split(',').map((f) => f.trim().toLowerCase());
      if (fields.includes('start') && fields.includes('end') && fields.includes('text')) {
        formatFields.length = 0;
        formatFields.push(...fields);
      }
      continue;
    }
    if (line.startsWith('Dialogue:') && formatFields.length > 0) {
      // Text is the LAST field and may itself contain commas.
      const parts = line.slice(9).split(',');
      const textIdx = formatFields.indexOf('text');
      const body = parts.slice(textIdx).join(',');
      const start = parts[formatFields.indexOf('start')] ?? '';
      const end = parts[formatFields.indexOf('end')] ?? '';
      const timeRe = /^(\d+):(\d{2}):(\d{2}[.,]\d{1,3})/;
      const sm = timeRe.exec(start);
      const em = timeRe.exec(end);
      const content = stripTags(body);
      if (sm && em && content) {
        cues.push(
          `${vttTime(sm[1], sm[2], sm[3].replace(',', '.'))} --> ${vttTime(em[1], em[2], em[3].replace(',', '.'))}\n${content}`,
        );
      }
    }
  }
  return `WEBVTT\n\n${cues.join('\n\n')}\n`;
}

function toVtt(raw: string): string {
  const head = raw.slice(0, 512).trimStart();
  if (/^WEBVTT/i.test(head)) return raw;
  if (/^\d+\s*$/m.test(head) && /-->/.test(raw) && /,\d{3}/.test(raw)) {
    return srtToVtt(raw);
  }
  if (/\[Script Info\]/i.test(head) || /\[Events\]/i.test(head)) {
    return assToVtt(raw);
  }
  // Unknown format — hand it to the muxer anyway; the worst case is a
  // subtitle track that players ignore.
  return `WEBVTT\n\n${raw.trim()}\n`;
}

// HLS AES-128 default IV: the media sequence number as a 16-byte big-endian
// value (used when the playlist omits IV).
function sequenceIv(sequence: number): Uint8Array {
  const iv = new Uint8Array(16);
  const view = new DataView(iv.buffer);
  view.setUint32(12, sequence >>> 0);
  return iv;
}

function findBytes(data: Uint8Array, needle: Uint8Array, from = 0): number {
  outer: for (let i = from; i + needle.length <= data.length; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (data[i + j] !== needle[j]) continue outer;
    }
    return i;
  }
  return -1;
}

async function muxToMkv(
  mediaBlob: Blob,
  audioBlob: Blob | null,
  subtitles: { label: string; language?: string; vtt: string }[],
  filename: string,
  signal: AbortSignal,
  onProgress: (p: DownloadProgress) => void,
): Promise<HlsDownloadResult> {
  const {
    Input,
    Output,
    Conversion,
    ALL_FORMATS,
    BlobSource,
    MkvOutputFormat,
    StreamTarget,
    TextSubtitleSource,
    EncodedVideoPacketSource,
    EncodedAudioPacketSource,
    EncodedPacketSink,
  } = await import('mediabunny');
  throwIfAborted(signal);

  const input = new Input({ formats: ALL_FORMATS, source: new BlobSource(mediaBlob) });
  // Separate-audio providers (YUI/settlar): the audio track ships in its
  // own TS playlist, so it comes from a second Input.
  const audioInput = audioBlob
    ? new Input({ formats: ALL_FORMATS, source: new BlobSource(audioBlob) })
    : input;
  const fileName = `${filename.replace(/[\\/:*?"<>|]+/g, '_')}.mkv`;

  const reportMux = (p: number) =>
    onProgress({
      phase: 'muxing',
      segmentsDone: 1,
      segmentsTotal: 1,
      bytes: 0,
      muxProgress: p,
    });
  const wireAbort = (conversionLike: { cancel: () => Promise<void> }) => {
    const onAbort = () => void conversionLike.cancel();
    signal.addEventListener('abort', onAbort, { once: true });
    return () => signal.removeEventListener('abort', onAbort);
  };

  // Output target: collect muxed chunks BY POSITION. Mediabunny streams
  // media chunks in file order, then back-patches the Matroska Segment size,
  // SeekHead, and Cues over already-written offsets at finalize. Assembly
  // must therefore be last-write-wins: split/trim any chunk the new write
  // overlaps instead of sorting and appending (which leaves the placeholder
  // header in place and inserts patch bytes into the middle of the file).
  const chunks: { start: number; data: Uint8Array }[] = [];
  const writeChunk = (position: number, data: Uint8Array) => {
    if (data.byteLength === 0) return;
    const end = position + data.byteLength;
    // First chunk whose end is past this write's start (chunks are sorted
    // and non-overlapping).
    let lo = 0;
    let hi = chunks.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (chunks[mid].start + chunks[mid].data.byteLength <= position) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }
    // At most the first overlapping chunk extends left of the write and at
    // most the last extends right — keep them separate so the new chunk
    // lands between them and `chunks` stays sorted for the next search.
    let left: (typeof chunks)[number] | null = null;
    let right: (typeof chunks)[number] | null = null;
    let index = lo;
    while (index < chunks.length && chunks[index].start < end) {
      const chunk = chunks[index];
      const chunkEnd = chunk.start + chunk.data.byteLength;
      if (chunk.start < position) {
        left = {
          start: chunk.start,
          data: chunk.data.subarray(0, position - chunk.start),
        };
      }
      if (chunkEnd > end) {
        right = {
          start: end,
          data: chunk.data.subarray(end - chunk.start),
        };
      }
      index += 1;
    }
    chunks.splice(
      lo,
      index - lo,
      ...(left ? [left] : []),
      { start: position, data },
      ...(right ? [right] : []),
    );
  };
  const target = new StreamTarget(
    new WritableStream<import('mediabunny').StreamTargetChunk>({
      async write(chunk) {
        writeChunk(chunk.position, chunk.data);
      },
    }),
    { chunked: true },
  );

  try {
    if (subtitles.length === 0 && !audioBlob) {
      // Proven path: mediabunny's Conversion copies the input tracks 1:1.
      const output = new Output({ format: new MkvOutputFormat(), target });
      // Concatenated TS segments can expose two programs (duplicate video +
      // audio tracks); only the primary pair belongs in the MKV.
      const conversion = await Conversion.init({
        input,
        output,
        tracks: 'primary',
      });
      conversion.onProgress = reportMux;
      throwIfAborted(signal);
      const unwire = wireAbort(conversion);
      try {
        await conversion.execute();
      } finally {
        unwire();
      }
    } else {
      // With external soft subs OR a separate audio track, remux manually:
      // copy the video packets (input) and audio packets (audioInput) and
      // add each subtitle as a WebVTT track. The SAME source instances
      // passed to add*Track must be the ones fed packets.
      const output = new Output({ format: new MkvOutputFormat(), target });
      const rawVideoTrack = await input.getPrimaryVideoTrack();
      const rawAudioTrack = await audioInput.getPrimaryAudioTrack();
      if (!rawVideoTrack && !rawAudioTrack) throw new Error('Stream has no video or audio track');
      const videoTrack =
        rawVideoTrack && rawVideoTrack.codec ? rawVideoTrack : null;
      const audioTrack =
        rawAudioTrack && rawAudioTrack.codec ? rawAudioTrack : null;
      if (!videoTrack && !audioTrack) throw new Error('Unsupported codecs in stream');

      const videoSource = videoTrack
        ? new EncodedVideoPacketSource(videoTrack.codec!)
        : null;
      if (videoTrack && videoSource) output.addVideoTrack(videoSource);
      const audioSource = audioTrack
        ? new EncodedAudioPacketSource(audioTrack.codec!)
        : null;
      if (audioTrack && audioSource) output.addAudioTrack(audioSource);
      const subSources = subtitles.map((sub) => {
        const source = new TextSubtitleSource('webvtt');
        output.addSubtitleTrack(source, {
          name: sub.label,
          languageCode: toIso639_2(sub.language),
        });
        return { source, vtt: sub.vtt };
      });
      await output.start();

      if (videoTrack && videoSource) {
        const sink = new EncodedPacketSink(videoTrack);
        const decoderConfig = await videoTrack.getDecoderConfig();
        type VideoMeta = Parameters<typeof videoSource.add>[1];
        let packet = await sink.getFirstPacket();
        let sentMeta = false;
        let processed = 0;
        while (packet) {
          throwIfAborted(signal);
          await videoSource.add(
            packet,
            sentMeta ? undefined : ({ decoderConfig } as VideoMeta),
          );
          sentMeta = true;
          processed += 1;
          reportMux(Math.min(0.99, processed / Math.max(processed, 400)));
          packet = await sink.getNextPacket(packet);
        }
      }
      if (audioTrack && audioSource) {
        const sink = new EncodedPacketSink(audioTrack);
        const decoderConfig = await audioTrack.getDecoderConfig();
        type AudioMeta = Parameters<typeof audioSource.add>[1];
        let packet = await sink.getFirstPacket();
        let sentMeta = false;
        while (packet) {
          throwIfAborted(signal);
          await audioSource.add(
            packet,
            sentMeta ? undefined : ({ decoderConfig } as AudioMeta),
          );
          sentMeta = true;
          packet = await sink.getNextPacket(packet);
        }
      }
      for (const { source, vtt } of subSources) {
        await source.add(vtt);
      }
      await output.finalize();
    }
    } catch (err) {
      if (signal.aborted || (err as Error)?.name === 'AbortError') {
        throw new AbortedError();
      }
      throw err;
    }

  // Assemble in FILE order: sort by offset and reject gaps (a gap means
  // the muxer wrote beyond a hole — zero-fill it so the container stays
  // structurally valid). Chunks are already sorted and non-overlapping.
  if (subtitles.length > 0) {
    // mediabunny only emits S_TEXT/WEBVTT, which FFmpeg/VLC/Chrome cannot
    // decode. Cue bodies are plain text with block timing — i.e. valid
    // SubRip — so relabel the CodecID in place (same byte length).
    // shortcut: WebVTT-only styling/tags degrade to plain text.
    const needle = new TextEncoder().encode('S_TEXT/WEBVTT');
    const replacement = new Uint8Array(needle.length);
    replacement.set(new TextEncoder().encode('S_TEXT/UTF8'));
    for (const chunk of chunks) {
      if (chunk.start > 1024 * 1024) break; // Tracks live in the header
      let index = findBytes(chunk.data, needle);
      if (index < 0) continue;
      const copy = chunk.data.slice();
      while (index >= 0) {
        copy.set(replacement, index);
        index = findBytes(copy, needle, index + needle.length);
      }
      chunk.data = copy;
    }
  }
  const parts: BlobPart[] = [];
  let cursor = 0;
  for (const chunk of chunks) {
    if (chunk.start > cursor) {
      parts.push(new Uint8Array(chunk.start - cursor));
    }
    // StreamTargetChunk.data is Uint8Array<ArrayBufferLike>; a defensive
    // copy pins it to a plain ArrayBuffer for the Blob.
    parts.push(
      new Uint8Array(chunk.data).buffer as ArrayBuffer,
    );
    cursor = Math.max(cursor, chunk.start + chunk.data.byteLength);
  }
  const blob = new Blob(parts, { type: 'video/x-matroska' });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
  return { ok: true, fileName };
}

/**
 * Run the full download. Resolves {ok:true} on success, {ok:false,error} on
 * failure; throws AbortedError when canceled via the signal.
 */
export async function startHlsDownload(
  opts: HlsDownloadOptions,
): Promise<HlsDownloadResult> {
  const { url, headers, proxyBase, filename, subtitles, qualityHeight, onProgress, signal } = opts;
  try {
    throwIfAborted(signal);
    onProgress({
      phase: 'manifest',
      segmentsDone: 0,
      segmentsTotal: 0,
      bytes: 0,
      muxProgress: 0,
    });
    const {
      video,
      audioUrl,
      subtitles: manifestSubtitles,
    } = await resolveMediaPlaylist(url, headers, proxyBase, signal, qualityHeight);
    if (video.byterange) {
      return { ok: false, error: 'This stream uses byte-range segments, which are not supported.' };
    }
    // Separate-audio providers (YUI/settlar): the AUDIO group is its own
    // playlist — a video-only file would be silent, so resolve and download
    // it too.
    let audio: MediaPlaylist | null = null;
    if (audioUrl) {
      try {
        const resolvedAudio = await resolveMediaPlaylist(
          audioUrl,
          headers,
          proxyBase,
          signal,
        );
        audio = resolvedAudio.video;
      } catch (err) {
        if (signal.aborted) throw new AbortedError();
        console.warn('Separate audio track unavailable — video only:', err);
      }
    }
    const totalSegments =
      video.segmentUrls.length + (audio ? audio.segmentUrls.length : 0);
    const mediaBlob = await fetchSegmentBlob(
      video,
      headers,
      proxyBase,
      signal,
      (done, _total, bytes) =>
        onProgress({
          phase: 'segments',
          segmentsDone: done,
          segmentsTotal: totalSegments,
          bytes,
          muxProgress: 0,
        }),
    );
    let audioBlob: Blob | null = null;
    if (audio) {
      audioBlob = await fetchSegmentBlob(
        audio,
        headers,
        proxyBase,
        signal,
        (done, _total, bytes) =>
          onProgress({
            phase: 'segments',
            segmentsDone: video.segmentUrls.length + done,
            segmentsTotal: totalSegments,
            bytes,
            muxProgress: 0,
          }),
      );
    }
    throwIfAborted(signal);

    // External subs: fetch + normalize every track to WebVTT. A failed
    // subtitle fetch never kills the download — it just drops that track.
    // The player's per-source list (passed in) is authoritative; the master's
    // EXT-X-MEDIA renditions are only a fallback (some providers advertise
    // dead subtitle objects there).
    const seenSubtitleUrls = new Set<string>();
    const downloadSubtitles = (
      subtitles && subtitles.length > 0 ? subtitles : manifestSubtitles
    ).filter(
      (sub) => {
        // Thumbnail/preview tracks are not dialogue; skip them.
        if (!sub?.url || /thumbnail|preview/i.test(sub.url)) return false;
        if (seenSubtitleUrls.has(sub.url)) return false;
        seenSubtitleUrls.add(sub.url);
        return true;
      },
    );
    const vttTracks: { label: string; language?: string; vtt: string }[] = [];
    for (const sub of downloadSubtitles) {
      try {
        throwIfAborted(signal);
        const raw = await fetchText(sub.url, headers, proxyBase, signal);
        vttTracks.push({ label: sub.label, language: sub.language, vtt: toVtt(raw) });
      } catch (err) {
        if (signal.aborted) throw new AbortedError();
        console.warn('Subtitle track skipped:', sub.label, err);
      }
    }

    const result = await muxToMkv(
      mediaBlob,
      audioBlob,
      vttTracks,
      filename,
      signal,
      onProgress,
    );
    onProgress({
      phase: 'done',
      segmentsDone: 1,
      segmentsTotal: 1,
      bytes: 0,
      muxProgress: 1,
    });
    return result;
  } catch (err) {
    if (signal.aborted || (err as Error)?.name === 'AbortError' || (err as Error)?.name === 'ConversionCanceledError') {
      throw new AbortedError();
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Download failed',
    };
  }
}

export const isDownloadCanceled = (err: unknown): boolean =>
  err instanceof Error && err.name === 'AbortedError';
