from models import db, Transaction, Budget, Upload
from sqlalchemy import func, extract, case
from datetime import datetime, timedelta

def get_dashboard_stats(start_date=None, end_date=None, upload_id=None, user_id=None):
    if not start_date:
        start_date = datetime(2000, 1, 1)
    if not end_date:
        end_date = datetime.utcnow()

    filters = [
        Transaction.date >= start_date,
        Transaction.date <= end_date
    ]
    if upload_id:
        filters.append(Transaction.source_file_id == upload_id)
    elif user_id:
        filters.append(Transaction.source_file_id.in_(
            db.session.query(Upload.id).filter(Upload.user_id == user_id)
        ))

    total_sales = db.session.query(func.sum(Transaction.amount)).filter(
        Transaction.type == 'SALE',
        *filters
    ).scalar() or 0

    total_purchases = db.session.query(func.sum(Transaction.amount)).filter(
        Transaction.type == 'PURCHASE',
        *filters
    ).scalar() or 0
    
    margin = total_sales + total_purchases

    balance_query = db.session.query(func.sum(Transaction.amount))
    if upload_id:
        balance_query = balance_query.filter(Transaction.source_file_id == upload_id)
    elif user_id:
        balance_query = balance_query.filter(Transaction.source_file_id.in_(
            db.session.query(Upload.id).filter(Upload.user_id == user_id)
        ))
        
    current_balance = balance_query.scalar() or 0

    return {
        "total_sales": float(total_sales),
        "total_purchases": float(total_purchases),
        "margin": float(margin),
        "current_balance": float(current_balance)
    }

def get_cash_flow_history(year=None, granularity='month', upload_id=None, user_id=None):
    if not year:
        max_date_query = db.session.query(func.max(Transaction.date))
        if upload_id:
            max_date_query = max_date_query.filter(Transaction.source_file_id == upload_id)
        elif user_id:
            max_date_query = max_date_query.filter(Transaction.source_file_id.in_(
                db.session.query(Upload.id).filter(Upload.user_id == user_id)
            ))
        max_date = max_date_query.scalar()
        
        if max_date:
            year = max_date.year if isinstance(max_date, datetime) else int(str(max_date)[:4])
        else:
            year = datetime.utcnow().year

    start_date = datetime(year, 1, 1)
    end_date = datetime(year + 1, 1, 1)
    
    if granularity == 'day':
        date_format = '%Y-%m-%d'
    else:
        date_format = '%Y-%m'
    
    filters = [
        Transaction.date >= start_date,
        Transaction.date < end_date
    ]
    if upload_id:
        filters.append(Transaction.source_file_id == upload_id)
    elif user_id:
        filters.append(Transaction.source_file_id.in_(
            db.session.query(Upload.id).filter(Upload.user_id == user_id)
        ))

    results = db.session.query(
        func.strftime(date_format, Transaction.date).label('period'),
        func.sum(Transaction.amount).label('net_flow')
    ).filter(*filters).group_by('period').order_by('period').all()
    
    history = []
    
    initial_balance_query = db.session.query(func.sum(Transaction.amount)).filter(
        Transaction.date < start_date
    )
    if upload_id:
        initial_balance_query = initial_balance_query.filter(Transaction.source_file_id == upload_id)
    elif user_id:
        initial_balance_query = initial_balance_query.filter(Transaction.source_file_id.in_(
            db.session.query(Upload.id).filter(Upload.user_id == user_id)
        ))
        
    initial_balance = initial_balance_query.scalar() or 0
    
    cumulative = float(initial_balance)
    
    for r in results:
        net = float(r.net_flow)
        cumulative += net
        history.append({
            "date": r.period,
            "net_flow": net,
            "balance": float(cumulative)
        })
        
    return history

def get_monthly_breakdown(year=None, upload_id=None, user_id=None):
    if not year:
        max_date_query = db.session.query(func.max(Transaction.date))
        if upload_id:
            max_date_query = max_date_query.filter(Transaction.source_file_id == upload_id)
        elif user_id:
            max_date_query = max_date_query.filter(Transaction.source_file_id.in_(
                db.session.query(Upload.id).filter(Upload.user_id == user_id)
            ))
        max_date = max_date_query.scalar()
        
        if max_date:
            year = max_date.year if isinstance(max_date, datetime) else int(str(max_date)[:4])
        else:
            year = datetime.utcnow().year
        
    start_date = datetime(year, 1, 1)
    end_date = datetime(year + 1, 1, 1)
    
    filters = [
        Transaction.date >= start_date,
        Transaction.date < end_date
    ]
    if upload_id:
        filters.append(Transaction.source_file_id == upload_id)
    elif user_id:
        filters.append(Transaction.source_file_id.in_(
            db.session.query(Upload.id).filter(Upload.user_id == user_id)
        ))

    results = db.session.query(
        func.strftime('%Y-%m', Transaction.date).label('month'),
        func.sum(case((Transaction.type == 'SALE', Transaction.amount), else_=0)).label('income'),
        func.sum(case((Transaction.type == 'PURCHASE', Transaction.amount), else_=0)).label('expense')
    ).filter(*filters).group_by('month').order_by('month').all()
    
    breakdown = []
    for r in results:
        income = float(r.income or 0)
        expense = float(r.expense or 0)
        margin = income + expense
        margin_pct = (margin / income * 100) if income > 0 else 0
        
        breakdown.append({
            "month": r.month,
            "income": income,
            "expense": expense,
            "margin": margin,
            "margin_pct": round(margin_pct, 2)
        })
        
    return breakdown

