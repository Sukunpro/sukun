# r875 VISUAL SURGICAL FIX

Root cause found in previous hotfix:
the new CSS referenced jewel files at `./btn-...-r872.png`, but the real files are
`./assets/berhetiyye-premium/btn-...-r872.png`.
Because the bad rule was later and `!important`, it overrode the valid older rule with a non-existent image.
That is why `Bitir` stayed naked.

This patch:
- corrects every jewel asset path;
- hides non-button orphan children inside the journey grid;
- suppresses pseudo-elements only in the journey grid;
- keeps r875/SW untouched;
- adds scoped text wrapping/auto-height safeguards.
