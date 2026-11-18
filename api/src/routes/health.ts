import type { Router } from '../http/router.ts';

export function registerHealthRoutes(router: Router, startedAt: Date): void {
  router.get('/api/health', () => ({
    body: { status: 'ok', service: 'contoso-pension-api', startedAt: startedAt.toISOString() },
  }));
}
