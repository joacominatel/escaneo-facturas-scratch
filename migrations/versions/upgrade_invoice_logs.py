"""Actualizar tabla de logs

Revision ID: upgrade_invoice_logs
Revises: 
Create Date: 2025-05-05 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'upgrade_invoice_logs'
down_revision = None  # Reemplazar con la revisión anterior real
branch_labels = None
depends_on = None


def upgrade():
    # Agregar nuevas columnas
    op.add_column('invoice_logs', sa.Column('level', sa.String(20), nullable=False, server_default='info'))
    op.add_column('invoice_logs', sa.Column('category', sa.String(50), nullable=False, server_default='process'))
    op.add_column('invoice_logs', sa.Column('origin', sa.String(100), nullable=True))
    op.add_column('invoice_logs', sa.Column('extra_data', sa.Text(), nullable=True))
    op.add_column('invoice_logs', sa.Column('ip_address', sa.String(45), nullable=True))
    
    # Crear índices para mejorar rendimiento en consultas comunes
    op.create_index(op.f('ix_invoice_logs_level'), 'invoice_logs', ['level'], unique=False)
    op.create_index(op.f('ix_invoice_logs_category'), 'invoice_logs', ['category'], unique=False)
    op.create_index(op.f('ix_invoice_logs_created_at'), 'invoice_logs', ['created_at'], unique=False)


def downgrade():
    # Eliminar índices
    op.drop_index(op.f('ix_invoice_logs_created_at'), table_name='invoice_logs')
    op.drop_index(op.f('ix_invoice_logs_category'), table_name='invoice_logs')
    op.drop_index(op.f('ix_invoice_logs_level'), table_name='invoice_logs')
    
    # Eliminar columnas
    op.drop_column('invoice_logs', 'ip_address')
    op.drop_column('invoice_logs', 'extra_data')
    op.drop_column('invoice_logs', 'origin')
    op.drop_column('invoice_logs', 'category')
    op.drop_column('invoice_logs', 'level') 