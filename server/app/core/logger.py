import logging
import sys
from loguru import logger
from app.core.config import settings

class LogHandler(logging.Handler):
    def emit(self, record):
        try:
            level = logger.level(record.levelname).name
        except ValueError:
            level = record.levelno
        
        frame, depth = logging.currentframe(), 2
        while frame.f_code.co_filename == logging.__file__:
            frame = frame.f_back
            depth += 1

        logger.opt(depth=depth, exception=record.exc_info).log(level, record.getMessage())
    
def setup_logging():
    """Configures app-wide logging: stdlib handlers replaced with Loguru, console + file sinks."""
    logging.root.handlers = [LogHandler()]
    logging.root.setLevel(settings.LOG_LEVEL)

    for name in logging.root.manager.loggerDict.keys():
        logging.getLogger(name).handlers = []
        logging.getLogger(name).propagate = True

    logger.remove()

    logger.add(
        sys.stdout,
        level=settings.LOG_LEVEL,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
               "<level>{level: <8}</level> | "
               "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>"
    )

    logger.add(
        settings.LOG_FILE_PATH,
        rotation="10 MB",
        retention="30 days",
        level="INFO",
        compression="zip",
        enqueue=True,
    )

    logger.info("Logging configured (level: {})", settings.LOG_LEVEL)