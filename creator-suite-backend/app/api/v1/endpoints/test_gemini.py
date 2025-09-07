from fastapi import APIRouter, HTTPException
import httpx
from app.core.config import settings


router = APIRouter()


@router.get("/test-gemini", tags=["test"])
async def test_gemini() -> dict:
    """
    Test Google Gemini 2.5 Flash by calling the public REST API.

    Returns the raw JSON response from the model.
    """
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not configured")

    headers = {
        "x-goog-api-key": api_key,
        "Content-Type": "application/json",
    }

    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        "gemini-2.5-flash:generateContent"
    )

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": "Say 'pong' if you can read this."}
                ]
            }
        ]
    }

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(url, headers=headers, json=payload)
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=response.text)
        return response.json()


