from models import db, Transaction, Upload
from sqlalchemy import func, case
from datetime import datetime, timedelta
import pandas as pd
import numpy as np

def generate_forecast(months=6, upload_id=None, user_id=None):
    # 1. Get historical monthly data
    query = db.session.query(
        func.strftime('%Y-%m', Transaction.date).label('month'),
        func.sum(case((Transaction.type == 'SALE', Transaction.amount), else_=0)).label('income'),
        func.sum(case((Transaction.type == 'PURCHASE', Transaction.amount), else_=0)).label('expense')
    )
    
    if upload_id:
        query = query.filter(Transaction.source_file_id == upload_id)
    elif user_id:
        query = query.filter(Transaction.source_file_id.in_(
            db.session.query(Upload.id).filter(Upload.user_id == user_id)
        ))
        
    historical_data = query.group_by('month').order_by('month').all()
    
    if not historical_data:
        return []

    # Convert to list of dicts
    data = []
    for r in historical_data:
        data.append({
            "month": r.month,
            "income": float(r.income or 0),
            "expense": float(r.expense or 0)
        })
    
    # 2. Calculate Seasonality & Trends
    # Simple approach: Calculate average income/expense for each month (1-12)
    monthly_avg = {} # { 1: {income: X, expense: Y, count: N}, ... }
    
    for d in data:
        dt = datetime.strptime(d['month'], '%Y-%m')
        m = dt.month
        if m not in monthly_avg:
            monthly_avg[m] = {'income': 0, 'expense': 0, 'count': 0}
        
        monthly_avg[m]['income'] += d['income']
        monthly_avg[m]['expense'] += d['expense']
        monthly_avg[m]['count'] += 1
        
    # Calculate averages
    seasonality = {}
    for m, vals in monthly_avg.items():
        if vals['count'] > 0:
            seasonality[m] = {
                'income': vals['income'] / vals['count'],
                'expense': vals['expense'] / vals['count']
            }
            
    # 3. Generate Forecast
    last_month_str = data[-1]['month']
    last_date = datetime.strptime(last_month_str, '%Y-%m')
    
    # Get current balance
    balance_query = db.session.query(func.sum(Transaction.amount))
    if upload_id:
        balance_query = balance_query.filter(Transaction.source_file_id == upload_id)
    elif user_id:
        balance_query = balance_query.filter(Transaction.source_file_id.in_(
            db.session.query(Upload.id).filter(Upload.user_id == user_id)
        ))

    current_balance = balance_query.scalar() or 0
    
    forecast = []
    running_balance = float(current_balance)
    
    for i in range(1, months + 1):
        next_date = last_date + timedelta(days=32 * i)
        next_date = next_date.replace(day=1) # First day of next month
        month_num = next_date.month
        
        # Get seasonal average or global average if month missing
        if month_num in seasonality:
            pred_income = seasonality[month_num]['income']
            pred_expense = seasonality[month_num]['expense']
        else:
            # Fallback to global average
            all_incomes = [d['income'] for d in data]
            all_expenses = [d['expense'] for d in data]
            pred_income = sum(all_incomes) / len(all_incomes) if all_incomes else 0
            pred_expense = sum(all_expenses) / len(all_expenses) if all_expenses else 0
            
        net = pred_income + pred_expense
        running_balance += net
        
        forecast.append({
            "date": next_date.strftime('%Y-%m'),
            "predicted_income": round(pred_income, 2),
            "predicted_expense": round(pred_expense, 2),
            "predicted_net": round(net, 2),
            "predicted_balance": round(running_balance, 2)
        })
        
    return forecast
