# Contributing to Verdela Money Expense Tracker

Thank you for your interest in contributing to Verdela! We welcome contributions from developers of all skill levels.

---

## 🛠️ Development Setup

1. **Fork & Clone**:
   ```bash
   git clone https://github.com/<your-username>/Money-Expense-Tracker.git
   cd Money-Expense-Tracker
   ```

2. **Backend Setup**:
   ```bash
   cd backend
   python -m venv venv
   # On Windows: .\venv\Scripts\activate
   # On Linux/macOS: source venv/bin/activate
   pip install -r requirements.txt
   python seed_data.py
   python app.py
   ```

3. **Frontend Setup**:
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

---

## 🧪 Testing Guidelines

Before opening a pull request, ensure all tests pass:

- **Backend Tests**:
  ```bash
  pytest
  ```
- **Frontend Typecheck & Build**:
  ```bash
  cd frontend
  npm run build
  npm run lint
  ```

---

## 📌 Commit Guidelines

We use **Conventional Commits**:
- `feat:` A new user-facing feature
- `fix:` A bug fix
- `docs:` Documentation updates
- `test:` Adding or updating tests
- `refactor:` Code improvements that don't alter functionality
- `chore:` Dependency or build tool updates

---

## 🚀 Pull Request Workflow

1. Create a feature branch (`git checkout -b feat/your-feature-name`).
2. Make your changes and commit them with conventional commit messages.
3. Push to your fork (`git push origin feat/your-feature-name`).
4. Open a Pull Request against `main`.
5. Ensure all automated CI checks pass.
