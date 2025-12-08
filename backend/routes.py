import os
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from datetime import datetime
from models import db, Upload, Transaction, Budget, User
from services.ingestion import process_file
from services.kpi import get_dashboard_stats, get_cash_flow_history, get_monthly_breakdown, get_annual_breakdown, get_top_expenses, get_top_income, get_advanced_kpis
from services.budget import import_budget, get_budget_comparison
from services.forecast import generate_forecast
from services.analysis import generate_analysis
from flask_jwt_extended import jwt_required, get_jwt_identity

api_bp = Blueprint('api', __name__)

ALLOWED_EXTENSIONS = {'csv', 'xlsx', 'xls'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@api_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_file():
    current_user_id = int(get_jwt_identity())
    
    # Check upload limit for free users
    user = User.query.get(current_user_id)
    if user.subscription_status != 'active':
        upload_count = Upload.query.filter_by(user_id=current_user_id).count()
        if upload_count >= 2:
            return jsonify({
                "error": "Upload limit reached",
                "code": "LIMIT_REACHED",
                "message": "You have reached the limit of 2 free uploads. Please subscribe to continue."
            }), 403

    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        upload_folder = os.path.join(current_app.root_path, 'uploads')
        if not os.path.exists(upload_folder):
            os.makedirs(upload_folder)
            
        file_path = os.path.join(upload_folder, filename)
        file.save(file_path)
        
        # Check for duplicates for this user
        existing_upload = Upload.query.filter_by(filename=filename, status='completed', user_id=current_user_id).first()
        if existing_upload:
             return jsonify({"error": "File already uploaded. Please reset data if you want to re-upload."}), 409

        # Create Upload record
        new_upload = Upload(filename=filename, status='processing', user_id=current_user_id)
        db.session.add(new_upload)
        db.session.commit()
        
        try:
            count = process_file(file_path, new_upload.id)
            return jsonify({
                "message": f"File processed successfully. {count} transactions imported.",
                "upload_id": new_upload.id
            }), 200
        except Exception as e:
            import traceback
            traceback.print_exc()
            return jsonify({"error": f"Processing error: {str(e)}"}), 500
            
    return jsonify({"error": "Invalid file type"}), 400

@api_bp.route('/upload-budget', methods=['POST'])
def upload_budget():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        upload_folder = os.path.join(current_app.root_path, 'uploads')
        if not os.path.exists(upload_folder):
            os.makedirs(upload_folder)
        file_path = os.path.join(upload_folder, filename)
        file.save(file_path)
        
        try:
            count = import_budget(file_path)
            return jsonify({"message": f"Budget imported successfully. {count} entries."}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    return jsonify({"error": "Invalid file"}), 400

@api_bp.route('/dashboard/stats', methods=['GET'])
@jwt_required()
def dashboard_stats():
    current_user_id = int(get_jwt_identity())
    upload_id = request.args.get('upload_id', type=int)
    
    if upload_id:
        upload = Upload.query.get(upload_id)
        if not upload or upload.user_id != current_user_id:
            return jsonify({"error": "Unauthorized access to this upload"}), 403

    stats = get_dashboard_stats(upload_id=upload_id, user_id=current_user_id)
    return jsonify(stats)

@api_bp.route('/dashboard/cashflow', methods=['GET'])
@jwt_required()
def cashflow_history():
    current_user_id = int(get_jwt_identity())
    granularity = request.args.get('granularity', default='month')
    year = request.args.get('year', type=int)
    upload_id = request.args.get('upload_id', type=int)

    if upload_id:
        upload = Upload.query.get(upload_id)
        if not upload or upload.user_id != current_user_id:
            return jsonify({"error": "Unauthorized access to this upload"}), 403

    history = get_cash_flow_history(year=year, granularity=granularity, upload_id=upload_id, user_id=current_user_id)
    return jsonify(history)

@api_bp.route('/budget/comparison', methods=['GET'])
def budget_comparison():
    month = request.args.get('month', type=int)
    year = request.args.get('year', type=int)
    comparison = get_budget_comparison(month, year)
    return jsonify(comparison)

@api_bp.route('/forecast', methods=['GET'])
@jwt_required()
def forecast():
    current_user_id = int(get_jwt_identity())
    months = request.args.get('months', default=6, type=int)
    upload_id = request.args.get('upload_id', type=int)

    if upload_id:
        upload = Upload.query.get(upload_id)
        if not upload or upload.user_id != current_user_id:
            return jsonify({"error": "Unauthorized access to this upload"}), 403

    data = generate_forecast(months, upload_id=upload_id, user_id=current_user_id)
    return jsonify(data)

@api_bp.route('/uploads', methods=['GET'])
@jwt_required()
def get_uploads():
    current_user_id = int(get_jwt_identity())
    uploads = Upload.query.filter_by(user_id=current_user_id).order_by(Upload.upload_date.desc()).all()
    return jsonify([{
        "id": u.id,
        "filename": u.filename,
        "date": u.upload_date.strftime('%Y-%m-%d %H:%M'),
        "status": u.status,
        "error": u.error_message
    } for u in uploads])

@api_bp.route('/dashboard/monthly', methods=['GET'])
@jwt_required()
def monthly_breakdown():
    current_user_id = int(get_jwt_identity())
    year = request.args.get('year', type=int)
    upload_id = request.args.get('upload_id', type=int)

    if upload_id:
        upload = Upload.query.get(upload_id)
        if not upload or upload.user_id != current_user_id:
            return jsonify({"error": "Unauthorized access to this upload"}), 403

    data = get_monthly_breakdown(year, upload_id=upload_id, user_id=current_user_id)
    return jsonify(data)

@api_bp.route('/dashboard/annual', methods=['GET'])
@jwt_required()
def annual_breakdown():
    current_user_id = int(get_jwt_identity())
    upload_id = request.args.get('upload_id', type=int)

    if upload_id:
        upload = Upload.query.get(upload_id)
        if not upload or upload.user_id != current_user_id:
            return jsonify({"error": "Unauthorized access to this upload"}), 403

    data = get_annual_breakdown(upload_id=upload_id, user_id=current_user_id)
    return jsonify(data)

@api_bp.route('/dashboard/top-expenses', methods=['GET'])
@jwt_required()
def top_expenses():
    current_user_id = int(get_jwt_identity())
    limit = request.args.get('limit', default=10, type=int)
    upload_id = request.args.get('upload_id', type=int)

    if upload_id:
        upload = Upload.query.get(upload_id)
        if not upload or upload.user_id != current_user_id:
            return jsonify({"error": "Unauthorized access to this upload"}), 403

    data = get_top_expenses(limit, upload_id=upload_id, user_id=current_user_id)
    return jsonify(data)

@api_bp.route('/dashboard/top-income', methods=['GET'])
@jwt_required()
def top_income():
    current_user_id = int(get_jwt_identity())
    limit = request.args.get('limit', default=10, type=int)
    upload_id = request.args.get('upload_id', type=int)

    if upload_id:
        upload = Upload.query.get(upload_id)
        if not upload or upload.user_id != current_user_id:
            return jsonify({"error": "Unauthorized access to this upload"}), 403

    data = get_top_income(limit, upload_id=upload_id, user_id=current_user_id)
    return jsonify(data)

@api_bp.route('/dashboard/advanced-kpis', methods=['GET'])
@jwt_required()
def advanced_kpis():
    current_user_id = int(get_jwt_identity())
    upload_id = request.args.get('upload_id', type=int)

    if upload_id:
        upload = Upload.query.get(upload_id)
        if not upload or upload.user_id != current_user_id:
            return jsonify({"error": "Unauthorized access to this upload"}), 403

    data = get_advanced_kpis(upload_id=upload_id, user_id=current_user_id)
    return jsonify(data)

@api_bp.route('/dashboard/details', methods=['GET'])
@jwt_required()
def get_details():
    current_user_id = int(get_jwt_identity())
    month = request.args.get('month') # Format: YYYY-MM
    type_filter = request.args.get('type') # INCOME or EXPENSE
    upload_id = request.args.get('upload_id', type=int)

    if upload_id:
        upload = Upload.query.get(upload_id)
        if not upload or upload.user_id != current_user_id:
            return jsonify({"error": "Unauthorized access to this upload"}), 403
    
    if not month or not type_filter:
        return jsonify({"error": "Missing month or type parameter"}), 400
        
    try:
        start_date = datetime.strptime(month, '%Y-%m')
        # Calculate end date (first day of next month)
        if start_date.month == 12:
            end_date = datetime(start_date.year + 1, 1, 1)
        else:
            end_date = datetime(start_date.year, start_date.month + 1, 1)
            
        # Map frontend type to DB type
        db_type = 'SALE' if type_filter == 'income' else 'PURCHASE'
        
        query = db.session.query(Transaction).filter(
            Transaction.date >= start_date,
            Transaction.date < end_date,
            Transaction.type == db_type
        )

        if upload_id:
            query = query.filter(Transaction.source_file_id == upload_id)
        elif current_user_id:
            query = query.filter(Transaction.source_file_id.in_(
                db.session.query(Upload.id).filter(Upload.user_id == current_user_id)
            ))

        transactions = query.order_by(Transaction.date.desc()).all()
        
        return jsonify([{
            "date": t.date.strftime('%Y-%m-%d'),
            "description": t.description,
            "category": t.category,
            "amount": float(t.amount)
        } for t in transactions])
        
    except ValueError:
        return jsonify({"error": "Invalid date format"}), 400

@api_bp.route('/dashboard/analysis', methods=['GET'])
@jwt_required()
def get_analysis():
    try:
        current_user_id = int(get_jwt_identity())
        upload_id = request.args.get('upload_id', type=int)

        if upload_id:
            upload = Upload.query.get(upload_id)
            if not upload or upload.user_id != current_user_id:
                return jsonify({"error": "Unauthorized access to this upload"}), 403

        data = generate_analysis(upload_id=upload_id, user_id=current_user_id)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_bp.route('/uploads/<int:upload_id>', methods=['DELETE'])
@jwt_required()
def delete_upload(upload_id):
    try:
        current_user_id = int(get_jwt_identity())
        upload = Upload.query.get(upload_id)
        if not upload:
            return jsonify({"error": "Upload not found"}), 404
        
        if upload.user_id != current_user_id:
            return jsonify({"error": "Unauthorized"}), 403

        # Delete related transactions first (manual cascade)
        Transaction.query.filter_by(source_file_id=upload_id).delete()
        
        # Delete the upload record
        db.session.delete(upload)
        db.session.commit()
        
        # Optional: Delete the actual file from disk
        try:
            upload_folder = os.path.join(current_app.root_path, 'uploads')
            file_path = os.path.join(upload_folder, upload.filename)
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception as e:
            print(f"Error deleting file from disk: {e}")
            # We don't fail the request if file deletion fails, as DB is consistent

        return jsonify({"message": "Upload deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
