import asyncio
import base64
from playwright.async_api import async_playwright
from app.core.config import settings

class VisionBrowser:
    def __init__(self):
        self.width = settings.DEFAULT_VIEWPORT_WIDTH
        self.height = settings.DEFAULT_VIEWPORT_HEIGHT


    async def capture_page_snapshot(self, url:str):
        async with async_playwright() as p:

            browser = await p.chromium.launch(headless=True)

            context = await browser.new_context(
                viewport={
                    "width": self.width,
                    "height": self.height
                },
                device_scale_factor=1,
            )

            page = await context.new_page()

            try:
                await page.goto(url, wait_until="networkidle", timeout=30000)
                screenshot = await page.screenshot(full_page=False)
                encoded_screenshot = base64.b64encode(screenshot).decode("utf-8")

                current_url = page.url
                title = await page.title()

                return {
                    "success": True,
                    "title": title,
                    "current_url": current_url,
                    "base64_screenshot": encoded_screenshot,
                    "viewport": {
                        "width": self.width,
                        "height": self.height
                    }
                }
            
            except Exception as e:
                return {
                    "success": False,
                    "error": str(e)
                }
            finally:
                await context.close()
                await browser.close()


    @staticmethod
    def normalize_coordinates(absolute_x:float, absolute_y:float, viewport_width:int, viewport_height:int):
        normalized_x = round(absolute_x / viewport_width, 4)
        normalized_y = round(absolute_y / viewport_height, 4)
        return {"x": normalized_x, "y": normalized_y}
    
    @staticmethod
    def denormalize_coordinates(normalized_x:float, normalized_y:float, viewport_width:int, viewport_height:int):
        absolute_x = round(normalized_x * viewport_width)
        absolute_y = round(normalized_y * viewport_height)
        return {"x": absolute_x, "y": absolute_y}