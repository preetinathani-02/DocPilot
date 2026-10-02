import os
import re
import uuid

UPLOAD_DIR = "app/uploads"

os.makedirs(UPLOAD_DIR, exist_ok=True)

_SAFE_NAME_RE = re.compile(r"[^A-Za-z0-9._-]+")


def _sanitize_filename(filename: str) -> str:
    """Strip path components and unsafe characters to prevent path traversal."""
    base = os.path.basename(filename or "upload")
    base = _SAFE_NAME_RE.sub("_", base)
    return base[:255] or "upload"


async def save_file(file, owner_id: str) -> str:
    """
    Persist an uploaded file under a per-user directory with a random,
    collision-proof prefix, so users can never overwrite or read each
    other's raw files even if filenames match.
    """
    safe_name = _sanitize_filename(file.filename)
    owner_dir = os.path.join(UPLOAD_DIR, str(owner_id))
    os.makedirs(owner_dir, exist_ok=True)

    unique_name = f"{uuid.uuid4().hex}_{safe_name}"
    file_path = os.path.join(owner_dir, unique_name)

    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)

    return file_path
