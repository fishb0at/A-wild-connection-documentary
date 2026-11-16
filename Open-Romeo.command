#!/bin/zsh
cd -- "${0:A:h}" || exit 1
exec python3 - <<'PY'
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from threading import Timer
from pathlib import Path
import webbrowser
handler = partial(SimpleHTTPRequestHandler, directory=str(Path.cwd()))
with ThreadingHTTPServer(('127.0.0.1', 0), handler) as server:
    url = f'http://127.0.0.1:{server.server_port}/'
    print(f'Romeo is available at {url}\nKeep this window open while viewing the site. Press Control-C to stop.', flush=True)
    timer = Timer(0.3, webbrowser.open, args=(url,))
    timer.daemon = True
    timer.start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
PY
