from models import db, Transaction, Upload
from sqlalchemy import func, case
from datetime import datetime, timedelta
from services.kpi import get_dashboard_stats, get_advanced_kpis, get_top_expenses

SECTOR_BENCHMARKS = {
    'BAKERY': {
        'name': 'Boulangerie / Pâtisserie',
        'target_margin': 12.0,
        'min_margin': 5.0,
        'max_material_cost': 32.0, # % of sales
        'max_staff_cost': 35.0, # % of sales
        'keywords': ['boulangerie', 'bakery', 'pain', 'patisserie', 'croissant', 'baguette']
    },
    'CONSTRUCTION': {
        'name': 'BTP / Construction / Menuiserie',
        'target_margin': 15.0,
        'min_margin': 8.0,
        'max_material_cost': 45.0,
        'max_staff_cost': 30.0,
        'keywords': ['btp', 'construction', 'maison', 'cabane', 'jardin', 'bois', 'menuiserie']
    },
    'RESTAURANT': {
        'name': 'Restauration',
        'target_margin': 10.0,
        'min_margin': 4.0,
        'max_material_cost': 30.0,
        'max_staff_cost': 35.0,
        'keywords': ['restaurant', 'food', 'repas', 'snack', 'bar']
    },
    'GENERAL': {
        'name': 'Général',
        'target_margin': 10.0,
        'min_margin': 0.0,
        'max_material_cost': 100.0,
        'max_staff_cost': 100.0,
        'keywords': []
    }
}

def detect_sector(upload_id):
    if not upload_id:
        return 'GENERAL'
    
    upload = Upload.query.get(upload_id)
    if not upload:
        return 'GENERAL'
        
    filename = upload.filename.lower()
    
    for sector, data in SECTOR_BENCHMARKS.items():
        for keyword in data['keywords']:
            if keyword in filename:
                return sector
                
    return 'GENERAL'

def generate_analysis(upload_id=None, user_id=None):
    """
    Analyzes financial data with sector-specific context.
    """
    # Get base stats
    stats = get_dashboard_stats(upload_id=upload_id, user_id=user_id)
    adv_stats = get_advanced_kpis(upload_id=upload_id, user_id=user_id)
    top_expenses = get_top_expenses(limit=100, upload_id=upload_id, user_id=user_id) # Get all expenses for categorization
    
    sector_key = detect_sector(upload_id)
    sector_data = SECTOR_BENCHMARKS[sector_key]
    
    strengths = []
    weaknesses = []
    recommendations = []
    
    # Context Intro
    if sector_key != 'GENERAL':
        strengths.append(f"Analyse Sectorielle : Profil identifié comme '{sector_data['name']}'. Comparaison avec les standards du marché.")

    # 1. Analyze Margin & Profitability vs Benchmark
    margin = stats.get('margin', 0)
    total_sales = stats.get('total_sales', 0)
    
    if total_sales > 0:
        margin_pct = (margin / total_sales) * 100
        
        if margin_pct >= sector_data['target_margin']:
            strengths.append(f"Performance Excellente : Votre marge nette ({round(margin_pct, 1)}%) est supérieure à la moyenne du secteur {sector_data['name']} ({sector_data['target_margin']}%).")
        elif margin_pct >= sector_data['min_margin']:
            strengths.append(f"Performance Correcte : Votre marge ({round(margin_pct, 1)}%) est dans la moyenne basse du secteur (Cible : {sector_data['target_margin']}%).")
            recommendations.append(f"Pour atteindre les leaders du secteur {sector_data['name']}, visez une marge de {sector_data['target_margin']}%.")
        else:
            weaknesses.append(f"Rentabilité Critique : Votre marge ({round(margin_pct, 1)}%) est dangereusement inférieure aux standards du secteur ({sector_data['min_margin']}% min).")
            recommendations.append("Action Urgente : Audit complet des coûts nécessaire. Votre modèle économique actuel n'est pas viable à long terme par rapport à la concurrence.")

    # 2. Analyze Cost Structure (Materials vs Staff)
    # Heuristic: Try to identify material/staff costs from categories
    material_cost = 0
    staff_cost = 0
    
    for exp in top_expenses:
        cat = exp['category'].lower()
        amount = exp['amount']
        
        # Keywords for categorization
        if any(k in cat for k in ['matiere', 'marchandise', 'achat', 'fournisseur', 'stock', 'boisson', 'aliment']):
            material_cost += amount
        elif any(k in cat for k in ['salaire', 'social', 'personnel', 'urssaf', 'retraite', 'prevoyance']):
            staff_cost += amount
            
    if total_sales > 0:
        material_pct = (material_cost / total_sales) * 100
        staff_pct = (staff_cost / total_sales) * 100
        
        # Check Materials
        if sector_key != 'GENERAL' and material_pct > sector_data['max_material_cost']:
            weaknesses.append(f"Coût Matières Trop Élevé : {round(material_pct, 1)}% du CA (Standard {sector_data['name']} : max {sector_data['max_material_cost']}%).")
            recommendations.append("Renégociez avec vos fournisseurs ou revoyez vos fiches techniques/prix de vente. Vous perdez trop de marge sur les achats.")
        elif material_pct > 0:
             strengths.append(f"Maîtrise des Coûts Matières : {round(material_pct, 1)}% du CA.")

        # Check Staff
        if sector_key != 'GENERAL' and staff_pct > sector_data['max_staff_cost']:
             weaknesses.append(f"Masse Salariale Trop Lourde : {round(staff_pct, 1)}% du CA (Standard {sector_data['name']} : max {sector_data['max_staff_cost']}%).")
             recommendations.append("Optimisez les plannings ou augmentez la productivité par employé. Le ratio masse salariale/CA est critique.")

    # 3. Cash Flow & Savings
    savings_rate = adv_stats.get('savings_rate', 0)
    if savings_rate < 0:
        weaknesses.append("Trésorerie : Vous brûlez du cash chaque mois.")
        recommendations.append("Arrêtez tout investissement non essentiel immédiatement.")
        
    # 4. Max Expense Check
    max_expense = adv_stats.get('max_expense', 0)
    if max_expense > (total_sales * 0.15) and total_sales > 0:
         weaknesses.append("Risque de Concentration : Une seule dépense représente plus de 15% de votre CA.")

    # Default messages if empty
    if not strengths:
        strengths.append("Analyse en cours d'affinement.")
    if not weaknesses:
        weaknesses.append("Indicateurs alignés avec le secteur.")
    if not recommendations:
        recommendations.append("Maintenez le cap actuel.")

    return {
        "strengths": strengths,
        "weaknesses": weaknesses,
        "recommendations": recommendations,
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "sector": sector_data['name']
    }
