from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()

class OpenAIService:
    def __init__(self, model="gpt-4"):
        self.api_key = os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("API key for OpenAI not found in environment variables.")
        self.model = model
        self.client = OpenAI(api_key=self.api_key)

        # Cargar prompt desde archivo
        with open("app/prompts/summarize_invoice.txt", "r", encoding="utf-8") as f:
            self.summary_prompt_template = f.read()

    def summarize_invoice_text(self, raw_text: str) -> str:
        prompt = self.summary_prompt_template.replace("{raw_text}", raw_text.strip())

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "Sos un asistente de procesamiento de documentos."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=500
        )
        return response.choices[0].message.content.strip()

    def extract_structured_data(self, raw_text: str) -> dict:
        with open("app/prompts/extract_invoice_data.txt", "r", encoding="utf-8") as f:
            prompt_template = f.read()

        prompt = prompt_template.replace("{raw_text}", raw_text.strip())

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "Sos un experto en análisis de facturas."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            max_tokens=1000
        )

        content = response.choices[0].message.content.strip()
        
        import json
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            raise ValueError("Error al convertir la respuesta a JSON:\n" + content)
