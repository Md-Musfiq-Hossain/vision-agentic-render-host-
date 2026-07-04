import sys
import asyncio
import uvicorn

if __name__ == "__main__":
    # Force the correct event loop policy on Windows immediately at startup
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
        
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8001,
        reload=False,
    )