def get_annual_breakdown(upload_id=None, user_id=None):
    query = db.session.query(
        func.strftime('%Y', Transaction.date).label('year'),
        func.sum(case((Transaction.type == 'SALE', Transaction.amount), else_=0)).label('income'),
        func.sum(case((Transaction.type == 'PURCHASE', Transaction.amount), else_=0)).label('expense')
    )
    
    if upload_id:
        query = query.filter(Transaction.source_file_id == upload_id)
    elif user_id:
        query = query.filter(Transaction.source_file_id.in_(
            db.session.query(Upload.id).filter(Upload.user_id == user_id)
        ))
        
    results = query.group_by('year').order_by('year').all()
    
    breakdown = []
    for r in results:
        income = float(r.income or 0)
        expense = float(r.expense or 0)
        margin = income + expense
        
        breakdown.append({
            "year": r.year,
            "income": income,
            "expense": expense,
            "margin": margin
        })
        
    return breakdown

def get_top_expenses(limit=10, upload_id=None, user_id=None):
    query = db.session.query(
        Transaction.category,
        func.sum(Transaction.amount).label('total')
    ).filter(
        Transaction.type == 'PURCHASE'
    )
    
    if upload_id:
        query = query.filter(Transaction.source_file_id == upload_id)
    elif user_id:
        query = query.filter(Transaction.source_file_id.in_(
            db.session.query(Upload.id).filter(Upload.user_id == user_id)
        ))
        
    query = query.group_by(Transaction.category).order_by(func.sum(Transaction.amount).asc())
    
    if limit and limit > 0:
        results = query.limit(limit).all()
    else:
        results = query.all()
    
    expenses = []
    for r in results:
        category = r.category if r.category and r.category != 'nan' else 'Uncategorized'
        expenses.append({
            "category": category,
            "amount": abs(float(r.total))
        })
        
    return expenses

def get_top_income(limit=10, upload_id=None, user_id=None):
    query = db.session.query(
        Transaction.category,
        func.sum(Transaction.amount).label('total')
    ).filter(
        Transaction.type == 'SALE'
    )
    
    if upload_id:
        query = query.filter(Transaction.source_file_id == upload_id)
    elif user_id:
        query = query.filter(Transaction.source_file_id.in_(
            db.session.query(Upload.id).filter(Upload.user_id == user_id)
        ))
        
    query = query.group_by(Transaction.category).order_by(func.sum(Transaction.amount).desc())
    
    if limit and limit > 0:
        results = query.limit(limit).all()
    else:
        results = query.all()
    
    incomes = []
    for r in results:
        category = r.category if r.category and r.category != 'nan' else 'Uncategorized'
        incomes.append({
            "category": category,
            "amount": float(r.total)
        })
        
    return incomes

def get_advanced_kpis(upload_id=None, user_id=None):
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=365)
    
    query = db.session.query(
        func.sum(case((Transaction.type == 'SALE', Transaction.amount), else_=0)).label('income'),
        func.sum(case((Transaction.type == 'PURCHASE', Transaction.amount), else_=0)).label('expense')
    ).filter(
        Transaction.date >= start_date
    )
    
    if upload_id:
        query = query.filter(Transaction.source_file_id == upload_id)
    elif user_id:
        query = query.filter(Transaction.source_file_id.in_(
            db.session.query(Upload.id).filter(Upload.user_id == user_id)
        ))
        
    totals = query.first()
    
    income = float(totals.income or 0)
    expense = float(totals.expense or 0)
    margin = income + expense
    savings_rate = (margin / income * 100) if income > 0 else 0
    
    max_expense_query = db.session.query(Transaction).filter(
        Transaction.type == 'PURCHASE'
    )
    
    if upload_id:
        max_expense_query = max_expense_query.filter(Transaction.source_file_id == upload_id)
    elif user_id:
        max_expense_query = max_expense_query.filter(Transaction.source_file_id.in_(
            db.session.query(Upload.id).filter(Upload.user_id == user_id)
        ))
        
    max_expense_tx = max_expense_query.order_by(Transaction.amount.asc()).first()
    
    max_expense_val = 0
    max_expense_details = None
    
    if max_expense_tx:
        max_expense_val = abs(float(max_expense_tx.amount))
        max_expense_details = {
            "amount": max_expense_val,
            "description": max_expense_tx.description,
            "date": max_expense_tx.date.strftime('%Y-%m-%d'),
            "category": max_expense_tx.category
        }

    max_income_query = db.session.query(Transaction).filter(
        Transaction.type == 'SALE'
    )

    if upload_id:
        max_income_query = max_income_query.filter(Transaction.source_file_id == upload_id)
    elif user_id:
        max_income_query = max_income_query.filter(Transaction.source_file_id.in_(
            db.session.query(Upload.id).filter(Upload.user_id == user_id)
        ))

    max_income_tx = max_income_query.order_by(Transaction.amount.desc()).first()

    max_income_val = 0
    max_income_details = None

    if max_income_tx:
        max_income_val = float(max_income_tx.amount)
        max_income_details = {
            "amount": max_income_val,
            "description": max_income_tx.description,
            "date": max_income_tx.date.strftime('%Y-%m-%d'),
            "category": max_income_tx.category
        }
    
    return {
        "savings_rate": round(savings_rate, 2),
        "max_expense": max_expense_val,
        "max_expense_details": max_expense_details,
        "max_income": max_income_val,
        "max_income_details": max_income_details,
        "expense_coverage": round(abs(income / expense), 2) if expense != 0 else 0
    }
