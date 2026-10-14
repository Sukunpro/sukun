# Easy controls after contemplation exit

`easy-controls.cjs` executes the shipped layout controller and native quick-control delegates in the existing DOM fixture. Its 30 cases cover Esma and Berhetiyye, normal/focus transitions, persistent visibility, keyboard focus, labels, late summary placement, restore/rebuild and unchanged command ownership. The fixture does not claim CSS or physical device behavior.

Run `node tests/r1063/easy-controls.cjs /path/to/source-root`.

The release's separate full-application Chromium report reproduces the original r1062 exit-and-hide failure, then exercises actual contemplation entry/exit and Hide/Show in Classic/Feyz at a mobile viewport. It checks computed visibility, native node identity, settings independence, language, focus, reload persistence and native background audio continuity against exact served release bytes. It does not establish physical Android hardware behavior.
