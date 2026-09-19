# r875 NO-FLASH

Flashing root cause in the previous hardfix:
- a MutationObserver repeatedly called paint()
- paint() created a new Image() for Bitir on every mutation
- onload/onerror repeatedly swapped the background
- older r875 cleanup runtimes also touched the same buttons

Fix:
- hardfix MutationObserver removed
- async Image fallback removed
- older duplicate journey cleanup runtimes removed
- jewel backgrounds are written once at DOMContentLoaded as inline !important
- no interval, no MutationObserver, no pageshow repaint, no async image swap
- SW/version untouched
