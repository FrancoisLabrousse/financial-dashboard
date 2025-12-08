from app import create_app
from models import db, Upload, Transaction

app = create_app()

with app.app_context():
    uploads = Upload.query.all()
    print(f"--- Uploads Found: {len(uploads)} ---")
    for u in uploads:
        print(f"ID: {u.id} | File: {u.filename} | Status: {u.status}")
        
        # Count transactions
        count = Transaction.query.filter_by(source_file_id=u.id).count()
        print(f"  -> Transaction Count: {count}")
        
        # Show sample transactions
        samples = Transaction.query.filter_by(source_file_id=u.id).limit(3).all()
        for s in samples:
            print(f"     - {s.date} | {s.description} | {s.amount} | {s.type}")
        print("")
