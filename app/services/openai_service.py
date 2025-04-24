from openai import OpenAI
import os
from dotenv import load_dotenv
import time
import requests.exceptions
import tenacity
import json

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

        # Cargar prompts desde archivos (solo una vez)
        self._load_prompts()
        
    def _load_prompts(self):
        """Carga los prompts desde archivos una sola vez"""
        try:
            with open("app/prompts/summarize_invoice.txt", "r", encoding="utf-8") as f:
                self.summary_prompt_template = f.read()
                
            with open("app/prompts/extract_invoice_data.txt", "r", encoding="utf-8") as f:
                self.extract_data_prompt_template = f.read()
        except Exception as e:
            print(f"Error cargando prompts: {e}")
            raise

    def _get_cache_key(self, prompt, model):
        """Genera una clave de caché simple basada en el prompt y modelo"""
        import hashlib
        return hashlib.md5(f"{prompt}:{model}".encode()).hexdigest()

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
    def extract_structured_data(self, raw_text: str) -> dict:
        """Extrae datos estructurados del texto de la factura con reintentos en caso de error"""
        # Truncar texto si es demasiado largo
        if len(raw_text) > 20000:
            raw_text = raw_text[:20000] + "..."
            
        prompt = self.extract_data_prompt_template.replace("{raw_text}", raw_text.strip())
        
        # Verificar caché
        if self.cache_enabled:
            cache_key = self._get_cache_key(prompt, self.model)
            if cache_key in self._response_cache:
                print("Usando respuesta en caché para extracción de datos")
                return self._response_cache[cache_key]

        try:
            start_time = time.time()
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "Sos un experto en análisis de facturas."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2,
                max_tokens=4096,
            )

            content = response.choices[0].message.content.strip()
            
            # Procesar el JSON de respuesta
            try:
                if content.startswith("```json"):
                    content = content[7:-3].strip()  # remove ```json and ``` at the end
                elif content.startswith("```"):
                    content = content[3:-3].strip()  # remove ```

                structured_data = json.loads(content)
                
                # Guardar en caché
                if self.cache_enabled:
                    self._response_cache[cache_key] = structured_data
                
                print(f"Datos estructurados extraídos en {time.time() - start_time:.2f} segundos")
                return structured_data
                
            except json.JSONDecodeError:
                print(f"Error al convertir la respuesta a JSON:\n{content[:200]}...")
                raise ValueError("Error al convertir la respuesta a JSON:\n" + content)
                
        except Exception as e:
            print(f"Error en API de OpenAI durante extracción: {str(e)}")
            raise
        
    def extract_structured_data_and_raw(self, raw_text: str) -> tuple[dict, str]:
        """Extrae tanto datos estructurados como resumen del texto de la factura"""
        structured_data = self.extract_structured_data(raw_text)
        raw_response = self.summarize_invoice_text(raw_text)
        return structured_data, raw_response