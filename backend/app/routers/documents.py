import os
import shutil
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from fastapi.responses import JSONResponse
from datetime import datetime, timezone

from ..models.mongo_models import DocumentModel, User
from ..models.schemas import DocumentResponse, DocumentRenameRequest
from .auth import get_current_user_active
from ..tasks import process_pdf_document

router = APIRouter(
    tags=["Documents"]
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

async def generate_display_name(user_id: str, ext: str) -> str:
    """Génère un nom d'affichage incrémental pour un document"""
    count = await DocumentModel.find(
        DocumentModel.user_id == user_id
    ).count()
    return f"Document {count + 1}{ext}"

def _document_to_response(doc: DocumentModel) -> DocumentResponse:
    """Convertit un modèle DocumentModel en DocumentResponse"""
    url = f"/uploads/{doc.filename}"
    return DocumentResponse(
        id=str(doc.id),
        filename=doc.filename,
        original_name=doc.original_name,
        display_name=doc.display_name,
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
    bannette_id: Optional[str] = Query(None),
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

        display_name = await generate_display_name(str(current_user.id), ext)

        doc = DocumentModel(
            user_id=str(current_user.id),
            filename=display_name,
            original_name=file.filename,
            display_name=display_name,
            mime_type=detected_mime_type,
            size_bytes=file_size,
            storage_path=file_path,
            document_type="OTHERS",
            num_pages=0,
            bannette_id=bannette_id
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
    bannette_id: Optional[str] = Query(None),
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

            display_name = await generate_display_name(str(current_user.id), ext)

            doc = DocumentModel(
                user_id=str(current_user.id),
                filename=display_name,
                original_name=file.filename,
                display_name=display_name,
                mime_type=detected_mime_type,
                size_bytes=file_size,
                storage_path=file_path,
                document_type="OTHERS",
                bannette_id=bannette_id
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
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_user_active)
):
    """Retourne les documents récemment importés par l'utilisateur avec pagination"""
    docs = await DocumentModel.find(
        DocumentModel.user_id == str(current_user.id)
    ).skip(skip).limit(limit).sort("-created_at").to_list()
    
    return [_document_to_response(doc) for doc in docs]

@router.get("/documents/search", response_model=List[DocumentResponse])
async def search_documents(
    q: str = Query("", min_length=0),
    document_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user_active)
):
    """Recherche des documents par nom, type ou statut"""
    query = DocumentModel.user_id == str(current_user.id)
    
    if q:
        q_lower = q.lower()
        docs = await DocumentModel.find(
            DocumentModel.user_id == str(current_user.id)
        ).skip(skip).limit(limit * 2).sort("-created_at").to_list()
        
        docs = [
            doc for doc in docs 
            if q_lower in (doc.original_name or "").lower() or
               q_lower in (doc.filename or "").lower() or
               q_lower in (doc.display_name or "").lower()
        ]
        docs = docs[:limit]
        return [_document_to_response(doc) for doc in docs]
    
    if document_type:
        query = query & (DocumentModel.document_type == document_type)
    
    if status:
        query = query & (DocumentModel.status == status)
    
    docs = await DocumentModel.find(
        query
    ).skip(skip).limit(limit).sort("-created_at").to_list()
    
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

@router.patch("/documents/{document_id}", response_model=DocumentResponse)
async def rename_document(
    document_id: str,
    request: DocumentRenameRequest,
    current_user: User = Depends(get_current_user_active)
):
    """Renomme un document"""
    doc = await DocumentModel.get(document_id)
    if not doc or doc.user_id != str(current_user.id):
        raise HTTPException(status_code=404, detail="Document non trouvé")
    
    doc.display_name = request.display_name
    doc.updated_at = datetime.now(timezone.utc)
    await doc.save()
    
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

@router.get("/documents/by-bannette/{bannette_id}", response_model=List[DocumentResponse])
async def get_documents_by_bannette(
    bannette_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_user_active)
):
    """Récupère les documents d'une bannette spécifique"""
    docs = await DocumentModel.find(
        DocumentModel.user_id == str(current_user.id) &
        (DocumentModel.bannette_id == bannette_id)
    ).skip(skip).limit(limit).sort("-created_at").to_list()

    return [_document_to_response(doc) for doc in docs]
