# Controlled AI router contract

Run `node tests/ai-router/contract.cjs` from the repository root. The test extracts shipped code and uses only synthetic credentials and in-memory fetch responses. It never contacts an AI provider. It covers model/picker parity, legacy explicit model migration, offline behavior, consent, payloads, fallbacks, quotas, authentication errors, response validation, cancellation, concurrency, timeouts, secret-free diagnostics and unchanged offline arrangement logic. This is not a real API/account/CORS or physical-device offline test.
