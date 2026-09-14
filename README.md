# Slot Booking System - SLOP 1.0

A comprehensive full-stack web application designed for DIT University to manage event slot bookings for various clubs and committees. This system ensures organized scheduling and prevents double-booking conflicts.

## 🚀 Project Overview

The Slot Booking System is a MERN stack application that enables authorized club administrators to book time slots for their events while maintaining a conflict-free schedule. The system provides a centralized platform for managing university event scheduling with proper authentication and authorization mechanisms.

### Key Features
- **Role-based Access Control**: Only authenticated club admins can book slots
- **Real-time Slot Availability**: Live updates on slot booking status
- **Atomic Conflict Prevention**: Database-level atomic updates prevent double-booking even under concurrent load
- **Admin Dashboard**: Comprehensive management interface with Create / Edit / Delete slot controls
- **Responsive Design**: Mobile-friendly user interface
- **Public Slot View**: All users (including unauthenticated visitors) can browse available slots
- **Gmail Password Reset**: Real email-based password reset with 1-hour expiring tokens

## 🏗️ System Architecture

### Frontend Architecture
```
Client Layer (React.js + Vite + Tailwind CSS)
├── Component Layer (UI Components)
├── API Service Layer (Axios)
└── Routing Layer (React Router)
```

### Backend Architecture
```
Server Layer (Node.js/Express.js)
├── API Routes (RESTful endpoints)
├── Middleware Layer (Auth, Validation)
├── Business Logic Layer (Controllers)
├── Data Access Layer (Models)
└── Database Layer (MongoDB)
```

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (v6.0 or higher) or a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster
- npm

### Backend Setup
```bash
cd Slot-Booking-System-Backend
cp .env.example .env          # fill in values
npm install
npm run dev                   # starts on http://localhost:5000
```

### Frontend Setup
```bash
cd Slot-Booking-System-Frontend
cp .env.example .env          # fill in VITE_API_BASE_URL
npm install
npm run dev                   # starts on http://localhost:5173
```

---

## 🌐 Production Deployment Checklist

Follow these steps **in order** to deploy the system to Render (backend) + GitHub Pages (frontend).

### Step 1 — MongoDB Atlas

1. Create a free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
2. In **Network Access**, add `0.0.0.0/0` (allow all IPs) so Render can connect.
3. In **Database Access**, create a user with Read/Write on your database.
4. Copy the connection string: `mongodb+srv://<user>:<password>@cluster.mongodb.net/<dbname>?retryWrites=true&w=majority`

### Step 2 — Deploy Backend to Render

1. Push this repo to GitHub.
2. Go to [dashboard.render.com/new/blueprint](https://dashboard.render.com/new/blueprint).
3. Connect your repo — Render detects `render.yaml` automatically.
4. Set the following **Environment Variables** in the Render dashboard:

| Variable | Value |
|---|---|
| `MONGODB_URI` | Your Atlas connection string (Step 1) |
| `JWT_SECRET` | A strong random string — generate at [randomkeygen.com](https://randomkeygen.com) |
| `FRONTEND_URL` | `https://<your-github-username>.github.io` |
| `GMAIL_USER` | Your Gmail address (`yourname@gmail.com`) |
| `GMAIL_PASS` | 16-character Gmail App Password (see Step 3) |
| `GMAIL_FROM` | `"SLoP Booking System <yourname@gmail.com>"` |

5. Click **Deploy**. Note the service URL: `https://slop-slot-booking-backend.onrender.com`

### Step 3 — Gmail App Password (for password reset emails)

> **Important:** Never use your regular Gmail password. Use an App Password.

1. Visit [myaccount.google.com/security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** if not already on.
3. Visit [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
4. Select **App: Mail**, **Device: Other** → name it `SLoP Backend`
5. Copy the 16-character password → paste into `GMAIL_PASS` in Render.

### Step 4 — GitHub Repository Secrets (for frontend CI)

In your GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Value |
|---|---|
| `VITE_API_BASE_URL` | `https://slop-slot-booking-backend.onrender.com/api` |

Push to `main` — the GitHub Actions workflow will lint, build, and deploy the frontend to GitHub Pages automatically.

### Step 5 — Enable GitHub Pages

In your GitHub repo → **Settings → Pages**:
- **Source**: GitHub Actions
- Wait for the deploy workflow to complete.
- Your site is live at `https://<your-github-username>.github.io/SLoP5.0-Slot-Booking-System/`

### Step 6 — Bootstrap the First Super Admin

With the backend live, create the first `super_admin` account:

```bash
cd Slot-Booking-System-Backend
# Make sure .env has MONGODB_URI pointing to your Atlas cluster
npm run create-admin -- --name "Your Name" --email admin@example.com --password "SecurePass123"
```

Or via SSH/Render shell (if running on Render):
```bash
node scripts/create-admin.js --name "Your Name" --email admin@example.com --password "SecurePass123"
```

### Step 7 — Verify Deployment

| Check | Expected |
|---|---|
| `GET https://<render-url>/api/health` | `{ "success": true, "message": "Server is running" }` |
| `GET https://<render-url>/api/slots` | `200` with slot array (even without auth) |
| Login at the GitHub Pages URL | Redirects to `/dashboard` |
| Direct visit to `https://<pages-url>/dashboard` | Loads app (not a 404) |
| Forgot Password → enter email | Receives a real Gmail with reset link |
| Click reset link → set new password | Logs in automatically |
| Login as super_admin → go to Slots | See "Create Slot" button |

---

## 📚 Documentation

- [Project Structure](./docs/PROJECT_STRUCTURE.md)
- [Database Schema](./docs/DATABASE_SCHEMA.md)
- [API Documentation](./docs/API_DOCUMENTATION.md)
- [User Roles & Permissions](./docs/USER_ROLES.md)
- [Development Workflow](./docs/DEVELOPMENT_WORKFLOW.md)

## 👥 User Roles

| Role | Capabilities |
|---|---|
| **Regular User** | Browse slots (read-only), view own profile |
| **Club Admin** | Book available slots, manage own bookings |
| **Super Admin** | All of the above + create/edit/delete slots, approve/reject all bookings |

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite 7, Axios, React Router 7, Tailwind CSS 4
- **Backend**: Node.js, Express 4, MongoDB, Mongoose 8
- **Auth**: JWT tokens (7-day expiry)
- **Email**: Nodemailer + Gmail SMTP (password reset)
- **Deploy**: Render (backend) + GitHub Pages (frontend)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ for DIT University - SLOP 5.0**
