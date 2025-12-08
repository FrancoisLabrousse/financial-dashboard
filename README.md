# Financial Dashboard

A Full Stack Web Application for financial data analysis, KPI tracking, and forecasting.

## Features
- **Data Ingestion**: Upload Excel/CSV files from various sources (EBP, Sage, etc.) with automatic column normalization.
- **Dashboard**: Interactive charts and cards for Sales, Purchases, Margin, and Cash Flow.
- **Forecasting**: Cash flow projection based on historical data.
- **Budgeting**: Compare actuals vs budget.
- **Authentication**: Secure login and registration.

## Tech Stack
- **Backend**: Python (Flask), Pandas, SQLAlchemy
- **Frontend**: React (Vite), Tailwind CSS, Recharts
- **Database**: PostgreSQL

## Getting Started

### Prerequisites
- Docker & Docker Compose
- OR Python 3.11+ and Node.js 18+ (for manual setup)

### Option 1: Run with Docker (Recommended)
1. Navigate to the project root:
   ```bash
   cd financial-dashboard
   ```
2. Start the services:
   ```bash
   docker compose up --build
   ```
3. Access the application:
   - Frontend: `http://localhost:5173` (or whatever port Vite binds to, check logs, might need to map port in docker-compose if I added frontend there, but currently docker-compose only has backend/db. You need to run frontend locally or add it to compose).
   
   *Correction*: The provided `docker-compose.yml` currently only sets up the Backend and Database. To run the full stack:

   1. **Start Backend & DB**:
      ```bash
      docker compose up -d
      ```
   2. **Start Frontend**:
      ```bash
      cd frontend
      npm install
      npm run dev
      ```
   3. Open `http://localhost:5173` in your browser.

### Option 2: Manual Setup

#### Backend
1. `cd backend`
2. Create virtual environment: `python -m venv venv`
3. Activate it: `source venv/bin/activate` (or `venv\Scripts\activate` on Windows)
4. Install reqs: `pip install -r requirements.txt`
5. Set DB URL: `export DATABASE_URL=postgresql://...` (Ensure you have a Postgres DB running)
6. Run: `python app.py`

#### Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev`

## Usage
1. Register a new account.
2. Login.
3. Use the "Upload" button to import your financial Excel/CSV files.
4. View the Dashboard to see your KPIs and Cash Flow charts.
