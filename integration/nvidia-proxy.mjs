/* SÜKÛN r941 — optional, user-owned Cloudflare Worker. Not deployed by this file.
 * Each caller supplies their own NVIDIA key. No server key, storage or logging.
 * Developer evaluation only; NVIDIA's account/model terms still apply.
 */
const UPSTREAM = 'https://integrate.api.nvidia.com/v1/chat/completions';
const DEFAULT_ORIGIN = 'https://sukunpro.github.io';
const MODELS = new Set(['nvidia/nemotron-3-super-120b-a12b', 'moonshotai/kimi-k3']);
const REQUEST_LIMIT = 100 * 1024;
const RESPONSE_LIMIT = 512 * 1024;
const TIMEOUT_MS = 15000;

class ProxyError extends Error {
  constructor(code, status) { super(code); this.code = code; this.status = status; }
}

function allowedOrigin(env) {
  const value = env?.ALLOWED_ORIGIN ?? DEFAULT_ORIGIN;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && value === url.origin ? value : null;
  } catch { return null; }
}

function headers(origin, extras = {}) {
  const value = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Vary': 'Origin',
    ...extras,
  };
  if (origin) {
    value['Access-Control-Allow-Origin'] = origin;
    value['Access-Control-Expose-Headers'] = 'Retry-After';
  }
  return value;
}

function errorResponse(code, status, origin, extras) {
  return new Response(JSON.stringify({error: {code, message: code}}), {
    status, headers: headers(origin, extras),
  });
}

function cancelBody(body) {
  try { Promise.resolve(body?.cancel()).catch(() => {}); } catch { /* no logging */ }
}

async function limitedText(response, maxBytes, deadline) {
  const length = response.headers.get('Content-Length');
  if (length !== null && /^\d+$/.test(length) && Number(length) > maxBytes) {
    cancelBody(response.body);
    throw new ProxyError('BODY_TOO_LARGE', 413);
  }
  if (!response.body) return '';
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const part = await Promise.race([reader.read(), deadline]);
      if (part.done) break;
      total += part.value.byteLength;
      if (total > maxBytes) throw new ProxyError('BODY_TOO_LARGE', 413);
      chunks.push(part.value);
    }
  } catch (error) {
    try { Promise.resolve(reader.cancel()).catch(() => {}); } catch { /* no logging */ }
    throw error;
  } finally {
    try { reader.releaseLock(); } catch { /* a cancelled pending read can hold the lock */ }
  }
  const joined = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { joined.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder('utf-8', {fatal: true}).decode(joined);
}

function payloadFrom(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body))
    throw new ProxyError('INVALID_REQUEST', 400);
  if (!MODELS.has(body.model)) throw new ProxyError('MODEL_NOT_ALLOWED', 400);
  if (!Array.isArray(body.messages) || !body.messages.length || body.messages.length > 80)
    throw new ProxyError('INVALID_MESSAGES', 400);
  const roles = new Set(['system', 'user', 'assistant']);
  const messages = body.messages.map(message => {
    if (!message || !roles.has(message.role) || typeof message.content !== 'string' ||
        !message.content.trim() || message.content.length > 65536)
      throw new ProxyError('INVALID_MESSAGES', 400);
    return {role: message.role, content: message.content};
  });
  const requestedTokens = body.max_tokens ?? 1024;
  if (typeof requestedTokens !== 'number' || !Number.isFinite(requestedTokens) || requestedTokens <= 0)
    throw new ProxyError('INVALID_TOKEN_LIMIT', 400);
  const payload = {
    model: body.model, messages,
    max_tokens: Math.max(1, Math.min(4096, Math.floor(requestedTokens))),
    stream: false,
  };
  if (body.model === 'moonshotai/kimi-k3') {
    payload.temperature = 1;
    payload.reasoning_effort = 'low';
  } else {
    payload.temperature = typeof body.temperature === 'number' && Number.isFinite(body.temperature)
      ? Math.min(2, Math.max(0, body.temperature)) : 0.5;
  }
  return payload;
}

function retryAfter(value) {
  if (!value || value.length > 80) return null;
  if (/^\d+$/.test(value.trim())) {
    const seconds = Number(value);
    return Number.isSafeInteger(seconds) ? String(Math.min(86400, seconds)) : null;
  }
  // Convert valid HTTP dates to delay seconds; never echo upstream header text.
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return null;
  return String(Math.min(86400, Math.max(0, Math.ceil((timestamp - Date.now()) / 1000))));
}

function scrubContent(content, key) {
  return content.split(key).join('[anahtar gizlendi]')
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]{8,}/gi, 'Bearer [gizlendi]')
    .replace(/nvapi-[A-Za-z0-9_-]{8,}/g, '[anahtar gizlendi]');
}

