# Retired single-name pause capture — r1072

After a global Pause, the legacy mix pauses single dhikr by stopping its scheduler and retaining `MINI.wasAuto` as its Resume capture. Changing names or pressing local Finish did not retire that capture. The new name could remain PAUSED without a foreground owner: Start/Resume rejected the global hold, Finish left the same paused presentation, and manual counting still worked. Global Resume could also replay the obsolete automatic intent.

The production registry now owns `retireSinglePauseGate()`. Only explicit single-name navigation, restart, native category/name selection and local Finish invoke retirement. The old automatic continuation is removed. The global hold is released only when the registry can prove that no independent paused layer remains; it checks captured providers, raw provider states, primary/secondary frequencies, ambience, native background mix, Voice Halo and paused media. Unknown observations retain the hold. Retirement never resumes a source or fabricates a Play intent.

Captured single-name wheel navigation now uses the native direct-name authority even when the old mix makes general flow metadata say audio. Active smart sessions and journeys keep their navigation authority. Native name-selection audio cues respect a remaining global hold. Session selection uses scoped retirement instead of clearing every captured provider.

Validation is recorded in `tests/r1072/evidence`:

- The ready personal-recording failure was reproduced in unmodified r1071, including rejected Start/Resume, Finish remaining paused, and a working manual counter.
- 42/42 new production-source regression cases pass. They cover Next, Previous, Restart, native category/name selection, Finish, no stale automatic restart, no credit during retirement, unknown-state rejection and independently paused frequency, secondary frequency, ambience, native mix, Voice Halo and reader ownership. Removing only the Halo guard makes precisely its four conservation cases fail.
- Existing local/global pause-scope cases pass 63/63, and ownership-handoff cases pass 17/17.
- Static release identity, JavaScript syntax, SRI and all 698 deployment inventory entries pass 1,268/1,268 assertions.
- The actual-browser test uses trusted wheel clicks and genuine generated personal WAV playback at 384×691 in Classic/Feyz. It checks global Pause → Next → Start/Pause/Resume/Finish, direct Finish after global Pause, fresh Start and the manual counter, with exact served bytes and no JavaScript/SRI/missing-asset faults.
- All 118 retained fixture groups are verified: 106 passed in the aggregate, and 12 child-fixture failures caused by a temporary QA file named `package.json` passed after that file was renamed. Production bytes did not change; raw and rerun outcomes are retained in the validation summary.
- Independent review confirmed the Voice Halo guard preserves its paused context and found no remaining blocker.

The exact final shell SHA-256 is `7d007fa3090f7de8199fc1a521712c0c268e0140b1832348bea1ddf5cab38d40`. Browser evidence comes from isolated Linux Chromium with controlled device speech and blocked service workers. Physical Android screen locking, speaker audibility, OS audio focus and real client SW activation are unverified. No personal health report, screenshot or recording is included in the repository or release packages.
