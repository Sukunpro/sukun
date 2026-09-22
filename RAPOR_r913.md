# SÜKÛN r913 — Build Unity + Strict Scene Context

- App build meta, footer identity, SW, cache namespace and markers aligned to r913.
- Footer identity now reads the build meta instead of a hard-coded r910 constant.
- Berhetiyye scene is permitted only on Zikir/Tefekkür surfaces AND when active category is berhet.
- Ambiyans/Home/normal 99 Esmâ surfaces force the base Mevlevî scene and clear stale Berhetiyye scene variables.
- r910/r912 scene decisions hardened to the same strict surface gate.
- No polling loop added; scene synchronization remains event/requestAnimationFrame based.
