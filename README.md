ConnectHub — Connect Beyond Boundaries

**ConnectHub** is a full-stack networking platform designed to help students and industry professionals discover people, build meaningful connections, and communicate with one another.

🌐 **Live Website:** https://connecthub-iota-two.vercel.app/

## ✨ Features

- **Authentication** — Sign up and log in securely.
- **User Profiles** — Create and update your professional profile, including your headline, bio, location, skills, and interests.
- **Discover People** — Explore profiles and search for people based on their details and interests.
- **Connection Requests** — Send, accept, and decline connection requests.
- **My Connections** — View your accepted professional connections.
- **Real-Time Messaging** — Communicate with your connections through the messaging system.
- **Unread Message Indicators** — See when unread messages are waiting.
- **Responsive Interface** — A clean, modern interface designed around a distinctive ivory, soft pink, deep plum, and coral palette.

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| Next.js | React framework and application routing |
| React | User interface |
| JavaScript | Application logic |
| Supabase | Authentication, PostgreSQL database, and real-time functionality |
| Supabase Row Level Security (RLS) | Database access controls |
| Vercel | Deployment and hosting |
| Git & GitHub | Version control and source code management |

## 🖥️ Getting Started

Follow these steps to run ConnectHub locally.

### Prerequisites

- Node.js and npm
- A Supabase project
- Git

### 1. Clone the repository

```bash
git clone https://github.com/Roopesh-21/connecthub.git
cd connecthub
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the project root and add your Supabase project URL and publishable key:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Replace the example values with your own Supabase project values.

**Security:** Never commit `.env.local` or expose Supabase secret/service-role keys in client-side code or a public repository.

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🗄️ Backend Setup

ConnectHub uses Supabase for authentication and application data.

To run the project with your own Supabase instance:

1. Create a Supabase project.
2. Configure the required database tables and Row Level Security policies for profiles, connections, messages, and message read receipts.
3. Enable the required real-time functionality for messaging.
4. Add your Supabase URL and publishable key to `.env.local`.
5. Configure authentication settings for your local and deployed application URLs.

The application expects the database schema and access policies used by the project.

## 🚀 Deployment

ConnectHub is deployed on Vercel.

**Live application:** https://connecthub-iota-two.vercel.app/

To deploy your own instance, import the repository into Vercel, configure the required environment variables, and deploy the Next.js application.

## 🎯 Project Goals

ConnectHub was built to explore full-stack web development and create a networking experience for students and professionals.

The project focuses on:

- Building interactive features backed by a real database.
- Implementing authentication and database access controls.
- Managing connection requests and user relationships.
- Supporting real-time communication.
- Deploying and maintaining a web application.

## 👨‍💻 Author

**Roopesh Indugabilli**

- GitHub: [@Roopesh-21](https://github.com/Roopesh-21)
- Project Repository: [ConnectHub](https://github.com/Roopesh-21/connecthub)

---

*ConnectHub — Discover people. Build connections. Create opportunities.*
