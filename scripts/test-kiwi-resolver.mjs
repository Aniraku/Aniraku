import handler from '../api/kiwi-resolve.js';

const payload = { status: 0, body: null, headers: {} };
const res = {
  setHeader(key, value) {
    payload.headers[key.toLowerCase()] = value;
  },
  status(code) {
    payload.status = code;
    return this;
  },
  json(body) {
    payload.body = body;
    return this;
  },
};

await handler(
  { method: 'GET', query: { url: 'https://kwik.cx/e/Cw8iW8xWK2sq' } },
  res,
);

if (payload.status !== 200) {
  throw new Error(`Kiwi resolver returned ${payload.status}: ${JSON.stringify(payload.body)}`);
}

const source = payload.body?.source;
const url = new URL(source?.url ?? '');
if (source?.type !== 'hls' || source?.verification !== 'proxy' || !/\.m3u8(?:$|\?)/i.test(url.pathname)) {
  throw new Error(`Unexpected resolved source: ${JSON.stringify(source)}`);
}
if (!/(?:^|\.)(?:owocdn|uwucdn)\.(?:top|net|com)$/i.test(url.hostname)) {
  throw new Error(`Unexpected resolved media host: ${url.hostname}`);
}
if (payload.body?.headers?.Referer !== 'https://kwik.cx/') {
  throw new Error('Resolver did not retain the required Kiwi Referer.');
}

console.log(`Kiwi resolver smoke check passed: ${url.hostname}`);
