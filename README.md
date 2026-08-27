# Impulse — The Agentic API Collaboration Platform

![Impulse Banner](/public/preview.png)

Impulse is a high-performance, collaborative API development platform designed for modern teams. Built with a focus on speed, aesthetics, and agentic workflows, it provides a unified environment for REST testing, Realtime/WebSocket debugging, and team-wide documentation.

## ✨ Key Features

### 🚀 Advanced REST Client
- **Dynamic Request Builder**: Support for all HTTP methods (GET, POST, PUT, DELETE, PATCH).
- **Embedded Monaco Editor**: Experience VS Code-grade editing for JSON bodies and headers.
- **AI-Powered Suggestions**: Automatically suggest request names and structure based on your endpoint.
- **Response History**: Track and compare response times, sizes, and headers over time.
- **Browser & Proxy Execution**: Send requests from your own machine or through the server. See [Execution modes](#-execution-modes).

### 🔌 Realtime WebSocket Debugger
- **Live Stream**: Monitor incoming and outgoing WebSocket messages in a structured log table.
- **Message Editor**: Send complex JSON payloads with auto-formatting and syntax highlighting.
- **Connection Management**: Handle auto-reconnection and status tracking with ease.

### 👥 Collaborative Workspaces
- **Team Isolation**: Organize projects into shared workspaces.
- **Invite System**: Scale your team with secure, token-based invitation links.
- **Role-Based Access**: Manage permissions with Admin, Editor, and Viewer roles.

### 📂 Collection Management & Import
- **Instant Migration**: Seamlessly import your existing collections from **Postman v2.1** or native Impulse JSON formats.
- **Folder Organization**: Group requests into logical collections for better discoverability.

### ⌨️ Developer Experience
- **Command Palette (Cmd+K)**: Instant global search for documentation and collections.
- **Mobile Responsive**: Access your workspaces and test APIs from any device.
- **Documentation Hub**: Unified documentation page with search and quick-start guides.

---

## 🔀 Execution Modes

Where a request is actually sent from decides what it can reach. Pick the mode
in the **Send via** selector under the URL bar.

| Mode | Runs on | Reaches `localhost` / private network | Blocked by CORS |
|---|---|---|---|
| **Browser** | Your machine | Yes | Yes |
| **Proxy** | The Impulse server | No (blocked by the SSRF guard) | No |
| **Auto** (default) | Browser, then proxy | Yes, on the first attempt | Falls back to the proxy |

**Browser mode** uses `fetch` in your own tab, so it behaves like the app you
are building: it can hit `http://localhost:8080`, VPN-only hosts, and anything
else your machine can route to. The trade-off is CORS — an API that does not
send `Access-Control-Allow-Origin` will block the response, and cross-origin
responses only expose safelisted headers.

**Proxy mode** sends through `POST /api/proxy` on the server, which ignores CORS
and returns every response header. It is authenticated, rate limited to 60
requests per minute per user, capped at a 30 s timeout and a 10 MB response, and
every URL (including each redirect hop) is checked against an SSRF guard that
blocks loopback, link-local, and RFC 1918 addresses — so the server cannot be
used to reach cloud metadata endpoints or internal services.

If you self-host Impulse on the same trusted machine as the APIs you are
testing, set `IMPULSE_ALLOW_PRIVATE_HOSTS=true` to let proxy mode reach private
addresses.

> **Do not set `IMPULSE_ALLOW_PRIVATE_HOSTS=true` on a shared or public
> deployment.** It disables the SSRF guard and turns the proxy into an open
> gateway to that server's internal network.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 14+](https://nextjs.org) (App Router)
- **Database**: [Prisma](https://prisma.io) with PostgreSQL
- **Authentication**: [Better Auth](https://better-auth.com)
- **UI Components**: [Radix UI](https://www.radix-ui.com) & [Tailwind CSS](https://tailwindcss.com)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs) & [TanStack Query](https://tanstack.com/query)
- **Icons**: [Lucide React](https://lucide.dev)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Somilg11/impulse.git
   cd impulse
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/impulse"
   BETTER_AUTH_SECRET="your-secret-here"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"

   GITHUB_CLIENT_ID="..."
   GITHUB_CLIENT_SECRET="..."
   GOOGLE_CLIENT_ID="..."
   GOOGLE_CLIENT_SECRET="..."
   GOOGLE_GENERATIVE_AI_API_KEY="..."

   # Optional. Only for local self-hosting - see "Execution Modes".
   # IMPULSE_ALLOW_PRIVATE_HOSTS="true"
   ```

4. **Initialize Database**
   ```bash
   npx prisma db push
   ```

5. **Run the Development Server**
   ```bash
   npm run dev
   ```

---

## 📖 Architecture & API

Impulse follows a modular architecture for scalability:

- **/src/modules/request**: Handles the core REST client logic and editor state.
- **/src/modules/realtime**: Manages WebSocket connections via a global Zustland store.
- **/src/modules/collections**: Controls the organization and importing of API requests.
- **/src/app/api/ai**: Internal endpoints for AI-assisted workflow optimizations.
- **/src/app/api/proxy**: Authenticated, SSRF-guarded server-side request execution (proxy mode).
- **/src/lib/authz.ts**: Workspace membership and role checks. Every server action that takes an id goes through it.
- **/src/lib/http.ts**: Header/param/body normalization shared by every execution path.

---

## 🤝 Contributing

Setup, branching model, commit conventions, and the security rules a reviewer
will block on are in [CONTRIBUTING.md](CONTRIBUTING.md).

Vulnerabilities: please report privately — see [SECURITY.md](SECURITY.md).

Architecture, design decisions, and a deeper write-up of the execution modes:
[docs/summary.md](docs/summary.md).

---

## 🛡️ License

[MIT](LICENSE). Built with ❤️ by Somil Gupta.
