from datetime import datetime
from app.core.extensions import db
from sqlalchemy.dialects.mysql import JSON

class Invoice(db.Model):
    __tablename__ = 'invoices'

    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    status = db.Column(db.String(50), nullable=False, default='pending')
    preview_data = db.Column(db.JSON, nullable=True)
    final_data = db.Column(db.JSON, nullable=True)
    agent_response = db.Column(db.Text, nullable=True)
    file_path = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "filename": self.filename,
            "status": self.status,
            "preview_data": self.preview_data,
            "final_data": self.final_data,
            "agent_response": self.agent_response,
            "file_path": self.file_path,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }
