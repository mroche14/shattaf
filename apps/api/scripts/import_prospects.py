#!/usr/bin/env python3
"""CLI script to import plumber prospects from CSV."""

import argparse
import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.database import init_db, close_db, async_session_factory
from src.services.prospect import ProspectService


async def import_csv(csv_path: str, dry_run: bool = False) -> None:
    """Import prospects from CSV file."""
    # Initialize database
    await init_db()

    try:
        # Read CSV file
        path = Path(csv_path)
        if not path.exists():
            print(f"Error: File not found: {csv_path}")
            return

        # Try different encodings
        csv_content = None
        for encoding in ['utf-8', 'latin-1', 'cp1252']:
            try:
                csv_content = path.read_text(encoding=encoding)
                print(f"✓ File read with encoding: {encoding}")
                break
            except UnicodeDecodeError:
                continue

        if csv_content is None:
            print("Error: Unable to decode CSV file")
            return

        # Count lines for preview
        lines = csv_content.strip().split('\n')
        print(f"✓ Found {len(lines) - 1} rows (excluding header)")

        if dry_run:
            print("\n[DRY RUN] Would import the following:")
            # Show first 5 rows as preview
            import csv
            from io import StringIO
            reader = csv.DictReader(StringIO(csv_content))
            for i, row in enumerate(reader):
                if i >= 5:
                    print(f"  ... and {len(lines) - 6} more rows")
                    break
                name = row.get('raison_sociale') or f"{row.get('prenom_dirigeant', '')} {row.get('nom_dirigeant', '')}".strip()
                dept = row.get('departement', 'N/A')
                tel = row.get('telephone', 'N/A')
                print(f"  [{dept}] {name} - {tel}")
            return

        # Create session and import
        async with async_session_factory() as session:
            service = ProspectService(session)
            result = await service.import_csv(csv_content)

            print(f"\n✓ Import completed:")
            print(f"  Total rows: {result.total_rows}")
            print(f"  Created: {result.created}")
            print(f"  Updated: {result.updated}")

            if result.errors:
                print(f"\n⚠ Errors ({len(result.errors)}):")
                for error in result.errors[:10]:
                    print(f"  - {error}")
                if len(result.errors) > 10:
                    print(f"  ... and {len(result.errors) - 10} more errors")

    finally:
        await close_db()


def main():
    parser = argparse.ArgumentParser(description="Import plumber prospects from CSV")
    parser.add_argument(
        "--csv",
        required=True,
        help="Path to CSV file to import"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview import without making changes"
    )

    args = parser.parse_args()

    asyncio.run(import_csv(args.csv, args.dry_run))


if __name__ == "__main__":
    main()
