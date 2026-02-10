"""
Modèles pour la classification et la gestion des pages
"""
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class PageClassification(Base):
    """
    Classification d'une page dans un type de document
    """
    __tablename__ = "page_classifications"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    page_number = Column(Integer, nullable=False)
    type_id = Column(Integer, ForeignKey("document_types.id"), nullable=False)
    instance_name = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    # document = relationship("Document", back_populates="classifications")
    # document_type = relationship("DocumentType", back_populates="classifications")

    def to_dict(self):
        return {
            "id": self.id,
            "document_id": self.document_id,
            "page_number": self.page_number,
            "type_id": self.type_id,
            "instance_name": self.instance_name,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }


class Document(Base):
    """
    Document scanné ou importé
    """
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    original_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_type = Column(String(50), nullable=False)  # application/pdf, image/png, etc.
    file_size = Column(Integer, nullable=False)  # in bytes
    num_pages = Column(Integer, default=1)
    status = Column(String(20), default="pending")  # pending, processing, completed, error
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    # classifications = relationship("PageClassification", back_populates="document")

    def to_dict(self):
        return {
            "id": self.id,
            "filename": self.filename,
            "original_name": self.original_name,
            "file_type": self.file_type,
            "file_size": self.file_size,
            "num_pages": self.num_pages,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
