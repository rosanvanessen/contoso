import type { AddressInfo } from 'node:net';
import { createApp } from '../src/app.ts';

/** Starts the app on a random port with a fixed clock (2026-11-18 = workshop day). */
export async function startTestServer(today = '2026-11-18') {
  const server = createApp({ today: () => today, log: () => {} });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const { port } = server.address() as AddressInfo;
  const base = `http://127.0.0.1:${port}`;
  return {
    base,
    get: (path: string) => fetch(`${base}${path}`),
    post: (path: string, body: unknown) =>
      fetch(`${base}${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }),
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}
