# Impulse ⚡

> **Next-Gen API Development & Testing Platform**

Impulse is a modern, high-performance API testing and development environment built for the AI era. It combines the utility of traditional tools like Postman with advanced AI capabilities, realtime collaboration, and a sleek, developer-centric UI.

![Project Status](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-16.0-black)

## ✨ Key Features

- **🚀 Smart API Client**: Full-featured HTTP client supporting GET, POST, PUT, DELETE, PATCH, and more.
- **🤖 AI-Powered**:
    -   **Smart Naming**: AI automatically suggests descriptive names for your requests based on context.
    -   **JSON Generation**: Generate complex JSON bodies from natural language prompts.
- **⚡ Realtime Collaboration**: (In Progress) Work with your team in real-time.
- **🏢 Workspace Management**: Organize your projects into workspaces with role-based access control.
- **📁 Collections**: Group related requests for better organization.
- **🌗 Dark Mode**: Beautiful, dark-themed UI designed for long coding sessions.
- **🔐 Secure Authentication**: Robust auth system supporting GitHub and Google OAuth.
- **🛡️ Type-Safe**: Built with end-to-end type safety using TypeScript, Zod, and Prisma.

## 🛠️ Tech Stack

Impulse is built with a modern, production-grade stack:

### Core
-   **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Database**: [PostgreSQL](https://www.postgresql.org/)
-   **ORM**: [Prisma](https://www.prisma.io/)

### Frontend & UI
-   **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
-   **Components**: [Shadcn UI](https://ui.shadcn.com/) (Radix Primitives)
-   **Icons**: [Lucide React](https://lucide.dev/)
-   **Editor**: [Monaco Editor](https://microsoft.github.io/monaco-editor/)
-   **State Management**: [Zustand](https://github.com/pmndrs/zustand) & [TanStack Query](https://tanstack.com/query/latest)

### Backend & Services
-   **Auth**: [Better Auth](https://www.better-auth.com/)
-   **AI**: [Google Gemini 2.0 Flash](https://deepmind.google/technologies/gemini/) via Vercel AI SDK
-   **Validation**: [Zod](https://zod.dev/)

## 🚀 Getting Started

### Prerequisites

-   Node.js (v18+)
-   Docker (for local database)
-   npm or pnpm

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/impulse.git
    cd impulse
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env` file in the root directory and add the following variables:

    ```env
    # Database
    DATABASE_URL="postgresql://user:password@localhost:5432/impulse?schema=public"

    # Auth (Better Auth)
    BETTER_AUTH_SECRET="your_generated_secret"
    GITHUB_CLIENT_ID="your_github_id"
    GITHUB_CLIENT_SECRET="your_github_secret"
    GOOGLE_CLIENT_ID="your_google_id"
    GOOGLE_CLIENT_SECRET="your_google_secret"

    # AI (Google Gemini)
    GOOGLE_GENERATIVE_AI_API_KEY="your_gemini_api_key"

    # App
    NEXT_PUBLIC_APP_URL="http://localhost:3000"
    ```

4.  **Start Database**
    ```bash
    docker compose up -d
    ```

5.  **Run Migrations**
    ```bash
    npx prisma migrate dev
    ```

6.  **Start Development Server**
    ```bash
    npm run dev
    ```

    Visit `http://localhost:3000` to see the app in action.

## 📂 Project Structure

The project follows a modular architecture in `src/modules`:

```
src/
├── app/                 # Next.js App Router pages
├── components/          # Shared UI components
├── lib/                 # Core utilities (DB, Env, API clients)
├── modules/             # Feature-based modules
│   ├── ai/              # AI integration logic
│   ├── authentication/  # Auth components and actions
│   ├── collections/     # Collection management
│   ├── invites/         # Workspace invitation system
│   ├── realtime/        # WebSocket/Realtime logic
│   ├── request/         # Request builder & execution
│   └── workspace/       # Workspace & member management
└── styles/              # Global styles
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the project
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
