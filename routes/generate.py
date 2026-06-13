from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx
import json
from config import GEMINI_API_KEY, GEMINI_MODEL

router = APIRouter()


class Component(BaseModel):
    id: str
    type: str
    x: float
    y: float
    width: float
    height: float
    props: dict


class DesignPayload(BaseModel):
    canvas_width: int
    canvas_height: int
    components: list[Component]


def build_prompt(payload: DesignPayload) -> str:
    design_json = json.dumps(payload.dict(), indent=2)
    return f"""You are an expert frontend developer.
Convert this UI design JSON into a complete, single HTML file with embedded CSS and JS.

Rules:
- The entire design must be wrapped in a div with: position:relative; width:{payload.canvas_width}px; height:{payload.canvas_height}px; background:#ffffff;
- Every component must use position:absolute with the exact left/top/width/height from the JSON
- The body must have margin:0; padding:0;
- Do NOT use flexbox or grid for layout — only position:absolute for placing elements
- Make it look polished: proper fonts, hover states, transitions
- No external libraries or CDN links
- Return ONLY raw HTML. No explanation. No markdown. No backticks. Start directly with <!DOCTYPE html>

Component types:
- button: styled button using props.label, props.bgColor, props.textColor
- input: labeled input using props.label, props.placeholder
- card: shadowed card using props.title, props.body
- heading: heading tag using props.text, props.fontSize
- navbar: nav bar using props.logo and props.links (comma-separated)
- image: img tag using props.src, props.alt

Design JSON:
{design_json}
"""


@router.post("/generate")
async def generate_code(payload: DesignPayload):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not set in .env")

    if not payload.components:
        raise HTTPException(status_code=400, detail="No components on canvas")

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"

    body = {
        "contents": [
            {"parts": [{"text": build_prompt(payload)}]}
        ],
        "generationConfig": {
            "temperature": 0.3,
            "maxOutputTokens": 8192
        }
    }

    try:
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(url, json=body)
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=502, detail=f"Gemini API error: {e.response.text}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Request failed: {str(e)}")

    try:
        code = data["candidates"][0]["content"]["parts"][0]["text"]
        # Strip markdown fences if Gemini adds them
        code = code.strip()
        if code.startswith("```"):
            code = code.split("\n", 1)[1]
            code = code.rsplit("```", 1)[0]
        return {"code": code.strip()}
    except (KeyError, IndexError) as e:
        raise HTTPException(status_code=502, detail=f"Unexpected Gemini response: {data}")
