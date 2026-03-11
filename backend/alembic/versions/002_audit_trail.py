"""Add audit trail and audit_log table

Revision ID: 002
Revises: 001
Create Date: 2026-03-11 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add audit columns to user table
    op.add_column("user", sa.Column("created_by", sa.String(), nullable=True))
    op.add_column("user", sa.Column("updated_by", sa.String(), nullable=True))
    op.create_foreign_key("fk_user_created_by", "user", "user", ["created_by"], ["id"])
    op.create_foreign_key("fk_user_updated_by", "user", "user", ["updated_by"], ["id"])

    # Create append-only audit_log table
    op.create_table(
        "audit_log",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("table_name", sa.String(), nullable=False),
        sa.Column("record_id", sa.String(), nullable=False),
        sa.Column("action", sa.String(), nullable=False),
        sa.Column("old_data", sa.Text(), nullable=True),
        sa.Column("new_data", sa.Text(), nullable=True),
        sa.Column("actor_id", sa.String(), nullable=True),
        sa.Column("timestamp", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["actor_id"], ["user.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_audit_log_table_name", "audit_log", ["table_name"])
    op.create_index("ix_audit_log_record_id", "audit_log", ["record_id"])
    op.create_index("ix_audit_log_timestamp", "audit_log", ["timestamp"])
    op.create_index("ix_audit_log_actor_id", "audit_log", ["actor_id"])


def downgrade() -> None:
    op.drop_index("ix_audit_log_actor_id", table_name="audit_log")
    op.drop_index("ix_audit_log_timestamp", table_name="audit_log")
    op.drop_index("ix_audit_log_record_id", table_name="audit_log")
    op.drop_index("ix_audit_log_table_name", table_name="audit_log")
    op.drop_table("audit_log")
    op.drop_constraint("fk_user_updated_by", "user", type_="foreignkey")
    op.drop_constraint("fk_user_created_by", "user", type_="foreignkey")
    op.drop_column("user", "updated_by")
    op.drop_column("user", "created_by")
