import pytesseract
from pdf2image import convert_from_path
from PIL import Image
import tempfile

class OCRService:
    def __init__(self, lang="eng"):
        self.lang = lang

    def extract_text_from_pdf(self, pdf_path):
        text = ""
        with tempfile.TemporaryDirectory() as path:
            images = convert_from_path(pdf_path, dpi=300, output_folder=path)
            for i, image in enumerate(images):
                text += pytesseract.image_to_string(image, lang=self.lang)
        return text

    def extract_text_from_image(self, image_path):
        image = Image.open(image_path)
        return pytesseract.image_to_string(image, lang=self.lang)
