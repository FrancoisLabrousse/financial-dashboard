import pandas as pd
from models import db, Budget, Transaction
from sqlalchemy import func
from datetime import datetime

def import_budget(file_path):
    """
    Imports budget from Excel/CSV. Expected columns: Period (YYYY-MM), Category, Amount.
    """
    if file_path.endswith('.csv'):
        df = pd.read_csv(file_path)
    else:
        df = pd.read_excel(file_path)
        
    # Normalize columns
    df.columns = df.columns.str.lower().str.strip()
    
    # Expected keys: period, category, amount
    budgets = []
    for _, row in df.iterrows():
        try:
            period_str = str(row.get('period', ''))
            # Handle various date formats, assume YYYY-MM or Date object
            if isinstance(row.get('period'), datetime):
                period_date = row['period'].date().replace(day=1)
            else:
                period_date = pd.to_datetime(period_str).date().replace(day=1)
                
            amount = pd.to_numeric(row.get('amount', 0), errors='coerce')
            category = row.get('category', 'General')
            
            budgets.append(Budget(
                period=period_date,
                category=category,
                amount=amount
            ))
        except Exception as e:
            print(f"Skipping row: {e}")
            continue
            
    db.session.bulk_save_objects(budgets)
    db.session.commit()
    return len(budgets)

def get_budget_comparison(month=None, year=None):
    """
    Compares Actual vs Budget for a specific month/year.
    """
    if not month or not year:
        now = datetime.utcnow()
        month = now.month
        year = now.year
        
    start_date = datetime(year, month, 1)
    if month == 12:
        end_date = datetime(year + 1, 1, 1)
    else:
        end_date = datetime(year, month + 1, 1)
        
    # Get Actuals (Sales - Purchases)
    # Note: Purchases are negative in DB, so Sum is correct net result? 
    # Or do we compare Sales vs Sales Budget and Expenses vs Expense Budget?
    # Let's do Total Income vs Total Budget for simplicity for now, or breakdown.
    
    # Actual Sales
    actual_sales = db.session.query(func.sum(Transaction.amount)).filter(
        Transaction.type == 'SALE',
        Transaction.date >= start_date,
        Transaction.date < end_date
    ).scalar() or 0
    
    # Budgeted Amount (Assuming budget is for Net Income or Sales? Let's assume Sales for positive budget)
    budgeted_amount = db.session.query(func.sum(Budget.amount)).filter(
        Budget.period == start_date
    ).scalar() or 0
    
    return {
        "period": f"{year}-{month:02d}",
        "actual_sales": float(actual_sales),
        "budgeted_amount": float(budgeted_amount),
        "variance": float(actual_sales - budgeted_amount),
        "achievement_rate": (float(actual_sales) / float(budgeted_amount)) * 100 if budgeted_amount else 0
    }
