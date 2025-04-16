import os
import zipfile
from werkzeug.utils import secure_filename

def extract_pdfs_from_zip(zip_file, extract_to="uploads/tmp"):
    os.makedirs(extract_to, exist_ok=True)
    pdf_paths = []

    with zipfile.ZipFile(zip_file, 'r') as archive:
        for file_info in archive.infolist():
            if file_info.filename.lower().endswith(".pdf"):
                # Sanitizar el nombre
                filename = secure_filename(os.path.basename(file_info.filename))
                path = os.path.join(extract_to, filename)
                with open(path, 'wb') as f:
                    f.write(archive.read(file_info))
                pdf_paths.append(path)

    return pdf_paths
