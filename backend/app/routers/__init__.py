from .scan_profiles import router as scan_profiles_router
from .documents import router as documents_router
from .bannettes import router as bannettes_router

__all__ = ["scan_profiles_router", "documents_router", "bannettes_router"]
