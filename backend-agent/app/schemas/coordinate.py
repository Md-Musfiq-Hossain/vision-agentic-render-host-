from pydantic import BaseModel, HttpUrl, Field

class ScrapeRequest(BaseModel):
    url: HttpUrl
    target_element: str = Field(..., description="Description of element to locate") # The '...' makes it strictly required and non-nullable