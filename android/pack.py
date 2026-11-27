"""Stage the verified r1278 Android site and create the Google Play base module."""
import argparse
import hashlib
import json
import re
import shutil
from urllib.parse import urlsplit
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZIP_STORED, ZipFile
from web.android_shell import android_shell

APP = Path(__file__).resolve().parent
BUILD = APP / "build"
SITE = BUILD / "site"
RELEASE = "r1278"
INVENTORY = f"sukun-site-assets-{RELEASE}.json"
MARKER = f"sukun-build-{RELEASE}.json"


def encode_json(value):
    return (json.dumps(value, ensure_ascii=False, indent=2) + "\n").encode("utf-8")


def sha(data):
    return hashlib.sha256(data).hexdigest()


def stage(repo):
    manifest = json.loads((repo / INVENTORY).read_bytes())
    if SITE.exists() and any(SITE.iterdir()):
        raise ValueError("Use an empty build/site for staging.")
    SITE.mkdir(parents=True, exist_ok=True)
    seen = set()
    if manifest["build"] != RELEASE:
        raise ValueError("Unexpected source release")
    for entry in manifest["files"]:
        name = entry["path"]
        path = Path(name)
        if path.is_absolute() or ".." in path.parts or name in seen or name == INVENTORY:
            raise ValueError(f"Invalid source path: {name}")
        seen.add(name)
        data = (repo / path).read_bytes()
        if len(data) != entry["bytes"] or sha(data) != entry["sha256"]:
            raise ValueError(f"Unverified release asset: {name}")
        target = SITE / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
    original = (SITE / "nero.html").read_bytes()
    marker = json.loads((SITE / MARKER).read_bytes())
    if (SITE / "index.html").read_bytes() != original or sha(original) != marker["shell"]["sha256"]:
        raise ValueError("Source document hash or aliases inconsistent")
    shell = android_shell(original)
    for name in ("nero.html", "index.html"):
        (SITE / name).write_bytes(shell)
    for image in sorted((APP / "brand").rglob("*.png")):
        shutil.copyfile(image, SITE / image.relative_to(APP / "brand"))
    finalize(repo)


def update_asset_hashes(value):
    if isinstance(value, list):
        for child in value:
            update_asset_hashes(child)
    elif isinstance(value, dict):
        url = value.get("url", "")
        if isinstance(url, str) and url.startswith("./") and "sha256" in value:
            relative = Path(urlsplit(url).path.removeprefix("./"))
            if not relative.is_absolute() and ".." not in relative.parts:
                path = SITE / relative
                if path.is_file():
                    value["sha256"] = sha(path.read_bytes())
        for child in value.values():
            update_asset_hashes(child)


def finalize(repo):
    # The site backup and device repair flow consume these two manifests.
    shell = (SITE / "nero.html").read_bytes()
    if (SITE / "index.html").read_bytes() != shell:
        raise ValueError("Android entry point aliases differ")
    marker = json.loads((SITE / MARKER).read_bytes())
    update_asset_hashes(marker)
    marker["shell"]["sha256"] = sha(shell)
    (SITE / MARKER).write_bytes(encode_json(marker))
    # Branding is overlaid on the Android site. Keep the bundled worker's
    # integrity metadata in sync with the actual packaged assets.
    worker = SITE / "sw.js"
    worker_source = worker.read_text(encoding="utf-8")
    for constant, field in (("REQUIRED_RUNTIME", "runtime"), ("OPTIONAL_AUDIO", "optionalAudio")):
        entries = json.dumps(marker[field], ensure_ascii=False).replace("<", "\\u003c")
        worker_source, replaced = re.subn(
            rf"const {constant} = \[[\s\S]*?\];",
            lambda _: f"const {constant} = {entries};",
            worker_source,
        )
        if replaced != 1:
            raise ValueError(f"Expected one worker asset table: {constant}")
    worker.write_text(worker_source, encoding="utf-8")
    source_inventory = json.loads((repo / INVENTORY).read_bytes())
    entries = []
    for path in sorted(SITE.rglob("*")):
        if not path.is_file() or path.name == INVENTORY:
            continue
        data = path.read_bytes()
        entries.append({"path": path.relative_to(SITE).as_posix(), "sha256": sha(data), "bytes": len(data)})
    source_inventory["files"] = entries
    source_inventory["totalBytes"] = sum(row["bytes"] for row in entries)
    (SITE / INVENTORY).write_bytes(encode_json(source_inventory))
    print(f'{len(entries)} assets; {source_inventory["totalBytes"]:,} uncompressed bytes')


def add_sources(repo, out):
    files = [APP / name for name in ("AndroidManifest.xml", "pack.py", "compile.py", "BUILD.txt", "bundle-config.json")]
    for folder in ("web", "src", "res", "policy-content", "brand"):
        for file in sorted((APP / folder).rglob("*")):
            if file.is_file() and "__pycache__" not in file.parts and not file.name.startswith("test"):
                files.append(file)
    with ZipFile(out, "w", compression=ZIP_DEFLATED) as archive:
        for file in files:
            archive.write(file, file.relative_to(APP))
        archive.write(repo / "LICENSE", "LICENSE")


def module(repo):
    finalize(repo)
    add_sources(repo, BUILD / "android-source.zip")
    with ZipFile(BUILD / "linked.apk") as linked, ZipFile(BUILD / "base.zip", "w", compression=ZIP_STORED) as base:
        for file in linked.infolist():
            name = "manifest/AndroidManifest.xml" if file.filename == "AndroidManifest.xml" else file.filename
            base.writestr(name, linked.read(file))
        base.write(BUILD / "classes.dex", "dex/classes.dex")
        base.write(BUILD / "android-source.zip", "assets/android-source.zip")
        for file in sorted(SITE.rglob("*")):
            if file.is_file():
                base.write(file, "assets/sukun/" + file.relative_to(SITE).as_posix())


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("step", choices=["stage", "finalize", "module"])
    parser.add_argument("repo", type=Path)
    args = parser.parse_args()
    {"stage": stage, "finalize": finalize, "module": module}[args.step](args.repo.resolve())
