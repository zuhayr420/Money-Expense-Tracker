# Verdela — Family Finance & Budget Management Platform

[![CI Pipeline](https://github.com/zuhayr420/Money-Expense-Tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/zuhayr420/Money-Expense-Tracker/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-10b981.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6.svg)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)

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
│   └── vite.config.ts            # Vite build & chunking configuration
├── .github/
│   └── workflows/
│       └── ci.yml                # Automated GitHub Actions CI pipeline
├── .gitignore                    # Git exclusions
├── LICENSE                       # MIT Open Source License
└── README.md                     # Platform documentation
```

---

## 💻 Local Running Guide

Follow these steps to run the full application locally on your computer.

### 1. Prerequisites
Make sure you have installed on your machine:
- **Python 3.10+**: [python.org](https://www.python.org/downloads/)
- **Node.js 18+ & npm**: [nodejs.org](https://nodejs.org/)

---

### 2. Backend Setup (Flask API)

1. Open your terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```

2. *(Recommended)* Create and activate a Python virtual environment:
   - **Windows (PowerShell)**:
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   - **macOS / Linux**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. *(Optional)* Seed initial demo data (accounts, cards, budgets, family members):
   ```bash
   python seed_data.py
   ```

5. Start the backend server:
   ```bash
   python app.py
   ```
   > The API will be active at **`http://localhost:5000`** (Health check: `http://localhost:5000/api/health`).

---

### 3. Frontend Setup (React + Vite)

1. Open a **new terminal window** and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   > The web app will launch at **`http://localhost:5173`**.

---

### 4. Demo Login Credentials

If you ran `python seed_data.py`, you can log in immediately with:
- **Username**: `demo`
- **Password**: `demo123`

*(Or simply click **Register** on the login page to create a brand new personal account).*

---

## 🧪 Running Automated Tests

Run the backend unit and integration test suite:

```bash
python -m unittest discover -s "backend/tests" -p "test_*.py"
```

---

## 🔒 Security Hardening Summary

- **Hashed Passwords**: Password verification uses salted Bcrypt / Werkzeug secure hashing.
- **JWT Protection**: Cryptographically signed tokens with expiration and user verification.
- **Security Response Headers**: Injected via middleware:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: SAMEORIGIN`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`
- **Sanitized Secrets**: No hardcoded API keys or sensitive credentials committed.
- **Structured Error Handling**: Global error handlers for 400, 401, 403, 404, 405, 429, and 500 guarantee clean JSON responses.

---

## 📄 License

This project is licensed under the terms of the [MIT License](LICENSE). Copyright (c) 2026 Zuhayr Md.

