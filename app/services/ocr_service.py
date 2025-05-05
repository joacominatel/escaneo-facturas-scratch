import pytesseract
from pdf2image import convert_from_path
from PIL import Image
import tempfile
import os
import functools
import time
import threading
from concurrent.futures import ThreadPoolExecutor
from app.services.log_service import LogService, LogLevel, LogCategory

# Semáforo global para limitar el número de procesos OCR concurrentes
OCR_SEMAPHORE = threading.Semaphore(2)

class OCRService:
    def __init__(self, lang="eng", cache_enabled=True):
        self.lang = lang
        self.cache_enabled = cache_enabled
        self.cache_dir = os.getenv("OCR_CACHE_DIR", "/tmp/ocr_cache")
        
        # Crear directorio de caché si no existe
        if self.cache_enabled and not os.path.exists(self.cache_dir):
            os.makedirs(self.cache_dir, exist_ok=True)
        LogService.debug(None, "ocr_service_init", f"OCRService inicializado con lang='{self.lang}', cache_enabled={self.cache_enabled}", LogCategory.SYSTEM)
    
    def _get_cache_path(self, file_path):
        """Genera una ruta de caché basada en la ruta del archivo y su fecha de modificación"""
        if not self.cache_enabled:
            return None
            
        file_stat = os.stat(file_path)
        file_mtime = file_stat.st_mtime
        filename = os.path.basename(file_path)
        cache_key = f"{filename}_{file_mtime}.txt"
        return os.path.join(self.cache_dir, cache_key)
    
    def _process_image(self, image):
        """Procesa una imagen individual con OCR"""
        # Nota: No podemos pasar invoice_id aquí directamente. El log se hará en el método que llama.
        with OCR_SEMAPHORE:
            return pytesseract.image_to_string(image, lang=self.lang)
    
    @functools.lru_cache(maxsize=32)
    def extract_text_from_pdf(self, pdf_path, invoice_id: int | None = None):
        """Extrae texto de un PDF usando OCR con caché y procesamiento en paralelo optimizado"""
        process_name = "extract_text_from_pdf"
        LogService.process_start(invoice_id, process_name, f"Iniciando OCR para PDF: {pdf_path}", extra={"pdf_path": pdf_path})
        start_time = time.time()
        text = ""
        cache_hit = False

        # Verificar caché primero
        cache_path = self._get_cache_path(pdf_path)
        if cache_path and os.path.exists(cache_path):
            try:
                with open(cache_path, 'r', encoding='utf-8') as f:
                    text = f.read()
                duration = time.time() - start_time
                LogService.info(invoice_id, "ocr_cache_hit", f"Texto extraído de caché para {pdf_path}", LogCategory.PROCESS, extra={"cache_path": cache_path, "duration_seconds": duration})
                cache_hit = True
                LogService.process_end(invoice_id, process_name, f"OCR completado (desde caché) en {duration:.2f} segundos", duration=duration, extra={"pdf_path": pdf_path, "cache_hit": True})
                return text
            except Exception as e:
                LogService.warning(invoice_id, "ocr_cache_read_error", f"Error al leer caché {cache_path}: {e}", LogCategory.SYSTEM, extra={"cache_path": cache_path})

        # Si no hubo caché hit, proceder con OCR
        try:
            with tempfile.TemporaryDirectory() as path:
                # Convertir PDF a imágenes con una resolución más baja pero adecuada (DPI 200 en lugar de 300)
                images = convert_from_path(pdf_path, dpi=200, output_folder=path, thread_count=2)
                
                # Procesa imágenes en paralelo usando un ThreadPoolExecutor
                with ThreadPoolExecutor(max_workers=2) as executor:
                    # Pasamos self._process_image sin argumentos adicionales
                    results = list(executor.map(self._process_image, images))
                    text = "\n".join(results)
                
        except Exception as e:
            duration = time.time() - start_time
            error_msg = f"Error procesando PDF {pdf_path}: {str(e)}"
            LogService.process_error(invoice_id, process_name, e, error_msg, extra={"pdf_path": pdf_path, "duration_seconds": duration})
            print(error_msg)
            raise # Re-lanzar la excepción para que la capa superior la maneje

        duration = time.time() - start_time
        # Guardar en caché si está habilitado y si no hubo hit
        if cache_path and not cache_hit:
            try:
                with open(cache_path, 'w', encoding='utf-8') as f:
                    f.write(text)
                LogService.debug(invoice_id, "ocr_cache_saved", f"Resultado de OCR guardado en caché: {cache_path}", LogCategory.SYSTEM, extra={"cache_path": cache_path})
            except Exception as e:
                LogService.warning(invoice_id, "ocr_cache_write_error", f"Error al guardar caché {cache_path}: {e}", LogCategory.SYSTEM, extra={"cache_path": cache_path})

        LogService.process_end(invoice_id, process_name, f"OCR completado en {duration:.2f} segundos", duration=duration, extra={"pdf_path": pdf_path, "cache_hit": False, "text_length": len(text)})
        # print(f"OCR completado para {pdf_path} en {duration:.2f} segundos") # LogService ya imprime
        return text

    def extract_text_from_image(self, image_path, invoice_id: int | None = None):
        """Extrae texto de una imagen usando OCR con caché"""
        process_name = "extract_text_from_image"
        LogService.process_start(invoice_id, process_name, f"Iniciando OCR para imagen: {image_path}", extra={"image_path": image_path})
        start_time = time.time()
        text = ""
        cache_hit = False

        # Verificar caché primero
        cache_path = self._get_cache_path(image_path)
        if cache_path and os.path.exists(cache_path):
            try:
                with open(cache_path, 'r', encoding='utf-8') as f:
                    text = f.read()
                duration = time.time() - start_time
                LogService.info(invoice_id, "ocr_cache_hit", f"Texto extraído de caché para {image_path}", LogCategory.PROCESS, extra={"cache_path": cache_path, "duration_seconds": duration})
                cache_hit = True
                LogService.process_end(invoice_id, process_name, f"OCR completado (desde caché) en {duration:.2f} segundos", duration=duration, extra={"image_path": image_path, "cache_hit": True})
                return text
            except Exception as e:
                LogService.warning(invoice_id, "ocr_cache_read_error", f"Error al leer caché {cache_path}: {e}", LogCategory.SYSTEM, extra={"cache_path": cache_path})

        # Si no hubo cache hit, procesar
        try:
            with OCR_SEMAPHORE:
                image = Image.open(image_path)
                text = pytesseract.image_to_string(image, lang=self.lang)
        except Exception as e:
            duration = time.time() - start_time
            error_msg = f"Error procesando imagen {image_path}: {str(e)}"
            LogService.process_error(invoice_id, process_name, e, error_msg, extra={"image_path": image_path, "duration_seconds": duration})
            print(error_msg)
            raise

        duration = time.time() - start_time
        # Guardar en caché si está habilitado
        if cache_path and not cache_hit:
             try:
                 with open(cache_path, 'w', encoding='utf-8') as f:
                     f.write(text)
                 LogService.debug(invoice_id, "ocr_cache_saved", f"Resultado de OCR guardado en caché: {cache_path}", LogCategory.SYSTEM, extra={"cache_path": cache_path})
             except Exception as e:
                 LogService.warning(invoice_id, "ocr_cache_write_error", f"Error al guardar caché {cache_path}: {e}", LogCategory.SYSTEM, extra={"cache_path": cache_path})

        LogService.process_end(invoice_id, process_name, f"OCR de imagen completado en {duration:.2f} segundos", duration=duration, extra={"image_path": image_path, "cache_hit": False, "text_length": len(text)})
        return text
