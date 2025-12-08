import sqlite3
import os

DB_PATH = os.path.join(os.getcwd(), 'backend', 'instance', 'financial_dashboard.db')

def migrate_db():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at: {DB_PATH}")
        return

    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        print(f"--- Migrating database {DB_PATH} ---")
        
        # Check existing columns
        cursor.execute("PRAGMA table_info(users)")
        columns = [info[1] for info in cursor.fetchall()]
        
        # Add subscription_status if not exists
        if 'subscription_status' not in columns:
            print("Adding column: subscription_status")
            cursor.execute("ALTER TABLE users ADD COLUMN subscription_status TEXT DEFAULT 'free'")
        else:
            print("Column 'subscription_status' already exists.")

        # Add stripe_customer_id if not exists
        if 'stripe_customer_id' not in columns:
            print("Adding column: stripe_customer_id")
            cursor.execute("ALTER TABLE users ADD COLUMN stripe_customer_id TEXT")
        else:
            print("Column 'stripe_customer_id' already exists.")

        # Add stripe_subscription_id if not exists
        if 'stripe_subscription_id' not in columns:
            print("Adding column: stripe_subscription_id")
            cursor.execute("ALTER TABLE users ADD COLUMN stripe_subscription_id TEXT")
        else:
            print("Column 'stripe_subscription_id' already exists.")

        conn.commit()
        print("Migration completed successfully.")
        conn.close()
        
    except sqlite3.Error as e:
        print(f"SQLite error: {e}")

if __name__ == "__main__":
    migrate_db()
