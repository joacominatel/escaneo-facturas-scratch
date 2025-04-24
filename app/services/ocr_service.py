import pytesseract
from pdf2image import convert_from_path
from PIL import Image
import tempfile
import os
import functools
import time
import threading
from concurrent.futures import ThreadPoolExecutor

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
        with OCR_SEMAPHORE:
            return pytesseract.image_to_string(image, lang=self.lang)
    
    @functools.lru_cache(maxsize=32)
    def extract_text_from_pdf(self, pdf_path):
        """Extrae texto de un PDF usando OCR con caché y procesamiento en paralelo optimizado"""
        # Verificar caché primero
        cache_path = self._get_cache_path(pdf_path)
        if cache_path and os.path.exists(cache_path):
            with open(cache_path, 'r', encoding='utf-8') as f:
                return f.read()
        
        start_time = time.time()
        text = ""
        
        try:
            with tempfile.TemporaryDirectory() as path:
                # Convertir PDF a imágenes con una resolución más baja pero adecuada (DPI 200 en lugar de 300)
                images = convert_from_path(pdf_path, dpi=200, output_folder=path, thread_count=2)
                
                # Procesa imágenes en paralelo usando un ThreadPoolExecutor
                with ThreadPoolExecutor(max_workers=2) as executor:
                    results = list(executor.map(self._process_image, images))
                    text = "\n".join(results)
                
        except Exception as e:
            print(f"Error procesando PDF {pdf_path}: {str(e)}")
            raise
        
        # Guardar en caché si está habilitado
        if cache_path:
            with open(cache_path, 'w', encoding='utf-8') as f:
                f.write(text)
        
        print(f"OCR completado para {pdf_path} en {time.time() - start_time:.2f} segundos")
        return text

    def extract_text_from_image(self, image_path):
        """Extrae texto de una imagen usando OCR con caché"""
        # Verificar caché primero
        cache_path = self._get_cache_path(image_path)
        if cache_path and os.path.exists(cache_path):
            with open(cache_path, 'r', encoding='utf-8') as f:
                return f.read()
                
        with OCR_SEMAPHORE:
            image = Image.open(image_path)
            text = pytesseract.image_to_string(image, lang=self.lang)
            
        # Guardar en caché si está habilitado
        if cache_path:
            with open(cache_path, 'w', encoding='utf-8') as f:
                f.write(text)
                
        return text
