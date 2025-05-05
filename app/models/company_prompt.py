from datetime import datetime
from app.core.extensions import db

class CompanyPrompt(db.Model):
    __tablename__ = 'company_prompts'

    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False)
    version = db.Column(db.Integer, nullable=False, default=1)
    prompt_path = db.Column(db.String(500), nullable=False)
    is_default = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "company_id": self.company_id,
            "version": self.version,
            "prompt_path": self.prompt_path,
            "is_default": self.is_default,
            "created_at": self.created_at.isoformat() if self.created_at else None
        } 