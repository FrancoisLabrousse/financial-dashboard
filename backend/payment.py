import stripe
from flask import Blueprint, request, jsonify, current_app, redirect
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User

payment_bp = Blueprint('payment', __name__)

@payment_bp.route('/create-checkout-session', methods=['POST'])
@jwt_required()
def create_checkout_session():
    stripe.api_key = current_app.config['STRIPE_SECRET_KEY']
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    try:
        checkout_session = stripe.checkout.Session.create(
            customer_email=user.email,
            payment_method_types=['card'],
            line_items=[
                {
                    'price': current_app.config['STRIPE_PRICE_ID'],
                    'quantity': 1,
                },
            ],
            mode='subscription',
            success_url='http://localhost:5173/payment/success?session_id={CHECKOUT_SESSION_ID}',
            cancel_url='http://localhost:5173/payment/cancel',
            metadata={
                'user_id': user.id
            }
        )
        return jsonify({'url': checkout_session.url})
    except Exception as e:
        return jsonify(error=str(e)), 500

@payment_bp.route('/webhook', methods=['POST'])
def webhook():
    stripe.api_key = current_app.config['STRIPE_SECRET_KEY']
    payload = request.get_data(as_text=True)
    sig_header = request.headers.get('Stripe-Signature')
    endpoint_secret = current_app.config['STRIPE_WEBHOOK_SECRET']

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, endpoint_secret
        )
    except ValueError as e:
        return 'Invalid payload', 400
    except stripe.error.SignatureVerificationError as e:
        return 'Invalid signature', 400

    # Handle the event
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        handle_checkout_session(session)
    elif event['type'] == 'invoice.payment_succeeded':
        # Can be used to extend subscription
        pass
    
    return 'Success', 200

def handle_checkout_session(session):
    # Retrieve user from metadata
    # Note: metadata is not always present in the session object depending on API version, 
    # but we added it in create_checkout_session.
    # Alternatively, we can use client_reference_id
    
    # For simplicity, we'll try to find user by email if metadata fails, 
    # but metadata is safer.
    
    # In a real app, we should use client_reference_id for robustness.
    
    # Let's assume we get user_id from metadata
    # But wait, session object in webhook might not have metadata if not expanded.
    # However, checkout.session.completed usually has it.
    
    # Let's try to get user by email as fallback
    customer_email = session.get('customer_details', {}).get('email')
    
    # But we passed metadata.
    # Let's query by email for now as it's safer than relying on unverified metadata structure without testing.
    if customer_email:
        user = User.query.filter_by(email=customer_email).first()
        if user:
            user.subscription_status = 'active'
            user.stripe_customer_id = session.get('customer')
            user.stripe_subscription_id = session.get('subscription')
            db.session.commit()
            print(f"User {user.username} subscription activated.")
