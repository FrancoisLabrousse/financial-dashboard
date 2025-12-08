from sqlalchemy import func
from models import db

def format_date_sql(date_col, fmt):
    """
    Returns a SQLAlchemy expression for formatting a date column as a string.
    Handles differences between SQLite (strftime) and PostgreSQL (to_char).
    
    fmt: SQLite format string (e.g. '%Y-%m')
    """
    # Check dialect name
    # Note: We need to access the dialect from the session bind or engine
    dialect_name = db.session.bind.dialect.name if db.session.bind else 'sqlite'
    
    if dialect_name == 'sqlite':
        return func.strftime(fmt, date_col)
    else:
        # PostgreSQL uses to_char(date, 'YYYY-MM')
        # Map common SQLite format codes to Postgres patterns
        pg_fmt = fmt.replace('%Y', 'YYYY') \
                    .replace('%m', 'MM') \
                    .replace('%d', 'DD') \
                    .replace('%H', 'HH24') \
                    .replace('%M', 'MI') \
                    .replace('%S', 'SS')
        return func.to_char(date_col, pg_fmt)
