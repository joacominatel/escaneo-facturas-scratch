from datetime import datetime
from app.core.extensions import db

class Company(db.Model):
    __tablename__ = 'companies'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    # prompt_path = db.Column(db.String(500), nullable=True) # Campo mencionado en new_workflow.md linea 4, pero no en la seccion "Tabla companies". Lo comentamos por ahora.
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relación con CompanyPrompt
    prompts = db.relationship('CompanyPrompt', backref='company', lazy=True, cascade="all, delete-orphan")
    # Relación con Invoice
    invoices = db.relationship('Invoice', backref='company', lazy=True)


    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            # "prompt_path": self.prompt_path,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        } 