# Impulse — The Agentic API Collaboration Platform

![Impulse Banner](https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2670&auto=format&fit=crop)

Impulse is a high-performance, collaborative API development platform designed for modern teams. Built with a focus on speed, aesthetics, and agentic workflows, it provides a unified environment for REST testing, Realtime/WebSocket debugging, and team-wide documentation.

## ✨ Key Features

### 🚀 Advanced REST Client
- **Dynamic Request Builder**: Support for all HTTP methods (GET, POST, PUT, DELETE, PATCH).
- **Embedded Monaco Editor**: Experience VS Code-grade editing for JSON bodies and headers.
- **AI-Powered Suggestions**: Automatically suggest request names and structure based on your endpoint.
- **Response History**: Track and compare response times, sizes, and headers over time.

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

---

## 🛡️ License

Built with ❤️ by Somil Gupta. This project is open for contribution and community feedback.
