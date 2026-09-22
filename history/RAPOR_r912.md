# SÜKÛN r912 — Scene Authority Cleanup

- r899/r902/r910/r911 scene polling loops removed from active flow.
- Mevlevî/base scene is fixed and event-driven; no periodic display/opacity rewriting.
- Berhetiyye scene is isolated by `data-r912-context=berhet`.
- Hâlık/99 Esmâ fall back to the same fixed Mevlevî base scene.
- Crystal wheel wrappers/pseudo plates forced transparent.
- r911 content that had been appended after `</html>` was removed; r912 is inserted before `</body>`.
- App/SW/cache/build markers aligned to r912.
