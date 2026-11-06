'use strict';
// Historical entry point, maintained for callers of the r1149 release suite.
// Reuse the current eight-case native upgrade/offline/rollback contract rather
// than freezing a candidate version or a list of obsolete runtime assets.
// The caller still selects the immutable baseline checkout; current and prior
// identities and required runtime hashes are read from those exact checkouts.
require('../r1213/release-upgrade-browser.cjs');
