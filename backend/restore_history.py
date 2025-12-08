import os
from app import create_app
from models import db, Upload
from services.ingestion import process_file

app = create_app()

def restore_uploads():
    with app.app_context():
        upload_folder = os.path.join(app.root_path, 'uploads')
        if not os.path.exists(upload_folder):
            print("Uploads folder not found.")
            return

        files = [f for f in os.listdir(upload_folder) if os.path.isfile(os.path.join(upload_folder, f))]
        
        print(f"Found files: {files}")
        
        for filename in files:
            # Check if exists in DB
            existing = Upload.query.filter_by(filename=filename).first()
            if existing:
                print(f"Skipping {filename} (already in DB)")
                continue
                
            print(f"Restoring {filename}...")
            try:
                # Create new upload record
                new_upload = Upload(filename=filename, status='processing')
                db.session.add(new_upload)
                db.session.commit()
                
                # Process file
                file_path = os.path.join(upload_folder, filename)
                count = process_file(file_path, new_upload.id)
                
                new_upload.status = 'completed'
                db.session.commit()
                print(f"Successfully restored {filename} with {count} transactions.")
                
            except Exception as e:
                print(f"Failed to restore {filename}: {e}")
                if 'new_upload' in locals():
                    new_upload.status = 'error'
                    new_upload.error_message = str(e)
                    db.session.commit()

if __name__ == "__main__":
    restore_uploads()
