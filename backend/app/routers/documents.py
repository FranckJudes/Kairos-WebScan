import os
import shutil
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from fastapi.responses import JSONResponse
from datetime import datetime, timezone

from ..models.mongo_models import DocumentModel, User
from ..models.schemas import DocumentResponse
from .auth import get_current_user_active
from ..tasks import process_pdf_document

router = APIRouter(
    tags=["Documents"]
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def _document_to_response(doc: DocumentModel) -> DocumentResponse:
    """Convertit un modèle DocumentModel en DocumentResponse"""
    url = f"/uploads/{doc.filename}"
    return DocumentResponse(
        id=str(doc.id),
        filename=doc.filename,
        original_name=doc.original_name,
        mime_type=doc.mime_type,
        size_bytes=doc.size_bytes,
        document_type=doc.document_type,
        status=doc.status,
        url=url,
        created_at=doc.created_at,
        updated_at=doc.updated_at
    )

@router.post("/documents/upload", response_model=DocumentResponse)
@router.post("/uploads", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user_active)
):
    """Upload un seul document"""
    try:
        ext = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{ext}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        file_size = os.path.getsize(file_path)

        ext_lower = ext.lower()
        mime_type_map = {
            '.pdf': 'application/pdf',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.tiff': 'image/tiff',
            '.tif': 'image/tiff',
            '.bmp': 'image/bmp',
            '.webp': 'image/webp',
            '.gif': 'image/gif'
        }
        detected_mime_type = mime_type_map.get(ext_lower, file.content_type or "application/octet-stream")

        is_pdf = ext_lower == '.pdf' or (file.content_type and file.content_type == 'application/pdf')

        doc = DocumentModel(
            user_id=str(current_user.id),
            filename=unique_filename,
            original_name=file.filename,
            mime_type=detected_mime_type,
            size_bytes=file_size,
            storage_path=file_path,
            document_type="OTHERS",
            num_pages=0 
        )
        await doc.insert()

        document_id = str(doc.id)

        if is_pdf:
            process_pdf_document.delay(document_id, unique_filename, str(current_user.id))

        return _document_to_response(doc)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de l'upload : {str(e)}"
        )

@router.post("/documents/upload/batch", response_model=List[DocumentResponse])
async def upload_documents_batch(
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user_active)
):
    """Upload plusieurs documents à la fois"""
    uploaded_docs = []
    for file in files:
        try:
            ext = os.path.splitext(file.filename)[1]
            unique_filename = f"{uuid.uuid4()}{ext}"
            file_path = os.path.join(UPLOAD_DIR, unique_filename)

            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            file_size = os.path.getsize(file_path)

            ext_lower = ext.lower()
            mime_type_map = {
                '.pdf': 'application/pdf',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.tiff': 'image/tiff',
                '.tif': 'image/tiff',
                '.bmp': 'image/bmp',
                '.webp': 'image/webp',
                '.gif': 'image/gif'
            }
            detected_mime_type = mime_type_map.get(ext_lower, file.content_type or "application/octet-stream")

            doc = DocumentModel(
                user_id=str(current_user.id),
                filename=unique_filename,
                original_name=file.filename,
                mime_type=detected_mime_type,
                size_bytes=file_size,
                storage_path=file_path,
                document_type="OTHERS"
            )
            await doc.insert()
            uploaded_docs.append(_document_to_response(doc))
        except Exception:
            continue
            
    return uploaded_docs

@router.get("/documents/", response_model=List[DocumentResponse])
async def list_documents(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user_active)
):
    """Liste les documents de l'utilisateur courant"""
    docs = await DocumentModel.find(
        DocumentModel.user_id == str(current_user.id)
    ).skip(skip).limit(limit).sort("-created_at").to_list()
    
    return [_document_to_response(doc) for doc in docs]

@router.get("/documents/recent", response_model=List[DocumentResponse])
async def get_recent_documents(
    limit: int = Query(10, ge=1, le=20),
    current_user: User = Depends(get_current_user_active)
):
    """Retourne les documents récemment importés par l'utilisateur"""
    docs = await DocumentModel.find(
        DocumentModel.user_id == str(current_user.id)
    ).limit(limit).sort("-created_at").to_list()
    
    return [_document_to_response(doc) for doc in docs]

@router.get("/documents/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: str,
    current_user: User = Depends(get_current_user_active)
):
    """Récupère les détails d'un document"""
    doc = await DocumentModel.get(document_id)
    if not doc or doc.user_id != str(current_user.id):
        raise HTTPException(status_code=404, detail="Document non trouvé")
    
    return _document_to_response(doc)

@router.delete("/documents/{document_id}")
async def delete_document(
    document_id: str,
    current_user: User = Depends(get_current_user_active)
):
    """Supprime un document et son fichier"""
    doc = await DocumentModel.get(document_id)
    if not doc or doc.user_id != str(current_user.id):
        raise HTTPException(status_code=404, detail="Document non trouvé")
    
    if os.path.exists(doc.storage_path):
        os.remove(doc.storage_path)
        
    await doc.delete()
    return {"message": "Document supprimé avec succès"}
