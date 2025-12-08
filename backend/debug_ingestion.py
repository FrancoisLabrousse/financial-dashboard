import pandas as pd
import re
import os

# Mocking the logic from ingestion.py
def normalize_columns(df):
    df.columns = df.columns.str.lower().str.strip()
    patterns = {
        'date': [r'date', r'dt', r'jour', r'période'],
        'description': [r'libellé', r'label', r'description', r'motif', r'memo', r'écriture'],
        'amount': [r'montant', r'amount', r'net'],
        'debit': [r'debit', r'débit'],
        'credit': [r'credit', r'crédit'],
        'third_party': [r'tiers', r'third.*party', r'client', r'fournisseur', r'nom', r'name', r'compte.*tiers'],
        'category': [r'catégorie', r'category', r'compte.*général', r'famille']
    }
    normalized_cols = {}
    used_columns = set()
    priority_keys = ['date', 'debit', 'credit', 'amount', 'description', 'third_party', 'category']
    for standard in priority_keys:
        regex_list = patterns.get(standard, [])
        for col in df.columns:
            if col in used_columns: continue
            if any(re.search(p, col) for p in regex_list):
                normalized_cols[standard] = col
                used_columns.add(col)
                break
    return normalized_cols

def parse_amount(row, cols):
    amount = 0.0
    if 'debit' in cols and 'credit' in cols:
        debit = pd.to_numeric(row.get(cols['debit'], 0), errors='coerce') or 0
        credit = pd.to_numeric(row.get(cols['credit'], 0), errors='coerce') or 0
        amount = credit - debit
    elif 'amount' in cols:
        val = row[cols['amount']]
        if isinstance(val, str):
            val = val.replace('€', '').replace('$', '').replace(' ', '').replace(',', '.')
        amount = pd.to_numeric(val, errors='coerce') or 0
    return amount

def determine_type(amount, description):
    description = str(description).lower()
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
    if amount < 0: return 'PURCHASE', amount
    if amount > 0:
        if any(keyword in description for keyword in expense_keywords):
            return 'PURCHASE', -amount
        return 'SALE', amount
    return 'OTHER', amount

def analyze_file(file_path):
    output_file = "debug_output_full.txt"
    with open(output_file, "w", encoding="utf-8") as f:
        f.write(f"Analyzing {file_path}...\n")
        try:
            if file_path.endswith('.xls'):
                df = pd.read_excel(file_path, engine='xlrd')
            else:
                df = pd.read_excel(file_path, engine='openpyxl')
                
            f.write(f"Columns found: {df.columns.tolist()}\n")
            cols = normalize_columns(df)
            f.write(f"Mapped columns: {cols}\n")
            
            f.write("\n--- ALL Transactions ---\n")
            f.write("Idx | RawDate | ParsedDate | Description | RawAmount | ParsedAmount | Type | FinalAmount\n")
            
            for idx, row in df.iterrows():
                if 'date' not in cols: break
                date_val = row[cols['date']]
                
                parsed_date = "N/A"
                try:
                    if pd.notna(date_val):
                        if isinstance(date_val, (int, float)):
                            date_obj = pd.to_datetime(date_val, unit='D', origin='1899-12-30')
                        else:
                            date_obj = pd.to_datetime(date_val, dayfirst=True)
                        parsed_date = str(date_obj.date())
                except:
                    parsed_date = "ERROR"
                    
                amount_val = row.get(cols.get('amount'), 0) if 'amount' in cols else 0
                parsed_amount = parse_amount(row, cols)
                
                description = str(row.get(cols.get('description'), '')).strip()
                type_val, corrected_amount = determine_type(parsed_amount, description)
                
                f.write(f"{idx} | {date_val} | {parsed_date} | {description} | {amount_val} | {parsed_amount} | {type_val} | {corrected_amount}\n")
                
        except Exception as e:
            f.write(f"Error: {e}\n")
            print(f"Error: {e}")

if __name__ == "__main__":
    base_path = r"c:\Users\zaxod\OneDrive\Documents\APPS\financial-dashboard\backend\uploads"
    analyze_file(os.path.join(base_path, "PME_Cabanes_Detaille.xlsx"))
