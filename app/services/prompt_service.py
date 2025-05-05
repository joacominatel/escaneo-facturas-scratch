import os
import shutil
from app.core.extensions import db
from app.models.company import Company
from app.models.company_prompt import CompanyPrompt
from sqlalchemy.orm import joinedload
from sqlalchemy import func # Importar func para db.func.max
import logging # Usar logging para mejor registro de errores

# Configurar un logger básico si no tienes uno global
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

COMPANY_PROMPTS_DIR = "app/prompts/companies"

class PromptServiceError(Exception):
    """Custom exception for prompt service errors."""
    pass

class PromptService:

    @staticmethod
    def _get_next_version_info(company_id: int) -> tuple[int, str]:
        """Determina la siguiente versión y la ruta del nuevo archivo de prompt
           consultando la versión máxima existente en la base de datos."""
        company_prompt_dir = os.path.join(COMPANY_PROMPTS_DIR, str(company_id))
        os.makedirs(company_prompt_dir, exist_ok=True) # Asegurar que el directorio exista

        # Buscar versión máxima existente en la DB para esta compañía
        # Usamos with_for_update para bloquear la tabla o filas relevantes si es necesario
        # aunque con max() sobre una columna indexada suele ser rápido.
        # Considerar el nivel de aislamiento de la transacción.
        max_version_obj = db.session.query(func.max(CompanyPrompt.version)) \
                                    .filter(CompanyPrompt.company_id == company_id).scalar()
        max_version = max_version_obj if max_version_obj is not None else 0
        next_version = max_version + 1
            
        new_filename = f"prompt_v{next_version}.txt"
        new_prompt_path = os.path.join(company_prompt_dir, new_filename)
        # Devolver ruta relativa al workspace para consistencia si es necesario,
        # o mantenerla absoluta/relativa al CWD según la configuración.
        # Asumimos que la ruta guardada debe ser la que se usa para abrir/leer.
        return next_version, new_prompt_path

    @staticmethod
    def update_company_prompt(company_id: int, new_prompt_content: str) -> CompanyPrompt:
        """
        Actualiza el prompt de una empresa creando una nueva versión.
        Utiliza una lógica simplificada y robusta para determinar la versión.
        
        Args:
            company_id: ID de la empresa cuyo prompt se actualizará.
            new_prompt_content: El nuevo contenido para el prompt.

        Returns:
            La nueva instancia de CompanyPrompt creada.

        Raises:
            PromptServiceError: Si la empresa no existe o si ocurre un error.
            ValueError: Si el contenido del prompt está vacío.
        """
        if not new_prompt_content or not new_prompt_content.strip():
            raise ValueError("El contenido del nuevo prompt no puede estar vacío.")

        session = db.session
        company = session.query(Company).get(company_id)
        if not company:
            raise PromptServiceError(f"Empresa con ID {company_id} no encontrada.")

        # Determinar nueva versión y ruta ANTES de la transacción principal
        # para evitar cálculos dentro de la lógica transaccional si es posible.
        try:
             next_version, new_prompt_path = PromptService._get_next_version_info(company_id)
        except Exception as e:
             logger.error(f"Error al determinar la siguiente versión para empresa {company_id}: {e}", exc_info=True)
             raise PromptServiceError(f"No se pudo determinar la siguiente versión del prompt: {e}") from e

        new_prompt_file_created = False
        try:
            # Escribir el nuevo contenido en el archivo ANTES de la transacción de DB
            # Si esto falla, no afectamos la DB.
            os.makedirs(os.path.dirname(new_prompt_path), exist_ok=True)
            with open(new_prompt_path, 'w', encoding='utf-8') as f:
                f.write(new_prompt_content)
            new_prompt_file_created = True
            logger.info(f"Nuevo archivo de prompt creado: {new_prompt_path}")

            # Iniciar transacción de base de datos
            # Usamos un bloque try/except anidado para el commit específico
            try:
                 # Obtener y desactivar el prompt por defecto actual (si existe) DENTRO de la transacción
                 current_default_prompt = session.query(CompanyPrompt) \
                                                 .filter(CompanyPrompt.company_id == company_id, CompanyPrompt.is_default == True) \
                                                 .with_for_update() \
                                                 .first() # Bloquear fila para evitar race conditions

                 if current_default_prompt:
                     current_default_prompt.is_default = False
                     session.add(current_default_prompt)
                     logger.info(f"Prompt anterior (ID: {current_default_prompt.id}, v{current_default_prompt.version}) marcado como no default.")

                 # Crear el nuevo registro de prompt
                 new_prompt = CompanyPrompt(
                     company_id=company_id,
                     version=next_version,
                     prompt_path=new_prompt_path, # Guardar la ruta tal cual se usó para escribir
                     is_default=True
                 )
                 session.add(new_prompt)
                 session.flush() # Para obtener el ID del nuevo prompt si es necesario
                 new_prompt_id = new_prompt.id # Guardar ID para logging

                 # Commit de los cambios en la base de datos
                 session.commit()
                 logger.info(f"Nuevo prompt (ID: {new_prompt_id}, v{next_version}) guardado como default para empresa {company_id}.")
                 
                 return new_prompt
            
            except Exception as db_exc:
                 session.rollback() # Revertir cambios en DB si el commit falla
                 logger.error(f"Error durante la transacción de DB al actualizar prompt para empresa {company_id}: {db_exc}", exc_info=True)
                 # Lanzar un error específico para la falla de DB
                 raise PromptServiceError(f"Error de base de datos al actualizar prompt: {db_exc}") from db_exc

        except Exception as e:
            # Captura errores fuera de la transacción de DB (ej. escritura de archivo, cálculo de versión)
            # O errores relanzados desde el bloque de transacción
            logger.error(f"Error general al actualizar prompt para empresa {company_id}: {e}", exc_info=True)
            
            # Intentar borrar el archivo nuevo si se creó y la operación general falló
            if new_prompt_file_created and os.path.exists(new_prompt_path):
                try:
                    os.remove(new_prompt_path)
                    logger.warning(f"Archivo de prompt fallido {new_prompt_path} eliminado debido a error.")
                except OSError as rm_err:
                    logger.error(f"Error al eliminar archivo de prompt fallido {new_prompt_path}: {rm_err}")
            
            # Re-lanzar como error específico del servicio si no lo es ya
            if isinstance(e, (ValueError, PromptServiceError)):
                 raise e
            else:
                 raise PromptServiceError(f"Error inesperado al actualizar prompt: {e}") from e
        # finally: # El finally no es estrictamente necesario aquí si no hay recursos que cerrar siempre
        #     pass
