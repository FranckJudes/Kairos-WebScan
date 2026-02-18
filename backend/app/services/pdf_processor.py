"""
Service de traitement PDF avec extraction des pages en temps réel
Utilise PyMuPDF (fitz) pour extraire les pages et les convertir en images
"""
import os
import fitz  # PyMuPDF
from typing import List, Dict, Any, Optional
import logging
from pathlib import Path
import asyncio
from concurrent.futures import ThreadPoolExecutor
import aiofiles
import json

logger = logging.getLogger(__name__)


class PDFProcessor:
    """Processseur de PDF pour extraction des pages en temps réel"""

    def __init__(self, upload_dir: str = "uploads"):
        self.upload_dir = Path(upload_dir)
        self.upload_dir.mkdir(exist_ok=True)
        self.executor = ThreadPoolExecutor(max_workers=4)

    def _get_page_count(self, pdf_path: str) -> int:
        """Retourne le nombre de pages dans un PDF"""
        try:
            doc = fitz.open(pdf_path)
            count = len(doc)
            doc.close()
            return count
        except Exception as e:
            return 0

    def _render_page_to_image(
        self,
        pdf_path: str,
        page_number: int,
        zoom: float = 2.0,
        output_format: str = "JPEG"
    ) -> Optional[bytes]:
        """
        Convertit une page PDF en image

        Args:
            pdf_path: Chemin du fichier PDF
            page_number: Numéro de page (0-indexé)
            zoom: Facteur de zoom pour la qualité
            output_format: Format de sortie (JPEG, PNG)

        Returns:
            Bytes de l'image ou None en cas d'erreur
        """
        try:
            doc = fitz.open(pdf_path)

            if page_number >= len(doc):
                doc.close()
                return None

            page = doc[page_number]

            mat = fitz.Matrix(zoom, zoom)

            pix = page.get_pixmap(matrix=mat)

            try:
                img_bytes = pix.tobyte(output_format)
            except AttributeError:
                try:
                    img_bytes = pix.pil_tobyte(format=output_format.lower())
                except AttributeError:
                    import io
                    from PIL import Image

                    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)

                    output = io.BytesIO()
                    img.save(output, format="JPEG" if output_format == "JPEG" else "PNG", quality=95)
                    img_bytes = output.getvalue()

            doc.close()
            return img_bytes

        except Exception as e:
            return None

    def save_page_as_image(
        self,
        pdf_path: str,
        page_number: int,
        output_path: str,
        zoom: float = 2.0,
        output_format: str = "JPEG"
    ) -> Optional[str]:
        """
        Sauvegarde une page PDF comme fichier image

        Args:
            pdf_path: Chemin du PDF source
            page_number: Numéro de page (0-indexé)
            output_path: Chemin de sortie de l'image
            zoom: Facteur de zoom
            output_format: Format de sortie

        Returns:
            Chemin de l'image sauvegardée ou None
        """
        try:
            img_bytes = self._render_page_to_image(pdf_path, page_number, zoom, output_format)

            if not img_bytes:
                return None

            # Créer le dossier de sortie si nécessaire
            output_dir = Path(output_path).parent
            output_dir.mkdir(parents=True, exist_ok=True)

            # Sauvegarder l'image
            with open(output_path, "wb") as f:
                f.write(img_bytes)

            return output_path

        except Exception as e:
            return None

    async def process_pdf_async(
        self,
        pdf_path: str,
        document_id: str,
        progress_callback: Optional[callable] = None
    ) -> List[Dict[str, Any]]:
        """
        Traite un PDF de manière asynchrone et extrait toutes les pages

        Args:
            pdf_path: Chemin du PDF
            document_id: ID du document
            progress_callback: Callback appelé pour chaque page traitée

        Returns:
            Liste des pages extraites avec leurs métadonnées
        """
        loop = asyncio.get_event_loop()
        pages = []

        try:
            # Obtenir le nombre de pages
            page_count = await loop.run_in_executor(
                self.executor,
                self._get_page_count,
                pdf_path
            )

            if page_count == 0:
                return pages


            pages_dir = self.upload_dir / "pages" / document_id
            pages_dir.mkdir(parents=True, exist_ok=True)

            for page_num in range(page_count):
                output_filename = f"page_{page_num + 1}.jpg"
                output_path = pages_dir / output_filename

                saved_path = await loop.run_in_executor(
                    self.executor,
                    self.save_page_as_image,
                    pdf_path,
                    page_num,
                    str(output_path),
                    2.0,  # zoom
                    "JPEG"
                )

                if saved_path:
                    page_info = {
                        "page_number": page_num + 1,
                        "original_page_number": page_num + 1,
                        "filename": output_filename,
                        "url": f"/uploads/pages/{document_id}/{output_filename}",
                        "width": None,  # Sera rempli plus tard si nécessaire
                        "height": None
                    }

                    pages.append(page_info)

                    # Callback de progression
                    if progress_callback:
                        await progress_callback({
                            "document_id": document_id,
                            "page_number": page_num + 1,
                            "total_pages": page_count,
                            "progress": ((page_num + 1) / page_count) * 100,
                            "page_url": page_info["url"],
                            "status": "processing"
                        })


            return pages

        except Exception as e:
            if progress_callback:
                await progress_callback({
                    "document_id": document_id,
                    "status": "error",
                    "error": str(e)
                })
            return pages

    async def process_single_page(
        self,
        pdf_path: str,
        document_id: str,
        page_number: int
    ) -> Optional[Dict[str, Any]]:
        """
        Traite une seule page d'un PDF

        Args:
            pdf_path: Chemin du PDF
            document_id: ID du document
            page_number: Numéro de page (1-indexé)

        Returns:
            Informations de la page ou None
        """
        loop = asyncio.get_event_loop()

        try:
            # Créer le dossier pour les pages
            pages_dir = self.upload_dir / "pages" / document_id
            pages_dir.mkdir(parents=True, exist_ok=True)

            output_filename = f"page_{page_number}.jpg"
            output_path = pages_dir / output_filename

            # Sauvegarder la page (page_number est 1-indexé, on le convertit en 0-indexé)
            saved_path = await loop.run_in_executor(
                self.executor,
                self.save_page_as_image,
                pdf_path,
                page_number - 1,
                str(output_path),
                2.0,
                "JPEG"
            )

            if saved_path:
                page_info = {
                    "page_number": page_number,
                    "original_page_number": page_number,
                    "filename": output_filename,
                    "url": f"/uploads/pages/{document_id}/{output_filename}"
                }

                return page_info

            return None

        except Exception as e:
            return None


# Instance globale
_processor: Optional[PDFProcessor] = None


def get_pdf_processor() -> PDFProcessor:
    """Retourne l'instance globale du processeur PDF"""
    global _processor
    if _processor is None:
        _processor = PDFProcessor()
    return _processor