export default {
  async fetch(request, env = {}) {
    const configured = allowedOrigin(env);
    if (!configured) return errorResponse('INVALID_ORIGIN_CONFIG', 503, null);
    const origin = request.headers.get('Origin');
    if (origin !== configured) return errorResponse('ORIGIN_NOT_ALLOWED', 403, null);
    const url = new URL(request.url);
    if (url.pathname !== '/nvidia') return errorResponse('NOT_FOUND', 404, origin);
    if (url.search) return errorResponse('QUERY_NOT_ALLOWED', 400, origin);
    if (request.method === 'OPTIONS') {
      const method = request.headers.get('Access-Control-Request-Method');
      const requestedHeaders = (request.headers.get('Access-Control-Request-Headers') || '')
        .toLowerCase().split(',').map(value => value.trim()).filter(Boolean);
      if (method !== 'POST' || requestedHeaders.some(value => !['authorization', 'content-type'].includes(value)))
        return errorResponse('PREFLIGHT_NOT_ALLOWED', 403, origin);
      return new Response(null, {status: 204, headers: headers(origin, {
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
        'Access-Control-Max-Age': '600',
      })});
    }
    if (request.method !== 'POST')
      return errorResponse('METHOD_NOT_ALLOWED', 405, origin, {'Allow': 'POST, OPTIONS'});
    const auth = /^Bearer ([A-Za-z0-9._~+/=-]{16,512})$/i.exec(request.headers.get('Authorization') || '');
    if (!auth) return errorResponse('API_KEY_REQUIRED', 401, origin);
    if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type') || ''))
      return errorResponse('JSON_REQUIRED', 415, origin);
    if (request.signal?.aborted) return errorResponse('REQUEST_CANCELLED', 499, origin);

    const key = auth[1];
    const controller = new AbortController();
    let expired = false;
    let callerCancelled = false;
    let rejectDeadline;
    const deadline = new Promise((_, reject) => { rejectDeadline = reject; });
    const timer = setTimeout(() => {
      expired = true;
      controller.abort();
      rejectDeadline(new ProxyError('UPSTREAM_TIMEOUT', 504));
    }, TIMEOUT_MS);
    const onCancel = () => {
      callerCancelled = true;
      controller.abort();
      rejectDeadline(new ProxyError('REQUEST_CANCELLED', 499));
    };
    request.signal?.addEventListener('abort', onCancel, {once: true});
    let phase = 'request';
    try {
      const raw = await limitedText(request, REQUEST_LIMIT, deadline);
      let data;
      try { data = JSON.parse(raw); } catch { throw new ProxyError('INVALID_JSON', 400); }
      const payload = payloadFrom(data);
      phase = 'upstream';
      const upstream = await Promise.race([fetch(UPSTREAM, {
        method: 'POST',
        headers: {'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json', 'Accept': 'application/json'},
        body: JSON.stringify(payload),
        redirect: 'error',
        signal: controller.signal,
      }), deadline]);
      if (!upstream.ok) {
        cancelBody(upstream.body);
        const retry = retryAfter(upstream.headers.get('Retry-After'));
        const extras = retry !== null ? {'Retry-After': retry} : {};
        if (upstream.status === 401 || upstream.status === 403)
          return errorResponse('NVIDIA_AUTH_FAILED', upstream.status, origin, extras);
        if (upstream.status === 429)
          return errorResponse('NVIDIA_RATE_LIMIT', 429, origin, retry === null ? {'Retry-After': '60'} : extras);
        if (upstream.status === 404)
          return errorResponse('NVIDIA_MODEL_UNAVAILABLE', 404, origin, extras);
        return errorResponse('NVIDIA_UPSTREAM_ERROR', 502, origin, extras);
      }
      if (!/^application\/json(?:\s*;|$)/i.test(upstream.headers.get('Content-Type') || '')) {
        cancelBody(upstream.body);
        throw new ProxyError('NVIDIA_INVALID_RESPONSE', 502);
      }
      const result = JSON.parse(await limitedText(upstream, RESPONSE_LIMIT, deadline));
      const message = result?.choices?.[0]?.message;
      if (!message || typeof message.content !== 'string' || !message.content.trim() || message.content.length > 65536)
        throw new ProxyError('NVIDIA_EMPTY_RESPONSE', 502);
      const reason = result.choices[0].finish_reason;
      const safeResult = {
        model: payload.model,
        choices: [{index: 0, message: {role: 'assistant', content: scrubContent(message.content, key)},
          finish_reason: ['stop', 'length', 'content_filter'].includes(reason) ? reason : 'stop'}],
      };
      return new Response(JSON.stringify(safeResult), {status: 200, headers: headers(origin)});
    } catch (error) {
      controller.abort();
      if (expired) return errorResponse('UPSTREAM_TIMEOUT', 504, origin);
      if (callerCancelled) return errorResponse('REQUEST_CANCELLED', 499, origin);
      if (error instanceof ProxyError) {
        if (phase === 'upstream' && error.code === 'BODY_TOO_LARGE')
          return errorResponse('NVIDIA_RESPONSE_TOO_LARGE', 502, origin);
        return errorResponse(error.code, error.status, origin);
      }
      return errorResponse(phase === 'request' ? 'INVALID_REQUEST' : 'NVIDIA_UPSTREAM_ERROR',
        phase === 'request' ? 400 : 502, origin);
    } finally {
      clearTimeout(timer);
      request.signal?.removeEventListener('abort', onCancel);
    }
  },
};
