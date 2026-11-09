'use strict';
// Automatic statistics and the shared disclosure are verified with native journey controls.
const path=require('node:path');
if(process.argv[3]&&!process.argv[3].endsWith('.json'))process.argv[3]=path.join(process.argv[3],'report.json');
require('../seyir-controls/browser.cjs');
