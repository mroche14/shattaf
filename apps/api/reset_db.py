"""Reset database for re-seeding."""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def reset():
    e = create_async_engine("postgresql+asyncpg://postgres:postgres@localhost:5434/shattaf")
    async with e.begin() as conn:
        result = await conn.execute(text(
            "SELECT tablename FROM pg_tables "
            "WHERE schemaname = 'public' AND tablename <> 'alembic_version'"
        ))
        tables = [row[0] for row in result.fetchall()]
        if tables:
            table_list = ", ".join(tables)
            await conn.execute(text(f"TRUNCATE {table_list} CASCADE"))
            print(f"Truncated {len(tables)} tables: {table_list}")
    await e.dispose()

asyncio.run(reset())
