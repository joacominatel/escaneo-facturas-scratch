from flask import Blueprint, request, jsonify
from app.services.company_service import CompanyService, CompanyServiceError
from app.models.company import Company # Para type hint si es necesario
from app.services.prompt_service import PromptService, PromptServiceError
import logging

logger = logging.getLogger(__name__)
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

@company_bp.route('/<int:company_id>/prompt', methods=['PUT'])
def update_company_prompt_route(company_id):
    """
    Actualiza el prompt por defecto de una empresa creando una nueva versión.
    Espera un JSON con la clave 'prompt_content'.
    """
    data = request.get_json()
    if not data or 'prompt_content' not in data:
        return jsonify({"error": "El campo 'prompt_content' es requerido en el JSON"}), 400

    new_content = data['prompt_content']

    try:
        # Llamar al servicio para actualizar el prompt
        new_prompt = PromptService.update_company_prompt(company_id, new_content)
        # Devolver los detalles del nuevo prompt creado
        return jsonify(new_prompt.to_dict()), 200
    except ValueError as ve:
        # Error de validación (ej: contenido vacío)
        return jsonify({"error": str(ve)}), 400
    except PromptServiceError as pse:
        # Error específico del servicio (ej: empresa no encontrada, error de DB/archivo)
        # Podríamos mapear códigos de error específicos si el servicio los proporcionara
        if "no encontrada" in str(pse):
             return jsonify({"error": str(pse)}), 404 # Not Found
        else:
             # Otros errores del servicio (considerar 500 Internal Server Error o 409 Conflict si aplica)
             return jsonify({"error": f"Error del servicio de prompts: {pse}"}), 500
    except Exception as e:
        # Otros errores inesperados
        logger.error(f"Error inesperado en PUT /companies/{company_id}/prompt: {e}", exc_info=True)
        return jsonify({"error": "Ocurrió un error interno al actualizar el prompt"}), 500
    
@company_bp.route('/<int:company_id>/prompts', methods=['GET'])
def list_company_prompts(company_id):
    """Lista todos los prompts de una empresa."""
    try:
        prompts = CompanyService.list_company_prompts(company_id)
        return jsonify([prompt.to_dict() for prompt in prompts]), 200
    except Exception as e:
        print(f"Error inesperado en GET /companies/{company_id}/prompts: {e}")
        return jsonify({"error": "Ocurrió un error interno al listar los prompts"}), 500
    
@company_bp.route('/<int:company_id>/prompts/<int:prompt_id>/content', methods=['GET'])
def get_prompt_content(company_id, prompt_id):
    """Obtiene el contenido de un prompt específico de una empresa."""
    try:
        content = CompanyService.get_prompt_content(company_id, prompt_id)
        return jsonify({"content": content}), 200
    except Exception as e:
        print(f"Error inesperado en GET /companies/{company_id}/prompts/{prompt_id}/content: {e}")
        return jsonify({"error": "Ocurrió un error interno al obtener el contenido del prompt"}), 500
