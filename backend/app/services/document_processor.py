from typing import List, Tuple
import PyPDF2
import docx
import io
import re

class DocumentProcessor:
    @staticmethod
    def extract_text_from_pdf(file_content: bytes) -> str:
        try:
            pdf_file = io.BytesIO(file_content)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            return text.strip()
        except Exception as e:
            raise Exception(f"Failed to extract text from PDF: {str(e)}")

    @staticmethod
    def extract_text_from_docx(file_content: bytes) -> str:
        try:
            doc_file = io.BytesIO(file_content)
            doc = docx.Document(doc_file)
            text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
            return text.strip()
        except Exception as e:
            raise Exception(f"Failed to extract text from DOCX: {str(e)}")

    @staticmethod
    def extract_text_from_txt(file_content: bytes) -> str:
        try:
            return file_content.decode("utf-8").strip()
        except Exception as e:
            raise Exception(f"Failed to extract text from TXT: {str(e)}")

    @staticmethod
    def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
        text = re.sub(r'\s+', ' ', text)
        text = text.strip()

        if len(text) <= chunk_size:
            return [text] if text else []

        chunks = []
        start = 0

        while start < len(text):
            end = start + chunk_size

            if end < len(text):
                last_period = text.rfind('.', start, end)
                last_newline = text.rfind('\n', start, end)
                last_space = text.rfind(' ', start, end)

                split_point = max(last_period, last_newline, last_space)
                if split_point > start:
                    end = split_point + 1

            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)

            start = end - overlap if end < len(text) else end

        return chunks

    @staticmethod
    def process_file(file_content: bytes, filename: str) -> Tuple[str, List[str]]:
        file_ext = filename.lower().split('.')[-1]

        if file_ext == 'pdf':
            text = DocumentProcessor.extract_text_from_pdf(file_content)
        elif file_ext in ['docx', 'doc']:
            text = DocumentProcessor.extract_text_from_docx(file_content)
        elif file_ext == 'txt':
            text = DocumentProcessor.extract_text_from_txt(file_content)
        else:
            raise ValueError(f"Unsupported file type: {file_ext}")

        chunks = DocumentProcessor.chunk_text(text)
        return text, chunks

document_processor = DocumentProcessor()
