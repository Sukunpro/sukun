# r1047 frequency-start / dock-pause contract

Run with Node.js from any directory:

    node tests/r1047/frequency-pause-contract.cjs [source-root]

Keep frequency-pause-fixture.cjs beside the contract. Optional final argument
`baseline` verifies the known old-source mismatch instead of expecting its fix.

The fixture executes extracted production frStart/frStop, mini Pause/Resume,
registry, r698 transport, r588 click/render and currentFlow logic. Web Audio
nodes/context, now-playing synchronization and journey APIs are controlled seams.
It proves command dispatch and state boundaries, not speaker output or full-page
native event order. The original earlier Esma flow's creation of the stale gate
is separate from the reproduced stale-gate precondition.

Candidate: 44 cases cover first Pause after a stale gate/new frequency start,
clean Pause/Resume/Stop, failures/already-playing, unrelated providers, raw-state
errors, foreground owner/queue, microphone/recording state and unchanged journey
commands. The helper never resumes captured providers and leaves missing or
ambiguous safety evidence closed. Production data/storage are not used.
