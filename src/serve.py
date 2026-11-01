from __future__ import annotations

import http.server
import os
import pathlib
import threading
import webbrowser

HOST = os.environ.get("MIJIAN_HOST", "127.0.0.1")
PORT = int(os.environ.get("MIJIAN_PORT", "4174"))
NO_BROWSER = os.environ.get("MIJIAN_NO_BROWSER") == "1"
ROOT = pathlib.Path(__file__).resolve().parent


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, format: str, *args) -> None:
        # Keep the preview console quiet; the browser is the feedback surface.
        pass


def open_preview() -> None:
    webbrowser.open(f"http://{HOST}:{PORT}/?fresh=1")


def main() -> None:
    try:
        server = http.server.ThreadingHTTPServer((HOST, PORT), Handler)
    except OSError:
        print(f"Port {PORT} is already in use. Opening the existing preview instead.")
        open_preview()
        return

    print()
    print("  MIJIAN / AI SCREENWRITING PROTOTYPE")
    print(f"  Preview: http://{HOST}:{PORT}")
    print("  Press Ctrl+C to stop.")
    print()
    if not NO_BROWSER:
        threading.Timer(0.55, open_preview).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n  Preview stopped.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
