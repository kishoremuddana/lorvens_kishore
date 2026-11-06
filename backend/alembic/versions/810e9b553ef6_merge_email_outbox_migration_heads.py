"""merge email outbox migration heads

Revision ID: 810e9b553ef6
Revises: 6332360dc99b, YOUR_GENERATED_REVISION_ID
Create Date: 2026-11-04 14:11:00.892088

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '810e9b553ef6'
down_revision: Union[str, Sequence[str], None] = ('6332360dc99b', 'YOUR_GENERATED_REVISION_ID')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
