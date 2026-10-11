# r1054 automatic touch continuity

```sh
node tests/r1054/automatic-touch-continuity.cjs
```

The fixture executes the production session selection, read model and command
routes, manual count gates and motion controller. Native category/journey/media
owners and DOM timing are controlled endpoints. Each single, 28-name and 99-name
session is selected and started through the production command boundary.

Long touch, touch focus, multiple fingers, foreign releases and cancellation
preserve automatic rotation without scheduling a release or touching transport
or counts. Keyboard focus still holds targets for accessible activation; pointer
input clears that hold. Explicit pause, hidden state, motion preferences,
reduced motion, performance saving and Tekke retain their existing gates.

These checks establish source behavior, not physical Android compositor or
audible-output performance.
