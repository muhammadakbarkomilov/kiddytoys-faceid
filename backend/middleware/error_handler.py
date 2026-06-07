import logging
from fastapi import Request, status
from fastapi.responses import JSONResponse

logger = logging.getLogger("backend_logger")
logging.basicConfig(level=logging.INFO)

async def global_exception_handler(request: Request, exc: Exception):
    # Log the traceback details internally
    logger.error(f"Global unhandled exception on {request.url.path}: {exc}", exc_info=True)
    
    # Return a generic safe response to mask internal details
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "detail": "Serverda ichki xatolik yuz berdi. Iltimos, keyinroq urinib ko'ring."
        }
    )
