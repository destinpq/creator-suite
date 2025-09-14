#!/usr/bin/env python3
"""PM2 entrypoint: ensure bcrypt.__about__.__version__ exists before passlib loads.

This script patches the bcrypt module if needed, then starts uvicorn programmatically
so the patch is guaranteed to be applied early in the process lifecycle.
"""
import importlib
import sys
import types
import os


def ensure_bcrypt_about():
    try:
        bcrypt = importlib.import_module("bcrypt")
    except Exception:
        # bcrypt not installed; nothing to do
        return

    if not hasattr(bcrypt, "__about__"):
        # Try to determine version from importlib.metadata or pkg_resources
        version = None
        try:
            # Python 3.8+
            from importlib.metadata import version as _version, PackageNotFoundError
            try:
                version = _version("bcrypt")
            except PackageNotFoundError:
                version = None
        except Exception:
            try:
                import pkg_resources

                try:
                    version = pkg_resources.get_distribution("bcrypt").version
                except Exception:
                    version = None
            except Exception:
                version = None

        about = types.SimpleNamespace()
        about.__version__ = version or "0"
        setattr(bcrypt, "__about__", about)
    # ensure the bcrypt module in sys.modules is the same object
    try:
        import sys as _sys

        _sys.modules.setdefault("bcrypt", bcrypt)
    except Exception:
        pass


def main():
    # apply shim early
    ensure_bcrypt_about()
    # debug: print whether the about attribute is present
    try:
        import bcrypt as _bcrypt

        print("pm2_entry: bcrypt_has_about", hasattr(_bcrypt, "__about__"), getattr(_bcrypt, "__about__", None))
        sys.stdout.flush()
    except Exception as _e:
        print("pm2_entry: bcrypt import failed:", _e, file=sys.stderr)
        sys.stderr.flush()

    # Start uvicorn programmatically so nothing imports bcrypt before our shim
    try:
        import uvicorn

        # Determine host/port from env or defaults
        host = os.environ.get("UVICORN_HOST", "0.0.0.0")
        port = int(os.environ.get("UVICORN_PORT", "55556"))

        # Run uvicorn with main:app from this package
        uvicorn.run("main:app", host=host, port=port)
    except Exception as exc:
        print("failed to start uvicorn:", exc, file=sys.stderr)
        raise


if __name__ == "__main__":
    main()
