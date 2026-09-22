# SÜKÛN r899 — Visual Context Authority

- r898 build/SW authority retained and advanced to r899.
- Removed malformed post-`</html>` legacy renderer tail from both shells.
- Berhetiyye wheel now uses a true RGBA PNG and is intentionally static to avoid Android/WebView WebP+transform black compositing tile.
- Exactly one wheel node (`#r899BerhetWheel`) and one canonical numeric layer are allowed.
- Berhetiyye scene is visible only while the actual current zikir category is `berhet`; 99 Esma explicitly hides the Berhetiyye scene.
- Stale Berhetiyye dataset flags are cleared when leaving 28 Berhetiyye, preventing ornate controls/background from leaking into 99 Esma.
- Old mirror counter nodes and old wheel nodes are purged continuously.
