"""API routers."""

from .auth import router as auth_router
from .users import router as users_router
from .products import router as products_router
from .bookings import router as bookings_router
from .quotes import router as quotes_router
from .orders import router as orders_router
from .jobs import router as jobs_router
from .invoices import router as invoices_router
from .payments import router as payments_router
from .public import router as public_router

__all__ = [
    "auth_router",
    "users_router",
    "products_router",
    "bookings_router",
    "quotes_router",
    "orders_router",
    "jobs_router",
    "invoices_router",
    "payments_router",
    "public_router",
]
