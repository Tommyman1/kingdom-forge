# Kingdom Forge 2.5.5 — Portainer installation

Kingdom Forge is designed to keep all persistent information in the named Docker volume `kingdom-forge-data`. Rebuilding or replacing the container does not delete accounts, characters, campaigns, or scheduled database backups.

## New installation from a Git repository

1. Extract this package into a new `kingdom-forge` repository and push every file to GitHub.
2. In Portainer, open **Stacks → Add stack → Repository**.
3. Enter the repository URL and set the Compose path to `compose.yaml`.
4. Deploy the stack. The initial image build can take several minutes.
5. Open `http://SERVER-IP:3000`. The first account created becomes the administrator.

The default compose file publishes port 3000 and does not require an existing Docker network.

## Tommy's proxy-network installation

Your server already has the external Docker network named `proxy`. Use `compose.portainer-proxy.yaml` as the Compose path. It does not publish a host port; Nginx Proxy Manager should forward to:

- Forward host: `kingdom-forge`
- Forward port: `3000`
- Scheme: `http`
- WebSocket support: enabled

Keep `COOKIE_SECURE=true` when using HTTPS. Use `false` only for plain HTTP testing.

## Updating safely

Download a database backup from **Admin → Download Database Backup** before updating. Pull the new repository revision and redeploy the stack without deleting `kingdom-forge-data`. Kingdom Forge applies additive database migrations during startup and makes scheduled backups under `/data/backups`.

Never select **Remove volumes** when removing or replacing the stack unless you intentionally want to erase all Kingdom Forge data.

## Health monitoring

- `GET /health` confirms the gateway process is running.
- `GET /ready` confirms the SQLite database is available.
- The supplied Compose health check calls `/health` every 30 seconds.

## Recovery

The persistent database is `/data/kingdom-forge.sqlite`. Scheduled copies are stored in `/data/backups`. Stop the container before replacing the live database with a backup. Preserve the original database until the restored installation has been verified.
