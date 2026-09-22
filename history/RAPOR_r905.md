# SÜKÛN r905 — Home Scene Geometry Recovery

- r904 document-integrity recovery preserved.
- Root cause: r902 VisualContext scene suppression was global and could hide `#r717Scene` outside Zikir.
- Suppression is now scoped to `body.sukun-zikir-tab` only.
- Home restores the original fixed r757 scene layer with `cover` and centered top positioning.
- No counter, journey, audio, Berhetiyye control, or playback logic changed.
- App/SW/cache markers advanced together to r905.
