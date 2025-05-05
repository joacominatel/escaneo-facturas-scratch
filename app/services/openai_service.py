from openai import OpenAI
import os
from dotenv import load_dotenv
import time
import requests.exceptions
import tenacity
import json
import hashlib
from app.services.log_service import LogService, LogLevel, LogCategory

load_dotenv()

# Decorador para reintentos con backoff exponencial en caso de error de la API
def retry_with_backoff(max_tries=4, factor=2):
    return tenacity.retry(
        stop=tenacity.stop_after_attempt(max_tries),
        wait=tenacity.wait_exponential(multiplier=1, min=1, max=10),
        retry=(tenacity.retry_if_exception_type((
            requests.exceptions.Timeout,
            requests.exceptions.ConnectionError,
            requests.exceptions.RequestException
        ))),
        reraise=True
    )

class OpenAIService:
    def __init__(self, model="gpt-4.1-nano-2025-04-14", cache_enabled=True):
        self.api_key = os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("API key for OpenAI not found in environment variables.")
        self.model = model
        # Configuramos el timeout para las solicitudes HTTP
        self.client = OpenAI(
            api_key=self.api_key,
            timeout=30.0,  # 30 segundos de timeout
            max_retries=2,  # Reintentos incorporados
        )
        
        # Cache para respuestas
        self.cache_enabled = cache_enabled
        self._response_cache = {}

        # Cargar SOLO el prompt de resumen por defecto al iniciar
        LogService.debug(None, "openai_service_init", f"OpenAIService inicializado con model='{self.model}', cache_enabled={self.cache_enabled}", LogCategory.SYSTEM)
        self._load_summary_prompt()
        # El prompt de extracción se cargará dinámicamente
        self.default_extract_prompt_path = "app/prompts/extract_invoice_data.txt"
        
    def _load_summary_prompt(self):
        """Carga solo el prompt de resumen."""
        try:
            with open("app/prompts/summarize_invoice.txt", "r", encoding="utf-8") as f:
                self.summary_prompt_template = f.read()
                LogService.debug(None, "summary_prompt_loaded", "Prompt de resumen cargado.", LogCategory.SYSTEM)
        except Exception as e:
            error_msg = f"Error cargando prompt de resumen: {e}"
            LogService.error(None, "summary_prompt_load_failed", error_msg, LogCategory.SYSTEM, exc_info=True)
            raise

    def _load_extract_prompt(self, prompt_path: str | None) -> str:
        """Carga el prompt de extracción desde la ruta especificada o la ruta por defecto."""
        path_to_load = prompt_path if prompt_path and os.path.exists(prompt_path) else self.default_extract_prompt_path
        
        if not os.path.exists(path_to_load):
            error_msg = f"No se encontró el archivo de prompt de extracción en: {path_to_load}"
            LogService.error(None, "extract_prompt_load_failed", error_msg, LogCategory.SYSTEM, extra={"path_attempted": path_to_load})
            # Considerar si lanzar un error o usar un prompt genérico de respaldo
            raise FileNotFoundError(f"Prompt de extracción no encontrado en {path_to_load}")
             
        try:
            with open(path_to_load, "r", encoding="utf-8") as f:
                content = f.read()
                LogService.debug(None, "extract_prompt_loaded", f"Prompt de extracción cargado desde {path_to_load}.", LogCategory.SYSTEM, extra={"path_loaded": path_to_load})
                return content
        except Exception as e:
            error_msg = f"Error cargando prompt de extracción desde {path_to_load}: {e}"
            LogService.error(None, "extract_prompt_load_failed", error_msg, LogCategory.SYSTEM, extra={"path_attempted": path_to_load}, exc_info=True)
            raise

    def _get_cache_key(self, prompt_content: str, model: str) -> str:
        """Genera una clave de caché basada en el contenido del prompt y modelo"""
        return hashlib.md5(f"{prompt_content}:{model}".encode()).hexdigest()

    @retry_with_backoff(max_tries=3)
    def summarize_invoice_text(self, raw_text: str) -> str:
        """Genera un resumen del texto de la factura con reintentos en caso de error"""
        # Este método ahora necesita invoice_id
        # La firma debería ser: summarize_invoice_text(self, raw_text: str, invoice_id: int | None = None)
        # Asumiremos que se pasa None si no hay contexto de factura.
        # Por simplicidad en esta edición, añadiremos el parámetro sin cambiar la firma en la tool call.
        # ¡RECORDATORIO: Ajustar la firma en el código real! 
        invoice_id = getattr(self, '_current_invoice_id', None) # Truco temporal para pasar el ID
        
        process_name = "summarize_invoice_text"
        text_length = len(raw_text)
        log_extra = {"model": self.model, "text_length": text_length}
        LogService.process_start(invoice_id, process_name, "Iniciando resumen de texto", extra=log_extra)
        start_time = time.time() # Mover inicio del temporizador aquí

        # Truncar texto si es demasiado largo
        if len(raw_text) > 15000:
            raw_text = raw_text[:15000] + "..."
            LogService.warning(invoice_id, "text_truncated", f"Texto truncado a 15000 caracteres para resumen.", LogCategory.API, extra={"original_length": text_length})

        prompt = self.summary_prompt_template.replace("{raw_text}", raw_text.strip())
        
        # Verificar caché
        if self.cache_enabled:
            cache_key = self._get_cache_key(prompt, self.model)
            if cache_key in self._response_cache:
                duration = time.time() - start_time
                cached_content = self._response_cache[cache_key]
                LogService.info(invoice_id, "openai_cache_hit", f"Respuesta de resumen obtenida de caché.", LogCategory.API, extra={"cache_key": cache_key, "duration_seconds": duration})
                LogService.process_end(invoice_id, process_name, f"Resumen obtenido de caché en {duration:.2f} segundos", duration=duration, extra=log_extra | {"cache_hit": True, "response_length": len(cached_content)})
                print("Usando respuesta en caché para resumen")
                return self._response_cache[cache_key]

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "Sos un asistente de procesamiento de documentos."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=500,
            )
            content = response.choices[0].message.content.strip()
            
            # Guardar en caché
            if self.cache_enabled:
                self._response_cache[cache_key] = content
                
            duration = time.time() - start_time
            LogService.process_end(invoice_id, process_name, f"Resumen generado en {duration:.2f} segundos", duration=duration, extra=log_extra | {"cache_hit": False, "response_length": len(content)})
            print(f"Resumen generado en {time.time() - start_time:.2f} segundos") # LogService ya imprime y calcula duration
            return content
            
        except Exception as e:
            duration = time.time() - start_time
            error_msg = f"Error en API de OpenAI durante summarize: {str(e)}"
            LogService.process_error(invoice_id, process_name, e, error_msg, extra=log_extra | {"duration_seconds": duration})
            print(f"Error en API de OpenAI durante summarize: {str(e)}")
            raise

    @retry_with_backoff(max_tries=3)
    def extract_structured_data(self, raw_text: str, prompt_path: str | None = None) -> dict:
        """Extrae datos estructurados usando un prompt específico o el por defecto."""
        # ¡RECORDATORIO: Ajustar la firma en el código real para incluir invoice_id! 
        invoice_id = getattr(self, '_current_invoice_id', None) # Truco temporal
        
        process_name = "extract_structured_data"
        text_length = len(raw_text)
        effective_prompt_path = prompt_path or "default"
        log_extra = {"model": self.model, "text_length": text_length, "prompt_path": effective_prompt_path}
        LogService.process_start(invoice_id, process_name, "Iniciando extracción de datos estructurados", extra=log_extra)
        start_time = time.time()

        # Truncar texto si es demasiado largo
        if len(raw_text) > 20000:
            raw_text = raw_text[:20000] + "..."
            LogService.warning(invoice_id, "text_truncated", f"Texto truncado a 20000 caracteres para extracción.", LogCategory.API, extra={"original_length": text_length, "prompt_path": effective_prompt_path})

        # Cargar el template del prompt adecuado
        try:
            extract_data_prompt_template = self._load_extract_prompt(prompt_path)
        except Exception as e:
             # Manejar error de carga de prompt (loguear, posible fallback?)
             print(f"Error crítico al cargar el prompt ({prompt_path or 'default'}), usando un prompt básico.")
             # Fallback muy básico si todo falla
             extract_data_prompt_template = "Extrae los siguientes campos del texto de la factura en formato JSON: invoice_number, amount_total, date.\n\nTexto:\n{raw_text}"
        
        # Construir el prompt final
        prompt_content = extract_data_prompt_template.replace("{raw_text}", raw_text.strip())
        
        # Verificar caché usando el contenido del prompt actual
        cache_hit = False # Flag para saber si usamos caché
        if self.cache_enabled:
            cache_key = self._get_cache_key(prompt_content, self.model)
            if cache_key in self._response_cache:
                LogService.info(invoice_id, "openai_cache_hit", f"Respuesta de extracción obtenida de caché.", LogCategory.API, extra={"cache_key": cache_key, "prompt_path": effective_prompt_path})
                print(f"Usando respuesta en caché para extracción (prompt: {effective_prompt_path})") # Mantener print por ahora
                # Asegurarse que lo cacheado sea el diccionario
                cached_value = self._response_cache[cache_key]
                if isinstance(cached_value, dict):
                    duration = time.time() - start_time
                    LogService.process_end(invoice_id, process_name, f"Extracción obtenida de caché en {duration:.2f} segundos", duration=duration, extra=log_extra | {"cache_hit": True})
                    cache_hit = True # Marcar como caché hit
                    return cached_value
                else:
                    LogService.warning(invoice_id, "openai_cache_invalid", f"Valor cacheado para extracción no es un diccionario, recalculando.", LogCategory.API, extra={"cache_key": cache_key, "prompt_path": effective_prompt_path})
                    print("Advertencia: Valor cacheado no es un diccionario, recalculando.") # Mantener print
                    # Podría intentar decodificar si es string, o simplemente seguir

        # Solo ejecutar si no hubo cache hit
        if not cache_hit:
            try:
                # start_time ya está definido antes del check de caché
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": "Sos un experto en análisis de facturas y extracción de datos estructurados."}, # Rol actualizado
                        {"role": "user", "content": prompt_content}
                    ],
                    temperature=0.2,
                    max_tokens=4096, # Podría necesitar ajustarse según el prompt
                    response_format={ "type": "json_object" } # Usar modo JSON si el modelo lo soporta
                )

                content = response.choices[0].message.content.strip()
                duration = time.time() - start_time
                
                # Procesar el JSON de respuesta (ya debería ser JSON por response_format)
                try:
                    # Directamente decodificar JSON
                    structured_data = json.loads(content)
                    
                    # Guardar en caché el diccionario decodificado
                    if self.cache_enabled:
                        self._response_cache[cache_key] = structured_data
                    
                    LogService.process_end(invoice_id, process_name, f"Datos estructurados extraídos en {duration:.2f} segundos", duration=duration, extra=log_extra | {"cache_hit": False})
                    print(f"Datos estructurados extraídos en {duration:.2f} segundos (prompt: {effective_prompt_path})") # LogService ya lo hace
                    return structured_data
                    
                except json.JSONDecodeError as decode_error:
                    error_msg = f"Error al convertir la respuesta a JSON (response_format={response.response_format}): {content[:200]}..."
                    LogService.error(invoice_id, "openai_json_decode_error", error_msg, LogCategory.API, extra=log_extra | {"duration_seconds": duration, "raw_response": content[:500]}, exc_info=decode_error)
                    print(error_msg)
                    
                    # Intentar limpiar si aún falla (aunque response_format debería evitarlo)
                    if content.startswith("```json"):
                        content_cleaned = content[7:-3].strip()
                    elif content.startswith("```"):
                        content_cleaned = content[3:-3].strip()
                    else:
                        content_cleaned = content
                    try:
                        structured_data = json.loads(content_cleaned)
                        if self.cache_enabled:
                             self._response_cache[cache_key] = structured_data # Cachear el resultado limpio
                        LogService.info(invoice_id, "openai_json_manual_clean_success", "Datos estructurados extraídos después de limpieza manual.", LogCategory.API, extra=log_extra | {"duration_seconds": duration})
                        print("Datos estructurados extraídos después de limpieza manual.")
                        # Considerar si LogService.process_end debería ir aquí también?
                        return structured_data
                    except json.JSONDecodeError as inner_e:
                        final_error_msg = f"Fallo final al decodificar JSON tras limpieza: {inner_e}"
                        LogService.critical(invoice_id, "openai_json_decode_final_failure", final_error_msg, LogCategory.API, extra=log_extra | {"duration_seconds": duration, "cleaned_response": content_cleaned[:500]}, exc_info=inner_e)
                        print(final_error_msg)
                        raise ValueError("Error al convertir la respuesta a JSON: " + content_cleaned)
                    
            except Exception as e:
                duration = time.time() - start_time
                # Capturar errores específicos de OpenAI API si es necesario
                error_msg = f"Error en API de OpenAI durante extracción (prompt: {effective_prompt_path}): {str(e)}"
                LogService.process_error(invoice_id, process_name, e, error_msg, extra=log_extra | {"duration_seconds": duration})
                print(error_msg)
                raise

    def extract_structured_data_and_raw(self, raw_text: str, invoice_id: int | None = None, prompt_path: str | None = None) -> tuple[dict, str]:
        """Extrae datos estructurados (usando prompt específico) y resumen."""
        # Pasar el invoice_id a los métodos subyacentes
        # Usamos un truco temporal para pasar el ID sin cambiar explícitamente la firma en todos lados
        self._current_invoice_id = invoice_id
        try:
            structured_data = self.extract_structured_data(raw_text, prompt_path=prompt_path)
            # El resumen no cambia, usa el prompt de resumen fijo
            raw_response = self.summarize_invoice_text(raw_text)
            return structured_data, raw_response
        finally:
            # Limpiar el ID temporal
            delattr(self, '_current_invoice_id')