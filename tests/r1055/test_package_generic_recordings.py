"""Black-box checks for the generic voice archive packaging command.

Fixtures contain synthetic PCM bytes only.  These tests assert interchange,
integrity, limits and all-or-nothing output; they make no audibility claim.
"""
import base64
import copy
import hashlib
import importlib.util
import io
import json
from pathlib import Path
import shutil
import struct
import subprocess
import sys
import tempfile
import unittest
from unittest import mock
import wave


ROOT = Path(__file__).resolve().parents[2]
TOOL = ROOT / "tools" / "package_generic_recordings.py"
MIB = 1024 * 1024


def compact(value):
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def digest(data):
    return hashlib.sha256(data).hexdigest()


def wav(seed=1):
    stream = io.BytesIO()
    with wave.open(stream, "wb") as audio:
        audio.setnchannels(1)
        audio.setsampwidth(2)
        audio.setframerate(8000)
        audio.writeframes(struct.pack("<16h", *([seed * 100] * 16)))
    return stream.getvalue()


def generic_record(key="esma:0:nida", data=None, mime="audio/wav"):
    data = wav() if data is None else data
    return {
        "key": key,
        "type": mime,
        "bytes": len(data),
        "sha256": digest(data),
        "data": "data:" + mime + ";base64," + base64.b64encode(data).decode(),
    }


def generic_bank(records):
    meta = [{key: item[key] for key in ("key", "type", "bytes", "sha256")} for item in records]
    return {"app": "SUKUN_GENERIC_RECORDINGS", "schema": 1, "bankSha256": digest(compact(meta).encode()), "records": records}


def voice_bank(records):
    return {
        "uygulama": "SUKUN", "sur": 1,
        "kayitlar": {item["key"]: {"tur": item["type"], "veri": item["data"].rsplit(",", 1)[1]} for item in records},
    }


def multipart(parts, set_id="1234567890abcdef1234567890abcdef"):
    manifest = [{"part": number, "records": [[item["key"], item["type"], item["bytes"], item["sha256"]] for item in records]} for number, records in enumerate(parts, 1)]
    identity = {"v": 2, "setId": set_id, "manifestHash": digest(compact(manifest).encode()), "totalRecords": sum(map(len, parts)), "manifest": manifest}
    output = []
    for number, records in enumerate(parts, 1):
        value = voice_bank(records)
        value.update(sur=2, part=number, parts=len(parts), backupSet=copy.deepcopy(identity))
        output.append(value)
    return output


class PackageGenericRecordingsTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="sukun-generic-package-")
        self.directory = Path(self.temp.name)
        self.output = self.directory / "archive"
        self.sequence = 0

    def tearDown(self):
        self.temp.cleanup()

    def source(self, value, name=None):
        self.sequence += 1
        path = self.directory / (name or ("input-%02d.json" % self.sequence))
        path.write_text(json.dumps(value, ensure_ascii=False), encoding="utf-8")
        return path

    def run_cli(self, values=(), *, inputs=None, output=None, check_only=False):
        inputs = [self.source(value) for value in values] if inputs is None else inputs
        command = [sys.executable, str(TOOL), *(str(path) for path in inputs), "--output-dir", str(output or self.output)]
        if check_only:
            command.append("--check-only")
        return subprocess.run(command, capture_output=True, text=True, timeout=60)

    def assert_success(self, result):
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def snapshot(self, directory=None):
        directory = directory or self.output
        return {str(path.relative_to(directory)): path.read_bytes() for path in sorted(directory.rglob("*")) if path.is_file()} if directory.exists() else None

    def existing_bank(self):
        (self.output / "audio").mkdir(parents=True)
        record = generic_record("esma:99:nida", wav(9))
        manifest = generic_bank([record])
        relative = "audio/" + record["sha256"] + ".wav"
        manifest["records"] = [{**{key: record[key] for key in ("key", "type", "bytes", "sha256")}, "file": relative}]
        (self.output / "manifest.json").write_text(compact(manifest) + "\n", encoding="utf-8")
        (self.output / relative).write_bytes(wav(9))
        return self.snapshot()

    def assert_invalid_preserves(self, values=(), *, inputs=None):
        before = self.existing_bank()
        result = self.run_cli(values, inputs=inputs)
        self.assertNotEqual(result.returncode, 0, "Invalid input was accepted: " + result.stdout)
        self.assertEqual(self.snapshot(), before, "Invalid input changed the previous bank")
        # Failed validation must also leave no staged data beside the destination.
        self.assertEqual({p.name for p in self.directory.iterdir() if p.is_dir()}, {"archive"})

    def read_manifest(self, output=None):
        return json.loads(((output or self.output) / "manifest.json").read_text(encoding="utf-8"))

    def assert_pack(self, expected, output=None):
        output = output or self.output
        manifest = self.read_manifest(output)
        self.assertEqual(manifest["app"], "SUKUN_GENERIC_RECORDINGS")
        self.assertEqual(manifest["schema"], 1)
        records = manifest["records"]
        self.assertEqual([item["key"] for item in records], sorted(expected))
        meta = [{key: item[key] for key in ("key", "type", "bytes", "sha256")} for item in records]
        self.assertEqual(manifest["bankSha256"], digest(compact(meta).encode()))
        files = {"manifest.json"}
        for item in records:
            self.assertEqual(set(item), {"key", "type", "bytes", "sha256", "file"})
            self.assertNotIn("..", Path(item["file"]).parts)
            self.assertFalse(Path(item["file"]).is_absolute())
            data = (output / item["file"]).read_bytes()
            self.assertEqual(data, expected[item["key"]])
            self.assertEqual(item["bytes"], len(data))
            self.assertEqual(item["sha256"], digest(data))
            self.assertTrue(item["type"].startswith("audio/"))
            files.add(item["file"])
        self.assertEqual(set(self.snapshot(output)), files, "Output contains an input copy or unrelated data")
        return manifest

    def test_generic_schema_is_byte_preserved_and_hashes_match_runtime_format(self):
        records = [generic_record("esma:1:nida", wav(2)), generic_record("berhet:0", wav(1))]
        self.assert_success(self.run_cli([generic_bank(records)]))
        self.assert_pack({"esma:1:nida": wav(2), "berhet:0": wav(1)})

    def test_voice_json_contributes_only_recording_bytes(self):
        value = voice_bank([generic_record("dua:42", wav(3))])
        value.update(settings={"private": "PRIVATE_SETTINGS"}, counters={"private": "PRIVATE_COUNTER"}, sourceCopy="PRIVATE_SOURCE_JSON")
        value["kayitlar"]["dua:42"].update(volume=0.01, count=999, note="PRIVATE_NOTE")
        self.assert_success(self.run_cli([value]))
        self.assert_pack({"dua:42": wav(3)})
        self.assertNotIn(b"PRIVATE_", b"".join(self.snapshot().values()))

    def test_output_is_deterministic_for_file_and_record_order(self):
        a, b = generic_record("esma:9:nida", wav(9)), generic_record("esma:0:nida", wav(1))
        first = self.directory / "first"
        second = self.directory / "second"
        self.assert_success(self.run_cli([voice_bank([a]), voice_bank([b])], output=first))
        self.assert_success(self.run_cli([voice_bank([b]), voice_bank([a])], output=second))
        self.assertEqual(self.snapshot(first), self.snapshot(second))

    def test_identical_duplicates_are_deduplicated_across_inputs(self):
        record = generic_record("esma:0:nida", wav(2))
        self.assert_success(self.run_cli([voice_bank([record]), generic_bank([record])]))
        self.assert_pack({record["key"]: wav(2)})

    def test_successful_replacement_retires_old_bank_without_staged_leftovers(self):
        self.existing_bank()
        self.assert_success(self.run_cli([voice_bank([generic_record("esma:1:nida", wav(2))])]))
        self.assert_pack({"esma:1:nida": wav(2)})
        self.assertEqual({p.name for p in self.directory.iterdir() if p.is_dir()}, {"archive"})

    def test_failed_directory_promotion_restores_previous_managed_bank(self):
        before = self.existing_bank()
        source = self.source(voice_bank([generic_record("esma:1:nida", wav(2))]))
        # Exercise the real publication code, faulting only the promotion of a
        # fully prepared directory after the old output has been moved aside.
        spec = importlib.util.spec_from_file_location("sukun_generic_package_test", TOOL)
        module = importlib.util.module_from_spec(spec)
        sys.modules[spec.name] = module
        try:
            spec.loader.exec_module(module)
            clips = module.validate_sources([source])
            real_replace = module.os.replace
            promotions = 0

            def replace(source_path, destination_path):
                nonlocal promotions
                if ".stage-" in Path(source_path).name and Path(destination_path) == self.output:
                    promotions += 1
                    raise OSError("synthetic directory promotion failure")
                return real_replace(source_path, destination_path)

            with mock.patch.object(module.os, "replace", side_effect=replace):
                with self.assertRaises(OSError):
                    module.publish(clips, module.build_manifest(clips), self.output, [source])
            self.assertEqual(promotions, 1)
            self.assertEqual(self.snapshot(), before)
            self.assertEqual({p.name for p in self.directory.iterdir() if p.is_dir()}, {"archive"})
            self.assertFalse(any(".package.lock" in path.name for path in self.directory.iterdir()))
        finally:
            sys.modules.pop(spec.name, None)

    def test_conflicting_same_key_bytes_preserve_previous_bank(self):
        self.assert_invalid_preserves([voice_bank([generic_record(data=wav(1))]), voice_bank([generic_record(data=wav(2))])])

    def test_conflicting_same_key_mime_preserves_previous_bank(self):
        self.assert_invalid_preserves([voice_bank([generic_record()]), voice_bank([generic_record(mime="audio/webm")])])

    def test_complete_multipart_set_accepts_reverse_order(self):
        parts = multipart([[generic_record("esma:0:nida", wav(1))], [generic_record("esma:1:nida", wav(2))]])
        self.assert_success(self.run_cli(parts[::-1]))
        self.assert_pack({"esma:0:nida": wav(1), "esma:1:nida": wav(2)})

    def test_partial_multipart_set_preserves_previous_bank(self):
        parts = multipart([[generic_record("esma:0:nida")], [generic_record("esma:1:nida")]])
        self.assert_invalid_preserves(parts[:1])

    def test_multipart_manifest_digest_mismatch_preserves_previous_bank(self):
        part = multipart([[generic_record()]])[0]
        part["backupSet"]["manifestHash"] = "0" * 64
        self.assert_invalid_preserves([part])

    def test_multipart_payload_digest_mismatch_preserves_previous_bank(self):
        part = multipart([[generic_record()]])[0]
        part["kayitlar"]["esma:0:nida"]["veri"] = base64.b64encode(wav(3)).decode()
        self.assert_invalid_preserves([part])

    def test_same_set_id_cannot_claim_different_manifest(self):
        a = multipart([[generic_record("esma:0:nida")]])[0]
        b = multipart([[generic_record("esma:1:nida")]])[0]
        self.assert_invalid_preserves([a, b])

    def test_generic_bank_digest_mismatch_preserves_previous_bank(self):
        value = generic_bank([generic_record()])
        value["bankSha256"] = "f" * 64
        self.assert_invalid_preserves([value])

    def test_generic_clip_digest_mismatch_preserves_previous_bank(self):
        record = generic_record()
        record["sha256"] = "f" * 64
        self.assert_invalid_preserves([generic_bank([record])])

    def test_generic_clip_byte_count_mismatch_preserves_previous_bank(self):
        record = generic_record()
        record["bytes"] += 1
        self.assert_invalid_preserves([generic_bank([record])])

    def test_generic_data_uri_mime_mismatch_preserves_previous_bank(self):
        record = generic_record()
        record["data"] = record["data"].replace("data:audio/wav;", "data:audio/webm;")
        self.assert_invalid_preserves([generic_bank([record])])

    def test_non_audio_mime_preserves_previous_bank(self):
        self.assert_invalid_preserves([voice_bank([generic_record(mime="text/html")])])

    def test_uppercase_audio_mime_is_normalized_without_changing_bytes(self):
        self.assert_success(self.run_cli([voice_bank([generic_record(mime="AUDIO/WAV")])]))
        manifest = self.assert_pack({"esma:0:nida": wav()})
        self.assertEqual(manifest["records"][0]["type"], "audio/wav")

    def test_mime_control_characters_preserve_previous_bank(self):
        before = self.existing_bank()
        for control in ("\n", "\t", "\r"):
            with self.subTest(control=repr(control)):
                record = generic_record(mime="audio/wav;" + control + "codecs=pcm")
                result = self.run_cli([voice_bank([record])])
                self.assertNotEqual(result.returncode, 0)
                self.assertEqual(self.snapshot(), before)

    def test_boolean_generic_schema_is_rejected(self):
        value = generic_bank([generic_record()])
        value["schema"] = True
        self.assert_invalid_preserves([value])

    def test_boolean_voice_backup_version_is_rejected(self):
        value = voice_bank([generic_record()])
        value["sur"] = True
        self.assert_invalid_preserves([value])

    def test_malformed_base64_preserves_previous_bank(self):
        value = voice_bank([generic_record()])
        value["kayitlar"]["esma:0:nida"]["veri"] = "invalid%%%"
        self.assert_invalid_preserves([value])

    def test_noncanonical_base64_padding_bits_preserve_previous_bank(self):
        value = voice_bank([generic_record()])
        value["kayitlar"]["esma:0:nida"]["veri"] = "YR=="  # Decodes to 'a', but canonical form is YQ==.
        self.assert_invalid_preserves([value])

    def test_reserved_or_path_record_key_cannot_create_files(self):
        # Each invalid key must fail independently; a first failure must not hide another.
        for key in ("__proto__", "constructor", "archive:injected", "../../outside", "https://example.invalid/x"):
            with self.subTest(key=key), tempfile.TemporaryDirectory(dir=self.directory) as directory:
                output = Path(directory) / "archive"
                output.mkdir()
                (output / "manifest.json").write_text("previous", encoding="utf-8")
                before = self.snapshot(output)
                result = self.run_cli([voice_bank([generic_record(key)])], output=output)
                self.assertNotEqual(result.returncode, 0)
                self.assertEqual(self.snapshot(output), before)

    def test_invalid_later_input_cannot_partially_replace_previous_bank(self):
        bad = voice_bank([generic_record("esma:1:nida")])
        bad["kayitlar"]["esma:1:nida"]["veri"] = "%%"
        self.assert_invalid_preserves([voice_bank([generic_record("esma:0:nida")]), bad])

    def test_check_only_validates_without_creating_output(self):
        self.assert_success(self.run_cli([generic_bank([generic_record()])], check_only=True))
        self.assertFalse(self.output.exists())

    def test_check_only_invalid_input_preserves_previous_bank(self):
        before = self.existing_bank()
        value = generic_bank([generic_record()])
        value["bankSha256"] = "f" * 64
        result = self.run_cli([value], check_only=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(self.snapshot(), before)

    def test_empty_bank_is_rejected_without_output(self):
        result = self.run_cli([voice_bank([])])
        self.assertNotEqual(result.returncode, 0)
        self.assertFalse(self.output.exists())

    def test_record_count_limit_preserves_previous_bank(self):
        records = [generic_record("esma:%d:nida" % i) for i in range(2001)]
        self.assert_invalid_preserves([voice_bank(records)])

    def test_per_clip_limit_preserves_previous_bank(self):
        self.assert_invalid_preserves([voice_bank([generic_record(data=b"x" * (8 * MIB + 1))])])

    def test_aggregate_decoded_limit_preserves_previous_bank(self):
        # 67.5 MiB decoded, 90 MiB encoded: below the 96 MiB input limit,
        # so this specifically tests the aggregate 64 MiB decoded limit.
        records = [generic_record("esma:%d:nida" % i, bytes([i]) * (15 * MIB // 2)) for i in range(9)]
        self.assert_invalid_preserves([voice_bank(records)])

    def test_input_file_limit_preserves_previous_bank(self):
        path = self.directory / "oversized.json"
        with path.open("wb") as file:
            file.truncate(96 * MIB + 1)
        self.assert_invalid_preserves(inputs=[path])

    @unittest.skipUnless(shutil.which("node"), "Node is required for the production module interchange check")
    def test_output_loads_through_real_bundled_archive_module(self):
        expected = {"esma:0:nida": wav(1), "berhet:1": wav(2)}
        records = [generic_record(key, data) for key, data in expected.items()]
        self.assert_success(self.run_cli([generic_bank(records)]))
        script = r"""
const fs=require('node:fs'), path=require('node:path'), assert=require('node:assert/strict');
const root=process.argv[1], output=process.argv[2];
const {fixture}=require(path.join(root,'tests/r1055/generic-bank-fixture.cjs'));
(async()=>{
  const f=fixture(root), manifest=JSON.parse(fs.readFileSync(path.join(output,'manifest.json'),'utf8'));
  f.c.fetch=async(url,opt)=>{
    assert.equal(opt.credentials,'same-origin');
    const name=new URL(String(url)).pathname.split('/assets/generic-recordings/')[1];
    assert(name && !name.split('/').includes('..'));
    const bytes=fs.readFileSync(path.join(output,name));
    return {ok:true,headers:{get:key=>key==='content-length'?String(bytes.length):null},blob:async()=>new Blob([bytes])};
  };
  await f.api.ready(); const loaded=await f.api.loadBundled();
  assert.equal(loaded.bankId,manifest.bankSha256); assert.equal(loaded.count,manifest.records.length);
  assert.equal(f.state().enabled,false); await f.api.setEnabled(true);
  for(const row of manifest.records){
    const found=await f.api.find([row.key]); assert(found.generic);
    assert.equal(found.blob.type,row.type);
    assert.deepEqual(Buffer.from(await found.blob.arrayBuffer()),fs.readFileSync(path.join(output,row.file)));
  }
  assert.equal(f.history.personalAccess.length,0);
})().catch(error=>{console.error(error);process.exitCode=1});
"""
        result = subprocess.run(["node", "-e", script, str(ROOT), str(self.output)], capture_output=True, text=True, timeout=30)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)


if __name__ == "__main__":
    unittest.main()
