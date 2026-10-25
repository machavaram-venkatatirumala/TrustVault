import type { IncomingMessage, ServerResponse } from 'http';

interface CustomRequest extends IncomingMessage {
  url?: string;
  method?: string;
  body?: any;
}

interface CustomResponse extends ServerResponse {
  status: (statusCode: number) => CustomResponse;
  json: (data: any) => void;
}

/**
 * TrustVault Vercel Serverless Proxy Handler (Root Fallback)
 * Transparently reverse-proxies all API traffic to the real TrustVault Flask/PostgreSQL backend.
 * Never fabricates mock data or returns simulated records.
 */
export default async function handler(req: CustomRequest, res: CustomResponse) {
  // CORS Headers
  const origin = (req.headers.origin as string) || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Request-ID, X-Idempotency-Key'
  );

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const backendUrl =
    process.env.BACKEND_URL ||
    process.env.VITE_API_BASE_URL ||
    process.env.TRUSTVAULT_API_URL ||
    '';

  if (!backendUrl) {
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        error: {
          message:
            'TrustVault Backend API is not configured on this serverless deployment. Please configure the BACKEND_URL or VITE_API_BASE_URL environment variable to point to your live TrustVault backend instance.',
          code: 'BACKEND_NOT_CONFIGURED',
        },
      })
    );
    return;
  }

  // Construct target URL
  const targetBase = backendUrl.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
  const path = req.url || '/';
  const targetUrl = `${targetBase}${path.startsWith('/') ? path : `/${path}`}`;

  try {
    // Read request body if present
    let bodyBuffer: Buffer | undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
      }
      if (chunks.length > 0) {
        bodyBuffer = Buffer.concat(chunks);
      }
    }

    // Forward request headers (excluding host)
    const forwardHeaders: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (key.toLowerCase() === 'host') continue;
      if (value !== undefined) {
        forwardHeaders[key] = Array.isArray(value) ? value.join(', ') : value;
      }
    }

    const proxyRes = await fetch(targetUrl, {
      method: req.method,
      headers: forwardHeaders,
      body: bodyBuffer,
      redirect: 'manual',
    });

    res.statusCode = proxyRes.status;

    // Forward response headers
    proxyRes.headers.forEach((val, key) => {
      if (key.toLowerCase() === 'set-cookie') {
        const rawCookies = (proxyRes.headers as any).getSetCookie?.() || [val];
        res.setHeader('Set-Cookie', rawCookies);
      } else {
        res.setHeader(key, val);
      }
    });

    // Pipe response body
    const arrayBuffer = await proxyRes.arrayBuffer();
    res.end(Buffer.from(arrayBuffer));
  } catch (proxyError: any) {
    console.error('Vercel API reverse proxy error:', proxyError);
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        error: {
          message: `Failed to proxy request to TrustVault backend at ${targetUrl}: ${proxyError.message}`,
          code: 'PROXY_BACKEND_ERROR',
        },
      })
    );
  }
}
