# r1037 approved opening signature

The user selected the slow humm–humm–ta-dammm preview and requested slightly
longer second/final releases. The first hit and the initial120ms of the other
hits retain the selected PCM. The second release is500ms (+70ms), final1280ms
(+140ms). The complete mono48kHz PCM16 WAV is3.000s and288044 bytes.

The original logo/style/keyframes remain. CSS now has1s preparation plus4.8s
visual duration; mark/light last4.3s. Audio reserves the whole3s file plus20ms
lead and admits an onset only before1780ms of the visual phase. Input, hiding,
active recording/audio, malformed state, unknown ownership and late work fail
closed. One independent AudioBufferSource plays once at rate1/gain1. No old
oscillator fallback or future-gesture replay exists.

The WAV is required verified runtime material in SW/build/site inventory.
Page-side fetch SRI, SHA-256 and length validation precede decoding. Decoded
duration/channel count are checked. Fetch/decode promises can never outlive
cancellation into audible playback. No personal storage is changed.

Run from repository root:

    node tests/r1037/intro-audio-lifecycle.cjs .
    node tests/r1037/intro-visual-diagnostics.cjs .
    node tests/r1037/intro-asset-cache.cjs .
    node tests/r1037/intro-waveform.cjs .
    node tests/r1034/intro-health-diagnostic.cjs .
    node tests/r1029/transparent-intro.cjs .

The earlier oscillator-timbre and650ms timing suites are historical contracts;
the current source has no oscillators. Their safety cases are carried into the
r1037 lifecycle/visual suites, including interrupted and repeated asynchronous
flows. Existing health, recovery, containment, volume, mini-player and artwork
regressions are also run on the current source.

Tests are controlled fixtures/digital measurements, not a claim that Android
autoplay always succeeds or that a speaker sounds identical to the preview.
