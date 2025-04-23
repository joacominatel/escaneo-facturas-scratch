from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

cors = CORS()
db = SQLAlchemy()
migrate = Migrate()

def init_extensions(app):
    cors.init_app(app, origins=["*"])
    db.init_app(app)
    migrate.init_app(app, db)
