import csv
import random
from datetime import datetime, timedelta

categories_income = ['Vente de services', 'Consulting', 'Formation', 'Maintenance']
categories_expense = ['Loyer', 'Salaires', 'Logiciels', 'Publicité', 'Déplacements', 'Fournitures']

start_date = datetime(2023, 1, 1)
end_date = datetime(2023, 12, 31)

rows = []
rows.append(['Date', 'Libellé', 'Montant', 'Devise'])

current_date = start_date
while current_date <= end_date:
    # Generate 1-3 transactions per day
    if random.random() > 0.7:
        # Income
        amount = round(random.uniform(500, 5000), 2)
        category = random.choice(categories_income)
        rows.append([current_date.strftime('%d/%m/%Y'), f"Facture {category}", amount, 'EUR'])
    
    if random.random() > 0.6:
        # Expense
        amount = round(random.uniform(-1500, -50), 2)
        category = random.choice(categories_expense)
        rows.append([current_date.strftime('%d/%m/%Y'), f"Paiement {category}", amount, 'EUR'])

    current_date += timedelta(days=random.randint(1, 3))

# Add some big fixed expenses
for month in range(1, 13):
    rows.append([f"01/{month:02d}/2023", "Loyer Bureau", -1200.00, 'EUR'])
    rows.append([f"28/{month:02d}/2023", "Salaires", -4500.00, 'EUR'])

with open('demo_data.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f, delimiter=';')
    writer.writerows(rows)

print("demo_data.csv created")
