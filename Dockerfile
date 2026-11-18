# Contoso Pension Platform — zero runtime dependencies (Node 24 runs TypeScript natively).
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY package.json ./
COPY api ./api
COPY web ./web
COPY data ./data
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:3000/api/health || exit 1
CMD ["node", "api/src/server.ts"]
