# Time since / until

A small Node.js web application for creating **named timers** that show how much time has **elapsed since** a chosen instant or remains **until** that instant. Timers are stored on the server as JSON so they persist across browsers and sessions.

## Features

- **Live duration** — Counts days, hours, minutes, and seconds, updating every second.
- **Since / until** — The label follows the target: past targets show elapsed time (“Since”); future targets show remaining time (“Until”).
- **Minimal list** — Each row highlights the duration; expand a row for actions.
- **Reset** — Sets the target to the current time and records the event in a history log.
- **Details** — View creation time, current target, and the full reset history.
- **REST API** — JSON API for automation or integration (see below).

## Tech stack

- **Runtime:** Node.js 18+
- **Server:** Express
- **Client:** Static HTML, CSS, and JavaScript (no build step)
- **Persistence:** Single JSON file with atomic writes and simple locking

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or newer  
- npm (bundled with Node)

### Install

```bash
npm install
```

### Run locally

```bash
npm start
```

Open a browser at [http://localhost:3000](http://localhost:3000). On first use, the app creates `data/timers.json` (ensure the process can create the `data/` directory).

### Run tests

```bash
npm test
```

## Configuration

Environment variables:

| Variable | Description |
|----------|-------------|
| `PORT` | HTTP port (default: **3000** when unset). Production containers often set this (e.g. **8080**). |
| `HOST` | Bind address (default: **0.0.0.0**). |
| `TIMERS_DATA_PATH` | Absolute path to the timers JSON file. Takes precedence over `DATA_DIR`. |
| `DATA_DIR` | Directory containing `timers.json` if `TIMERS_DATA_PATH` is not set. |
| `NODE_ENV` | Set to `production` in typical deployments. |

If neither `TIMERS_DATA_PATH` nor `DATA_DIR` is set, the file defaults to `./data/timers.json` relative to the current working directory.

## API

Base path: `/api/timers`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/timers` | List all timers. |
| `GET` | `/api/timers/:id` | Get one timer. |
| `POST` | `/api/timers` | Create (`{ "name": string, "target": ISO 8601 string }`). |
| `PATCH` | `/api/timers/:id` | Update name and/or target (`{ "name"?, "target"? }`). Does not append to reset history. |
| `POST` | `/api/timers/:id/reset` | Set target to now and append to reset log. |
| `DELETE` | `/api/timers/:id` | Delete a timer. |

Responses are JSON. Validation failures return `400`; missing resources return `404`.

## Docker

Build and run with the included `Dockerfile`:

```bash
docker build -t time-since-date-app .
docker run --rm -p 8080:8080 -e TIMERS_DATA_PATH=/data/timers.json -v "$(pwd)/data:/data" time-since-date-app
```

The image defaults to listening on port **8080** inside the container.

## Deployment notes

This project includes a `fly.toml` and `Dockerfile` suitable for deploying on [Fly.io](https://fly.io/) or similar container platforms. Persistent timers require **durable storage** (for example, a mounted volume) so `timers.json` survives restarts; configure `TIMERS_DATA_PATH` to point at that mount. Create the volume in the **same region** as the app, size volumes in **gigabytes** (the smallest commonly available tier is typically 1 GB), and keep **one Machine** per volume unless you adopt a multi-instance storage strategy.

After changing configuration or environment, redeploy the container image so the running service picks up updates.

## License

Specify a license in this repository if you distribute or publish the project.
