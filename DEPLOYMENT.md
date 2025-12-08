# Guide de Déploiement

Ce guide explique comment déployer le Tableau de Bord Financier sur **Render** (Backend) et **Vercel** (Frontend).

## Prérequis
- Un compte GitHub.
- Des comptes sur [Render](https://render.com) et [Vercel](https://vercel.com).
- Le projet poussé sur un dépôt GitHub.

---

## Partie 1 : Déployer le Backend (Render)

1.  **Créer un nouveau Web Service** :
    - Allez sur votre tableau de bord Render.
    - Cliquez sur **New +** -> **Web Service**.
    - Connectez votre dépôt GitHub.

2.  **Configurer le Service** :
    - **Name** : `financial-dashboard-backend` (ou similaire)
    - **Root Directory** : `backend`
    - **Runtime** : `Python 3`
    - **Build Command** : `pip install -r requirements.txt`
    - **Start Command** : `gunicorn app:app`

3.  **Variables d'Environnement** :
    - Ajoutez les variables suivantes dans l'onglet "Environment" :
        - `PYTHON_VERSION` : `3.9.0` (ou votre version locale)
        - `DATABASE_URL` : (Render fournit une DB Postgres interne, ou vous pouvez utiliser le fichier SQLite si vous persistez le disque, mais Postgres est recommandé pour la prod. Pour l'instant, vous pouvez rester sur SQLite mais notez que les données seront perdues à chaque redéploiement sauf si vous utilisez un Disque. **Meilleure option** : Créez une base de données **PostgreSQL** sur Render et collez l'`Internal Connection URL` ici).
        - `JWT_SECRET_KEY` : `votre-super-secret-key`
        - `STRIPE_SECRET_KEY` : `sk_test_...`
        - `STRIPE_PUBLISHABLE_KEY` : `pk_test_...`
        - `STRIPE_WEBHOOK_SECRET` : `whsec_...`
        - `STRIPE_PRICE_ID` : `price_...`
        - `MAIL_USERNAME` : `...`
        - `MAIL_PASSWORD` : `...`

4.  **Déployer** :
    - Cliquez sur **Create Web Service**.
    - Attendez que le déploiement se termine.
    - **Copiez l'URL du Backend** (ex: `https://financial-dashboard-backend.onrender.com`).

---

## Partie 2 : Déployer le Frontend (Vercel)

1.  **Importer le Projet** :
    - Allez sur votre tableau de bord Vercel.
    - Cliquez sur **Add New ...** -> **Project**.
    - Importez le même dépôt GitHub.

2.  **Configurer le Projet** :
    - **Framework Preset** : `Vite`
    - **Root Directory** : `frontend` (Cliquez sur "Edit" à côté de Root Directory et sélectionnez `frontend`).

3.  **Variables d'Environnement** :
    - Ajoutez la variable suivante :
        - `VITE_API_URL` : Collez l'**URL du Backend** de la Partie 1 (ex: `https://financial-dashboard-backend.onrender.com/api`). **Important** : Ajoutez `/api` à la fin car vos routes backend sont préfixées par `/api`.

4.  **Déployer** :
    - Cliquez sur **Deploy**.
    - Attendez que la construction (build) se termine.

---

## Partie 3 : Configuration Finale

1.  **Webhook Stripe** :
    - Allez sur votre tableau de bord Stripe -> Développeurs -> Webhooks.
    - Ajoutez un endpoint : `https://<VOTRE-URL-BACKEND>/api/payment/webhook`.
    - Sélectionnez les événements : `checkout.session.completed`, `invoice.payment_succeeded`.

2.  **CORS (Optionnel)** :
    - Si vous rencontrez des problèmes CORS, vous devrez peut-être mettre à jour la configuration `CORS` dans `backend/app.py` pour autoriser explicitement votre domaine Vercel au lieu de `*`.

## Vérification
- Ouvrez votre URL Vercel.
- Essayez de vous inscrire/connecter.
- Essayez d'uploader un fichier.
