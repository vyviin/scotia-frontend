# Scotia Frontend + Trading Replay Demo

React + Vite frontend with a minimal Django backend for demo candle replay and paper trades.

## Frontend

```bash
npm install
npm run dev
```

Runs at `http://localhost:5173`.

## Backend

See [backend/README.md](backend/README.md) for full setup. Quick start:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo_candles
python manage.py runserver
```

API base URL: `http://localhost:8000/api/`
