import pandas as pd
from datetime import datetime
import re
from models import db, Transaction, Upload

def normalize_columns(df):
    """
    Normalize column names to standard keys using regex patterns.
    Returns a dictionary mapping standard keys to actual column names.
    """
    df.columns = df.columns.str.lower().str.strip()
    
    # Regex patterns for column detection
    patterns = {
        'date': [r'date', r'dt', r'jour', r'période'],
        'description': [r'libellé', r'label', r'description', r'motif', r'memo', r'écriture'],
        'amount': [r'montant', r'amount', r'net'], # Removed 'solde' to avoid confusion with Balance or "Date de solde"
        'debit': [r'debit', r'débit'],
        'credit': [r'credit', r'crédit'],
        'third_party': [r'tiers', r'third.*party', r'client', r'fournisseur', r'nom', r'name', r'compte.*tiers'],
        'category': [r'catégorie', r'category', r'compte.*général', r'famille']
    }
    
    normalized_cols = {}
    used_columns = set()
    
    # Priority order: Date, then Debit/Credit, then Amount, then others
    priority_keys = ['date', 'debit', 'credit', 'amount', 'description', 'third_party', 'category']
    
    for standard in priority_keys:
        regex_list = patterns.get(standard, [])
        for col in df.columns:
            if col in used_columns:
                continue
                
            # Check if column matches any pattern for this standard key
            if any(re.search(p, col) for p in regex_list):
                normalized_cols[standard] = col
                used_columns.add(col)
                break # Found a match for this key, move to next key
    
    return normalized_cols

def parse_amount(row, cols):
    """
    Calculates the signed amount from the row.
    Positive = Inflow (Sale), Negative = Outflow (Purchase).
    """
    amount = 0.0
    
    # Case 1: Debit/Credit columns (Common in Accounting: Sage, EBP)
    if 'debit' in cols and 'credit' in cols:
        debit = pd.to_numeric(row.get(cols['debit'], 0), errors='coerce') or 0
        credit = pd.to_numeric(row.get(cols['credit'], 0), errors='coerce') or 0
        # In accounting: Credit is usually Income (Positive for P&L), Debit is Expense (Negative)
        # BUT for Bank Statements: Credit is Inflow (+), Debit is Outflow (-)
        # Let's assume Bank Statement logic for "Cash Flow" dashboard:
        # Credit = Money In (+), Debit = Money Out (-)
        amount = credit - debit
        
    # Case 2: Single Amount column
    elif 'amount' in cols:
        val = row[cols['amount']]
        # Clean currency symbols and spaces
        if isinstance(val, str):
            val = val.replace('€', '').replace('$', '').replace(' ', '').replace(',', '.')
        amount = pd.to_numeric(val, errors='coerce') or 0
        
    return amount

def determine_type(amount, description):
    """
    Determines transaction type based on amount sign and description keywords.
    Returns a tuple (type, corrected_amount).
    """
    description = str(description).lower()
    
    # List of keywords that strongly indicate an expense
    # List of keywords that strongly indicate an expense
    expense_keywords = [
        'achat', 'payment', 'paiement', 'prélèvement', 'prelevement', 'carte', 'cb', 
        'retrait', 'commission', 'frais', 'cotisation', 'assurance', 'mutuelle',
        'loyer', 'edf', 'engie', 'eau', 'orange', 'sfr', 'bouygues', 'free',
        'amazon', 'cdiscount', 'fnac', 'darty', 'boulanger', 'leroy merlin', 'castorama',
        'ikea', 'decathlon', 'uber', 'sncf', 'train', 'avion', 'hotel', 'restaurant',
        'mcdo', 'burger', 'kfc', 'subway', 'starbucks', 'carrefour', 'leclerc', 'auchan',
        'lidl', 'intermarché', 'monoprix', 'franprix', 'casino', 'super u', 'hyper u',
        'impôt', 'taxe', 'urssaf', 'rsi', 'cipav', 'tva', 'solde', 'consommable', 
        'honoraire', 'main d\'oeuvre', 'prestation', 'facture', 'charge', 'fourniture',
        'entretien', 'réparation', 'maintenance', 'emprunt', 'crédit', 'agios', 'banque',
        'salaire', 'paie', 'virement'
    ]
    
    # If amount is already negative, it's definitely a purchase
    if amount < 0:
        return 'PURCHASE', amount
        
    # If amount is positive, check if it's actually an expense disguised as positive
    if amount > 0:
        # Check for expense keywords
        if any(keyword in description for keyword in expense_keywords):
            return 'PURCHASE', -amount # Flip sign to negative
            
        return 'SALE', amount # Default to Sale/Income
        
    return 'OTHER', amount

