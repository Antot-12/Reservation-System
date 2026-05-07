from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool, NullPool
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Configure engine based on database type
is_sqlite = settings.DATABASE_URL.startswith('sqlite')
is_postgresql = settings.DATABASE_URL.startswith('postgresql')

engine_kwargs = {}

if is_sqlite:
    # SQLite: Use NullPool for better concurrency, disable check_same_thread
    engine_kwargs = {
        "connect_args": {"check_same_thread": False},
        "poolclass": NullPool,
    }
elif is_postgresql:
    # PostgreSQL: Optimize connection pooling
    engine_kwargs = {
        "poolclass": QueuePool,
        "pool_size": 20,              # Number of connections to keep in pool
        "max_overflow": 30,           # Additional connections when pool exhausted
        "pool_pre_ping": True,        # Verify connections before using
        "pool_recycle": 3600,         # Recycle connections after 1 hour
        "pool_timeout": 30,           # Timeout waiting for connection (seconds)
        "echo_pool": False,           # Set to True for pool debugging
        "connect_args": {
            "connect_timeout": 10,    # Connection timeout
            "options": "-c statement_timeout=30000"  # Query timeout (30 seconds)
        }
    }
else:
    # Other databases: Basic optimization
    engine_kwargs = {
        "pool_pre_ping": True,
        "pool_recycle": 3600,
        "pool_size": 10,
        "max_overflow": 20,
    }

# Create engine with optimizations
engine = create_engine(
    settings.DATABASE_URL,
    **engine_kwargs,
    echo=False  # Set to True for SQL debugging
)

# Log pool events for monitoring (optional, can be disabled in production)
@event.listens_for(engine, "connect")
def receive_connect(dbapi_conn, connection_record):
    logger.debug("Database connection established")

@event.listens_for(engine, "checkout")
def receive_checkout(dbapi_conn, connection_record, connection_proxy):
    logger.debug("Connection checked out from pool")

@event.listens_for(engine, "checkin")
def receive_checkin(dbapi_conn, connection_record):
    logger.debug("Connection returned to pool")

# Session factory with optimizations
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False  # Don't expire objects after commit for better performance
)

Base = declarative_base()


def get_db():
    """
    Dependency for FastAPI routes.
    Yields a database session and ensures it's closed after use.
    """
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        db.rollback()
        logger.error(f"Database session error: {e}")
        raise
    finally:
        db.close()


def get_db_context():
    """
    Context manager for database sessions.
    Use in non-FastAPI contexts (e.g., background tasks).

    Example:
        with get_db_context() as db:
            result = db.query(Model).all()
    """
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Database context error: {e}")
        raise
    finally:
        db.close()


def close_db_connections():
    """
    Close all database connections in the pool.
    Call this on application shutdown.
    """
    logger.info("Closing database connection pool")
    engine.dispose()


def get_pool_status():
    """
    Get current connection pool status for monitoring.
    Returns dict with pool metrics.
    """
    pool = engine.pool
    return {
        "size": pool.size(),
        "checked_in": pool.checkedin(),
        "checked_out": pool.checkedout(),
        "overflow": pool.overflow(),
        "total_connections": pool.size() + pool.overflow()
    }

