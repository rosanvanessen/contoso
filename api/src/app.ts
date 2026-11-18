import { createServer } from 'node:http';
import type { IncomingMessage, Server, ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { DatabaseSync } from 'node:sqlite';

import { createDatabase } from './db/database.ts';
import { ApiError } from './http/errors.ts';
import { Router, sendJson } from './http/router.ts';
import { MemberRepository } from './repositories/memberRepository.ts';
import { EmployerRepository } from './repositories/employerRepository.ts';
import { ContributionRepository } from './repositories/contributionRepository.ts';
import { ServiceRequestRepository } from './repositories/serviceRequestRepository.ts';
import { StatementService } from './services/statementService.ts';
import { ProjectionService } from './services/projectionService.ts';
import { registerHealthRoutes } from './routes/health.ts';
import { registerMemberRoutes } from './routes/members.ts';
import { registerEmployerRoutes } from './routes/employers.ts';
import { registerProjectionRoutes } from './routes/projections.ts';
import { registerServiceRequestRoutes } from './routes/serviceRequests.ts';

const WEB_ROOT = fileURLToPath(new URL('../../web/', import.meta.url));
const OPENAPI = fileURLToPath(new URL('../openapi.yaml', import.meta.url));
const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.yaml': 'application/yaml; charset=utf-8',
};

export interface AppOptions {
  db?: DatabaseSync;
  /** Injectable clock so tests are deterministic. Returns an ISO date (YYYY-MM-DD). */
  today?: () => string;
  /** Structured log sink; defaults to stdout JSON lines. */
  log?: (entry: Record<string, unknown>) => void;
}

/** Composition root: wires database → repositories → services → routes. */
export function createApp(options: AppOptions = {}): Server {
  const db = options.db ?? createDatabase();
  const today = options.today ?? (() => new Date().toISOString().slice(0, 10));
  const log = options.log ?? ((entry) => process.stdout.write(JSON.stringify(entry) + '\n'));

  const members = new MemberRepository(db);
  const employers = new EmployerRepository(db);
  const contributions = new ContributionRepository(db);
  const requests = new ServiceRequestRepository(db);
  const statements = new StatementService(contributions);
  const projections = new ProjectionService(contributions);

  const router = new Router();
  registerHealthRoutes(router, new Date());
  registerMemberRoutes(router, { members, contributions, statements, today });
  registerEmployerRoutes(router, { employers, members });
  registerProjectionRoutes(router, { members, projections, today });
  registerServiceRequestRoutes(router, { members, requests, today });

  return createServer(async (req: IncomingMessage, res: ServerResponse) => {
    const requestId = randomUUID();
    const started = performance.now();
    const url = new URL(req.url ?? '/', 'http://localhost');
    res.setHeader('x-request-id', requestId);
    try {
      const handled = await router.handle(req, res, url, requestId);
      if (!handled) await serveStatic(url.pathname, res);
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError('INTERNAL', 'Unexpected error');
      if (!(err instanceof ApiError)) log({ level: 'error', requestId, message: String(err) });
      sendJson(res, apiError.status, apiError.toBody());
    } finally {
      log({
        level: 'info', requestId, method: req.method, path: url.pathname,
        status: res.statusCode, durationMs: Math.round(performance.now() - started),
      });
    }
  });
}

async function serveStatic(pathname: string, res: ServerResponse): Promise<void> {
  if (pathname.startsWith('/api/')) throw new ApiError('NOT_FOUND', `No API route for ${pathname}`);
  if (pathname === '/openapi.yaml') return sendFile(OPENAPI, res);
  const relative = normalize(pathname === '/' ? '/index.html' : pathname).replace(/^(\.\.[/\\])+/, '');
  const file = join(WEB_ROOT, relative);
  if (!file.startsWith(WEB_ROOT)) throw new ApiError('NOT_FOUND', 'Not found');
  return sendFile(file, res);
}

async function sendFile(file: string, res: ServerResponse): Promise<void> {
  try {
    const content = await readFile(file);
    res.writeHead(200, { 'content-type': CONTENT_TYPES[extname(file)] ?? 'application/octet-stream' });
    res.end(content);
  } catch {
    throw new ApiError('NOT_FOUND', 'Not found');
  }
}