def auto_categorize(description):
    """
    Assigns a category based on keywords in the description.
    """
    desc = description.lower()
    keywords = {
        'Logement': ['loyer', 'immobilier', 'housing', 'rent'],
        'Alimentation': ['carrefour', 'leclerc', 'auchan', 'lidl', 'courses', 'restaurant', 'mcdo', 'burger', 'food'],
        'Transport': ['uber', 'sncf', 'train', 'essence', 'total', 'shell', 'parking', 'péage'],
        'Santé': ['pharmacie', 'docteur', 'médecin', 'hopital', 'mutuelle'],
        'Loisirs': ['netflix', 'spotify', 'cinéma', 'vacances', 'voyage', 'hotel'],
        'Salaire': ['salaire', 'virement', 'paie', 'income'],
        'Services': ['edf', 'engie', 'internet', 'orange', 'sfr', 'bouygues', 'free', 'abonnement']
    }
    
    for category, tags in keywords.items():
        if any(tag in desc for tag in tags):
            return category
            
    return 'Autre'

def process_file(file_path, upload_id):
    """
    Reads file, normalizes data, and saves transactions to DB.
    Supports: .csv, .xlsx
    """
    try:
        if file_path.endswith('.csv'):
            # Try different separators
            try:
                df = pd.read_csv(file_path, sep=None, engine='python')
            except:
                df = pd.read_csv(file_path)
        else:
            # Handle Excel files
            try:
                if file_path.endswith('.xls'):
                    df = pd.read_excel(file_path, engine='xlrd')
                elif file_path.endswith('.xlsx'):
                    df = pd.read_excel(file_path, engine='openpyxl')
                else:
                    df = pd.read_excel(file_path)
            except ImportError as e:
                if 'xlrd' in str(e):
                    raise ValueError("Missing 'xlrd' library for .xls files. Please install it: pip install xlrd")
                if 'openpyxl' in str(e):
                    raise ValueError("Missing 'openpyxl' library for .xlsx files. Please install it: pip install openpyxl")
                raise e
            
        cols = normalize_columns(df)
        
        # Validation: Must have at least Date
        if 'date' not in cols:
            raise ValueError("Could not detect a 'Date' column. Please ensure your file has a date column.")
        
        transactions = []
        
        for _, row in df.iterrows():
            # Date parsing
            date_val = row[cols['date']]
            if pd.isna(date_val):
                continue
                
            try:
                # Handle various date formats including Excel serial dates
                if isinstance(date_val, (int, float)):
                    # Excel serial date
                    date_obj = pd.to_datetime(date_val, unit='D', origin='1899-12-30').date()
                else:
                    # Check if it looks like YYYY-MM-DD
                    str_val = str(date_val)
                    if re.match(r'\d{4}-\d{2}-\d{2}', str_val):
                         date_obj = pd.to_datetime(date_val).date() # ISO format, no dayfirst
                    else:
                         date_obj = pd.to_datetime(date_val, dayfirst=True).date()
            except:
                continue # Skip invalid dates
            
            # Amount calculation
            amount = parse_amount(row, cols)
            
            # Skip zero amounts if desired, or keep them. Let's keep non-zero.
            if amount == 0:
                continue

            # Determine Type & Correct Amount
            description = str(row.get(cols.get('description'), '')).strip()
            type_val, corrected_amount = determine_type(amount, description)
                
            third_party = row.get(cols.get('third_party'), '')
            
            # Category logic: Use column if exists, else auto-categorize
            if 'category' in cols:
                category = str(row.get(cols['category'], '')).strip()
                if not category or category.lower() == 'nan':
                     category = auto_categorize(description)
            else:
                category = auto_categorize(description)
            
            transactions.append(Transaction(
                date=date_obj,
                description=description,
                amount=corrected_amount,
                type=type_val,
                category=category,
                third_party=str(third_party).strip(),
                source_file_id=upload_id
            ))
            
        if not transactions:
             raise ValueError("No valid transactions found. Check column names and data format.")

        db.session.bulk_save_objects(transactions)
        
        # Update Upload status
        upload = Upload.query.get(upload_id)
        upload.status = 'completed'
        db.session.commit()
        
        return len(transactions)
        
    except Exception as e:
        db.session.rollback()
        upload = Upload.query.get(upload_id)
        upload.status = 'error'
        upload.error_message = str(e)
        db.session.commit()
        raise e
