"""
sitecustomize.py

This file is automatically imported by Python on startup when found on sys.path.
It monkeypatches the `bcrypt` module to add a minimal `__about__` object with
`__version__` when it's missing so `passlib` can read the bcrypt version without
raising an AttributeError.

This is a small runtime shim to avoid editing site-packages. It's safe and
idempotent.
"""
import importlib
import types

def _ensure_bcrypt_about():
    try:
        bcrypt = importlib.import_module("bcrypt")
    except Exception:
        return

    if hasattr(bcrypt, "__about__"):
        return

    # Try to determine installed bcrypt version via importlib.metadata
    version = None
    try:
        # Python 3.8+ importlib.metadata
        import importlib.metadata as _ilm
        try:
            version = _ilm.version("bcrypt")
        except Exception:
            version = None
    except Exception:
        version = None

    # Fallback to pkg_resources if available
    if not version:
        try:
            import pkg_resources as _pr
            try:
                version = _pr.get_distribution("bcrypt").version
            except Exception:
                version = None
        except Exception:
            version = None

    about = types.SimpleNamespace(__version__=version)
    try:
        setattr(bcrypt, "__about__", about)
    except Exception:
        # Last-resort: inject into module dict
        bcrypt.__dict__["__about__"] = about


_ensure_bcrypt_about()
