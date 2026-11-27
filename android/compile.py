"""Compile the Android app Java sources against the SDK and convert them to DEX."""
from argparse import ArgumentParser
import hashlib
import os
from pathlib import Path
import shutil
import struct
import subprocess
import tempfile
from zipfile import ZipFile, ZIP_STORED
import zlib


def main():
    parser = ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("android_jar", type=Path)
    parser.add_argument("d8_jar", type=Path)
    parser.add_argument("classes_dex", type=Path)
    parser.add_argument("--min-api", type=int, default=26)
    args = parser.parse_args()
    java_files = sorted(args.source.rglob("*.java"))
    if not java_files:
        parser.error(f"No Java sources under {args.source}")
    if not args.android_jar.is_file() or not args.d8_jar.is_file():
        parser.error("Both Android SDK platform android.jar and build-tools lib/d8.jar are required")
    args.classes_dex.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(dir=args.classes_dex.parent) as tmp:
        work = Path(tmp)
        class_files = work / "classes"
        dex_output = work / "dex"
        class_files.mkdir()
        dex_output.mkdir()
        lambda_stubs = args.d8_jar.parent.parent / "core-lambda-stubs.jar"
        bootclasspath = os.pathsep.join(map(str, (lambda_stubs, args.android_jar)))
        subprocess.run([
            "java", "-m", "jdk.compiler/com.sun.tools.javac.Main", "-source", "8", "-target", "8",
            "-Xlint:-options", "-g:lines,source", "-encoding", "UTF-8",
            "-bootclasspath", bootclasspath, "-d", str(class_files), *map(str, java_files),
        ], check=True)
        jar = work / "app-classes.jar"
        with ZipFile(jar, "w", compression=ZIP_STORED) as archive:
            for cls in sorted(class_files.rglob("*.class")):
                archive.write(cls, cls.relative_to(class_files))
        subprocess.run([
            "java", "-cp", str(args.d8_jar), "com.android.tools.r8.D8", "--release",
            "--min-api", str(args.min_api), "--lib", str(args.android_jar),
            "--output", str(dex_output), str(jar),
        ], check=True)
        [dex] = dex_output.glob("*.dex")
        bytecode = dex.read_bytes()
        if (bytecode[:4] != b"dex\n"
                or struct.unpack_from("<I", bytecode, 32)[0] != len(bytecode)
                or bytecode[12:32] != hashlib.sha1(bytecode[32:]).digest()
                or struct.unpack_from("<I", bytecode, 8)[0] != zlib.adler32(bytecode[12:])):
            raise ValueError("Invalid DEX header or integrity fields")
        shutil.move(dex, args.classes_dex)
    print(f"{args.classes_dex}: {args.classes_dex.stat().st_size:,} bytes")


if __name__ == "__main__":
    main()
