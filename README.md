# Verdela — Family Finance & Budget Management Platform

An enterprise-grade, high-performance family financial management platform built with **Python Flask**, **SQLAlchemy ORM**, **React 19**, **TypeScript**, **Tailwind CSS v4**, and **Recharts**. Designed with a luxurious dark forest & liquid glass aesthetic, **Times New Roman** typography, and 120 FPS fluid physics.

---

## 🌟 Key Capabilities

1. **Precision Balance & Vault Ledger**:
   - Aggregate liquidity tracking across Savings, Current, Cash, and Joint accounts.
   - Dynamic real-time calculation of net worth, total assets, and credit liabilities.
2. **Interactive 3D Liquid Glass Cards**:
   - Multi-theme physical/virtual card management (Emerald, Obsidian, Royal Navy, Gold Prestige).
   - Dynamic card number formatting, EMV chip depiction, contactless indicator, and one-click security locking.
3. **Comprehensive Cash Flow & Budgeting**:
   - Real-time income and expense ledger with multi-category filters and instant balance synchronization.
   - Monthly category allocations with progressive utilization bars and automated threshold warnings at 80% and 100%.
4. **Milestone Savings Goals**:
   - Target amounts, target completion dates, and contribution history ledger.
   - Automated status transitions to `completed` upon reaching targets.
5. **Recurring Bills & Subscription Cadence**:
   - Due date tracking, cadence management (monthly, weekly, yearly), and one-click paid toggling.
6. **Multi-Member Family Vault**:
   - Role-based family governance (Administrator, Member, Viewer).
   - Individual member spending caps and aggregate family expenditure analysis.
7. **Intelligence & Visual Analytics**:
   - Luminous wave charts, monthly trend distributions, and spending breakdown.
   - Multi-currency engine (₹ INR, $ USD, € EUR, £ GBP).

---

## 🛠 Technology Stack

### Frontend:
- **Framework**: React 19 with TypeScript
- **Bundler & Tooling**: Vite 8 with Rolldown code-splitting
- **Styling**: Tailwind CSS v4, custom Liquid Glass design system
- **Animations & Physics**: Framer Motion (GPU-accelerated 120 FPS transitions)
- **Visualizations**: Recharts
- **Icons**: Lucide React
- **HTTP Client**: Axios with auth interceptors and dynamic base URLs

### Backend:
- **Framework**: Python Flask 3.0
- **Database & ORM**: SQLite / PostgreSQL via Flask-SQLAlchemy 3.1
- **Security & Auth**: PyJWT, Flask-Bcrypt, Werkzeug password hashing
- **Production Server**: Gunicorn (Linux) / Waitress (Cross-Platform)
- **CORS**: Flask-CORS with origin whitelisting and credentials support

---

## 📁 Project Structure

```text
├── backend/
│   ├── instance/
│   │   └── family_finance.db     # SQLite local database
│   ├── models/
│   │   └── __init__.py           # SQLAlchemy relational data models & indices
│   ├── routes/
│   │   ├── account_routes.py     # Accounts and wallet management
│   │   ├── analytics_routes.py   # Aggregations, charts, and insights
│   │   ├── auth_routes.py        # Authentication & user profile
│   │   ├── bill_routes.py        # Recurring bills & subscriptions
│   │   ├── budget_routes.py      # Budget limits & spent calculations
│   │   ├── card_routes.py        # Card management & locking
│   │   ├── family_routes.py      # Family members, roles & limits
│   │   ├── goal_routes.py        # Savings goals & contributions
│   │   └── transaction_routes.py # Income/expense posting & pagination
│   ├── tests/
│   │   └── test_api.py           # Automated unit & integration tests
│   ├── utils/
│   │   └── auth.py               # JWT token verification middleware
│   ├── .env.example              # Backend environment template
│   ├── app.py                    # Flask application factory, CORS & security headers
│   └── requirements.txt          # Python production dependencies
├── frontend/
│   ├── public/
│   │   ├── favicon.svg           # Verdela brand mark
│   │   ├── robots.txt            # Search engine directives
│   │   └── sitemap.xml           # XML sitemap
│   ├── src/
│   │   ├── components/           # Sidebar, Header, Modals & UI primitives
│   │   ├── context/              # Auth & Currency React Context
│   │   ├── pages/                # Overview, Accounts, Transactions, Budgets, etc.
│   │   ├── services/             # Axios API service layer
│   │   ├── types/                # TypeScript interface definitions
│   │   ├── App.tsx               # App router configuration
│   │   └── index.css             # Liquid glass CSS variables & Times New Roman typography
│   ├── .env.example              # Frontend environment template
│   ├── package.json              # Frontend scripts & dependencies
│   ├── vercel.json               # SPA routing fallback for Vercel
│   └── vite.config.ts            # Vite build & chunking configuration
├── .gitignore                    # Git exclusions
├── Procfile                      # Production process manager definition
└── README.md                     # Platform documentation
```

