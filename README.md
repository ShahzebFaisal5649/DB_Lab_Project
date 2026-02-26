# EDU-Connect

A full-stack education platform that connects students with tutors — featuring real-time chat, session management, profile verification, and an admin control panel.

## Screenshots

| Sign In | Register |
|---|---|
| ![Sign In](Sign%20in%20Page.png) | ![Register](Register%20Page.png) |

| Student Dashboard | Tutor Page |
|---|---|
| ![Student](Student%20Page.png) | ![Tutor](Tutor%20Page.png) |

| Request Session | Chat System |
|---|---|
| ![Request Session](Request%20Session%20with%20Tutor.png) | ![Chat](Chat%20System.png) |

| Admin Dashboard | Admin Panel |
|---|---|
| ![Admin 1](Admin%201.png) | ![Admin 2](Admin%202.png) |

## Tech Stack

**Frontend**
- React 18 + TypeScript (Create React App)
- TailwindCSS + Shadcn/UI component library
- React Hook Form + Zod validation
- Recharts for analytics charts
- React Hot Toast for notifications
- React Router DOM v6

**Backend**
- Node.js + Express
- MySQL2 (raw SQL queries)
- Prisma (schema management)
- bcrypt for password hashing
- Multer for file uploads (PDF verification documents)
- WebSocket (ws) for real-time chat

**Database**
- MySQL 8.0

## Features

- **Role-based auth** — Student, Tutor, and Admin roles with separate dashboards
- **Student Dashboard** — Find tutors, filter by subject/location, request sessions, real-time chat
- **Tutor Dashboard** — Manage session requests (accept/decline), upload verification documents, set availability
- **Admin Panel** — Manage users, verify tutors, add/remove subjects, view session analytics with charts
- **Real-time Chat** — WebSocket-based messaging after a session is accepted
- **Profile Management** — Edit name, location, learning goals, preferred subjects
- **Feedback System** — Rate sessions after completion
- **Dark Mode** — Class-based dark/light theme toggle

## Local Development Setup

### Prerequisites
- Node.js 18+
- MySQL 8.0

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/EDU-Connect-.git
cd EDU-Connect-
```

### 2. Set up MySQL database

After installing MySQL Server 8.0, run the setup script as root:

```bash
mysql -u root -p < server/setup-db.sql
```

This creates the `edu_connect_db` database, `edu_connect_user` account, and all tables in one step.

### 3. Configure environment variables

Create `server/.env`:

```env
DATABASE_URL="mysql://edu_connect_user:edu_connect_pass@localhost:3306/edu_connect_db"
FRONTEND_URL="http://localhost:3000"
PORT=5000
NODE_ENV="development"
```

### 4. Install dependencies

```bash
# Server
cd server && npm install

# Client
cd ../client && npm install
```

### 5. Start the servers

```bash
# Terminal 1 — Backend (port 5000)
cd server && node server.js

# Terminal 2 — Frontend (port 3000)
cd client && npm start
```

Open [http://localhost:3000](http://localhost:3000)

## Database Schema

Defined in `server/prisma/schema.prisma`. Key models:

| Model | Description |
|---|---|
| `User` | Base user with role (STUDENT / TUTOR / ADMIN) |
| `Student` | Learning goals, preferred subjects |
| `Tutor` | Location, availability, verification status, subjects |
| `Subject` | Available subjects (admin-managed) |
| `SessionRequest` | Student-to-tutor session requests with status |
| `Session` | Accepted sessions containing chat messages |
| `Message` | Real-time chat messages per session |
| `Feedback` | Post-session ratings and comments |

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/users/register` | Register (student / tutor / admin) |
| POST | `/api/users/login` | Login |
| GET | `/api/users/profile/:id` | Get user profile |
| PUT | `/api/users/profile/:id` | Update profile |
| GET | `/api/users/tutors` | List tutors (with search & filter) |
| POST | `/api/users/session/request` | Request a session |
| PUT | `/api/users/session/:id/respond` | Accept or decline a session |
| GET/POST/DELETE | `/api/users/subjects` | Manage subjects (admin) |
| GET | `/api/users/admin/users` | List all users (admin) |
| PUT | `/api/users/admin/users/:id/verify` | Verify a tutor (admin) |
| POST | `/api/users/session/:id/feedback` | Submit session feedback |

WebSocket on the same port handles real-time chat (`join` / `chat` message types).

## Project Structure

```
EDU-Connect-/
├── client/                     # React frontend
│   └── src/
│       ├── components/
│       │   ├── Dashboard.tsx         # Student & Tutor dashboard
│       │   ├── AdminDashboard.tsx    # Admin panel with charts
│       │   ├── Login.tsx
│       │   ├── Register.tsx          # 3-step registration form
│       │   ├── AdminLogin.tsx
│       │   ├── AdminRegister.tsx
│       │   └── ui/                   # Shadcn/UI components
│       ├── context/
│       │   └── ThemeContext.tsx      # Dark/light mode
│       ├── App.tsx
│       └── config.ts                 # API base URL
└── server/                     # Express backend
    ├── routes/
    │   └── userRoutes.js        # All API routes
    ├── middleware/
    │   └── auth.js
    ├── prisma/
    │   └── schema.prisma        # Database schema definition
    ├── setup-db.sql             # Local DB setup script
    ├── dbUtils.js               # MySQL connection pool
    └── server.js                # Express + WebSocket server
```

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | MySQL connection string | — |
| `FRONTEND_URL` | Allowed CORS origin | `http://localhost:3000` |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` |
