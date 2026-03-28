# Prompt log

## 2025-03-27

1. **Initial plan:** Node.js web app for timers tracking time since/until a date; persistence choice server JSON.

2. **Plan iteration:** Reset action; `createdAt` and `resets` history; timer details UI; Fly.io deployment with volume.

3. **Implementation:** “Node.js ‘time since / until’ timer web app — Implement the plan as specified… Do NOT edit the plan file itself… Mark todos… Don’t stop until all to-dos are completed.”

4. **UI refresh:** Minimal timer rows with time since/until as the hero; tap/click row to expand drawer with edit, reset, details, delete, etc.

5. **Fly deploy:** Confirm fly.toml (small VM, scale-to-zero, mount size — Fly minimum volume ~1 GB, not 64 MB).

## 2026-03-27

6. **Fly CLI:** Walk through installing the Fly CLI on this Mac.

7. **fly vs flyctl:** Also have Concourse `fly` installed; after `brew install flyctl`, use Fly.io via `flyctl` instead of `fly` — avoid name conflict.
