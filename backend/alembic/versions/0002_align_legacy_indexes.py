"""align legacy indexes with the models

Databases created before Alembic was used got their users / nutrition_goals
indexes from migration_users.py, under different names than the models declare.
Every statement is idempotent, so this is a no-op on a database built from 0001.

Revision ID: 0002
Revises: 0001
Create Date: 2026-10-22

"""
from typing import Sequence, Union

from alembic import op

revision: str = '0002'
down_revision: Union[str, None] = '0001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # users: unique constraints + plain indexes -> unique indexes named as in the model
    op.execute("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key")
    op.execute("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_username_key")
    op.execute("DROP INDEX IF EXISTS ix_users_email")
    op.execute("DROP INDEX IF EXISTS ix_users_username")
    op.execute("CREATE UNIQUE INDEX ix_users_email ON users (email)")
    op.execute("CREATE UNIQUE INDEX ix_users_username ON users (username)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_users_id ON users (id)")

    # nutrition_goals: one goal row per user
    op.execute("DROP INDEX IF EXISTS uq_nutrition_goals_user_id")
    op.execute("CREATE UNIQUE INDEX IF NOT EXISTS ix_nutrition_goals_user_id ON nutrition_goals (user_id)")


def downgrade() -> None:
    pass
