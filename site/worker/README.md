# xldx API Worker

Cloudflare Worker providing GitHub OAuth and XLSX generation API.

## Endpoints

| Method | Path             | Description                         |
| ------ | ---------------- | ----------------------------------- |
| GET    | `/auth/github`   | Redirects to GitHub OAuth           |
| GET    | `/auth/callback` | Handles OAuth callback, returns JWT |
| GET    | `/api/generate`  | Generates demo XLSX (requires JWT)  |

## Setup

### 1. Install Wrangler CLI

```bash
npm install -g wrangler
# or
bun add -g wrangler
```

### 2. Login to Cloudflare

```bash
wrangler login
```

### 3. Create GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in:
   - **Application name**: `xldx Demo`
   - **Homepage URL**: `https://yowainwright.github.io/xldx`
   - **Authorization callback URL**: `https://xldx-api.<your-subdomain>.workers.dev/auth/callback`
4. Click **Register application**
5. Copy the **Client ID**
6. Generate and copy a **Client Secret**

### 4. Set Secrets

```bash
cd site/worker

# Set each secret (you'll be prompted for the value)
wrangler secret put GITHUB_CLIENT_ID
wrangler secret put GITHUB_CLIENT_SECRET
wrangler secret put JWT_SECRET
```

For `JWT_SECRET`, generate a random string:

```bash
openssl rand -base64 32
```

### 5. Update Constants

Edit `constants.ts` and update `WORKER_URL` to match your deployed worker URL:

```typescript
export const WORKER_URL = "https://xldx-api.<your-subdomain>.workers.dev";
```

### 6. Deploy

```bash
wrangler deploy
```

## Local Development

```bash
# Run locally with secrets from .dev.vars file
wrangler dev

# Create .dev.vars file (gitignored)
echo "GITHUB_CLIENT_ID=your-dev-client-id
GITHUB_CLIENT_SECRET=your-dev-secret
JWT_SECRET=dev-jwt-secret-min-32-chars-long" > .dev.vars
```

For local dev, create a separate GitHub OAuth App with callback URL:
`http://localhost:8787/auth/callback`

## Testing

```bash
# From site directory
bun test worker
```

## Environment Variables

| Variable               | Description                            |
| ---------------------- | -------------------------------------- |
| `GITHUB_CLIENT_ID`     | GitHub OAuth App client ID             |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App client secret         |
| `JWT_SECRET`           | Secret for signing JWTs (min 32 chars) |

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌────────────┐
│   Browser   │────▶│ /auth/github │────▶│   GitHub   │
└─────────────┘     └──────────────┘     └────────────┘
       │                                        │
       │           ┌───────────────┐            │
       │◀──────────│/auth/callback │◀───────────┘
       │           └───────────────┘
       │                  │
       │            (JWT issued)
       │                  │
       ▼                  ▼
┌─────────────┐     ┌──────────────┐
│  Store JWT  │────▶│/api/generate │
│  (client)   │     │ (protected)  │
└─────────────┘     └──────────────┘
                          │
                          ▼
                    ┌──────────────┐
                    │  XLSX file   │
                    └──────────────┘
```

## Troubleshooting

### "Auth failed" on callback

- Check that `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are set correctly
- Verify the callback URL in GitHub matches your worker URL exactly

### "Invalid token" on /api/generate

- Ensure `JWT_SECRET` is the same value used when the token was created
- Check token hasn't expired (default: 24 hours)

### CORS errors

- The worker includes `cors()` middleware allowing all origins
- For production, you may want to restrict this to your domain
