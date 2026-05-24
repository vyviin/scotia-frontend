# Trading Replay Demo — Backend

Minimal Django API for demo candle replay and paper trades. Uses SQLite; no auth, no live market data.

## Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo_candles
python manage.py runserver
```

Server runs at `http://localhost:8000`.

## Environment variables

Copy the example env file and fill in Tavus credentials (backend only — never put these in the frontend):

```bash
cp .env.example .env
```

Required for Tavus CVI session creation:

| Variable | Description |
|----------|-------------|
| `TAVUS_API_KEY` | Tavus API key (`x-api-key` header) |
| `TAVUS_REPLICA_ID` | Replica ID for the CVI session |
| `TAVUS_PERSONA_ID` | Persona ID for the CVI session |

Django loads `backend/.env` automatically via `python-dotenv` in `config/settings.py`.

## Seed demo candles

Hardcoded fake SPY candles (24 each for `15m` and `1m`):

```bash
python manage.py seed_demo_candles
```

Safe to re-run — uses `update_or_create` on `(symbol, timeframe, candle_index)`.

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/replay/candles/?symbol=SPY&timeframe=15m` | Replay candles ordered by index |
| POST | `/api/trades/` | Save a demo trade |
| GET | `/api/trades/pnl/?symbol=SPY&current_price=414.25` | Unrealized P&L for open trades |
| POST | `/api/tavus/session/` | Create a Tavus CVI conversation (backend-only) |

### Examples

```bash
curl "http://localhost:8000/api/replay/candles/?symbol=SPY&timeframe=15m"

curl -X POST http://localhost:8000/api/trades/ \
  -H "Content-Type: application/json" \
  -d '{"side":"BUY","symbol":"SPY","quantity":2,"entry_price":412.5}'

curl "http://localhost:8000/api/trades/pnl/?symbol=SPY&current_price=414.25"
```

### Tavus CVI session

Create a Tavus conversation (requires `TAVUS_API_KEY`, `TAVUS_REPLICA_ID`, and `TAVUS_PERSONA_ID` in `backend/.env`):

```bash
curl -X POST http://127.0.0.1:8000/api/tavus/session/
```

Or use the management command:

```bash
python manage.py test_tavus_session
```

Success response:

```json
{
  "conversation_id": "...",
  "conversation_url": "...",
  "status": "...",
  "raw": { }
}
```

If Tavus env vars are missing, the endpoint returns HTTP 500 with an error message. If Tavus rejects the request, it returns HTTP 502 with details.

## CORS

Configured for the Vite dev server (`http://localhost:5173`) so the frontend can call the API during local development.

## Inspect data

Optional: create a superuser and browse `/admin/`:

```bash
python manage.py createsuperuser
```
