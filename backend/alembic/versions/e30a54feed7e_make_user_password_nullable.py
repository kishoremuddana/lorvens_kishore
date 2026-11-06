"""make user password nullable"""

from alembic import op
import sqlalchemy as sa


revision = "YOUR_GENERATED_REVISION_ID"
down_revision = "af1bb906deec"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "users",
        "hashed_password",
        existing_type=sa.String(length=255),
        nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "users",
        "hashed_password",
        existing_type=sa.String(length=255),
        nullable=False,
    )