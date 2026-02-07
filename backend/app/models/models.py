from sqlalchemy import Column, String, Integer, Enum
from sqlalchemy.orm import declarative_base
from ..database import Base
import enum


class BaseModel(Base):
    __abstract__ = True

    def to_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}


class BlankPageEnum(str, enum.Enum):
    no = "0"
    yes = "1"


class DefaultEnum(str, enum.Enum):
    no = "0"
    yes = "1"


class ScanProfile(BaseModel):
    __tablename__ = "scan_profiles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    libele = Column(String(255), unique=True, nullable=False)
    paper_size = Column(String(50), nullable=False, default="A4")
    horizontal_align = Column(String(50), nullable=False, default="center")
    resolution = Column(Integer, nullable=False, default=150)
    scale = Column(String(20), nullable=False, default="100%")
    brightness = Column(Integer, nullable=False, default=50)  # Note: corrigé depuis 'brithness'
    contrast = Column(Integer, nullable=False, default=50)
    blank_page = Column(String(1), Enum(BlankPageEnum), nullable=False, default="0")
    sensibility = Column(String(50), nullable=True)
    default = Column(String(1), Enum(DefaultEnum), nullable=False, default="0")

    def __repr__(self):
        return f"<ScanProfile(id={self.id}, libele={self.libele})>"
