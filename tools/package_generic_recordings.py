#!/usr/bin/env python3
"""Validate voice JSON backups and atomically package an optional audio bank.

The source backup remains outside the output. Settings, counters, timestamps,
backup IDs and other personal metadata are never copied into generated assets.
Native exact-recovery backups are intentionally refused rather than bypassing
that format's separate checksum. Export 'Tüm sesleri yedekle' for this tool.
"""
from __future__ import annotations

import argparse
import base64
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import sys
import tempfile
from dataclasses import dataclass
from typing import Any

APP = "SUKUN_GENERIC_RECORDINGS"
MAX_JSON = 96 * 1024 * 1024
MAX_BYTES = 64 * 1024 * 1024
MAX_CLIP = 8 * 1024 * 1024
MAX_RECORDS = 2000
KEY = re.compile(r"[A-Za-z0-9_.:-]{1,200}\Z")
MIME = re.compile(r'audio/[A-Za-z0-9.+-]+(?:;\s*[A-Za-z0-9.+_-]+=(?:"[A-Za-z0-9., +_/-]+"|[A-Za-z0-9., +_/-]+))*\Z', re.ASCII | re.IGNORECASE)
DIGEST = re.compile(r"[a-f0-9]{64}\Z")
SET_ID = re.compile(r"[a-f0-9]{32}\Z")
RESERVED = {"__proto__", "prototype", "constructor"}
EXT = {"webm": "webm", "wav": "wav", "x-wav": "wav", "wave": "wav", "mpeg": "mp3", "mp3": "mp3", "mp4": "m4a", "x-m4a": "m4a", "ogg": "ogg", "opus": "opus", "aac": "aac", "flac": "flac"}


class PackageError(ValueError):
    """Validation or packaging failure without leaking source payloads."""


def compact(value: Any) -> bytes:
    # These digest structures contain ASCII keys/MIME/hash and integer sizes.
    # Their member order is explicit, matching JSON.stringify(metaRows(...)).
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"), allow_nan=False).encode("utf-8")


