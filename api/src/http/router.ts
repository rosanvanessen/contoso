import type { IncomingMessage, ServerResponse } from 'node:http';
import { ApiError } from './errors.ts';

export interface RequestContext {
  req: IncomingMessage;
  params: Record<string, string>;
  query: URLSearchParams;
  body: unknown;
  requestId: string;
}

export interface HandlerResult { status?: number; body: unknown }
export type Handler = (ctx: RequestContext) => HandlerResult | Promise<HandlerResult>;

interface Route { method: string; pattern: RegExp; keys: string[]; handler: Handler }

/** Minimal router: `/api/members/:id` style paths, JSON in / JSON out. No external dependencies. */
export class Router {
  private readonly routes: Route[] = [];

  add(method: string, path: string, handler: Handler): this {
    const keys: string[] = [];
    const pattern = new RegExp('^' + path.replace(/:([A-Za-z]+)/g, (_m, key: string) => {
      keys.push(key);
      return '([^/]+)';
    }) + '/?$');
    this.routes.push({ method, pattern, keys, handler });
    return this;
  }

  get(path: string, handler: Handler) { return this.add('GET', path, handler); }
  post(path: string, handler: Handler) { return this.add('POST', path, handler); }

  /** Returns true when a route matched (handled or 405), false when nothing matched the path. */
  async handle(req: IncomingMessage, res: ServerResponse, url: URL, requestId: string): Promise<boolean> {
    const candidates = this.routes.filter((r) => r.pattern.test(url.pathname));
    if (candidates.length === 0) return false;

    const route = candidates.find((r) => r.method === req.method);
    if (!route) {
      throw new ApiError('METHOD_NOT_ALLOWED', `${req.method} is not allowed on ${url.pathname}`);
    }
    const match = route.pattern.exec(url.pathname)!;
    const params: Record<string, string> = {};
    route.keys.forEach((key, i) => { params[key] = decodeURIComponent(match[i + 1]); });

    const body = req.method === 'POST' || req.method === 'PUT' ? await readJson(req) : undefined;
    const result = await route.handler({ req, params, query: url.searchParams, body, requestId });
    sendJson(res, result.status ?? 200, result.body);
    return true;
  }
}

export function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

async function readJson(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > 64 * 1024) throw new ApiError('BAD_REQUEST', 'Request body too large (max 64 KB)');
    chunks.push(chunk as Buffer);
  }
  if (chunks.length === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new ApiError('BAD_REQUEST', 'Request body must be valid JSON');
  }
}
