from flask import Blueprint, request, jsonify
from app.services.company_service import CompanyService, CompanyServiceError
from app.models.company import Company # Para type hint si es necesario

company_bp = Blueprint('company_bp', __name__, url_prefix='/api/companies')

@company_bp.route('/', methods=['POST'])
def create_company():
    """Crea una nueva empresa y su prompt por defecto."""
    data = request.get_json()
    if not data or 'name' not in data:
        return jsonify({"error": "El campo 'name' es requerido"}), 400

    name = data['name']
    if not isinstance(name, str) or not name.strip():
         return jsonify({"error": "El campo 'name' debe ser una cadena no vacía"}), 400

    try:
        company = CompanyService.create_company_with_default_prompt(name.strip())
        return jsonify(company.to_dict()), 201
    except ValueError as ve:
        # Error específico: la empresa ya existe
        return jsonify({"error": str(ve)}), 409 # 409 Conflict
    except CompanyServiceError as cse:
        # Error durante la lógica del servicio (ej: no se encuentra layout)
        return jsonify({"error": f"Error del servicio: {cse}"}), 500
    except Exception as e:
        # Otros errores inesperados
        print(f"Error inesperado en POST /companies: {e}") # Loggear error
        return jsonify({"error": "Ocurrió un error interno al crear la empresa"}), 500

@company_bp.route('/', methods=['GET'])
def list_companies():
    """Lista todas las empresas."""
    try:
        companies = CompanyService.list_companies()
        return jsonify([company.to_dict() for company in companies]), 200
    except Exception as e:
        print(f"Error inesperado en GET /companies: {e}")
        return jsonify({"error": "Ocurrió un error interno al listar las empresas"}), 500

@company_bp.route('/<int:company_id>', methods=['GET'])
def get_company(company_id):
    """Obtiene los detalles de una empresa específica."""
    try:
        company = CompanyService.get_company_by_id(company_id)
        if company:
            return jsonify(company.to_dict()), 200
        else:
            return jsonify({"error": "Empresa no encontrada"}), 404
    except Exception as e:
        print(f"Error inesperado en GET /companies/{company_id}: {e}")
        return jsonify({"error": "Ocurrió un error interno al obtener la empresa"}), 500

# --- Endpoints adicionales para gestionar prompts (POST /<id>/prompts, etc.) pueden ir aquí --- 