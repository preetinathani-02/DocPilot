from slowapi import Limiter
from slowapi.util import get_remote_address

# Applied per-client-IP. Swap the key_func for a Redis-backed store in a
# multi-instance production deployment (slowapi supports this out of the box).
limiter = Limiter(key_func=get_remote_address)
