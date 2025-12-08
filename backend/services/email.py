from flask_mail import Message
from flask import current_app

def send_welcome_email(user_email, username):
    """
    Sends a welcome email to the new user.
    """
    try:
        # Import mail here to avoid circular imports if initialized in app.py
        # But usually we pass the mail instance or use current_app.extensions['mail']
        # For simplicity, we'll assume 'mail' is available via current_app context if we attached it.
        # However, extensions are typically stored in current_app.extensions.
        
        # Better approach: Import mail from app, but app imports this service... circular dependency.
        # Solution: Use current_app.extensions['mail']
        
        mail = current_app.extensions.get('mail')
        if not mail:
            print("Mail extension not found.")
            return

        msg = Message("Bienvenue sur votre Tableau de Bord Financier",
                      recipients=[user_email])
        
        msg.body = f"""Bonjour {username},

Bienvenue sur votre Tableau de Bord Financier !

Votre compte a été créé avec succès. Vous pouvez dès à présent vous connecter et importer vos fichiers pour analyser vos finances.

Si vous avez des questions, n'hésitez pas à nous contacter.

Cordialement,
L'équipe Support
"""
        
        msg.html = f"""
        <div style="font-family: Arial, sans-serif; color: #333;">
            <h2 style="color: #2563eb;">Bienvenue {username} !</h2>
            <p>Votre compte a été créé avec succès sur le <strong>Tableau de Bord Financier</strong>.</p>
            <p>Vous pouvez dès à présent :</p>
            <ul>
                <li>Importer vos relevés bancaires</li>
                <li>Visualiser vos dépenses et revenus</li>
                <li>Obtenir des prévisions financières</li>
            </ul>
            <p style="margin-top: 20px;">
                <a href="http://localhost:5173/login" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Accéder à mon compte</a>
            </p>
            <p style="font-size: 12px; color: #666; margin-top: 30px;">Ceci est un message automatique, merci de ne pas y répondre.</p>
        </div>
        """

        mail.send(msg)
        print(f"Welcome email sent to {user_email}")
        
    except Exception as e:
        print(f"Failed to send email: {str(e)}")
