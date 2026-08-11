"""Initial database schema migration

Revision ID: 001_initial
Revises: 
Create Date: 2026-08-10 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '001_initial'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.create_table(
        'supervisors',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('base_instruction', sa.Text(), nullable=False),
        sa.Column('available_actions', sa.JSON(), nullable=False),
        sa.Column('wake_policy', sa.JSON(), nullable=False),
        sa.Column('model_config', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    op.create_index(op.f('ix_supervisors_name'), 'supervisors', ['name'], unique=True)

    op.create_table(
        'runs',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('order_id', sa.String(length=255), nullable=False),
        sa.Column('supervisor_id', sa.String(), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('order_context', sa.JSON(), nullable=False),
        sa.Column('memory_summary', sa.Text(), nullable=False),
        sa.Column('next_wake_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('final_summary', sa.Text(), nullable=True),
        sa.Column('learnings', sa.JSON(), nullable=True),
        sa.Column('recommendations', sa.JSON(), nullable=True),
        sa.ForeignKeyConstraint(['supervisor_id'], ['supervisors.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_runs_order_id'), 'runs', ['order_id'], unique=False)
    op.create_index(op.f('ix_runs_status'), 'runs', ['status'], unique=False)

    op.create_table(
        'activities',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('run_id', sa.String(), nullable=False),
        sa.Column('event_id', sa.String(length=255), nullable=True),
        sa.Column('type', sa.String(length=100), nullable=False),
        sa.Column('action', sa.String(length=100), nullable=True),
        sa.Column('payload', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['run_id'], ['runs.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_activities_created_at'), 'activities', ['created_at'], unique=False)
    op.create_index(op.f('ix_activities_event_id'), 'activities', ['event_id'], unique=False)
    op.create_index(op.f('ix_activities_run_id'), 'activities', ['run_id'], unique=False)

def downgrade() -> None:
    op.drop_index(op.f('ix_activities_run_id'), table_name='activities')
    op.drop_index(op.f('ix_activities_event_id'), table_name='activities')
    op.drop_index(op.f('ix_activities_created_at'), table_name='activities')
    op.drop_table('activities')
    op.drop_index(op.f('ix_runs_status'), table_name='runs')
    op.drop_index(op.f('ix_runs_order_id'), table_name='runs')
    op.drop_table('runs')
    op.drop_index(op.f('ix_supervisors_name'), table_name='supervisors')
    op.drop_table('supervisors')
