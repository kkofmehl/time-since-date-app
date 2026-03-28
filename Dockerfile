FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
# Match fly.toml [http_service] internal_port; Fly injects PORT at runtime but this
# ensures the container listens on 8080 if PORT is missing from the environment.
ENV PORT=8080
ENV TIMERS_DATA_PATH=/data/timers.json

EXPOSE 8080
CMD ["node", "server.js"]
