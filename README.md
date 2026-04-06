# Personal Finance Tracker

FinTrack is a full-stack personal finance management application that helps users track their expenses, manage budgets, and gain insights into their spending habits.

## What the app does

- User signup and login with email and password
- User-specific expense tracking
- Expense create, edit, delete, search, and filtering
- Monthly category budgets with 80% and 100% alert states
- Dashboard with:
  - total monthly spend
  - top spending category
  - top payment methods
  - category breakdown chart
  - spending trend chart
  - smart suggestions
  - monthly SQL reports

## Project structure

- `frontend/` Next.js app
- `backend/` Node.js + Express API with MongoDB and SQL report storage
- `python-service/` Flask + Pandas suggestion service


## How to run

### 1. Backend

```bash
cd backend
npm install
```

Create `backend/.env`, then run:

```bash
npm run dev
```

Optional demo seed:

```bash
npm run seed
```

### 2. Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env.local`, then run:

```bash
npm run dev
```

### 3. Python suggestion service

```bash
cd python-service
pip install -r requirements.txt
python app.py
```

## Default local URLs

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000`
- Python service: `http://localhost:5001`

## Authentication

You can either create your own account from the sign-up page or seed demo accounts with:

```bash
cd backend
npm run seed
```

Demo credentials after seeding:

- User: `user@example.com / 123456`
- Admin: `admin@example.com / 123456`
