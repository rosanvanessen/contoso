import { createApp } from './app.ts';

const port = Number(process.env.PORT ?? 3000);
const app = createApp();

app.listen(port, () => {
  process.stdout.write(JSON.stringify({
    level: 'info',
    message: `Contoso Pension Platform running on http://localhost:${port}  (API: /api/health, UI: /)`,
  }) + '\n');
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => app.close(() => process.exit(0)));
}
