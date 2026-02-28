#!/usr/bin/env python3
"""
Open browser with tabs for all Shattaf apps, auto-logged in.

Launches Chrome with CDP, connects via Playwright to clear stale sessions,
fill login forms, and disconnect — leaving Chrome open with active sessions.

Usage:
    python scripts/open-browsers.py            # Open + auto-login
    python scripts/open-browsers.py --no-login # Open without auto-login
    python scripts/open-browsers.py --no-detach # Wait for browser to close
"""

import argparse
import shutil
import subprocess
import sys
import time
from pathlib import Path

# ── App definitions with credentials ──────────────────────────────────

APPS = [
    {
        "name": "Web Admin",
        "url": "http://localhost:3002",
        "login_url": "http://localhost:3002/login",
        "email": "admin@test.com",
        "password": "admin123",
    },
    {
        "name": "Web Pro",
        "url": "http://localhost:3001",
        "login_url": "http://localhost:3001/login",
        "email": "plumber@test.com",
        "password": "plumber123",
    },
    {
        "name": "Web Client",
        "url": "http://localhost:3003",
        "login_url": "http://localhost:3003/login",
        "email": "customer@test.com",
        "password": "customer123",
    },
    {
        "name": "API Docs",
        "url": "http://localhost:8010/docs",
        "login_url": None,
        "email": None,
        "password": None,
    },
]

CDP_PORT = 9222


# ── Browser detection ─────────────────────────────────────────────────

def get_system_chrome():
    """Find system-installed Chrome/Chromium."""
    candidates = [
        "/usr/bin/google-chrome",
        "/usr/bin/google-chrome-stable",
        "/opt/google/chrome/chrome",
        "/usr/bin/chromium",
        "/usr/bin/chromium-browser",
        "/snap/bin/chromium",
        "/usr/bin/brave-browser",
        "/opt/brave.com/brave/brave",
    ]
    for path in candidates:
        if Path(path).exists():
            return path

    for name in ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser", "brave-browser"]:
        found = shutil.which(name)
        if found:
            return found
    return None


def get_playwright_chromium():
    """Get the path to the Playwright Chromium executable (fallback)."""
    if sys.platform == "linux":
        browsers_path = Path.home() / ".cache" / "ms-playwright"
    elif sys.platform == "darwin":
        browsers_path = Path.home() / "Library" / "Caches" / "ms-playwright"
    else:
        browsers_path = Path.home() / "AppData" / "Local" / "ms-playwright"

    chromium_dirs = sorted(browsers_path.glob("chromium-*"), reverse=True)
    if chromium_dirs:
        chromium_dir = chromium_dirs[0]
        if sys.platform == "linux":
            for subdir in ["chrome-linux64", "chrome-linux"]:
                chrome_path = chromium_dir / subdir / "chrome"
                if chrome_path.exists():
                    return str(chrome_path)
        elif sys.platform == "darwin":
            return str(chromium_dir / "chrome-mac" / "Chromium.app" / "Contents" / "MacOS" / "Chromium")
    return None


def check_apparmor_sandbox():
    """Check if AppArmor user namespace restriction is enabled (Ubuntu 24.04+)."""
    try:
        with open("/proc/sys/kernel/apparmor_restrict_unprivileged_userns") as f:
            return f.read().strip() == "1"
    except FileNotFoundError:
        return False


# ── Chrome launcher ───────────────────────────────────────────────────

def launch_chrome(chrome_path, user_data_dir, using_system, urls, debug_port=None):
    """Launch Chrome with optional CDP debugging port."""
    cmd = [
        chrome_path,
        f"--user-data-dir={user_data_dir}",
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-infobars",
        "--disable-background-timer-throttling",
        "--disable-backgrounding-occluded-windows",
        "--disable-renderer-backgrounding",
    ]

    if debug_port:
        cmd.append(f"--remote-debugging-port={debug_port}")

    if check_apparmor_sandbox() and not using_system:
        cmd.append("--no-sandbox")

    cmd.extend(urls)

    proc = subprocess.Popen(
        cmd,
        start_new_session=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        stdin=subprocess.DEVNULL,
    )
    return proc


# ── Auto-login via CDP ────────────────────────────────────────────────

