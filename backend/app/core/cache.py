import redis
import json
from typing import Optional, Any
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class RedisCache:
    """Redis caching service"""

    def __init__(self):
        self.enabled = settings.REDIS_ENABLED
        self.ttl = settings.CACHE_TTL_SECONDS
        self.client = None

        if self.enabled:
            try:
                self.client = redis.from_url(
                    settings.REDIS_URL,
                    decode_responses=True,
                    socket_connect_timeout=5
                )
                # Test connection
                self.client.ping()
                logger.info("Redis connection established")
            except Exception as e:
                logger.warning(f"Redis connection failed: {e}. Caching disabled.")
                self.enabled = False
                self.client = None

    def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        if not self.enabled or not self.client:
            return None

        try:
            value = self.client.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logger.error(f"Redis GET error: {e}")
            return None

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set value in cache"""
        if not self.enabled or not self.client:
            return False

        try:
            serialized = json.dumps(value, default=str)
            self.client.setex(
                key,
                ttl or self.ttl,
                serialized
            )
            return True
        except Exception as e:
            logger.error(f"Redis SET error: {e}")
            return False

    def delete(self, key: str) -> bool:
        """Delete key from cache"""
        if not self.enabled or not self.client:
            return False

        try:
            self.client.delete(key)
            return True
        except Exception as e:
            logger.error(f"Redis DELETE error: {e}")
            return False

    def delete_pattern(self, pattern: str) -> bool:
        """Delete all keys matching pattern"""
        if not self.enabled or not self.client:
            return False

        try:
            keys = self.client.keys(pattern)
            if keys:
                self.client.delete(*keys)
            return True
        except Exception as e:
            logger.error(f"Redis DELETE_PATTERN error: {e}")
            return False

    def clear(self) -> bool:
        """Clear all cache"""
        if not self.enabled or not self.client:
            return False

        try:
            self.client.flushdb()
            return True
        except Exception as e:
            logger.error(f"Redis CLEAR error: {e}")
            return False

    def exists(self, key: str) -> bool:
        """Check if key exists"""
        if not self.enabled or not self.client:
            return False

        try:
            return bool(self.client.exists(key))
        except Exception as e:
            logger.error(f"Redis EXISTS error: {e}")
            return False


# Global cache instance
cache = RedisCache()


# Cache key generators
def slots_cache_key(from_date: str, to_date: str) -> str:
    """Generate cache key for available slots"""
    return f"slots:{from_date}:{to_date}"


def user_appointments_cache_key(user_id: int) -> str:
    """Generate cache key for user appointments"""
    return f"user_appointments:{user_id}"


def admin_stats_cache_key() -> str:
    """Generate cache key for admin dashboard stats"""
    return "admin:stats"


# Cache invalidation helpers
def invalidate_slots_cache():
    """Invalidate all slots cache"""
    cache.delete_pattern("slots:*")


def invalidate_user_cache(user_id: int):
    """Invalidate specific user cache"""
    cache.delete(user_appointments_cache_key(user_id))


def invalidate_admin_cache():
    """Invalidate admin cache"""
    cache.delete(admin_stats_cache_key())
