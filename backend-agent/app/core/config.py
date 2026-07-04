import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
    GITHUB_TOKEN: str = os.getenv("GITHUB_TOKEN", "")
    DEFAULT_VIEWPORT_WIDTH: int = int(os.getenv("DEFAULT_VIEWPORT_WIDTH", 1280))
    DEFAULT_VIEWPORT_HEIGHT: int = int(os.getenv("DEFAULT_VIEWPORT_HEIGHT", 720))

settings = Settings()