---

## ⚡ Local Development Quickstart

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 2. Backend Setup
```bash
cd backend
pip install -r requirements.txt
python app.py
```
> The API will start on `http://localhost:5000` with the health endpoint active at `http://localhost:5000/api/health`.

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
> The web interface will start on `http://localhost:5173`.

---

## 🧪 Running Automated Tests

A comprehensive integration test suite is included in `backend/tests/test_api.py` covering authentication, accounts, balance calculations, budgets, goals, cards, and security headers:

```bash
python -m unittest discover -s "backend/tests" -p "test_*.py"
```

---

## 🚀 Production Deployment Guide

### Architecture Overview
The application can be deployed as:
1. **Decoupled Architecture (Recommended)**:
   - **Frontend**: Deployed to Vercel, Netlify, or Cloudflare Pages.
   - **Backend**: Deployed to Render, Railway, Fly.io, or AWS EC2.
   - **Database**: Managed PostgreSQL (Supabase, Neon, Render Postgres, Railway).
2. **Monolith Architecture**:
   - Backend serves built frontend static files from `frontend/dist`.

---

### Deploying the Backend (e.g. Render / Railway / VPS)

1. **Deploy to Render or Railway**:
   - Connect your GitHub repository.
   - Set **Root Directory** to `backend` (or project root with Procfile).
   - Set **Build Command**: `pip install -r requirements.txt`
   - Set **Start Command**: `gunicorn app:app --workers 2 --threads 4 --timeout 120 --bind 0.0.0.0:$PORT`
2. **Set Environment Variables**:
   ```ini
   FLASK_ENV=production
   FLASK_DEBUG=0
   SECRET_KEY=use-a-strong-random-secret-key
   JWT_SECRET_KEY=use-a-strong-random-jwt-key
   DATABASE_URL=postgresql://user:password@host:5432/dbname
   CORS_ORIGINS=https://your-frontend.vercel.app
   ```
3. **Database Migration to PostgreSQL**:
   - Change `DATABASE_URL` from SQLite to your PostgreSQL connection string.
   - The application automatically calls `db.create_all()` inside an application context on boot to initialize all indexed tables without manual migrations needed.

---

### Deploying the Frontend (e.g. Vercel)

1. **Import Repository on Vercel**:
   - Set **Root Directory** to `frontend`.
   - Set **Framework Preset** to `Vite`.
   - Set **Build Command**: `npm run build`
   - Set **Output Directory**: `dist`
2. **Environment Variables**:
   ```ini
   VITE_API_BASE_URL=https://your-backend-api.onrender.com
   ```
3. **SPA Routing**:
   - The included [`frontend/vercel.json`](file:///e:/Money%20Expense%20Tracker/frontend/vercel.json) ensures all client-side routes (`/transactions`, `/accounts`, `/budgets`, etc.) resolve cleanly to `index.html` without 404 errors.

---

## 🔒 Security Hardening Summary

- **Hashed Passwords**: Password verification uses salted Bcrypt / Werkzeug secure hashing.
- **JWT Protection**: Cryptographically signed tokens with expiration and user verification.
- **Security Response Headers**: Injected via middleware:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: SAMEORIGIN`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains` (production)
- **Sanitized Secrets**: No hardcoded API keys or production database credentials in source code.
- **Structured Error Handling**: Global error handlers for 400, 401, 403, 404, 405, 429, and 500 guarantee clean JSON responses and prevent stack-trace leakage.
