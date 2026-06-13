from dotenv import load_dotenv
import os
from pathlib import Path

load_dotenv(dotenv_path=Path(__file__).parent / ".env")

GEMINI_API_KEY =os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = "gemini-2.5-flash"
CANVAS_DEFAULT_W = 1100
CANVAS_DEFAULT_H = 680


