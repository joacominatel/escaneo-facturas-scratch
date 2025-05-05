from openai import OpenAI
import os
from dotenv import load_dotenv
import time
import requests.exceptions
import tenacity
import json
import hashlib

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
        self._load_summary_prompt()
        # El prompt de extracción se cargará dinámicamente
        self.default_extract_prompt_path = "app/prompts/extract_invoice_data.txt"
        
    def _load_summary_prompt(self):
        """Carga solo el prompt de resumen."""
        try:
            with open("app/prompts/summarize_invoice.txt", "r", encoding="utf-8") as f:
                self.summary_prompt_template = f.read()
        except Exception as e:
            print(f"Error cargando prompt de resumen: {e}")
            raise

    def _load_extract_prompt(self, prompt_path: str | None) -> str:
        """Carga el prompt de extracción desde la ruta especificada o la ruta por defecto."""
        path_to_load = prompt_path if prompt_path and os.path.exists(prompt_path) else self.default_extract_prompt_path
        
        if not os.path.exists(path_to_load):
             print(f"Error: No se encontró el archivo de prompt de extracción en: {path_to_load}")
             # Considerar si lanzar un error o usar un prompt genérico de respaldo
             raise FileNotFoundError(f"Prompt de extracción no encontrado en {path_to_load}")
             
        try:
            with open(path_to_load, "r", encoding="utf-8") as f:
                return f.read()
        except Exception as e:
            print(f"Error cargando prompt de extracción desde {path_to_load}: {e}")
            raise

    def _get_cache_key(self, prompt_content: str, model: str) -> str:
        """Genera una clave de caché basada en el contenido del prompt y modelo"""
        return hashlib.md5(f"{prompt_content}:{model}".encode()).hexdigest()

    @retry_with_backoff(max_tries=3)
    def summarize_invoice_text(self, raw_text: str) -> str:
        """Genera un resumen del texto de la factura con reintentos en caso de error"""
        # Truncar texto si es demasiado largo
        if len(raw_text) > 15000:
            raw_text = raw_text[:15000] + "..."
            
        prompt = self.summary_prompt_template.replace("{raw_text}", raw_text.strip())
        
        # Verificar caché
        if self.cache_enabled:
            cache_key = self._get_cache_key(prompt, self.model)
            if cache_key in self._response_cache:
                print("Usando respuesta en caché para resumen")
                return self._response_cache[cache_key]

        try:
            start_time = time.time()
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
                
            print(f"Resumen generado en {time.time() - start_time:.2f} segundos")
            return content
            
        except Exception as e:
            print(f"Error en API de OpenAI durante summarize: {str(e)}")
            raise

    @retry_with_backoff(max_tries=3)
    def extract_structured_data(self, raw_text: str, prompt_path: str | None = None) -> dict:
        """Extrae datos estructurados usando un prompt específico o el por defecto."""
        # Truncar texto si es demasiado largo
        if len(raw_text) > 20000:
            raw_text = raw_text[:20000] + "..."
        
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
        if self.cache_enabled:
            cache_key = self._get_cache_key(prompt_content, self.model)
            if cache_key in self._response_cache:
                print(f"Usando respuesta en caché para extracción (prompt: {prompt_path or 'default'})")
                # Asegurarse que lo cacheado sea el diccionario
                cached_value = self._response_cache[cache_key]
                if isinstance(cached_value, dict):
                     return cached_value
                else:
                     print("Advertencia: Valor cacheado no es un diccionario, recalculando.")
                     # Podría intentar decodificar si es string, o simplemente seguir

        try:
            start_time = time.time()
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
            
            # Procesar el JSON de respuesta (ya debería ser JSON por response_format)
            try:
                # Directamente decodificar JSON
                structured_data = json.loads(content)
                
                # Guardar en caché el diccionario decodificado
                if self.cache_enabled:
                    self._response_cache[cache_key] = structured_data
                
                print(f"Datos estructurados extraídos en {time.time() - start_time:.2f} segundos (prompt: {prompt_path or 'default'})")
                return structured_data
                
            except json.JSONDecodeError:
                print(f"Error al convertir la respuesta a JSON (incluso con response_format):
{content[:200]}...")
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
                    print("Datos estructurados extraídos después de limpieza manual.")
                    return structured_data
                except json.JSONDecodeError as inner_e:
                    print(f"Fallo final al decodificar JSON: {inner_e}")
                    raise ValueError("Error al convertir la respuesta a JSON: " + content_cleaned)
                
        except Exception as e:
            # Capturar errores específicos de OpenAI API si es necesario
            print(f"Error en API de OpenAI durante extracción (prompt: {prompt_path or 'default'}): {str(e)}")
            raise
        
    def extract_structured_data_and_raw(self, raw_text: str, prompt_path: str | None = None) -> tuple[dict, str]:
        """Extrae datos estructurados (usando prompt específico) y resumen."""
        structured_data = self.extract_structured_data(raw_text, prompt_path=prompt_path)
        # El resumen no cambia, usa el prompt de resumen fijo
        raw_response = self.summarize_invoice_text(raw_text)
        return structured_data, raw_response