"""
Safe database migration script:
1. Creates users table if missing.
2. Creates the initial Super Admin account (Nithin-Kiran / Nithin@987).
3. Adds user_id columns to diary_entries, nutrition_goals, and custom_meals.
4. Migrates all existing records to the Super Admin account without data loss.
"""
import os
import sys
from sqlalchemy import text

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.database import engine, SessionLocal, Base
from app.models.user import User
from app.models.goal import NutritionGoal
from app.services.security import hash_password

ADMIN_USERNAME = "Nithin-Kiran"
ADMIN_PASSWORD = "Nithin@987"
ADMIN_FULL_NAME = "Nithin Kiran"
ADMIN_EMAIL = "nithin.kiran@calori.app"


def run_migration():
    print("Beginning migration for multi-user authentication...")
    
    with engine.begin() as conn:
        # 1. Ensure users table exists
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                full_name VARCHAR(100) NOT NULL,
                hashed_password VARCHAR(255) NOT NULL,
                role VARCHAR(20) NOT NULL DEFAULT 'member',
                is_active BOOLEAN NOT NULL DEFAULT TRUE,
                must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
                admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                calorie_target DOUBLE PRECISION NOT NULL DEFAULT 2000.0,
                created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
                last_login_at TIMESTAMP WITHOUT TIME ZONE
            );
            CREATE INDEX IF NOT EXISTS ix_users_username ON users (username);
            CREATE INDEX IF NOT EXISTS ix_users_email ON users (email);
        """))
        print("✓ Users table verified.")

    db = SessionLocal()
    try:
        # 2. Find or create Super Admin
        admin = db.query(User).filter(User.username == ADMIN_USERNAME).first()
        if not admin:
            admin = User(
                username=ADMIN_USERNAME,
                email=ADMIN_EMAIL,
                full_name=ADMIN_FULL_NAME,
                hashed_password=hash_password(ADMIN_PASSWORD),
                role="admin",
                is_active=True,
                must_change_password=False,
                calorie_target=2700.0
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
            print(f"✓ Created Super Admin account: {ADMIN_USERNAME} (ID: {admin.id})")
        else:
            print(f"✓ Found existing Super Admin account: {admin.username} (ID: {admin.id})")

        admin_id = admin.id

        # 3. Add user_id to diary_entries
        with engine.begin() as conn:
            conn.execute(text("""
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name='diary_entries' AND column_name='user_id'
                    ) THEN
                        ALTER TABLE diary_entries ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
                        CREATE INDEX IF NOT EXISTS ix_diary_entries_user_id ON diary_entries (user_id);
                    END IF;
                END $$;
            """))
            conn.execute(text(f"UPDATE diary_entries SET user_id = {admin_id} WHERE user_id IS NULL;"))
            print("✓ diary_entries updated with user_id.")

        # 4. Add user_id to nutrition_goals
        with engine.begin() as conn:
            conn.execute(text("""
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name='nutrition_goals' AND column_name='user_id'
                    ) THEN
                        ALTER TABLE nutrition_goals ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
                        CREATE UNIQUE INDEX IF NOT EXISTS uq_nutrition_goals_user_id ON nutrition_goals (user_id);
                    END IF;
                END $$;
            """))
            conn.execute(text(f"UPDATE nutrition_goals SET user_id = {admin_id} WHERE user_id IS NULL;"))
            print("✓ nutrition_goals updated with user_id.")

        # Ensure Admin has a goal record
        goal = db.query(NutritionGoal).filter(NutritionGoal.user_id == admin_id).first()
        if not goal:
            goal = NutritionGoal(user_id=admin_id, calories=2700.0, protein=110.0, carbohydrates=260.0, fat=70.0, fiber=35.0)
            db.add(goal)
            db.commit()
            print("✓ Created nutrition goal for Admin.")

        # 5. Add user_id to custom_meals
        with engine.begin() as conn:
            conn.execute(text("""
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name='custom_meals' AND column_name='user_id'
                    ) THEN
                        ALTER TABLE custom_meals ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
                        CREATE INDEX IF NOT EXISTS ix_custom_meals_user_id ON custom_meals (user_id);
                    END IF;
                END $$;
            """))
            conn.execute(text(f"UPDATE custom_meals SET user_id = {admin_id} WHERE user_id IS NULL;"))
            print("✓ custom_meals updated with user_id.")

        print("🎉 MIGRATION COMPLETED SUCCESSFULLY. All existing data is safe and assigned to Super Admin.")

    finally:
        db.close()


if __name__ == "__main__":
    run_migration()
