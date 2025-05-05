import os
import shutil
from app.core.extensions import db
from app.models.company import Company
from app.models.company_prompt import CompanyPrompt
from app.services.log_service import LogService, LogLevel, LogCategory

# Constantes para rutas de prompts
BASE_PROMPT_LAYOUT = "app/prompts/prompt_layout.txt"
COMPANY_PROMPTS_DIR = "app/prompts/companies"

class CompanyServiceError(Exception):
    """Custom exception for company service errors."""
    pass

class CompanyService:
    @staticmethod
    def create_company_with_default_prompt(name: str) -> Company:
        """
        Crea una nueva empresa y configura su primer prompt por defecto.
        1. Crea la entrada en la tabla companies.
        2. Crea el directorio para los prompts de la empresa.
        3. Copia el prompt layout base al directorio de la empresa.
        4. Crea la entrada en company_prompts referenciando el nuevo archivo.
        5. Guarda la ruta del prompt en el registro de company_prompts.

        Args:
            name: Nombre de la nueva empresa.

        Returns:
            La instancia de Company creada.

        Raises:
            CompanyServiceError: Si ocurre un error durante el proceso.
            ValueError: Si el nombre de la empresa ya existe.
        """
        # Verificar si la empresa ya existe
        existing_company = Company.query.filter_by(name=name).first()
        if existing_company:
            raise ValueError(f"La empresa '{name}' ya existe.")

        session = db.session
        company = None # Inicializar company fuera del try para el finally
        LogService.info(None, "create_company_attempt", f"Intentando crear empresa: {name}", LogCategory.SYSTEM)

        try:
            # 1. Crear la empresa
            company = Company(name=name)
            session.add(company)
            session.flush() # Para obtener el ID de la empresa antes del commit

            company_id = company.id
            company_prompt_dir = os.path.join(COMPANY_PROMPTS_DIR, str(company_id))
            default_prompt_filename = "prompt_v1.txt"
            new_prompt_path = os.path.join(company_prompt_dir, default_prompt_filename)

            # 2. Crear directorio (si no existe)
            os.makedirs(company_prompt_dir, exist_ok=True)

            # 3. Copiar el layout base
            if not os.path.exists(BASE_PROMPT_LAYOUT):
                raise CompanyServiceError(f"El archivo layout base no existe en {BASE_PROMPT_LAYOUT}")
            shutil.copy2(BASE_PROMPT_LAYOUT, new_prompt_path) # copy2 preserva metadatos

            # 4 & 5. Crear el registro del prompt
            company_prompt = CompanyPrompt(
                company_id=company_id,
                version=1,
                prompt_path=new_prompt_path, # Guardar ruta relativa o absoluta según necesidad
                is_default=True
            )
            session.add(company_prompt)

            # Commit de todas las operaciones
            session.commit()
            
            log_details = f"Empresa '{name}' (ID: {company_id}) creada exitosamente."
            log_extra = {"company_id": company_id, "prompt_path": new_prompt_path}
            LogService.info(None, "company_created", log_details, LogCategory.SYSTEM, extra=log_extra)
            print(f"Empresa '{name}' (ID: {company_id}) creada exitosamente con prompt por defecto en '{new_prompt_path}'")
            return company

        except ValueError as e:
            session.rollback()
            error_msg = f"Error al crear empresa '{name}': {str(e)}"
            LogService.error(None, "create_company_failed", error_msg, LogCategory.SYSTEM, extra={"company_name": name})
            print(error_msg)
            raise e # Re-lanzar la excepción original
        except CompanyServiceError as e:
            session.rollback()
            error_msg = f"Error (CompanyService) al crear empresa '{name}': {str(e)}"
            LogService.error(None, "create_company_failed", error_msg, LogCategory.SYSTEM, extra={"company_name": name})
            print(error_msg)
            # Limpieza del directorio si aplica
            if company and company.id and os.path.exists(os.path.join(COMPANY_PROMPTS_DIR, str(company.id))):
                try:
                    shutil.rmtree(os.path.join(COMPANY_PROMPTS_DIR, str(company.id)))
                    LogService.info(None, "create_company_cleanup", f"Directorio de prompts limpiado para {company.id}", LogCategory.SYSTEM)
                except OSError as rm_err:
                    LogService.error(None, "create_company_cleanup_failed", f"Error limpiando directorio {company.id}: {rm_err}", LogCategory.SYSTEM)
            raise e
        except Exception as e:
            session.rollback()
            error_msg = f"Error inesperado al crear la empresa '{name}': {str(e)}"
            LogService.critical(None, "create_company_unexpected_error", error_msg, LogCategory.SYSTEM, extra={"company_name": name}, exc_info=True)
            print(error_msg)
            # Limpieza adicional si es necesario (ej: borrar directorio si se creó)
            if company and company.id and os.path.exists(os.path.join(COMPANY_PROMPTS_DIR, str(company.id))):
                 # Intentar borrar el directorio si la transacción falló después de crearlo
                 try:
                     shutil.rmtree(os.path.join(COMPANY_PROMPTS_DIR, str(company.id)))
                 except OSError as rm_err:
                     print(f"Error al limpiar directorio de prompts para compañía fallida {company.id}: {rm_err}")
            
            # Re-lanzar como error específico del servicio o mantener la excepción original
            if isinstance(e, (ValueError, CompanyServiceError)):
                 raise e
            else:
                 raise CompanyServiceError(f"Error inesperado al crear empresa: {e}") from e
        finally:
            # session.close() # No cerramos aquí si usamos scoped_session o el patrón de Flask
            pass

    @staticmethod
    def get_default_prompt_path(company_id: int) -> str | None:
        """
        Obtiene la ruta del prompt por defecto para una empresa dada.

        Args:
            company_id: ID de la empresa.

        Returns:
            La ruta del archivo del prompt por defecto, o None si no se encuentra.
        """
        LogService.debug(None, "get_default_prompt_path_request", f"Buscando prompt por defecto para empresa {company_id}", LogCategory.SYSTEM)
        prompt = CompanyPrompt.query.filter_by(company_id=company_id, is_default=True).first()
        if prompt:
            LogService.debug(None, "get_default_prompt_path_found", f"Prompt por defecto encontrado: {prompt.prompt_path}", LogCategory.SYSTEM, extra={"company_id": company_id, "prompt_path": prompt.prompt_path})
        else:
            LogService.debug(None, "get_default_prompt_path_not_found", f"No se encontró prompt por defecto para empresa {company_id}", LogCategory.SYSTEM, extra={"company_id": company_id})
        return prompt.prompt_path if prompt else None

    # --- Métodos adicionales (ej: listar empresas, obtener empresa por id, etc.) ---
    @staticmethod
    def list_companies():
        return Company.query.all()

    @staticmethod
    def get_company_by_id(company_id: int):
        return Company.query.get(company_id) 
    
    @staticmethod
    def list_company_prompts(company_id: int):
        return CompanyPrompt.query.filter_by(company_id=company_id).all()
    
    @staticmethod
    def get_prompt_content(company_id: int, prompt_id: int):
        prompt_path = CompanyPrompt.query.filter_by(company_id=company_id, id=prompt_id).first().prompt_path
        if not prompt_path:
            raise ValueError(f"No se encontró un prompt para la empresa {company_id} con ID {prompt_id}")
        with open(prompt_path, 'r') as file:
            content = file.read()
            LogService.debug(None, "get_prompt_content_success", f"Contenido de prompt leído para empresa {company_id}, prompt {prompt_id}", LogCategory.SYSTEM, extra={"company_id": company_id, "prompt_id": prompt_id})
            return content
        
    @staticmethod
    def set_default_prompt(company_id: int, prompt_id: int):
        LogService.info(None, "set_default_prompt_attempt", f"Intentando establecer prompt {prompt_id} como defecto para empresa {company_id}", LogCategory.SYSTEM, extra={"company_id": company_id, "prompt_id": prompt_id})
        prompt = CompanyPrompt.query.filter_by(company_id=company_id, id=prompt_id).first()
        if not prompt:
            error_msg = f"No se encontró un prompt para la empresa {company_id} con ID {prompt_id}"
            LogService.error(None, "set_default_prompt_failed", error_msg, LogCategory.SYSTEM, extra={"company_id": company_id, "prompt_id": prompt_id})
            raise ValueError(f"No se encontró un prompt para la empresa {company_id} con ID {prompt_id}")
        # Desmarcar todos los prompts como default
        CompanyPrompt.query.filter_by(company_id=company_id).update({'is_default': False})
        # Marcar el prompt seleccionado como default
        prompt.is_default = True
        db.session.commit()
        LogService.info(None, "set_default_prompt_success", f"Prompt {prompt_id} establecido como defecto para empresa {company_id}", LogCategory.SYSTEM, extra={"company_id": company_id, "prompt_id": prompt_id, "prompt_path": prompt.prompt_path})
        return prompt