def digest(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def integer(value: Any, low: int, high: int) -> bool:
    return type(value) is int and low <= value <= high


def valid_key(value: Any) -> bool:
    return isinstance(value, str) and bool(KEY.fullmatch(value)) and value not in RESERVED and not value.startswith("archive:")


def audio_type(value: Any) -> str:
    if not isinstance(value, str) or len(value) > 100 or any(ord(char) < 32 or ord(char) > 126 for char in value) or not MIME.fullmatch(value):
        raise PackageError("invalid audio MIME type")
    return value.lower()


def unique_object(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for key, value in pairs:
        if key in result:
            raise PackageError("duplicate JSON object member")
        result[key] = value
    return result


def read_json_with_size(path: Path, limit: int = MAX_JSON) -> tuple[Any, int]:
    try:
        with path.open("rb") as handle:
            raw = handle.read(limit + 1)
        if len(raw) > limit:
            raise PackageError("input JSON exceeds the size limit")
        value = json.loads(raw.decode("utf-8"), object_pairs_hook=unique_object,
                           parse_constant=lambda _: (_ for _ in ()).throw(PackageError("nonfinite JSON number")))
        return value, len(raw)
    except (OSError, UnicodeError, json.JSONDecodeError) as error:
        raise PackageError("input is not readable valid JSON") from error


def read_json(path: Path) -> Any:
    return read_json_with_size(path)[0]


def decode_audio(value: Any, mime: str | None = None, require_uri: bool = False) -> tuple[bytes, str]:
    if not isinstance(value, str) or not value:
        raise PackageError("empty or invalid audio data")
    if value.startswith("data:"):
        comma = value.rfind(",")
        header = value[:comma]
        if comma < 0 or not header.lower().endswith(";base64"):
            raise PackageError("invalid audio data URI")
        uri_type = audio_type(header[5:-7])
        if mime is not None and audio_type(mime) != uri_type:
            raise PackageError("audio MIME declaration mismatch")
        mime = uri_type
        value = value[comma + 1:]
    elif require_uri:
        raise PackageError("expected an audio data URI")
    mime = audio_type(mime or "audio/webm")
    if not value or len(value) % 4 or len(value) > 4 * ((MAX_CLIP + 2) // 3):
        raise PackageError("audio base64 size exceeds the clip limit or has invalid padding")
    try:
        payload = base64.b64decode(value, validate=True)
    except (ValueError, base64.binascii.Error) as error:
        raise PackageError("invalid audio base64") from error
    if not payload or len(payload) > MAX_CLIP or base64.b64encode(payload).decode("ascii") != value:
        raise PackageError("noncanonical audio base64 or clip size exceeded")
    return payload, mime


@dataclass(frozen=True)
class Clip:
    key: str
    type: str
    payload: bytes

    @property
    def sha256(self) -> str:
        return digest(self.payload)

    def metadata(self) -> dict[str, Any]:
        return {"key": self.key, "type": self.type, "bytes": len(self.payload), "sha256": self.sha256}

    @property
    def file(self) -> str:
        subtype = self.type.split("/", 1)[1].split(";", 1)[0]
        return f"audio/{self.sha256}.{EXT.get(subtype, 'bin')}"


def descriptor(value: Any) -> list[Any]:
    if not isinstance(value, list) or len(value) != 4 or not valid_key(value[0]):
        raise PackageError("invalid backup manifest recording")
    audio_type(value[1])
    if not integer(value[2], 1, MAX_CLIP) or not isinstance(value[3], str) or not DIGEST.fullmatch(value[3]):
        raise PackageError("invalid backup manifest size or hash")
    return value


def part_fields(value: dict[str, Any]) -> tuple[int, int]:
    if ("part" in value) != ("parts" in value):
        raise PackageError("incomplete backup part metadata")
    part, parts = value.get("part", 1), value.get("parts", 1)
    if not integer(parts, 1, 1000) or not integer(part, 1, parts):
        raise PackageError("invalid backup part metadata")
    return part, parts


def backup_manifest(value: dict[str, Any]) -> tuple[str, bytes, list[list[Any]]]:
    part, parts = part_fields(value)
    bank = value.get("backupSet")
    if not isinstance(bank, dict) or not integer(value.get("sur"), 2, 2) or not integer(bank.get("v"), 2, 2) or not SET_ID.fullmatch(str(bank.get("setId", ""))):
        raise PackageError("invalid backup set identity")
    manifest = bank.get("manifest")
    if not isinstance(manifest, list) or len(manifest) != parts:
        raise PackageError("invalid backup set manifest")
    keys: set[str] = set()
    for number, entry in enumerate(manifest, 1):
        if not isinstance(entry, dict) or not integer(entry.get("part"), number, number) or not isinstance(entry.get("records"), list) or not 1 <= len(entry["records"]) <= MAX_RECORDS:
            raise PackageError("invalid backup manifest part")
        for item in entry["records"]:
            record = descriptor(item)
            if record[0] in keys:
                raise PackageError("duplicate key in backup manifest")
            keys.add(record[0])
    if len(keys) > MAX_RECORDS or not integer(bank.get("totalRecords"), 1, MAX_RECORDS) or bank["totalRecords"] != len(keys):
        raise PackageError("backup manifest record count mismatch")
    encoded = compact(manifest)
    if not isinstance(bank.get("manifestHash"), str) or digest(encoded) != bank["manifestHash"]:
        raise PackageError("backup manifest integrity mismatch")
    selected = manifest[part - 1]["records"]
    records = value.get("kayitlar")
    if not isinstance(records, dict) or set(records) != {record[0] for record in selected}:
        raise PackageError("backup part recordings do not match manifest")
    return bank["setId"], compact(bank), selected


def generic_metadata(record: Any) -> dict[str, Any]:
    if not isinstance(record, dict) or not valid_key(record.get("key")):
        raise PackageError("invalid generic archive recording key")
    mime = audio_type(record.get("type"))
    if not integer(record.get("bytes"), 1, MAX_CLIP) or not isinstance(record.get("sha256"), str) or not DIGEST.fullmatch(record["sha256"]):
        raise PackageError("invalid generic archive size or hash")
    return {"key": record["key"], "type": mime, "bytes": record["bytes"], "sha256": record["sha256"]}


def validate_sources(paths: list[Path]) -> list[Clip]:
    if not 1 <= len(paths) <= 1000:
        raise PackageError("select between one and 1000 JSON files")
    total_input = 0
    for path in paths:
        if not path.is_file():
            raise PackageError("input JSON file does not exist")
        size = path.stat().st_size
        total_input += size
        if size < 1 or total_input > MAX_JSON:
            raise PackageError("input JSON files exceed the 96 MiB limit")
    clips: dict[str, Clip] = {}
    sets: dict[str, tuple[bytes, int, set[int]]] = {}
    legacy_sets: dict[tuple[Any, ...], tuple[int, set[int]]] = {}
    decoded_bytes = 0
    actual_input = 0
    for path in paths:
        value, actual_size = read_json_with_size(path, MAX_JSON - actual_input)
        actual_input += actual_size
        if not isinstance(value, dict):
            raise PackageError("input is not a voice backup object")
        expected: dict[str, list[Any] | dict[str, Any]] = {}
        if "recovery" in value:
            raise PackageError("native exact-recovery format requires its separate validator; export a voice-only JSON backup")
        if value.get("app") == APP and integer(value.get("schema"), 1, 1):
            records = value.get("records")
            if not isinstance(records, list) or not 1 <= len(records) <= MAX_RECORDS:
                raise PackageError("generic archive is empty or exceeds the record count limit")
            rows = [generic_metadata(record) for record in records]
            if len({row["key"] for row in rows}) != len(rows):
                raise PackageError("duplicate key in generic archive")
            if digest(compact(rows)) != value.get("bankSha256"):
                raise PackageError("generic archive manifest integrity mismatch")
            expected = {row["key"]: row for row in rows}
            items = [(record["key"], record) for record in records]
            kind = "generic"
        elif value.get("uygulama") == "SUKUN" and isinstance(value.get("kayitlar"), dict):
            items = list(value["kayitlar"].items())
            kind = "voices"
            part, parts = part_fields(value)
            if "backupSet" in value:
                set_id, identity, rows = backup_manifest(value)
                if set_id in sets and sets[set_id][:2] != (identity, parts):
                    raise PackageError("same backup set identity has conflicting manifests")
                sets.setdefault(set_id, (identity, parts, set()))[2].add(part)
                expected = {row[0]: row for row in rows}
            else:
                if not integer(value.get("sur", 1), 1, 1):
                    raise PackageError("backup set manifest is missing")
                if parts > 1:
                    date = value.get("tarih")
                    if not isinstance(date, str) or not date:
                        raise PackageError("legacy multipart identity is missing")
                    identity = ("legacy", date, parts)
                    legacy_sets.setdefault(identity, (parts, set()))[1].add(part)
        elif value.get("app") == "SUKUN" and integer(value.get("fmt", 1), 1, 2) and isinstance(value.get("idb"), dict) and isinstance(value["idb"].get("sukunRec"), dict):
            items = list(value["idb"]["sukunRec"].items())
            kind = "full"
        else:
            raise PackageError("unsupported voice backup format")
        if not 1 <= len(items) <= MAX_RECORDS:
            raise PackageError("voice backup is empty or exceeds the record count limit")
        for key, record in items:
            if not valid_key(key) or not isinstance(record, dict):
                raise PackageError("invalid recording key or record object")
            if kind == "generic":
                payload, mime = decode_audio(record.get("data"), record.get("type"), require_uri=True)
            elif kind == "full":
                payload, mime = decode_audio(record.get("__blob"), record.get("type"), require_uri=True)
            else:
                payload, mime = decode_audio(record.get("veri"), record.get("tur", "audio/webm"))
            clip = Clip(key, mime, payload)
            row = expected.get(key)
            if isinstance(row, list):
                if [key, mime, len(payload), clip.sha256] != [row[0], audio_type(row[1]), row[2], row[3]]:
                    raise PackageError("recording does not match backup manifest")
            elif isinstance(row, dict) and clip.metadata() != row:
                raise PackageError("recording does not match generic archive manifest")
            if key in clips:
                if clips[key] != clip:
                    raise PackageError("conflicting duplicate recordings across input files")
                continue
            decoded_bytes += len(payload)
            if len(clips) >= MAX_RECORDS or decoded_bytes > MAX_BYTES:
                raise PackageError("archive exceeds 2000 recordings or 64 MiB decoded audio")
            clips[key] = clip
    for _, parts, received in sets.values():
        if received != set(range(1, parts + 1)):
            raise PackageError("verified backup set is incomplete")
    for parts, received in legacy_sets.values():
        if received != set(range(1, parts + 1)):
            raise PackageError("legacy backup set is incomplete")
    return [clips[key] for key in sorted(clips)]


def build_manifest(clips: list[Clip]) -> dict[str, Any]:
    rows = [clip.metadata() for clip in clips]
    return {"app": APP, "schema": 1, "bankSha256": digest(compact(rows)),
            "records": [{**row, "file": clip.file} for row, clip in zip(rows, clips)]}


def publish(clips: list[Clip], manifest: dict[str, Any], output: Path, sources: list[Path]) -> None:
    if output.is_symlink():
        raise PackageError("output must not be a symlink")
    output = output.resolve()
    if any(source.resolve().is_relative_to(output) for source in sources):
        raise PackageError("input JSON must remain outside the output directory")
    if output.exists():
        if not output.is_dir() or not (output / "manifest.json").is_file():
            raise PackageError("refusing to replace an unmanaged output directory")
        old = read_json(output / "manifest.json")
        if not isinstance(old, dict) or old.get("app") != APP or not integer(old.get("schema"), 1, 1):
            raise PackageError("refusing to replace an unrelated manifest")
        for entry in output.rglob("*"):
            if entry.is_symlink() or entry.is_file() and entry.relative_to(output).as_posix() != "manifest.json" and not entry.relative_to(output).as_posix().startswith("audio/"):
                raise PackageError("refusing to remove unrelated files from the output directory")
    output.parent.mkdir(parents=True, exist_ok=True)
    lock = output.parent / ("." + output.name + ".package.lock")
    try:
        descriptor_fd = os.open(lock, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    except FileExistsError as error:
        raise PackageError("another packaging operation owns the output lock") from error
    os.close(descriptor_fd)
    stage: Path | None = None
    previous: Path | None = None
    try:
        stage = Path(tempfile.mkdtemp(prefix="." + output.name + ".stage-", dir=output.parent))
        (stage / "audio").mkdir()
        for clip in clips:
            destination = stage / clip.file
            if destination.exists():
                if destination.read_bytes() != clip.payload:
                    raise PackageError("audio asset content collision")
                continue
            with destination.open("xb") as handle:
                handle.write(clip.payload)
                handle.flush()
                os.fsync(handle.fileno())
        with (stage / "manifest.json").open("xb") as handle:
            handle.write(compact(manifest) + b"\n")
            handle.flush()
            os.fsync(handle.fileno())
        # Recheck every emitted byte before promoting the completed directory.
        for clip in clips:
            if digest((stage / clip.file).read_bytes()) != clip.sha256:
                raise PackageError("staged audio asset integrity mismatch")
        if output.exists():
            previous = Path(tempfile.mkdtemp(prefix="." + output.name + ".previous-", dir=output.parent))
            previous.rmdir()
            os.replace(output, previous)
        try:
            os.replace(stage, output)
            stage = None
        except BaseException:
            if previous is not None:
                os.replace(previous, output)
                previous = None
            raise
        if previous is not None:
            shutil.rmtree(previous)
            previous = None
    finally:
        if stage is not None:
            shutil.rmtree(stage, ignore_errors=True)
        # A retained previous directory is never destroyed after a failed swap.
        lock.unlink(missing_ok=True)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("inputs", nargs="+", type=Path, help="voice-only/generic/legacy full JSON files; supply every backup part")
    parser.add_argument("--output-dir", type=Path, default=Path(__file__).resolve().parents[1] / "assets/generic-recordings")
    parser.add_argument("--check-only", action="store_true", help="validate and report without creating or changing output files")
    args = parser.parse_args(argv)
    try:
        clips = validate_sources(args.inputs)
        manifest = build_manifest(clips)
        if not args.check_only:
            publish(clips, manifest, args.output_dir, args.inputs)
        print(json.dumps({"ok": True, "checkOnly": args.check_only, "recordCount": len(clips),
                          "audioBytes": sum(len(clip.payload) for clip in clips), "largestClipBytes": max(len(clip.payload) for clip in clips),
                          "assetCount": len({clip.file for clip in clips}), "bankSha256": manifest["bankSha256"]}, separators=(",", ":")))
        return 0
    except (PackageError, OSError) as error:
        print(json.dumps({"ok": False, "error": str(error)}, separators=(",", ":")), file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
