#!/usr/bin/env python3
"""Finalize Sukun release metadata and package the explicit deployment graph.

Application/runtime logic stays untouched. Release identifiers, the opening
audio URL, notes, locale entries and SRI bookkeeping require --update-shell.
All bytes are planned and validated before any production file is written.
"""
import argparse
import base64
import datetime
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import zipfile


def sha(data):
    return hashlib.sha256(data).hexdigest()


def encoded_json(value):
    return (json.dumps(value, ensure_ascii=False, indent=2) + "\n").encode()


def inline_json(value):
    return json.dumps(value, ensure_ascii=False).replace("<", "\\u003c")


def local(url):
    path = url.split("?", 1)[0].split("#", 1)[0]
    if path.startswith("./"):
        path = path[2:]
    if not path or ":" in path or "\\" in path or path.startswith("/") or any(part in ("", ".", "..") for part in path.split("/")):
        raise ValueError("Unsafe local release path: " + url)
    return str(PurePosixPath(path))


def release_version_url(url, old, new):
    return re.sub(r"([?&]v=)" + re.escape(old) + r"\b", lambda m: m[1] + new, url)


def worker_release_identity(source, old, new):
    # Asset filenames and schema revisions are immutable dependencies, not
    # release identities. Only these worker constants and release URL aliases
    # may change; REQUIRED_RUNTIME is replaced from the verified graph below.
    for name, before, after in (
        ("SURUM", old, new),
        ("CACHE_META", f"./sukun-cache-meta-{old}.json", f"./sukun-cache-meta-{new}.json"),
        ("BUILD_MARKER", f"./sukun-build-{old}.json", f"./sukun-build-{new}.json"),
    ):
        pattern = r"^(const " + name + r"\s*=\s*)(['\"])([^'\"]+)\2;"
        matches = list(re.finditer(pattern, source, flags=re.M))
        assert len(matches) == 1 and matches[0][3] in (before, after), "Unexpected worker release constant: " + name
        source = re.sub(pattern, lambda m: m[1] + m[2] + after + m[2] + ";", source, flags=re.M)
    source = release_version_url(source, old, new)
    return source.replace(f"./sukun-site-assets-{old}.json", f"./sukun-site-assets-{new}.json")


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--root", type=Path, required=True)
    p.add_argument("--from-build", default="r1054")
    p.add_argument("--build", default="r1055")
    p.add_argument("--feature", default="generic-voices")
    p.add_argument("--date", default="2026-10-12")
    p.add_argument("--notes", type=Path, help="JSON {v,t,b,translations?}")
    p.add_argument("--metadata", type=Path, help="JSON object of extra build-marker revision fields")
    p.add_argument("--update-shell", action="store_true", help="Explicitly permit index/nero release identity, notes, locale and SRI updates")
    p.add_argument("--add", action="append", default=[], help="Explicit new deployment file or directory; directory contents are included recursively")
    p.add_argument("--zip", type=Path, help="Deployment-only ZIP outside the repo")
    p.add_argument("--package-only", action="store_true", help="Verify and ZIP the finalized inventory without modifying repo")
    a = p.parse_args()
    root = a.root.resolve()
    old, new = a.from_build, a.build
    assert re.fullmatch(r"r\d+", old) and re.fullmatch(r"r\d+", new)
    assert re.fullmatch(r"[a-z0-9-]+", a.feature), "Use a plain lowercase cache feature slug"
    date = datetime.date.fromisoformat(a.date)
    if a.zip and a.zip.resolve().is_relative_to(root):
        raise ValueError("ZIP must be written outside the production repository")
    planned = {}

    def read(name):
        name = local(name)
        return planned[name] if name in planned else (root / name).read_bytes()

    def readjson(name):
        return json.loads(read(name))

    def plan(name, value):
        planned[local(name)] = value.encode() if isinstance(value, str) else value

    def version_url(url):
        return release_version_url(url, old, new)

    if not a.package_only:
        previous = readjson(f"sukun-site-assets-{old}.json")
        assert previous["build"] == old
        build = readjson(f"sukun-build-{old}.json")
        assert build["build"] == old
        notes = readjson("surumler.json")
        note = json.loads(a.notes.read_text(encoding="utf-8")) if a.notes else None
        if note:
            assert note["v"] == new and isinstance(note["b"], list) and all(isinstance(x, str) for x in note["b"])
            notes = [{k: note[k] for k in ("v", "t", "b")}] + [x for x in notes if x["v"] != new]
        else:
            assert notes[0]["v"] == new, "Provide new release notes with --notes"

        html = read("index.html").decode()
        if a.update_shell:
            # The opening player fetches its WAV through a release-pinned URL.
            # Keep that metadata in step with the shell and worker before SRI
            # is calculated; an old query cannot identify the new runtime.
            old_audio_url = build.get("startupAudioFile")
            if old_audio_url:
                for entry in build["runtime"]:
                    name = local(entry["url"])
                    if name.startswith("assets/runtime/startup-intro-") and name.endswith(".js"):
                        source = read(name).decode()
                        updated = source.replace(old_audio_url, version_url(old_audio_url))
                        if updated != source:
                            plan(name, updated)
            html = version_url(html)
            html = re.sub(r'(<meta\s+name=["\']sukun-build["\']\s+content=["\'])' + re.escape(old), lambda m: m[1] + new, html)
            html = html.replace("window.SUKUN_BUILD='" + old + "'", "window.SUKUN_BUILD='" + new + "'")
            html = html.replace("dataset.sukunBuild='" + old + "'", "dataset.sukunBuild='" + new + "'")
            html, n = re.subn(r'(<script id="surumNotlari" type="application/json">)[\s\S]*?(</script>)', lambda m: m[1] + inline_json(notes) + m[2], html)
            assert n == 1, "Embedded release note block must be unique"
            if note and note.get("translations"):
                assert isinstance(note["translations"], dict)
                ident = f"sukun-{new}-release-locale"
                html = re.sub(r'<script id="' + ident + r'">[\s\S]*?</script>\s*', "", html)
                tag = '<script id="' + ident + '">if(window.I18N?.D)Object.assign(window.I18N.D,' + inline_json(note["translations"]) + ');</script>\n'
                position = html.rfind("</body>")
                assert position >= 0
                html = html[:position] + tag + html[position:]

            def update_sri(match):
                tag = match[0]
                url = re.search(r'\b(?:src|href)=["\']([^"\']+)["\']', tag)
                if not url or re.match(r"(?:[a-z]+:|//|#)", url[1], re.I):
                    return tag
                executable = bool(re.match(r"<script\b", tag, re.I) or re.search(r'\brel=["\']stylesheet["\']', tag, re.I))
                if not executable and not re.search(r"\bintegrity=", tag):
                    return tag
                token = "sha256-" + base64.b64encode(bytes.fromhex(sha(read(url[1])))).decode()
                if re.search(r"\bintegrity=", tag):
                    return re.sub(r'\bintegrity=["\'][^"\']*["\']', 'integrity="' + token + '"', tag)
                return tag[:-1] + ' integrity="' + token + '">'

            html = re.sub(r"<(?:script|link)\b[^>]*>", update_sri, html, flags=re.I)
            plan("index.html", html)
            plan("nero.html", html)
        else:
            assert read("index.html") == read("nero.html"), "Canonical entrypoints differ"
            embedded = json.loads(re.search(r'<script id="surumNotlari" type="application/json">([\s\S]*?)</script>', html)[1])
            assert embedded == notes, "Synchronize embedded notes or explicitly use --update-shell"
        markers = re.findall(r'<meta name="sukun-build" content="([^"]+)"', html)
        assert markers and all(x == new for x in markers) and f"window.SUKUN_BUILD='{new}'" in html, "Shell identity needs release bump"
        plan("surumler.json", encoded_json(notes))
        plan("version.txt", new + "\n")
        manifest = json.loads(version_url(read("manifest.webmanifest").decode()))
        assert manifest.get("version") in (old, new), "Unexpected webmanifest release version"
        manifest["version"] = new
        plan("manifest.webmanifest", encoded_json(manifest))
        latest = readjson("sukun-latest.json")
        latest.update(latest=new, build=new, v=new, date=a.date)
        plan("sukun-latest.json", encoded_json(latest))
        if a.metadata:
            additions = json.loads(a.metadata.read_text(encoding="utf-8"))
            assert isinstance(additions, dict)
            build.update(additions)
        build.update(build=new, base=old, feature=a.feature, siteBackupManifestUrl=f"./sukun-site-assets-{new}.json")
        if not build.get("sessionVersion", "").endswith("+" + new):
            build["sessionVersion"] = build.get("sessionVersion", old) + "+" + new
        for entries in (build["runtime"], build.get("artwork", [])):
            for entry in entries:
                entry["url"] = version_url(entry["url"])
                entry["sha256"] = sha(read(entry["url"]))
        runtime_paths = {local(entry["url"]) for entry in build["runtime"]}
        for match in re.finditer(r"<(?:script|link)\b[^>]*>", html, flags=re.I):
            tag = match[0]
            url = re.search(r'\b(?:src|href)=["\']([^"\']+)["\']', tag)
            if not url or "integrity=" not in tag or re.match(r"(?:[a-z]+:|//|#)", url[1], re.I):
                continue
            name = local(url[1])
            if name not in runtime_paths:
                assert re.search(r"[?&]v=" + new + r"\b", url[1]), "New mandatory member needs versioned URL: " + url[1]
                build["runtime"].append({"url": url[1], "sha256": sha(read(name))})
                runtime_paths.add(name)
        build["shell"]["sha256"] = sha(read("nero.html"))
        if build.get("startupAudioFile"):
            build["startupAudioFile"] = version_url(build["startupAudioFile"])
            build["startupAudioSha256"] = sha(read(build["startupAudioFile"]))
        assert build["automaticDataRecovery"] is False and build["exactDataRestoreEnabled"] is False
        assert "r1019" in build["blockedRollbackBuilds"]
        plan(f"sukun-build-{new}.json", encoded_json(build))
        sw = worker_release_identity(read("sw.js").decode(), old, new)
        sw, n = re.subn(r"const CACHE = '[^']+';", f"const CACHE = 'sukun-{new}-{a.feature}-{a.date.replace('-', '')}-v1';", sw)
        assert n == 1
        sw, n = re.subn(r"const REQUIRED_RUNTIME = \[[\s\S]*?\];", "const REQUIRED_RUNTIME = " + inline_json(build["runtime"]) + ";", sw)
        assert n == 1
        plan("sw.js", sw)
        paths = {x["path"] for x in previous["files"]}
        paths.discard(f"sukun-build-{old}.json")
        paths.add(f"sukun-build-{new}.json")
        paths.update(local(x["url"]) for x in build["runtime"])
        for addition in a.add:
            addition = local(addition)
            file = root / addition
            if file.is_dir():
                paths.update(str(child.relative_to(root)) for child in file.rglob("*") if child.is_file())
            else:
                assert file.is_file(), "Missing explicitly added file: " + addition
                paths.add(addition)
        inventory = {"schema": 1, "build": new, "files": []}
        for name in sorted(paths):
            data = read(name)
            inventory["files"].append({"path": name, "sha256": sha(data), "bytes": len(data)})
        inventory["totalBytes"] = sum(x["bytes"] for x in inventory["files"])
        plan(f"sukun-site-assets-{new}.json", encoded_json(inventory))

    inventory_name = f"sukun-site-assets-{new}.json"
    inventory = readjson(inventory_name)
    assert inventory["build"] == new and read("version.txt").decode().strip() == new
    entries = inventory["files"]
    assert len({x["path"] for x in entries}) == len(entries)
    assert inventory_name not in {x["path"] for x in entries}, "Inventory must not include its own bytes"
    for entry in entries:
        data = read(entry["path"])
        assert len(data) == entry["bytes"] and sha(data) == entry["sha256"], entry["path"]
    assert sum(x["bytes"] for x in entries) == inventory["totalBytes"]
    assert read("index.html") == read("nero.html")
    # Fail before mutations if any planned metadata graph check above failed.
    for name, data in planned.items():
        temporary = root / (name + ".release-tmp")
        temporary.write_bytes(data)
        temporary.replace(root / name)
    result = {"build": new, "files": len(entries), "deploymentBytes": inventory["totalBytes"], "writtenMetadataFiles": list(planned)}
    if a.zip:
        a.zip.parent.mkdir(parents=True, exist_ok=True)
        names = sorted([x["path"] for x in entries] + [inventory_name])
        assert len(names) == len(set(names))
        assert not any(name.startswith((".git/", "tests/", "diagnostics/", "qa-")) for name in names)
        with zipfile.ZipFile(a.zip, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
            for name in names:
                info = zipfile.ZipInfo(name, (date.year, date.month, date.day, 0, 0, 0))
                info.external_attr = 0o100644 << 16
                archive.writestr(info, read(name), compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)
        with zipfile.ZipFile(a.zip) as archive:
            assert archive.namelist() == names and archive.testzip() is None
            for entry in entries:
                assert sha(archive.read(entry["path"])) == entry["sha256"]
        result.update(zip=str(a.zip.resolve()), zipFiles=len(names), zipBytes=a.zip.stat().st_size, zipSha256=sha(a.zip.read_bytes()))
        a.zip.with_suffix(a.zip.suffix + ".sha256").write_text(result["zipSha256"] + "  " + a.zip.name + "\n")
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
