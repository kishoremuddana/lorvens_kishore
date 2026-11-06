
"""add welcome email tracking

Revision ID: af1bb906deec
Revises: c8f204a9cd52
"""

from alembic import op
import sqlalchemy as sa


revision = "af1bb906deec"
down_revision = "c8f204a9cd52"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "membership_payments",
        sa.Column(
            "welcome_email_sent",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )

    # Remove the database default after existing rows are populated.
    op.alter_column(
        "membership_payments",
        "welcome_email_sent",
        server_default=None,
    )


def downgrade() -> None:
    op.drop_column(
        "membership_payments",
        "welcome_email_sent",
    )
