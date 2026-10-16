#!/usr/bin/env node
// Read a secret through stdin, never an argv value. Output only its salted hash.
import { pbkdf2Sync, randomBytes } from 'node:crypto';

if (process.argv.length !== 2 || process.stdin.isTTY) {
  process.stderr.write('Provide the access code through stdin, without command-line arguments.\n');
  process.exit(1);
}
let input = '';
try {
  process.stdin.setEncoding('utf8');
  for await (const chunk of process.stdin) {
    input += chunk;
    if (Buffer.byteLength(input, 'utf8') > 2048) throw new Error('Too long');
  }
  const code = input.replace(/\r?\n$/, '');
  if (Array.from(code).length < 16 || Array.from(code).length > 256 || Buffer.byteLength(code, 'utf8') > 1024 || /[\r\n]/.test(code)) throw new Error('Invalid code');
  const salt = randomBytes(16);
  const hash = pbkdf2Sync(code, salt, 100000, 32, 'sha256');
  process.stdout.write(`pbkdf2-sha256$100000$${salt.toString('base64url')}$${hash.toString('base64url')}\n`);
} catch {
  process.stderr.write('Access code must be 16–256 characters on one line. No secret was printed.\n');
  process.exitCode = 1;
}