def auto_login():
    """Connect to Chrome via CDP, clear stale auth, login each app, disconnect."""
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("  Playwright not installed, skipping auto-login")
        print("    Install: pip install playwright && playwright install chromium")
        return False

    print("  Connecting to browser via CDP...")

    with sync_playwright() as p:
        # Retry CDP connection (Chrome may still be starting)
        browser = None
        for attempt in range(8):
            try:
                browser = p.chromium.connect_over_cdp(f"http://localhost:{CDP_PORT}")
                break
            except Exception:
                if attempt < 7:
                    time.sleep(1)

        if not browser:
            print("  Could not connect to browser via CDP")
            return False

        context = browser.contexts[0]

        # Keep existing tabs as placeholder (closing all tabs kills the context)
        existing_pages = list(context.pages)

        for app in APPS:
            name = app["name"]

            if not app["login_url"]:
                # Non-login page (API Docs) — just open it
                page = context.new_page()
                try:
                    page.goto(app["url"], wait_until="domcontentloaded", timeout=15000)
                    print(f"    {name}: opened")
                except Exception:
                    print(f"    {name}: could not load (server not ready?)")
                continue

            print(f"    {name} -> {app['email']}...")
            page = context.new_page()

            try:
                # Clear stale auth for this origin
                page.goto(app["url"], wait_until="domcontentloaded", timeout=10000)
                page.evaluate("() => { localStorage.clear(); sessionStorage.clear(); }")

                # Navigate to login
                page.goto(app["login_url"], wait_until="networkidle", timeout=15000)
                page.wait_for_selector('input[type="email"], input[name="email"]', timeout=5000)
                time.sleep(0.5)

                # Fill login form
                page.locator('input[type="email"], input[name="email"]').first.fill(app["email"])
                page.locator('input[type="password"], input[name="password"]').first.fill(app["password"])
                time.sleep(0.3)

                # Submit
                page.locator('button[type="submit"]').first.click()

                # Wait for redirect away from login page
                page.wait_for_url(lambda url: "/login" not in url, timeout=10000)
                print(f"    {name}: logged in -> {page.url}")

            except Exception as e:
                err = str(e).split("\n")[0][:80]
                print(f"    {name}: FAILED ({err})")

        # Close the original placeholder tabs (about:blank, new-tab, etc.)
        for pg in existing_pages:
            if pg.url in ("about:blank", "chrome://newtab/", "chrome://new-tab-page/"):
                try:
                    pg.close()
                except Exception:
                    pass

        # Disconnect from CDP — Chrome stays open
        browser.close()

    return True


# ── Main ──────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Open browser with all Shattaf apps")
    parser.add_argument("--no-detach", action="store_true", help="Wait for browser to close")
    parser.add_argument("--no-login", action="store_true", help="Skip auto-login")
    parser.add_argument("--playwright", action="store_true", help="Force Playwright browser")
    args = parser.parse_args()

    print("\n" + "=" * 50)
    print("  Shattaf Browser Launcher")
    print("=" * 50)

    # ── Find browser binary ──
    chrome_path = None
    using_system = False

    if not args.playwright:
        chrome_path = get_system_chrome()
        if chrome_path:
            using_system = True
            print(f"  Browser: {chrome_path}")

    if not chrome_path:
        chrome_path = get_playwright_chromium()
        if chrome_path:
            print(f"  Browser: Playwright Chromium ({chrome_path})")
        else:
            print("  Error: No browser found.")
            print("  Install Chrome or run: playwright install chromium")
            sys.exit(1)

    user_data_dir = Path.home() / ".shattaf-browser"
    user_data_dir.mkdir(exist_ok=True)

    need_login = not args.no_login

    # ── Print plan ──
    print()
    for app in APPS:
        if app["login_url"] and need_login:
            print(f"  {app['name']:12s} {app['url']:30s} -> {app['email']}")
        else:
            print(f"  {app['name']:12s} {app['url']}")

    # ── Launch Chrome ──
    if need_login:
        proc = launch_chrome(chrome_path, user_data_dir, using_system, ["about:blank"], CDP_PORT)
        print(f"\n  Chrome PID: {proc.pid}")
        print("  Waiting for browser to start...")
        time.sleep(3)

        auto_login()
    else:
        urls = [app["url"] for app in APPS]
        proc = launch_chrome(chrome_path, user_data_dir, using_system, urls)
        print(f"\n  Chrome PID: {proc.pid}")

    # ── Wait or detach ──
    if args.no_detach:
        print("\n  Browser running... Press Ctrl+C to close.")
        try:
            proc.wait()
        except KeyboardInterrupt:
            print("\n  Closing browser...")
            proc.terminate()
    else:
        print()
        print("=" * 50)
        print("  Browser ready!")
        print("=" * 50)
        print(f"\n  Session data: {user_data_dir}")
        print("  Close the browser window manually when done.\n")


if __name__ == "__main__":
    main()
