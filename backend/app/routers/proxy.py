from fastapi import APIRouter, HTTPException
import requests
from fastapi.responses import Response

router = APIRouter(prefix="/proxy", tags=["Proxy"])

SCAN_API_BASE_URL = "http://192.168.100.12:5000"


@router.get("/scan-image")
async def get_scan_image(path: str):
    """
    Proxy pour récupérer les images scannées depuis le backend de scan
    Évite les problèmes CORS entre le frontend et le backend de scan
    """
    try:
        encoded_path = path.replace("/", "\\") if "/" not in path else path
        image_url = f"{SCAN_API_BASE_URL}/api/WiaScanner/image?path={encoded_path}"
        response = requests.get(image_url, stream=True)

        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Failed to fetch image from scan backend: {response.text}"
            )

        content_type = response.headers.get('content-type', 'image/png')

        return Response(
            content=response.content,
            media_type=content_type,
            headers={
                "Cache-Control": "public, max-age=3600",
            }
        )
    except requests.RequestException as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching image from scan backend: {str(e)}"
        )
