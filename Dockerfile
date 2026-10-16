FROM node:22-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

FROM falkordb/falkordb:latest
COPY --from=node:22-bookworm-slim /usr/local/bin/node /usr/local/bin/node
WORKDIR /app
COPY --from=build /app /app
COPY scripts/start-container.sh /usr/local/bin/start-opsrelay
RUN chmod +x /usr/local/bin/start-opsrelay
ENV FALKORDB_URL=redis://127.0.0.1:6379 FALKORDB_GRAPH=opsrelay PORT=10000
EXPOSE 10000
ENTRYPOINT ["/usr/local/bin/start-opsrelay"]
