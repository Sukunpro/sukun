/* SÜKÛN r949 — audio ownership, bounded scenes and phased visual scheduling
   Amaç: yeni sürümün "waiting/install mismatch" yüzünden eski shell'de
   kilitlenmesini önlemek. Controller değişimi aktif sesi kendiliğinden
   kesmez; sayfa reload kararı istemci tarafında verilir. */
'use strict';

const SURUM = 'r1101';
const ART_CACHE = 'sukun-art-persistent-v1';
const CACHE = 'sukun-r1101-frequency-hub-20261018-v1';
const CACHE_META = './sukun-cache-meta-r1101.json';
const BUILD_MARKER = './sukun-build-r1101.json';
const LATEST_MARKER = './sukun-latest.json';
const REQUIRED_RUNTIME = [{"url": "./assets/runtime/berhet-layout-r938.css?v=r1101", "sha256": "e22130607a9dc18f298262d67a58393b4a51d09f3e7601a0f543df2ab0646491"}, {"url": "./assets/runtime/berhet-materials-r933.css?v=r1101", "sha256": "4be10a5e23254a4644178d08e664177e1dab6275c8b0ce817d7bfeedbf5e2b24"}, {"url": "./assets/runtime/berhet-controls-r933.css?v=r1101", "sha256": "3ad2239995fcc02fcbcf970d738a4b548716b9de360954af50839097c7c7c067"}, {"url": "./assets/runtime/berhet-dock-r933.css?v=r1101", "sha256": "6864dcd5bd188c9d6be26a387dca6ec60e8dec665596079c42eaf1628d4c0596"}, {"url": "./assets/runtime/background-owner-r949.js?v=r1101", "sha256": "b953e3292807cc020c225325b8f1b2d36067225f2efb52b7c124a0ac5d86a1a3"}, {"url": "./assets/runtime/lifecycle-r949.js?v=r1101", "sha256": "6cbdf363beac77a88db9d60916a57cc58144c14fe0c3de9498a5d740b2664c40"}, {"url": "./assets/runtime/audio-palette-r945.js?v=r1101", "sha256": "0df6131d56e869f22ba011a084300d4bb9ddddc4d41589e63436850492003bd1"}, {"url": "./assets/runtime/esma-scenes-r923.js?v=r1101", "sha256": "dc97cdaa6f31f63593f1576ad9ec7d3b206f0f55ff1b2aced8f43b0202d44854"}, {"url": "./assets/runtime/session-r919.js?v=r1101", "sha256": "5ef9efcb784542a53a9f3ebe8ec57f4694ebbeeb0b7af00428a6b4de9e2b8869"}, {"url": "./assets/runtime/dock-r920.js?v=r1101", "sha256": "921a6ec8374233a3db782eaf35dcd5628f2bcfa296f1efa34606871cda1e4590"}, {"url": "./assets/runtime/wheels-r924.js?v=r1101", "sha256": "69d077ff9ae72d7cbfd26dcd92065054d1f9f7dec5c182996fbe3fd312988a9f"}, {"url": "./assets/runtime/berhet-layout-r938.js?v=r1101", "sha256": "fc207191c48270c9dc4e84b3cb672e82f5d332f5fdc5d0deb709446471548dc6"}, {"url": "./assets/runtime/interface-r920.js?v=r1101", "sha256": "517d7dc842e2dbebdea2373335c527e1dd08624584a31eac6f79f19f8c057ff0"}, {"url": "./assets/runtime/wheels-r924.css?v=r1101", "sha256": "750168ec6e481deb4f85577f5005928e3dcca436eb090e59b17095e8cdaaa30f"}, {"url": "./assets/runtime/berhet-theme-r933.js?v=r1101", "sha256": "e3f4ba9b695d25d34c7e098a7d51b51e778089ddd897ac9b10b9851e511d2069"}, {"url": "./assets/runtime/health-view-r943.css?v=r1101", "sha256": "51a89716056a0c9b823421bf39ec30d6de99dd182ad8373a19454aa6509596c3"}, {"url": "./assets/runtime/health-view-r943.js?v=r1101", "sha256": "d04c05dfc3c0624226bec562acd5e8169c8ce5334836bcc8562e5fa37cfc4d84"}, {"url": "./assets/runtime/scene-picker-r945.css?v=r1101", "sha256": "95038f4efddb07a52626b6701c9edaddd5c8831d1f327b18d5160ae2bb7154d2"}, {"url": "./assets/runtime/scene-picker-r945.js?v=r1101", "sha256": "1ed9d5905ed4c82834c69fb111d8fb24ad192d416a7c478c9075112b00794b75"}, {"url": "./assets/runtime/health-r940.js?v=r1101", "sha256": "3484d47a7a55ff29348d62965bee516a71530c9dfe351ab9c4c3ad9579be6620"}, {"url": "./assets/runtime/nefs-r948.css?v=r1101", "sha256": "94ccd9dad8bd65f2501f90d83bfb8aee1e27229fc7a3f497c5d51d0564848edf"}, {"url": "./assets/runtime/nefs-data-r948.js?v=r1101", "sha256": "c29f42eacaa014b90b87b85d906f2468f91a8347ddd486467b9ad1d7c39c214c"}, {"url": "./assets/runtime/nefs-model-r948.js?v=r1101", "sha256": "b5d4f9673e26f01ea5cb3714f5c45a1ca41c1cee1745f72461ed71b54fc7185b"}, {"url": "./assets/runtime/nefs-ui-r948.js?v=r1101", "sha256": "8201e3904068e222f32a3ad704188c620c48ccc2c25091668854b5e6e12e5721"}, {"url": "./assets/runtime/offline-scenes-r962.js?v=r1101", "sha256": "3d2bf56119336acd4a8dab2422b96914a7bc3d8b386c1e3a43ab47e82a328c62"}, {"url": "./assets/wheel-navigation-r964/gold.png?v=r1101", "sha256": "3ed982ef9fdc057c97416b6837b780f08ffb0f9e0a9eca0daa973ddfc3660ca2"}, {"url": "./assets/wheel-navigation-r964/copper.png?v=r1101", "sha256": "b731ba244c0f04a972276580a70e3b203a8a9e839abe35841cfd08c372283012"}, {"url": "./assets/wheel-navigation-r964/silver.png?v=r1101", "sha256": "d7095d1597bdeb288035bd3aa87c4168c63a4dd6b98c7f6ab860f0f7c24a516f"}, {"url": "./assets/wheel-navigation-r964/dark.png?v=r1101", "sha256": "c6407489d8c52d1b65985dbbdb8d5c3df625b184739c413c40c6d423d70c55bb"}, {"url": "./assets/wheel-navigation-r964/crystal.png?v=r1101", "sha256": "dd751abc6483a3c5f3585e170d0c9888fdef5ccb69e276bd61d765b33bdb6b85"}, {"url": "./assets/runtime/presentation-r979.js?v=r1101", "sha256": "c648ddce99e0191ae5cb11bbccd19222a4bf3bb8764453c54d95d8e15831e033"}, {"url": "./assets/runtime/audio-cpu-r981.js?v=r1101", "sha256": "daba8b6eff390454fc7391aa80fdcf1f9e5db7d3a8b7d07d9be93abfb0cd0f4f"}, {"url": "./assets/runtime/audio-preparation-r981.js?v=r1101", "sha256": "03b21ec8e0308489662825502b2abaa1e64d7475c8c221fe04c52f4d0601e08d"}, {"url": "./assets/runtime/tab-owner-r981.js?v=r1101", "sha256": "d306eafe445953ac97537b3fbe68cc672c98cd124348340f53e9cb70d87e9f5e"}, {"url": "./assets/runtime/cadence-r981.css?v=r1101", "sha256": "e8551396049c455e9c340c71e7d343ebbaf2f4cdeacc80bcb82e8d6046889992"}, {"url": "./assets/runtime/cadence-r981.js?v=r1101", "sha256": "f9bd5dbaaaaf20fb5523afdcf00dec639ef17b2bf6b0cf6462c872dff9aa9cda"}, {"url": "./assets/runtime/studio-preparation-r982.js?v=r1101", "sha256": "e341b06e7bfa66584d09941ce6ceffa681e513385c6e8db04e932543c5fefbb4"}, {"url": "./assets/runtime/progress-journal-r982.js?v=r1101", "sha256": "1555800182b606e6abea73dd53bf8fa9392a7f42b4a3a628a208bf4ad8587cde"}, {"url": "./assets/runtime/tekke-sequence-r988.js?v=r1101", "sha256": "13e58d2412d8c215e968ec850fd5f18b49829ebdf0f9f9bd4adf4c502d4a0772"}, {"url": "./assets/runtime/tekke-set-r990.js?v=r1101", "sha256": "1e3b3baf822bd83a1f24cae1cab28aee9f54312aa644f8b3eaca07d8ad8a6f0a"}, {"url": "./assets/runtime/tekke-ux-r992.css?v=r1101", "sha256": "30d2a15133f7018a9378e349c8e495677ba74ca420f904c2e3f2cfc2a2d289b3"}, {"url": "./assets/runtime/tekke-ux-r992.js?v=r1101", "sha256": "9baa78b9bc30249160be39e5f8d89fdbc5b5fbc8d0615ec4a6d0856423bee89d"}, {"url": "./assets/runtime/tekke-journey-r993.css?v=r1101", "sha256": "1173ffc1a32c8201c990d26996cf44020195a1e9a65540f5c37ad8cbae1df863"}, {"url": "./assets/runtime/tekke-journey-r993.js?v=r1101", "sha256": "0b09636e3ba8978dcf7e92221d03fb25ebe73d81feb61bef26ca1e408080e61a"}, {"url": "./assets/scenes/tekke-r1014/berhet-billur.webp?v=r1101", "sha256": "17cbb4b7cc419bcc7e4fd0618c012ede1104523ed956aeed380280d169af6a50"}, {"url": "./assets/runtime/recording-continuity-r1016.js?v=r1101", "sha256": "81b728a119d5dd0a10d9d28dcf87224def17d4876a50f718e1a5aae12e7e8d8e"}, {"url": "./assets/runtime/recording-inspection-r1020.js?v=r1101", "sha256": "0e85827711831bc60ab62f6e7ef30397f087a75f25715d50cb04036119ab8c04"}, {"url": "./assets/runtime/studio-batch-r1020.js?v=r1101", "sha256": "b3fec4c8f222778500e9eeaa67ca8fb054e510ffadca252618d866cfc99f0bda"}, {"url": "./assets/runtime/recovery-versions-r1019.js?v=r1101", "sha256": "0f11bd2717934368c26c6e2670c0d3b97c10f89de329c08e6c533754ad97119c"}, {"url": "./assets/runtime/recovery-data-r1020.js?v=r1101", "sha256": "73dc56f2eb83405ee0801fd94703b85497963d02aad728216336e66e6e5da355"}, {"url": "./assets/runtime/site-backup-r1020.js?v=r1101", "sha256": "5d8380543c1893a80c80c5b8a425cc28638615a724144243549469b9672cddf9"}, {"url": "./assets/runtime/recovery-ui-r1019.js?v=r1101", "sha256": "54468ea9aa52047ffcb76d2271b3f7cecab8b0e98877f2c0381abb031241e541"}, {"url": "./assets/runtime/recording-salvage-r1020.js?v=r1101", "sha256": "77bb3ffca382820d11ba1c68917d6bf57457961c61831eb108afb8be3805fe58"}, {"url": "./assets/runtime/recovery-entry-r1027.js?v=r1101", "sha256": "6ce0cc4c7ec758dffa69230149f26d57e57799cd8e9c6a33cbcf76781b13ebff"}, {"url": "./assets/runtime/startup-intro-r1027.js?v=r1101", "sha256": "7b1e19d8b46e2c98ae1f5e2e8c388e3214566db14bc56e7b67e02b095c8a63b1"}, {"url": "./rescue.html?v=r1101", "sha256": "747a6f3c2b8664a4f287f18eb96f54270096ddaf28c57a4ba3dd6d2940b0acfd"}, {"url": "./assets/branding/sukun-frameless-logo-r1029.png?v=r1101", "sha256": "19686a971a82137067622b90a9984ac146e68c3e7e9b82395dfc19462f4ffdcd"}, {"url": "./assets/branding/sukun-intro-pattern-r1029.svg?v=r1101", "sha256": "e52c310a620872ab5f158dd12805d8f750dfda424224eb1e2ac01a42ee85f5f4"}, {"url": "./assets/audio/sukun-intro-signature-r1037.wav?v=r1101", "sha256": "19e70027ad3125d1165a09fdb529c87881048c2866094e88e1a169e41f7de457"}, {"url": "./assets/runtime/generic-recordings-r1055.js?v=r1101", "sha256": "c6823c9eeeae0525dcf09f8e2775e95ca964b902f76966e4ec9a3e893b88c1f3"}, {"url": "./assets/runtime/generic-recordings-ui-r1055.js?v=r1101", "sha256": "4c60e36eff387b882d2b8d874799da2a3a469bb0ecca20b888fa511cf147dbcc"}, {"url": "./assets/runtime/compact-ui-r1057.css?v=r1101", "sha256": "ea43a802d7059df167b1acf3504b96ba77dd73bd98b95b1e488d3ec4d57bfaea"}, {"url": "./assets/runtime/compact-ui-r1057.js?v=r1101", "sha256": "b2d6d78b94aba9cc7fd23ef830d8931dc0cf6e5e9a8f1e19b370e21d7efcae7d"}, {"url": "./assets/runtime/background-mix-render-r1059.js?v=r1101", "sha256": "b6f2e15ac7d5b67f44c5668ac17628f8f25b3d8ac695ce4a489964873368db5e"}, {"url": "./assets/runtime/background-mix-r1059.js?v=r1101", "sha256": "93cbb0462372d7789ef5739c71e5f5ba39f24cb81b04d0aca89257e4520ffc38"}, {"url": "./assets/runtime/active-source-r1060.js?v=r1101", "sha256": "4600b2a842da3dd588a71a8aba6c6f10b107901200503f52969c87fce67fc7e3"}, {"url": "./assets/runtime/active-layers-r1061.js?v=r1101", "sha256": "fa1886b2c0b805773e66b7b96e19496dbf0da1c48a5e449590b4a62a1d821aae"}, {"url": "./assets/runtime/reading-ui-r1064.css?v=r1101", "sha256": "c7e5ad5f763e51c806602b77bdc202ff2c9d491e461aa6ea1260a99e0a49d8b9"}, {"url": "./assets/runtime/yasin-data-r1064.js?v=r1101", "sha256": "937cacc460aba0deca454506b44ed92731a389834fa3f8986ce5dbee01cd3b94"}, {"url": "./assets/runtime/reading-sources-r1064.js?v=r1101", "sha256": "e5153c25c01536f94c2c482a094fcbec8fe23debaad2dac4cbb1fe4f4973c126"}, {"url": "./assets/runtime/reading-audio-r1064.js?v=r1101", "sha256": "dbeccc27c91c5a87b494437ff835364350e23d00e61687378875c867891d9b44"}, {"url": "./assets/runtime/reading-ui-r1064.js?v=r1101", "sha256": "e64203292bbb461b87526679593bf28b5cc43bc53e4ffc56acadea719572c09c"}, {"url": "./assets/audio/arabic-r1065/yasin.mp3?v=r1101", "sha256": "4096f23ddba18fb4b410e54459cac520d91de178c5b5d2a78232e57723fb6a3d"}, {"url": "./assets/audio/arabic-r1065/fatiha.mp3?v=r1101", "sha256": "46fe21a5118957d52ac76f5a6a7fdd7e75d52e4a569619ae3e174a23ce5c82bc"}, {"url": "./assets/audio/arabic-r1065/ayatul-kursi.mp3?v=r1101", "sha256": "cb32b4b36012fdc2c4a93460a7106b9e337f1244d5198a549cea76a7edeaeb38"}, {"url": "./assets/audio/arabic-r1065/ikhlas.mp3?v=r1101", "sha256": "9ad15357702fd585cfc9a4cb082c65a7d3930ff34ed1c720f14447a0fc60d361"}, {"url": "./assets/audio/arabic-r1065/falaq.mp3?v=r1101", "sha256": "2e01e8048cca4ff3a7419331e119241d15565e1e5a531fab85bd53d7283afcc9"}, {"url": "./assets/audio/arabic-r1065/nas.mp3?v=r1101", "sha256": "176441a835915036e7b517f723d49d2954a86cfd8bfd12d6172c77edcc85405e"}, {"url": "./assets/runtime/bundled-arabic-r1065.js?v=r1101", "sha256": "e3b594ed25cb88af5cc1535c625e48aac2d7c74c8a8d6339177a0ea3a36f1a8f"}, {"url": "./assets/runtime/navigation-r1066.js?v=r1101", "sha256": "fcee1b29945d5a294b9660047d803c615f6e309a5bbe9dda80df2e3f280f5ac6"}, {"url": "./assets/runtime/yasin-timing-r1067.js?v=r1101", "sha256": "6d02c11f10f3fae3b0a93e3ff071103d1f02842cb651ca80599cbbb53029e98e"}, {"url": "./assets/runtime/browser-contrast-r1077.css?v=r1101", "sha256": "35eb72c7d208df77eaa80833bd33535db2e71359bef78cb0713574cdb52e6689"}, {"url": "./assets/runtime/protective-plan-r1078.css?v=r1101", "sha256": "435d3597d787a42f4e4cb8014dad0d6cc1d944575cb82d6375a25376a8e73243"}, {"url": "./assets/runtime/protective-plan-r1078.js?v=r1101", "sha256": "eae538c9a50770b86751c48d1b4ab4515a443a541fb358c5e3d157bb2d6b6a22"}, {"url": "./assets/berhetiyye-gate/portal-r1080.css?v=r1101", "sha256": "5c115fb5f548e6d15bb938c5270d5431bcaabe03ea6abd164370ad05885bb757"}, {"url": "./assets/berhetiyye-gate/entry-r1080.css?v=r1101", "sha256": "652561e9c60b412bbb6e03096c5576787aad2966b3bcfae8205d40b28d3e0374"}, {"url": "./assets/berhetiyye-gate/invitation-tr.mp3?v=r1101", "sha256": "18a114ec927508e4f5684a7e76d39abe28058c81f5632c797a707c6109bd5303"}, {"url": "./assets/berhetiyye-gate/audio-r1080.js?v=r1101", "sha256": "d77a0ecff6f7a7b11cee3116817c51c6a1cf568d0c7e8d7026383842936d015c"}, {"url": "./integration/berhet-access/example-http-provider.js?v=r1101", "sha256": "ec2e1f22e7bf0ae938a7163019eec4556150bf858dc387e13b3596cce30f16ae"}, {"url": "./assets/berhetiyye-gate/access-r1080.js?v=r1101", "sha256": "99270f5efc93e38ab95d1c6da32005232a63e181d94765e44f4c894d424a64c6"}, {"url": "./assets/berhetiyye-gate/portal-r1080.js?v=r1101", "sha256": "0048e2a9cac8416faa0102b1cc10ff8d262693f09be89e4ad663c170e9c077c9"}, {"url": "./assets/berhetiyye-gate/entry-r1080.js?v=r1101", "sha256": "8ef27093ff8da3fc8dc9a8f67563df4f49c0176ecbf18772c416c28d1194cde3"}, {"url": "./assets/runtime/smart-session-ui-r1082.css?v=r1101", "sha256": "75a9a3565910449a6dd3b2a0b3d46487ed4d2c63ee7fd062b547a9f9a86db2a0"}, {"url": "./assets/runtime/smart-session-ui-r1082.js?v=r1101", "sha256": "5dac4626b57602a9d04b3bc7b58ff8dbaacc951c9bcd75a61f1835702d230713"}, {"url": "./assets/runtime/session-preflight-ui-r1092.css?v=r1101", "sha256": "e0b99033e8d528dffa1da89c778b8567c201db5dda32516a1105610a74cfd150"}, {"url": "./assets/runtime/preflight-cache-r1092.js?v=r1101", "sha256": "840a9e120dc10f93842eada39e17ac316671c45405e8109694bfd20d8966d0ed"}, {"url": "./assets/runtime/session-preflight-r1092.js?v=r1101", "sha256": "0c33412ea2ef96825ec6ac7bb9b8e30307b3b486aa14803e2becc0cb758ba986"}, {"url": "./assets/runtime/session-preflight-ui-r1092.js?v=r1101", "sha256": "c8239465b43a7cc392c7d87ca6fd2361d59e4fbcb08ad7852657ee58204ef844"}, {"url": "./assets/runtime/archive-download-r1093.css?v=r1101", "sha256": "1e64b2d06b24547bb932d4148de660201ec62a5610d95c6148d8ba879cfbbebc"}, {"url": "./assets/runtime/archive-download-r1093.js?v=r1101", "sha256": "5a796fbbe29c0f5183434e655e792102fb831bb39895e1f5685d3c5aaf9fd3ad"}, {"url": "./assets/runtime/source-matrix-ui-r1094.css?v=r1101", "sha256": "ad4a4fa2d522d2a418403fc07b8f1a0979faf6e6d4db240e40e699eadcbe135a"}, {"url": "./assets/runtime/source-matrix-r1094.js?v=r1101", "sha256": "07a56c03210a52669d9d0c5578339eac60423654bdf8ef13dc0d18a8f4607e1e"}, {"url": "./assets/runtime/source-matrix-ui-r1094.js?v=r1101", "sha256": "1cdc67d4769bc8707acdc7e175ed927faf3dc820f8834de984e144887540345c"}, {"url": "./assets/runtime/image-pack-manifest-r1095.json?v=r1101", "sha256": "00c62b2f7736479a0ee6f8ee1a02e054acb78fa34ee885f5cd618afcd5bb91a8"}, {"url": "./assets/runtime/offline-images-ui-r1095.css?v=r1101", "sha256": "8d8790d515e1e752f4e80598e450eca83c96ae0c7397df3eb1156a16573ea70b"}, {"url": "./assets/runtime/offline-images-ui-r1095.js?v=r1101", "sha256": "a73415347147aea22dc249f435aba425713e8bc4f7cf33c72ea1c372168f32ef"}, {"url": "./css/berhet-controls-r1101.css?v=r1101", "sha256": "00d1b69e1dd5a8a79eddeba920702e3cd28b56694cd1fa4576466d0ce0979dc0"}, {"url": "./js/section-switch-r1101.js?v=r1101", "sha256": "29d8a99e6061997c0d392dc6e6493189eab9f2c10d67b87dcdb7dfa80b5d4a8f"}, {"url": "./css/frequency-hub-r1101.css?v=r1101", "sha256": "23587c627d8683d16ca6d576ec3751af99595425e476d0dd0c695faf184c4c6e"}, {"url": "./js/frequency-hub-r1101.js?v=r1101", "sha256": "037c2b1295f0ffe23a35818ab71193167b3440fd8fef6ff02987b6318d1a2353"}];

/* Kurulumu kırabilecek büyük/görsel dosyaları zorunlu listeye koymuyoruz.
   Shell doğrulaması bağımsız; geri kalan assetler yalnız görünüm istediğinde
   normal fetch sırasında ortak görsel cache'ine yazılır. Toplu görsel indirme
   install/activate yaşam döngüsünü veya aktif ses oturumunu meşgul etmez. */
const CORE = [
  "./assets/branding/sukun-intro-pattern-r1029.svg?v=r1101",
  "./assets/runtime/recovery-entry-r1027.js?v=r1101",
  "./assets/runtime/startup-intro-r1027.js?v=r1101",
  "./assets/branding/sukun-frameless-logo-r1029.png?v=r1101",
  "./rescue.html?v=r1101",
  "./assets/runtime/recording-salvage-r1020.js?v=r1101",
  "./sukun-site-assets-r1101.json?v=r1101",
  "./assets/runtime/recovery-ui-r1019.js?v=r1101",
  "./assets/runtime/site-backup-r1020.js?v=r1101",
  "./assets/runtime/recovery-data-r1020.js?v=r1101",
  "./assets/runtime/recovery-versions-r1019.js?v=r1101",
  "./assets/runtime/studio-batch-r1020.js?v=r1101",
  './assets/runtime/recording-inspection-r1020.js?v=r1101',
  './assets/runtime/recording-continuity-r1016.js?v=r1101',
  "./assets/runtime/offline-scenes-r962.js?v=r1101",
  "./assets/wheel-navigation-r964/gold.png?v=r1101",
  "./assets/wheel-navigation-r964/copper.png?v=r1101",
  "./assets/wheel-navigation-r964/silver.png?v=r1101",
  "./assets/wheel-navigation-r964/dark.png?v=r1101",
  "./assets/wheel-navigation-r964/crystal.png?v=r1101",

  "./assets/runtime/tekke-journey-r993.css?v=r1101",
  "./assets/runtime/tekke-journey-r993.js?v=r1101",

  "./assets/runtime/tekke-ux-r992.css?v=r1101",
  "./assets/runtime/tekke-ux-r992.js?v=r1101",

  "./assets/runtime/tekke-set-r990.js?v=r1101",


  "./assets/runtime/tekke-sequence-r988.js?v=r1101",

  "./assets/runtime/studio-preparation-r982.js?v=r1101",
  "./assets/runtime/progress-journal-r982.js?v=r1101",

  "./assets/runtime/audio-cpu-r981.js?v=r1101",
  "./assets/runtime/audio-preparation-r981.js?v=r1101",
  "./assets/runtime/tab-owner-r981.js?v=r1101",
  "./assets/runtime/cadence-r981.css?v=r1101",
  "./assets/runtime/cadence-r981.js?v=r1101",

  "./assets/runtime/presentation-r979.js?v=r1101",
  "./assets/runtime/lifecycle-r949.js?v=r1101",
  "./assets/runtime/background-owner-r949.js?v=r1101",
  "./assets/runtime/berhet-layout-r938.css?v=r1101",
  "./assets/runtime/berhet-materials-r933.css?v=r1101",
  "./assets/runtime/berhet-controls-r933.css?v=r1101",
  "./assets/runtime/berhet-dock-r933.css?v=r1101",
  "./assets/runtime/audio-palette-r945.js?v=r1101",
  "./assets/runtime/esma-scenes-r923.js?v=r1101",
  "./assets/runtime/session-r919.js?v=r1101",
  "./assets/runtime/dock-r920.js?v=r1101",
  "./assets/runtime/wheels-r924.js?v=r1101",
  "./assets/runtime/berhet-layout-r938.js?v=r1101",
  "./assets/runtime/interface-r920.js?v=r1101",
  "./assets/runtime/wheels-r924.css?v=r1101",
  "./assets/runtime/berhet-theme-r933.js?v=r1101",
  "./assets/runtime/health-view-r943.css?v=r1101",
  "./assets/runtime/health-view-r943.js?v=r1101",
  "./assets/runtime/scene-picker-r945.css?v=r1101",
  "./assets/runtime/scene-picker-r945.js?v=r1101",
  "./assets/runtime/health-r940.js?v=r1101",
  "./assets/runtime/nefs-r948.css?v=r1101",
  "./assets/runtime/nefs-data-r948.js?v=r1101",
  "./assets/runtime/nefs-model-r948.js?v=r1101",
  "./assets/runtime/nefs-ui-r948.js?v=r1101",





















  './assets/berhetiyye-premium/control-round-plus-r788.webp',
  './assets/berhetiyye-premium/control-round-minus-r788.webp',
  './assets/berhetiyye-premium/control-nav-amethyst-r788.webp',
  './assets/berhetiyye-premium/control-nav-sapphire-r788.webp',
  './assets/berhetiyye-premium/control-nav-emerald-r788.webp',
  './assets/berhetiyye-premium/control-primary-r788.webp',
  './nero.html',
  './manifest.webmanifest',
  BUILD_MARKER,
  LATEST_MARKER


];

const NOTLAR = ["Kayıt koruması: yarım kalmış veri kurtarma günlüğü açılışta otomatik uygulanmaz. Tam veri geri yükleme ve toplu silme inceleme sırasında kapalıdır.", "🛟 Kayıp sesler: eski kişisel veri noktaları, stüdyo asılları ve doğrulanmış JSON yedekleri taranır. Yalnız eksik sesler eklenir; mevcut sesler değiştirilmez.", "Güncel depo sonucu ile önceki dolu gözlem ayrı gösterilir. Sıfır sonucu geçmişi silmez; okumalar eksik bir ses deposunu kendiliğinden oluşturmaz.", "Önbelleği yenileme sesleri veya ayarları silmez. Eski ve gizli veri noktaları ile stüdyo kopyaları korunur. r1019 sürümüne dönüş engellenmiştir.", "İsteğe bağlı görseller ortak önbelleğe alınır; sürüm başına yeniden çoğaltılmaz. Yerel kopya kalmamış seslerin kurtarılması için harici JSON yedeği gerekir."];

function buildOfHtml(text){
 const tags=String(text||'').match(/<meta\b[^>]*>/gi)||[];
 for(const tag of tags){
  if(/\bname\s*=\s*["']sukun-build["']/i.test(tag))return tag.match(/\bcontent\s*=\s*["']([^"']+)["']/i)?.[1]||'';
 }
 return '';
}
function vnum(v){const m=String(v||'').match(/r(\d+)/i);return m?Number(m[1]):-1}
function sameOriginPath(path){return new URL(path,self.location.href).pathname}
// Bound CacheStorage/hash/worker-message waits as well as network fetches.
function updateDeadline(work,ms,label){return new Promise((resolve,reject)=>{
 let done=false;const finish=(fn,value)=>{if(done)return;done=true;clearTimeout(timer);fn(value)};
 const timer=setTimeout(()=>finish(reject,Error(label+': zaman aşımı')),ms);
 Promise.resolve().then(work).then(v=>finish(resolve,v),e=>finish(reject,e));
})}
function replyUpdate(port,value){try{port?.postMessage(value)}catch(_){}}
async function prepareProgress(progress){
 try{const cs=await updateDeadline(()=>self.clients.matchAll({type:'window',includeUncontrolled:true}),2000,'İlerleme bildirimi');
  for(const c of cs)try{c.postMessage({type:'SUKUN_SW_STATUS',v:SURUM,cache:CACHE,phase:'prepare-progress',progress})}catch(_){}
 }catch(_){}
}
/* Keep one deadline alive through headers and the complete response body.
   Abort the network and cancel the reader before releasing a timed-out slot.
   Late headers/body chunks can never reach the cache-writing caller. */
function fetchBuffered(request,timeout){
 return new Promise((resolve,reject)=>{
  const ctl=new AbortController();let settled=false,response=null,reader=null,timer=null;
  const sourceSignal=typeof request==='object'?request.signal:null;
  const cancel=reason=>{try{ctl.abort(reason)}catch(_){}try{const target=reader,work=target?target.cancel(reason):response?.body?.cancel(reason);work?.catch(()=>{}).finally(()=>{try{target?.releaseLock()}catch(_){}})}catch(_){}};
  const finish=(fn,value)=>{if(settled)return;settled=true;clearTimeout(timer);sourceSignal?.removeEventListener('abort',onAbort);fn(value)};
  const onAbort=()=>{const error=sourceSignal?.reason||new DOMException('Dosya indirme iptal edildi','AbortError');cancel(error);finish(reject,error)};
  timer=setTimeout(()=>{const error=new DOMException('Dosya indirme zaman aşımı','TimeoutError');cancel(error);finish(reject,error)},timeout);
  if(sourceSignal?.aborted){onAbort();return}
  sourceSignal?.addEventListener('abort',onAbort,{once:true});
  Promise.resolve().then(async()=>{
   if(settled)return;
   response=await fetch(new Request(request,{signal:ctl.signal}));
   if(settled){cancel(ctl.signal.reason);return}
   if(!response||response.type==='opaque'||response.type==='error')throw Error('unreadable response');
   const chunks=[];let length=0;
   if(response.body){reader=response.body.getReader();for(;;){const part=await reader.read();if(settled)return;if(part.done)break;chunks.push(part.value);length+=part.value.byteLength}reader.releaseLock();reader=null}
   if(settled)return;
   const data=new Uint8Array(length);let offset=0;for(const chunk of chunks){data.set(chunk,offset);offset+=chunk.byteLength}
   finish(resolve,new Response(length?data:null,{status:response.status,statusText:response.statusText,headers:response.headers}));
  }).catch(error=>{cancel(error);finish(reject,error)});
 });
}
async function fetchFresh(path,timeout=30000){
 const response=await fetchBuffered(new Request(path,{cache:'no-store'}),timeout);
 if(!response?.ok)throw Error('fetch '+path+' '+(response?.status||'failed'));
 return response;
}
async function put(cache,key,res){try{await cache.put(key,res.clone());return true}catch(e){return false}}
async function readCacheMeta(){
  try{const c=await caches.open(CACHE),r=await c.match(CACHE_META,{ignoreSearch:true});return r?await r.json():null}catch(e){return null}
}
async function writeCacheMeta(meta){
 try{const cache=await caches.open(CACHE);await cache.put(CACHE_META,new Response(JSON.stringify(meta),{headers:{'Content-Type':'application/json','Cache-Control':'no-store'}}));return meta}catch(_){return null}
}


/* r1019 recovery: verified code caches only. Personal IndexedDB/localStorage
   are never read or replaced here. A pin outlives the service-worker process. */
const RECOVERY_CONTROL_CACHE = 'sukun-recovery-control-v1';
const RECOVERY_STATE_KEY = './__sukun_recovery_state__';
const RECOVERY_ROUTE = './__sukun_recovery__';
const RECOVERY_MAX_PREVIOUS = 5;
// r1019 could replay an automatic restore journal at startup. A later worker
// must never reopen that shell through rollback, a persisted pin, or fallback.
const RECOVERY_BLOCKED_BUILDS = new Set(['r1019']);
const recoveryUnsafeBuild = build => build!==SURUM&&RECOVERY_BLOCKED_BUILDS.has(build);
function recoveryUnsafeExecutable(url){
 if(url.origin!==self.location.origin||!/\.(?:m?js|css|html)$/i.test(url.pathname))return false;
 // An old controlled tab can ask for a file absent from the current manifest;
 // reject before generic cache/network fallback has a chance to serve it.
 if(url.searchParams.getAll('v').some(recoveryUnsafeBuild))return true;
 return recoveryUnsafeBuild('r1019')&&url.pathname===sameOriginPath('./assets/runtime/recovery-data-r1019.js');
}
const isAppCacheName = name => /^sukun-r\d+(?:-|$)/.test(String(name));
const recoveryUrl = path => new URL(path,self.location.href).href;
const recoveryPath = path => new URL(path,self.location.href).pathname;
let recoveryMutation = Promise.resolve();
function recoverySerialize(work){
 const next=recoveryMutation.then(work,work);recoveryMutation=next.catch(()=>{});return next;
}
async function recoveryReadState(){
 const c=await caches.open(RECOVERY_CONTROL_CACHE),r=await c.match(RECOVERY_STATE_KEY);
 if(!r)return {schema:1,pin:null};
 let d;try{d=await r.json()}catch(_){throw Error('RECOVERY_STATE_UNREADABLE')}
 if(d?.schema!==1||d.pin!=null&&(!isAppCacheName(d.pin.cache)||!/^r\d+$/.test(d.pin.build||'')))throw Error('RECOVERY_STATE_UNREADABLE');
 return d;
}
async function recoveryWriteState(data){
 const c=await caches.open(RECOVERY_CONTROL_CACHE);
 await c.put(RECOVERY_STATE_KEY,new Response(JSON.stringify({...data,schema:1,at:Date.now()}),{headers:{'Content-Type':'application/json'}}));
}
function recoveryProofKey(name){return './__sukun_recovery_proof__/'+encodeURIComponent(name)}
async function recoveryReadProof(name){
 try{const c=await caches.open(RECOVERY_CONTROL_CACHE),r=await c.match(recoveryProofKey(name));return r?await r.json():null}catch(_){return null}
}
function recoveryAttribute(tag,name){
 const m=String(tag).match(new RegExp('\\b'+name+'\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))','i'));return m?(m[1]??m[2]??m[3]):'';
}
function recoveryExecutables(html){
 const out=[];
 for(const tag of String(html).match(/<(?:script|link)\b[^>]*>/gi)||[]){
  const isScript=/^<script\b/i.test(tag),rel=recoveryAttribute(tag,'rel');
  if(!isScript&&!/\bstylesheet\b/i.test(rel))continue;
  const path=recoveryAttribute(tag,isScript?'src':'href');if(!path)continue;
  const url=new URL(path,self.location.href);if(url.origin!==self.location.origin)continue;
  out.push({url:url.href,integrity:recoveryAttribute(tag,'integrity')});
 }
 return out;
}
function recoveryHexToBase64(hex){
 let raw='';for(let i=0;i<hex.length;i+=2)raw+=String.fromCharCode(parseInt(hex.slice(i,i+2),16));return btoa(raw);
}
// The active worker's exact runtime list is the authority for admission too.
// A same-build label alone must not bless an incomplete or changed marker.
function recoveryCurrentMarkerRuntime(marker){
 if(!marker||(marker.build||marker.v)!==SURUM||(marker.build!=null&&marker.build!==SURUM)||(marker.v!=null&&marker.v!==SURUM)||!Array.isArray(marker.runtime)||marker.runtime.length!==REQUIRED_RUNTIME.length||!/^[a-f0-9]{64}$/i.test(marker.shell?.sha256||''))return null;
 const required=new Map(REQUIRED_RUNTIME.map(entry=>[recoveryUrl(entry.url),entry.sha256])),expected=new Map();
 for(const entry of marker.runtime){
  if(typeof entry?.url!=='string'||!/^[a-f0-9]{64}$/i.test(entry.sha256||''))return null;
  let url;try{url=new URL(entry.url,self.location.href)}catch(_){return null}
  if(url.origin!==self.location.origin||url.searchParams.get('v')!==SURUM||expected.has(url.href)||required.get(url.href)!==entry.sha256.toLowerCase())return null;
  expected.set(url.href,entry.sha256.toLowerCase());
 }
 return expected;
}
async function recoveryCurrentShellMatches(response,marker,proof){
 const expected=recoveryCurrentMarkerRuntime(marker);if(!expected)return false;
 const digest=await sha256Response(response);if(digest!==marker.shell.sha256.toLowerCase()||(proof&&digest!==proof.shellSha256))return false;
 const html=await response.clone().text();if(buildOfHtml(html)!==SURUM)return false;
 for(const entry of recoveryExecutables(html)){const hash=expected.get(entry.url);if(!hash||!entry.integrity.split(/\s+/).includes('sha256-'+recoveryHexToBase64(hash)))return false;}
 return true;
}
async function recoveryVerifyCache(name,enroll=false){
 if(!isAppCacheName(name))return null;
 try{
  const cache=await caches.open(name),htmlResponse=await cache.match('./nero.html',{ignoreSearch:true});
  if(!htmlResponse?.ok)return null;
  const html=await htmlResponse.clone().text(),build=buildOfHtml(html);if(!/^r\d+$/.test(build)||!name.startsWith('sukun-'+build+'-')||recoveryUnsafeBuild(build))return null;
  const metaResponse=await cache.match('./sukun-cache-meta-'+build+'.json',{ignoreSearch:true});
  const markerResponse=await cache.match('./sukun-build-'+build+'.json',{ignoreSearch:true});
  const manifestResponse=await cache.match('./manifest.webmanifest',{ignoreSearch:true});
  if(!metaResponse?.ok||!markerResponse?.ok||!manifestResponse?.ok)return null;
  const meta=await metaResponse.clone().json(),marker=await markerResponse.clone().json(),manifest=await manifestResponse.clone().json();
  if(!meta.complete||meta.v!==build||(meta.cache&&meta.cache!==name)||(marker.build||marker.v)!==build||manifest.short_name!=='SÜKÛN'||new URL(manifest.start_url||'',self.location.href).searchParams.get('v')!==build)return null;
  if(!Array.isArray(marker.runtime)||!marker.runtime.length)return null;
  // The current worker's embedded manifest is authoritative even before the
  // first proof is enrolled. A changed marker cannot bless changed runtimes.
  const required=name===CACHE?new Map(REQUIRED_RUNTIME.map(entry=>[recoveryUrl(entry.url),entry.sha256])):null;
  if(required&&(build!==SURUM||!recoveryCurrentMarkerRuntime(marker)))return null;
  const expected=new Map();
  for(const entry of marker.runtime){
   if(typeof entry?.url!=='string'||!/^[a-f0-9]{64}$/i.test(entry.sha256||''))return null;
   const url=new URL(entry.url,self.location.href);
   if(url.origin!==self.location.origin||url.searchParams.get('v')!==build||expected.has(url.href))return null;
   if(required&&required.get(url.href)!==entry.sha256.toLowerCase())return null;
   const response=await cache.match(entry.url,{ignoreSearch:false});
   if(!response?.ok||await sha256Response(response)!==entry.sha256.toLowerCase())return null;
   expected.set(url.href,entry.sha256.toLowerCase());
  }
  for(const entry of recoveryExecutables(html)){
   const digest=expected.get(entry.url);if(!digest||!entry.integrity.split(/\s+/).includes('sha256-'+recoveryHexToBase64(digest)))return null;
  }
  const shellSha256=await sha256Response(htmlResponse),markerSha256=await sha256Response(markerResponse),manifestSha256=await sha256Response(manifestResponse);
  // New releases may publish a shell digest in their build marker. Older
  // releases are enrolled only after complete runtime + HTML SRI validation.
  if(marker.shell?.sha256&&marker.shell.sha256!==shellSha256)return null;
  const proof=await recoveryReadProof(name);
  if(proof&&(proof.build!==build||proof.shellSha256!==shellSha256||proof.markerSha256!==markerSha256||proof.manifestSha256!==manifestSha256))return null;
  const result={build,cache:name,at:Number(meta.at)||0,shellSha256,markerSha256,manifestSha256,shellBytes:Number(htmlResponse.headers.get('content-length'))||new TextEncoder().encode(html).byteLength,runtimeCount:marker.runtime.length,verified:true};
  if(!proof){
   if(!enroll)return null;
   const controls=await caches.open(RECOVERY_CONTROL_CACHE);
   await controls.put(recoveryProofKey(name),new Response(JSON.stringify({...result,verifiedAt:Date.now()}),{headers:{'Content-Type':'application/json'}}));
  }
  return result;
 }catch(_){return null}
}
async function recoveryVersions(enroll=true){
 const names=(await caches.keys()).filter(isAppCacheName),entries=[];
 for(const name of names){const entry=await recoveryVerifyCache(name,enroll);if(entry)entries.push(entry)}
 entries.sort((a,b)=>vnum(b.build)-vnum(a.build)||b.at-a.at||a.cache.localeCompare(b.cache));
 const state=await recoveryReadState(),unique=[];
 for(const entry of entries){const existing=unique.find(e=>e.build===entry.build);if(!existing)unique.push(entry);else if(entry.cache===state.pin?.cache||entry.cache===CACHE)unique[unique.indexOf(existing)]=entry}
 const current=unique.find(e=>e.cache===CACHE)||null;
 const previous=unique.filter(e=>vnum(e.build)<vnum(SURUM));
 return {current:SURUM,currentCache:CACHE,currentReady:!!current,selected:state.pin?.build||SURUM,rollback:!!state.pin,maxPrevious:RECOVERY_MAX_PREVIOUS,availablePrevious:previous.length,versions:unique.filter(e=>vnum(e.build)<=vnum(SURUM)).map(e=>({...e,current:e.cache===CACHE,selected:e.cache===(state.pin?.cache||CACHE)}))};
}
async function recoveryPrune(){
 const state=await recoveryReadState(),report=await recoveryVersions(true),keep=new Set([CACHE]);
 const previous=report.versions.filter(e=>vnum(e.build)<vnum(SURUM)).slice(0,RECOVERY_MAX_PREVIOUS);
 if(state.pin&&!previous.some(e=>e.cache===state.pin.cache)){
  const pinned=report.versions.find(e=>e.cache===state.pin.cache);if(pinned){if(previous.length>=RECOVERY_MAX_PREVIOUS)previous.pop();previous.push(pinned)}
 }
 for(const entry of previous)keep.add(entry.cache);
 // Every executable history entry must verify; artwork and unrelated caches
 // are deliberately outside this predicate and cannot be deleted.
 for(const name of (await caches.keys()).filter(isAppCacheName))if(vnum(name)<=vnum(SURUM)&&!keep.has(name))await caches.delete(name);
 return recoveryVersions(false);
}
let recoveryPinMemo=null;
async function recoveryPinned(fresh=false){
 const state=await recoveryReadState();if(!state.pin){recoveryPinMemo=null;return null;}
 if(recoveryUnsafeBuild(state.pin.build))throw Error('UNSAFE_PIN');
 // Asset requests can share the last check. Fresh readiness and navigation
 // must inspect the cache again: the browser can evict files after verification.
 if(fresh||!recoveryPinMemo||recoveryPinMemo.cache!==state.pin.cache){recoveryPinMemo={cache:state.pin.cache,check:recoveryVerifyCache(state.pin.cache,false)};}
 const entry=await recoveryPinMemo.check;
 if(!entry||entry.build!==state.pin.build)throw Error('PIN_INVALID');return entry;
}
async function recoverySource(event){
 const id=event.source?.id;if(!id)throw Error('SAME_ORIGIN_WINDOW_REQUIRED');
 const client=await self.clients.get(id);if(!client||client.type!=='window')throw Error('SAME_ORIGIN_WINDOW_REQUIRED');
 const url=new URL(client.url),scope=new URL(self.registration.scope||'./',self.location.href);
 if(url.origin!==self.location.origin||!url.pathname.startsWith(scope.pathname))throw Error('SAME_ORIGIN_WINDOW_REQUIRED');
 return client;
}
async function recoverySingleSource(event){
 const client=await recoverySource(event);
 const all=await self.clients.matchAll({type:'window',includeUncontrolled:true}),scope=new URL(self.registration.scope||'./',self.location.href);
 if(all.some(c=>{try{const u=new URL(c.url);return c.id!==client.id&&u.origin===scope.origin&&u.pathname.startsWith(scope.pathname)}catch(_){return false}}))throw Error('OTHER_APP_TAB_OPEN');
 return client;
}
async function recoveryMutationSource(event){
 if(event.data?.confirm!==true)throw Error('EXPLICIT_CONFIRM_REQUIRED');
 return recoverySingleSource(event);
}
async function recoverySwitch(event,mode){
 await recoveryMutationSource(event);
 const expiresAt=Math.min(Number(event.data?.expiresAt)||Date.now()+55000,Date.now()+55000);
 const assertLive=()=>{if(Date.now()>=expiresAt)throw Error('RECOVERY_REQUEST_EXPIRED')};assertLive();
 if(mode==='current'){
  const current=await recoveryVerifyCache(CACHE,true);if(!current)throw Error('CURRENT_NOT_VERIFIED');
  await recoveryMutationSource(event);assertLive();recoveryPinMemo=null;
  await recoveryWriteState({schema:1,pin:null});return {ok:true,build:SURUM,cache:CACHE,rollback:false,reload:true};
 }
 const {cache,build}=event.data||{};
 if(recoveryUnsafeBuild(build)||recoveryUnsafeBuild(String(cache||'').match(/^sukun-(r\d+)(?:-|$)/)?.[1]))throw Error('HISTORICAL_BUILD_UNSAFE');
 const report=await recoveryVersions(true);
 const targets=report.versions.filter(e=>vnum(e.build)<vnum(SURUM)).slice(0,RECOVERY_MAX_PREVIOUS);
 const entry=targets.find(e=>e.cache===cache&&e.build===build);if(!entry)throw Error('HISTORICAL_BUILD_UNAVAILABLE');
 const verified=await recoveryVerifyCache(entry.cache,false);if(!verified)throw Error('HISTORICAL_BUILD_NOT_VERIFIED');
 await recoveryMutationSource(event);assertLive();recoveryPinMemo=null;
 await recoveryWriteState({schema:1,pin:{cache:entry.cache,build:entry.build,at:Date.now()}});
 return {ok:true,build:entry.build,cache:entry.cache,rollback:true,reload:true};
}
function recoveryUnavailable(error){
 const message=String(error?.message||error||'Önbellek okunamadı');
 return new Response('<!doctype html><html lang="tr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SÜKÛN Kurtarma</title><body style="background:#071219;color:#f3ead0;font:16px/1.7 system-ui;padding:24px"><h1>Korunan sürüm açılamadı</h1><p>Doğrulama başarısız olduğu için başka sürümün dosyalarıyla karıştırılmadı.</p><p><a style="color:#9fdfc4" href="'+RECOVERY_ROUTE+'">Kurtarma aracını aç</a></p><p>'+message.replace(/[<&]/g,'')+'</p></body></html>',{status:503,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});
}
async function recoveryNavigation(request,pin){
 const cache=await caches.open(pin.cache),res=await cache.match('./nero.html',{ignoreSearch:true});if(!res)return recoveryUnavailable('PIN_SHELL_MISSING');
 if(await sha256Response(res)!==pin.shellSha256)return recoveryUnavailable('PIN_SHELL_CHANGED');
 const html=await res.text(),link='<a href="'+RECOVERY_ROUTE+'" style="position:fixed;right:8px;bottom:8px;z-index:2147483647;background:#081d28;color:#d5fff1;padding:10px 14px;border:1px solid #7fb8ad;border-radius:12px;font:14px system-ui;text-decoration:none" aria-label="Kurtarma ve güncel sürüme dönüş">🛟 '+pin.build+' · Kurtarma</a>';
 const body=html.includes('</body>')?html.replace('</body>',link+'</body>'):html+link;
 const headers=new Headers(res.headers);headers.delete('content-length');headers.set('Cache-Control','no-store');return new Response(body,{status:res.status,headers});
}
async function recoveryAsset(request,pin){
 const cache=await caches.open(pin.cache),url=new URL(request.url),markerResponse=await cache.match('./sukun-build-'+pin.build+'.json',{ignoreSearch:true});
 if(!markerResponse||await sha256Response(markerResponse)!==pin.markerSha256)return Response.error();
 const marker=await markerResponse.clone().json();
 const entry=marker.runtime.find(e=>recoveryPath(e.url)===url.pathname);
 if(entry){
  const requested=url.searchParams.get('v'),revision=entry.url.match(/\/wheel-navigation-(r\d+)\//)?.[1];
  if(requested&&requested!==pin.build&&!(isArt(url)&&requested===revision))return Response.error();
  const res=await cache.match(entry.url,{ignoreSearch:false});return res&&await sha256Response(res)===entry.sha256?res:Response.error();
 }
 if(url.pathname===recoveryPath('./manifest.webmanifest')){const res=await cache.match('./manifest.webmanifest',{ignoreSearch:true});return res&&await sha256Response(res)===pin.manifestSha256?res:Response.error();}
 if(url.pathname===recoveryPath(LATEST_MARKER))return new Response(JSON.stringify({v:pin.build,build:pin.build,latest:pin.build,recoveryPinned:true,worker:SURUM}),{headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
 if(url.pathname===recoveryPath('./sukun-build-'+pin.build+'.json'))return markerResponse;
 if(/\.(?:m?js|css|html)$/i.test(url.pathname)||/\/(?:sukun-build-r\d+|__sukun_build_r\d+__)\.json$/.test(url.pathname))return Response.error();
 const exact=await cache.match(request,{ignoreSearch:false});if(exact)return exact;
 // Artwork is non-executable and persists independently; no network request
 // can replace a historical runtime, stylesheet, manifest, or shell.
 if(isArt(url)){const art=await caches.open(ART_CACHE),res=await art.match(artKey(request));if(validArt(res))return res;}
 return Response.error();
}
// This standalone client is serialized into the emergency document, so it has
// no dependency on a possibly broken application shell or external runtime.
function recoveryPageClient(){
 'use strict';
 const query=new URL(location.href).searchParams.get('lang');
 const lang=query==='en'||query==='tr'?query:/^en(?:-|$)/i.test(navigator.language||'')?'en':'tr';
 const en=lang==='en',text=(tr,eng)=>en?eng:tr;
 document.documentElement.lang=lang;
 document.title=text('SÜKÛN Kurtarma','SÜKÛN Recovery');
 const node=id=>document.getElementById(id),status=node('status'),errorBox=node('error'),current=node('current'),list=node('versions'),retry=node('retry');
 node('heading').textContent='🛟 '+document.title;
 node('intro').textContent=text('Yalnız bu cihazda doğrulanmış uygulama sürümleri açılır. Kişisel kayıtlar ve ayarlar değiştirilmez.','Only application versions verified on this device can be opened. Personal recordings and settings are not changed.');
 node('warning').textContent=text('Başka SÜKÛN sekmesi açıksa kapat. Eski sürüm, daha yeni kişisel veri biçimlerini desteklemeyebilir. Ses ve ayar yedeğini güncel sürümden ayrıca al.','Close any other SÜKÛN tabs. Older versions may not support newer personal data formats. Export a separate recording and settings backup from the current version.');
 current.textContent=text('Güncel sürüme dön','Return to current version');retry.textContent=text('Listeyi yeniden kontrol et','Check versions again');
 node('app').textContent=text('Uygulamayı aç','Open application');
 node('static').textContent=text('Bağımsız kurtarma sayfası','Independent recovery page');node('static').href='./rescue.html?lang='+lang;
 node('language').textContent=en?'Türkçe':'English';node('language').href='./__sukun_recovery__?lang='+(en?'tr':'en');
 const messages={
  OTHER_APP_TAB_OPEN:['Diğer SÜKÛN sekmelerini kapatıp yeniden dene.','Close the other SÜKÛN tabs and try again.'],
  SAME_ORIGIN_WINDOW_REQUIRED:['Kurtarma yalnız bu sitedeki SÜKÛN sayfasından kullanılabilir.','Recovery is available only from the SÜKÛN page on this site.'],
  EXPLICIT_CONFIRM_REQUIRED:['Sürüm değişikliği için onay gerekiyor.','Confirm the application version change first.'],
  HISTORICAL_BUILD_UNAVAILABLE:['Bu eski sürümün doğrulanmış dosyaları cihazda bulunmuyor.','Verified files for this older version are not available on this device.'],
  HISTORICAL_BUILD_UNSAFE:['Bu sürüm kayıt koruması nedeniyle kapalı. Güncel sürümü kullan.','This version is blocked to protect recordings. Use the current version.'],
  HISTORICAL_BUILD_NOT_VERIFIED:['Eski sürümün dosya kontrolü başarısız oldu.','The older version failed its file checks.'],
  CURRENT_NOT_VERIFIED:['Güncel sürüm dosyaları hazır değil. Bağlantı varken güncellemeyi kontrol et.','The current version files are not ready. Check for updates while online.'],
  PIN_INVALID:['Korunan sürüm doğrulanamadı. Güncel sürüme dön.','The selected recovery version could not be verified. Return to the current version.'],
  UNSAFE_PIN:['Seçili eski sürüm kayıt koruması nedeniyle kapalı. Güncel sürüme dön.','The selected older version is blocked to protect recordings. Return to the current version.'],
  RECOVERY_STATE_UNREADABLE:['Kurtarma durumu okunamadı. Güncel dosyalar doğrulanırsa aşağıdaki düğmeyle güncel sürüme dönebilirsin; kişisel kayıtlar korunur.','The recovery state could not be read. If the current files verify, use the button below to return to the current version; personal recordings are preserved.'],
  RECOVERY_REQUEST_EXPIRED:['Sürüm değiştirme süresi doldu. Listeyi yeniden kontrol edip dene.','The version change timed out. Check the version list and try again.'],
  NO_CONTROLLER:['Etkin SÜKÛN servisi bulunamadı. Bağımsız kurtarma sayfasını aç.','No active SÜKÛN service worker was found. Open the independent recovery page.'],
  RECOVERY_TIMEOUT:['Kontrol zaman aşımına uğradı. Yeniden dene.','The check timed out. Try again.'],
  RECOVERY_FAILED:['İşlem tamamlanamadı. Yeniden dene; site verilerini silme.','The operation could not finish. Try again; do not clear site data.']
 };
 let busy=false,report=null;
 const explain=e=>text(...(messages[e?.message]||messages.RECOVERY_FAILED));
 function showError(e){errorBox.textContent=explain(e);errorBox.hidden=false;}
 function buttons(){
  current.disabled=busy||(!report?.rollback&&report?.stateError!=='RECOVERY_STATE_UNREADABLE')||report.currentReady!==true;
  retry.disabled=busy;
  list.querySelectorAll('button').forEach(b=>{b.disabled=busy||b.dataset.selected==='true';});
 }
 function ask(type,extra={}){
  const worker=navigator.serviceWorker?.controller;
  let workerUrl;try{workerUrl=new URL(worker?.scriptURL,location.href);}catch(_){}
  const expected=new URL('./sw.js',location.href);
  if(!worker||workerUrl?.origin!==expected.origin||workerUrl.pathname!==expected.pathname)return Promise.reject(Error('NO_CONTROLLER'));
  return new Promise((resolve,reject)=>{
   let channel,timer,done=false;
   const finish=(fn,value)=>{if(done)return;done=true;clearTimeout(timer);try{channel?.port1.close();channel?.port2.close();}catch(_){}fn(value);};
   try{
    channel=new MessageChannel();timer=setTimeout(()=>finish(reject,Error('RECOVERY_TIMEOUT')),60000);
    channel.port1.onmessage=e=>{const data=e.data;if(!data||data.ok!==true)return finish(reject,Error(data?.error||'RECOVERY_FAILED'));finish(resolve,data);};
    channel.port1.onmessageerror=()=>finish(reject,Error('RECOVERY_FAILED'));
    worker.postMessage({type,...extra},[channel.port2]);
   }catch(_){finish(reject,Error('RECOVERY_FAILED'));}
  });
 }
 async function refresh(){
  status.textContent=text('Sürümler kontrol ediliyor…','Checking versions…');
  try{
   const r=await ask('RECOVERY_LIST');
   if(!Array.isArray(r.versions)||!/^r\d+$/.test(r.current||'')||!/^r\d+$/.test(r.selected||''))throw Error('RECOVERY_FAILED');
   report=r;
   status.textContent=text('Açılan sürüm: ','Selected version: ')+r.selected+text(' · güncel: ',' · current: ')+r.current+text(' · mevcut eski sürüm: ',' · available older versions: ')+r.availablePrevious+' / '+text('en çok 5','up to 5');
   list.replaceChildren();
   for(const v of r.versions.filter(v=>!v.current).slice(0,5)){
    if(!/^r\d+$/.test(v.build||'')||typeof v.cache!=='string')continue;
    const li=document.createElement('li'),button=document.createElement('button');button.type='button';
    button.textContent=v.build+(v.selected?text(' · seçili',' · selected'):text(' · bu sürüme dön',' · return to this version'));
    button.dataset.selected=String(!!v.selected);button.onclick=()=>act('RECOVERY_ROLLBACK',{cache:v.cache,build:v.build});li.append(button);list.append(li);
   }
  }catch(e){
   report=null;list.replaceChildren();status.textContent=text('Sürüm listesi okunamadı.','The version list could not be read.');if(errorBox.hidden)showError(e);
   if(e?.message==='RECOVERY_STATE_UNREADABLE'){
    // Checking the current release does not read or repair the broken pin.
    // The existing confirmed mutation still verifies it again before switching.
    try{const r=await ask('RECOVERY_CURRENT_STATUS');if(!/^r\d+$/.test(r.current||'')||typeof r.currentReady!=='boolean')throw Error('RECOVERY_FAILED');report={...r,stateError:'RECOVERY_STATE_UNREADABLE'};status.textContent=r.currentReady?text('Güncel sürüm doğrulandı: ','Current version verified: ')+r.current:text('Güncel sürüm dosyaları hazır değil.','The current version files are not ready.');}catch(_){}
   }
  }
  buttons();
 }
 async function act(type,extra={}){
  if(busy)return;
  if(!confirm(text('Uygulama sürümü değiştirilsin mi? Kişisel kayıtlar geri yüklenmez.','Change the application version? Personal recordings will not be restored.')))return;
  busy=true;buttons();errorBox.hidden=true;errorBox.textContent='';
  try{
   const result=await ask(type,{confirm:true,expiresAt:Date.now()+55000,...extra});
   const expected=type==='RECOVERY_ROLLBACK'?extra.build:report?.current;
   if(result.build!==expected||result.reload!==true)throw Error('RECOVERY_FAILED');
   location.href='./nero.html';
  }catch(e){
   // The actionable mutation error has its own alert. A successful list read
   // below must never replace it with the normal version summary.
   showError(e);await refresh();
  }finally{busy=false;buttons();}
 }
 current.onclick=()=>act('RECOVERY_CURRENT');
 retry.onclick=async()=>{if(busy)return;busy=true;buttons();errorBox.hidden=true;errorBox.textContent='';try{await refresh();}finally{busy=false;buttons();}};
 busy=true;buttons();refresh().finally(()=>{busy=false;buttons();});
}
function recoveryPage(){
 const html='<!doctype html><html lang="tr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><title>SÜKÛN Kurtarma / Recovery</title><style>body{margin:0;background:#081820;color:#f3ead0;font:16px/1.6 system-ui}main{max-width:640px;margin:auto;padding:22px}button,a{font:inherit;border:1px solid #557d75;border-radius:12px;padding:12px;color:#fff;background:#153c39;cursor:pointer;display:block;margin:12px 0}button:disabled{opacity:.45}li{margin:15px 0}small{color:#b1c6c2}#error{padding:12px;border:1px solid #edbd80;border-radius:8px;color:#ffe0b6} [hidden]{display:none!important}</style><main><h1 id="heading">🛟 SÜKÛN Kurtarma / Recovery</h1><p id="intro"></p><p id="error" role="alert" aria-live="assertive" hidden></p><p id="status" role="status"></p><button id="current" type="button" disabled></button><button id="retry" type="button"></button><ul id="versions"></ul><a id="app" href="./nero.html">SÜKÛN</a><a id="static" href="./rescue.html">Kurtarma / Recovery</a><a id="language" href="./__sukun_recovery__?lang=en">English</a><small id="warning"></small></main><script>('+recoveryPageClient.toString()+')();</script></html>';
 return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Content-Security-Policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"}});
}

/* Required executable assets are verified against the release manifest. */
async function sha256Response(response){
 const data=await response.clone().arrayBuffer();
 return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data)),x=>x.toString(16).padStart(2,'0')).join('');
}
async function currentComplete(){
 // One authoritative check for readiness and cached navigation: canonical
 // shell digest/SRI, build marker, manifest and every required runtime byte.
 return !!await recoveryVerifyCache(CACHE,true);
}
// Read-only readiness checks the actual cached shell as well as runtime hashes.
async function tekkeShellReady(){
 try{const pin=await recoveryPinned(true);return pin?true:await currentComplete();}catch(_){return false;}
}
let prepareInFlight=null;
function prepareShell(){
 if(prepareInFlight)return prepareInFlight;
 const deadline=Date.now()+60000;
 const live=()=>{if(Date.now()>=deadline)throw Error('Dosya doğrulama süresi doldu')};
 let finishedFiles=0;const totalFiles=REQUIRED_RUNTIME.length+4;
 const report=stage=>{prepareProgress({done:finishedFiles,total:totalFiles,stage}).catch(()=>{})};
 const task=updateDeadline(async()=>{
  const cache=await caches.open(CACHE),staged=[],proof=await recoveryReadProof(CACHE);live();report('download');
  const meta={v:SURUM,cache:CACHE,at:Date.now(),shell:false,manifest:false,marker:false,latest:false,runtime:{},runtimeRequired:REQUIRED_RUNTIME.length,complete:false,errors:[]};
  const downloadQueue=[];let activeDownloads=0;
  function drainDownloads(){
   while(activeDownloads<3&&downloadQueue.length){
    const job=downloadQueue.shift();activeDownloads++;
    Promise.resolve().then(job.run).then(job.resolve,job.reject).finally(()=>{activeDownloads--;drainDownloads()});
   }
  }
  function obtain(...args){return new Promise((resolve,reject)=>{downloadQueue.push({run:()=>obtainOne(...args),resolve,reject});drainDownloads()})}
  async function obtainOne(path,validate,key,required=true){
   live();let response,error;
   try{const cached=await cache.match(path,{ignoreSearch:false});if(cached&&await validate(cached))response=cached}catch(_){}
   live();for(let attempt=0;!response&&attempt<2;attempt++){
    live();
    try{const fresh=await fetchFresh(path,30000);if(!await validate(fresh))throw Error('sürüm veya SHA-256 uyuşmazlığı');response=fresh}
    catch(e){error=e;response=null;if(/fetch .* 4\d\d$|SHA-256/.test(String(e?.message||'')))break}
   }
   live();finishedFiles++;report('download');
   if(!response){meta.errors.push(path+': '+String(error?.message||'missing'));return false}
   staged.push([path,response]);return true;
  }
  // Obtain the marker first so damaged same-build cached HTML can be
  // rejected and refetched against its approved shell digest. An enrolled
  // snapshot also fixes the exact marker and manifest bytes for this build.
  meta.marker=await obtain(BUILD_MARKER,async r=>{const j=await r.clone().json();return !!recoveryCurrentMarkerRuntime(j)&&(!proof||await sha256Response(r)===proof.markerSha256)},'marker');
  if(!meta.marker){const stored=await writeCacheMeta(meta);if(!stored)throw Error('cache metadata write failed');return meta;}
  const marker=await staged.find(e=>e[0]===BUILD_MARKER)[1].clone().json();
  const base=[
   obtain(LATEST_MARKER,async r=>!!(await r.clone().json())?.v,'latest',false).then(ok=>meta.latest=ok),
   obtain('./manifest.webmanifest',async r=>{const j=await r.clone().json();return j?.short_name==='SÜKÛN'&&new URL(j?.start_url||'',self.location.href).searchParams.get('v')===SURUM&&(!proof||await sha256Response(r)===proof.manifestSha256)},'manifest').then(ok=>meta.manifest=ok),
   obtain('./nero.html',r=>recoveryCurrentShellMatches(r,marker,proof),'html').then(ok=>meta.shell=ok),
   ...REQUIRED_RUNTIME.map(entry=>obtain(entry.url,async r=>await sha256Response(r)===entry.sha256,entry.url).then(ok=>meta.runtime[entry.url]=ok))
  ];
  await Promise.all(base);live();report('saving');
  let shellDigestReady=true;
  try{const markerResponse=staged.find(e=>e[0]===BUILD_MARKER)?.[1],htmlResponse=staged.find(e=>e[0]==='./nero.html')?.[1],marker=markerResponse?await markerResponse.clone().json():null;if(marker?.shell?.sha256)shellDigestReady=!!htmlResponse&&await sha256Response(htmlResponse)===marker.shell.sha256;if(!shellDigestReady)meta.errors.push('HTML SHA-256 uyuşmazlığı')}catch(_){shellDigestReady=false;meta.errors.push('HTML doğrulaması başarısız')}
  const valid=shellDigestReady&&meta.shell&&meta.manifest&&meta.marker&&REQUIRED_RUNTIME.every(e=>meta.runtime[e.url]);
  if(valid){for(const [key,response] of staged){live();if(!await put(cache,key,response)){meta.errors.push('cache write:'+key);await writeCacheMeta(meta);return meta}}}
  live();meta.complete=valid;
  const stored=await writeCacheMeta(meta);if(!stored)throw Error('cache metadata write failed');
  // A successful staged write and readiness must describe the same graph;
  // quota/eviction races cannot produce an activation or refresh success.
  if(meta.complete&&!await currentComplete()){meta.complete=false;meta.errors.push('Kaydedilen uygulama dosyaları doğrulanamadı');if(!await writeCacheMeta(meta))throw Error('cache metadata write failed');}
  return meta;
 },60000,'Dosya doğrulama');
 prepareInFlight=task;task.finally(()=>{if(prepareInFlight===task)prepareInFlight=null}).catch(()=>{});return task;
}

async function cachedShellFrom(cacheName){
 if(recoveryUnsafeBuild(String(cacheName||'').match(/^sukun-(r\d+)(?:-|$)/)?.[1]))return null;
 try{const entry=await recoveryVerifyCache(cacheName,true);if(!entry)return null;const c=await caches.open(cacheName),res=await c.match('./nero.html',{ignoreSearch:true});return res?{res,build:entry.build,cache:cacheName}:null}catch(_){return null}
}
async function bestCachedShell(){
  const current=await cachedShellFrom(CACHE);if(current)return current;
  const keys=(await caches.keys()).filter(k=>isAppCacheName(k)&&k!==CACHE)
    .sort((a,b)=>vnum(b)-vnum(a));
  for(const k of keys){const x=await cachedShellFrom(k);if(x)return x}
  return null;
}
async function broadcastStatus(extra={}){
  const m=await readCacheMeta();
  const cs=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  const msg={type:'SUKUN_SW_STATUS',v:SURUM,cache:CACHE,complete:!!m?.complete,marker:m||null,...extra};
  cs.forEach(c=>{try{c.postMessage(msg)}catch(e){}});
}

self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  try{const meta=await prepareShell();if(!meta.complete)throw Error(meta.errors.join(' | '))}
  catch(error){
   // Report before this worker becomes redundant; the active worker stays intact.
   try{await updateDeadline(()=>broadcastStatus({phase:'install-error',error:String(error?.message||error)}),2000,'Durum bildirimi')}catch(_){}
   throw error;
  }
 })());
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  if(!await currentComplete()){const meta=await prepareShell();if(!meta.complete)throw Error('Incomplete release cannot activate')}
  await self.clients.claim();
  // Optional visuals are shared once across the retained releases. Migration
  // only removes a duplicate after its shared bytes match; release-manifest
  // runtime images remain in every release's verified cache.
  try{await compactOptionalArt()}catch(_){}
  await recoveryPrune();
  // Optional art is cached only by assetResponse when the page requests it.
  // Do not start detached warm-up work here: it competes with playback and may
  // be terminated at any point. Activation requires the verified shell only.
  await broadcastStatus({phase:'activated'});
 })());
});

const NET_TIMEOUT=3500;
async function timedFetch(request,ms=NET_TIMEOUT){
  try{return await fetchBuffered(request,ms)}catch(_){return null}
}
function isAppNavigation(request){
 const path=new URL(request.url).pathname;
 return [sameOriginPath('./'),sameOriginPath('./index.html'),sameOriginPath('./nero.html')].includes(path);
}
async function navigationResponse(request){
 if(!isAppNavigation(request))return assetResponse(request);
 try{const pin=await recoveryPinned(true);if(pin)return recoveryNavigation(request,pin)}catch(e){return recoveryUnavailable(e)}
 try{
  const fresh=await fetchFresh(request.url,6500),build=buildOfHtml(await fresh.clone().text());
  if(build===SURUM){
   let ready=await currentComplete();if(!ready){await prepareShell();ready=await currentComplete();}
   if(ready){const cache=await caches.open(CACHE),markerResponse=await cache.match(BUILD_MARKER,{ignoreSearch:true});const marker=markerResponse?await markerResponse.json():null,digest=await sha256Response(fresh);if(marker?.shell?.sha256&&digest!==marker.shell.sha256)throw Error('HTML SHA-256 mismatch');const proof=await recoveryReadProof(CACHE);if(proof&&digest!==proof.shellSha256)throw Error('HTML snapshot changed');await put(cache,'./nero.html',fresh);return fresh}
  }else{try{await self.registration.update()}catch(_){}}
 }catch(_){}
 const cached=await bestCachedShell();if(cached)return cached.res;
 return new Response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SÜKÛN</title><body style="background:#071219;color:#f3ead0;font:16px/1.7 system-ui;padding:24px"><p>SÜKÛN çevrimdışı. Doğrulanmış uygulama dosyaları henüz hazır değil. Bağlantı geldiğinde yeniden deneyin.</p>',{status:503,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});
}
async function runtimeResponse(request,entry){
 const cache=await caches.open(CACHE),url=new URL(request.url),requestedBuild=url.searchParams.get('v');
 // Navigation PNGs use their component revision in CSS. They still resolve
 // only to the canonical release bytes verified by REQUIRED_RUNTIME.
 const componentRevision=entry.url.match(/\/wheel-navigation-(r\d+)\//)?.[1];
 const componentAlias=isArt(url)&&requestedBuild===componentRevision;
 // A document from a later build cannot receive this worker's older executable.
 if(requestedBuild&&requestedBuild!==SURUM&&!componentAlias){
  if(/^r\d+$/.test(requestedBuild)&&vnum(requestedBuild)<vnum(SURUM)){
    for(const name of (await caches.keys()).filter(n=>isAppCacheName(n))){
      const shell=await cachedShellFrom(name);if(shell?.build!==requestedBuild)continue;
      const old=await caches.open(name),marker=await old.match('./sukun-build-'+requestedBuild+'.json',{ignoreSearch:true});
      if(!marker)continue;
      try{
        const build=await marker.json();if(build.build!==requestedBuild&&build.v!==requestedBuild)continue;
        const expected=build.runtime?.find(e=>sameOriginPath(e.url)===url.pathname&&new URL(e.url,self.location.href).searchParams.get('v')===requestedBuild);
        if(!expected||!/^[a-f0-9]{64}$/i.test(expected.sha256))continue;
        const saved=await old.match(expected.url,{ignoreSearch:false});
        if(saved&&await sha256Response(saved)===expected.sha256)return saved;
      }catch(_){}
    }
    // A mutable online URL cannot identify a historical build.
    return Response.error();
  }
  try{return await fetchFresh(request.url)}catch(_){return Response.error()}
}
 const cached=await cache.match(entry.url,{ignoreSearch:false});
 if(cached&&await sha256Response(cached)===entry.sha256)return cached;
 try{const fresh=await fetchFresh(entry.url);if(await sha256Response(fresh)!==entry.sha256)throw Error('runtime hash mismatch');await put(cache,entry.url,fresh);return fresh}catch(_){return Response.error()}
}

function isArt(url){return /\.(?:png|jpe?g|webp|svg)$/i.test(url.pathname)&&url.pathname.includes('/assets/')}
function validArt(res){return res?.ok&&res.type!=='opaque'&&/^image\//i.test(res.headers.get('content-type')||'')}
function artKey(request){const url=new URL(request.url||request,self.location.href);url.searchParams.delete('v');url.searchParams.delete('t');return new Request(url.href)}
// This ceiling stops new optional admissions; it never evicts a user's
// already available offline scenes to make room for another scene. Cache
// storage shares the origin quota with recordings, so leave a reserve when
// an estimate is available. No personal data store is accessed here.
const ART_MAX_BYTES=256*1024*1024,ART_MAX_ENTRIES=400,ART_QUOTA_RESERVE=64*1024*1024;
let artBudgetPromise=null,artWriteQueue=Promise.resolve();
function artOperation(promise,options={}){
 if(!options.strict)return promise;
 return new Promise((resolve,reject)=>{
  let done=false,timer;const abort=()=>finish(null,imagePackError('image-cancelled'));
  const finish=(value,error)=>{if(done)return;done=true;clearTimeout(timer);options.signal?.removeEventListener('abort',abort);error?reject(error):resolve(value)};
  timer=setTimeout(()=>finish(null,imagePackError('image-cache-unreadable')),12000);
  if(options.signal?.aborted){abort();return}options.signal?.addEventListener('abort',abort,{once:true});
  Promise.resolve(promise).then(value=>finish(value),error=>finish(null,error));
 });
}
async function artByteLength(response,options={}){
 const reader=response.clone().body?.getReader();if(!reader)return 0;
 let bytes=0,completed=false;
 try{for(;;){const chunk=await artOperation(reader.read(),options);if(chunk.done){completed=true;break}bytes+=chunk.value.byteLength;if(bytes>ART_MAX_BYTES)return bytes}return bytes}
 finally{if(!completed)try{reader.cancel().catch(()=>{})}catch(_){}try{reader.releaseLock()}catch(_){}}
}
async function artBudget(cache,options={}){
 if(!artBudgetPromise)artBudgetPromise=(async()=>{
  const sizes=new Map();let bytes=0;
  const requests=await artOperation(cache.keys(),options);if(options.strict&&requests.length>ART_MAX_ENTRIES)throw imagePackError('image-quota');
  for(const request of requests){
   const response=await artOperation(cache.match(request),options);if(!response)continue;
   const size=await artByteLength(response,options);sizes.set(request.url,size);bytes+=size;
  }
  return {sizes,bytes};
 })().catch(error=>{artBudgetPromise=null;throw error});
 return artBudgetPromise;
}
async function artHasHeadroom(bytes){
 try{
  const storage=self.navigator?.storage;if(typeof storage?.estimate!=='function')return true;
  const estimate=await storage.estimate(),quota=Number(estimate.quota),usage=Number(estimate.usage);
  if(Number.isFinite(quota)&&quota>0&&Number.isFinite(usage)&&usage>=0)return quota-usage>=Math.max(ART_QUOTA_RESERVE,bytes*2);
 }catch(_){}
 return true;
}
function storeOptionalArt(request,response,options={}){
 let started=false,abandoned=false,onStart=null;
 const work=async()=>{
  const refuse=code=>{if(options.strict)throw imagePackError(code);return false};
  started=true;onStart?.();if(abandoned)return refuse('image-cancelled');
  if(!validArt(response))return refuse('image-integrity');
  if(options.guard&&!await options.guard())return refuse('image-cancelled');
  const cache=await artOperation(caches.open(ART_CACHE),options),key=artKey(request),budget=await artBudget(cache,options),size=await artByteLength(response,options);
  const previous=budget.sizes.get(key.url)||0,newBytes=budget.bytes-previous+size;
  if(size>ART_MAX_BYTES||newBytes>ART_MAX_BYTES||(!budget.sizes.has(key.url)&&budget.sizes.size>=ART_MAX_ENTRIES)||!await artOperation(artHasHeadroom(Math.max(0,size-previous)),options))return refuse('image-quota');
  // Explicit package jobs recheck their client/cancellation fence after every
  // asynchronous admission check, immediately before the only cache write.
  if(options.guard&&!await options.guard())return refuse('image-cancelled');
  const before=options.guard?await artOperation(cache.match(key),options):null;
  if(options.guard&&!await options.guard())return refuse('image-cancelled');
  try{await cache.put(key,response.clone())}catch(error){return refuse(error?.name==='QuotaExceededError'?'image-quota':'image-cache-write')}
  let verified=true;try{if(options.verify)verified=await options.verify(await artOperation(cache.match(key),options))}catch(_){verified=false}
  const stillCurrent=!options.guard||await options.guard();
  if(!stillCurrent||!verified){
   // Cache.put cannot be aborted. A cancelled admission restores its previous
   // bytes before cancellation is acknowledged; serialized writers cannot race
   // this rollback. The original optional-art callers retain their old API.
   try{if(before)await cache.put(key,before);else await cache.delete(key)}catch(_){throw Object.assign(imagePackError('image-cache-write'),{cleanupFailed:true})}finally{artBudgetPromise=null}
   return refuse(!stillCurrent?'image-cancelled':'image-cache-write');
  }
  budget.bytes=newBytes;budget.sizes.set(key.url,size);return true;
 };
 const result=artWriteQueue.then(work,work).catch(error=>{if(options.strict)throw error;return false});artWriteQueue=result.then(()=>{},()=>{});
 if(!options.strict)return result;
 // A prior ordinary artwork request may own the queue. Cancellation can
 // abandon a package ticket before it starts without waiting for that unrelated
 // writer; the ticket's permanent fence prevents any later cache admission.
 return new Promise((resolve,reject)=>{
  let done=false,timer;const abort=()=>abandon('image-cancelled');
  const cleanup=()=>{clearTimeout(timer);options.signal?.removeEventListener('abort',abort)};
  const finish=(value,error)=>{if(done)return;done=true;cleanup();error?reject(error):resolve(value)};
  const abandon=code=>{if(started)return;abandoned=true;finish(null,imagePackError(code))};
  onStart=cleanup;timer=setTimeout(()=>abandon('image-cache-unreadable'),12000);
  if(options.signal?.aborted)abandon('image-cancelled');else options.signal?.addEventListener('abort',abort,{once:true});
  result.then(value=>finish(value),error=>finish(null,error));
 });
}
async function compactOptionalArt(){
 const shared=await caches.open(ART_CACHE);
 // Newer artwork wins the unversioned shared key. A differing older image
 // keeps its own release copy; only a verified identical duplicate is deleted.
 const names=(await caches.keys()).filter(isAppCacheName).sort((a,b)=>vnum(b)-vnum(a));
 for(const name of names){
  const cache=await caches.open(name),build=name.match(/^sukun-(r\d+)/)?.[1];
  let marker;try{const response=await cache.match('./sukun-build-'+build+'.json',{ignoreSearch:true});marker=response?await response.json():null}catch(_){}
  // Missing metadata cannot establish which historical images are mandatory.
  if(!Array.isArray(marker?.runtime))continue;
  const protectedPaths=new Set(marker.runtime.map(entry=>{try{return sameOriginPath(entry.url)}catch(_){return ''}}));
  for(const request of await cache.keys()){
   const url=new URL(request.url);if(!isArt(url)||protectedPaths.has(url.pathname))continue;
   const original=await cache.match(request);if(!validArt(original))continue;
   const key=artKey(request);let saved=await shared.match(key);
   if(!validArt(saved)){if(!await storeOptionalArt(key,original))continue;saved=await shared.match(key)}
   if(validArt(saved)&&await sha256Response(saved)===await sha256Response(original))await cache.delete(request);
  }
 }
}
async function artResponse(request){
 const current=await caches.open(CACHE),art=await caches.open(ART_CACHE),key=artKey(request);
 const exact=await current.match(request,{ignoreSearch:false});if(validArt(exact)){await storeOptionalArt(key,exact);return exact}
 try{const fresh=await timedFetch(request,6000);if(!validArt(fresh))throw Error('art unavailable');await storeOptionalArt(key,fresh);return fresh}catch(_){const saved=await art.match(key);if(validArt(saved))return saved;return Response.error()}
}
/* r1095: image packages share the existing artwork owner. The catalog is a
   required, SHA-pinned data file; no client-supplied URL, digest or byte count
   can grant cache admission. Optional images stay in ART_CACHE, while the five
   mandatory navigation images are inspected only in the current core cache. */
const IMAGE_PACK_MANIFEST='./assets/runtime/image-pack-manifest-r1095.json';
const IMAGE_PACK_SHA256='00c62b2f7736479a0ee6f8ee1a02e054acb78fa34ee885f5cd618afcd5bb91a8';
const IMAGE_PACK_PROTOCOL=1,IMAGE_PACK_READ_MS=12000,IMAGE_PACK_JOB_MS=600000;
const imagePackJobs=new Map(),imagePackPlans=new Map();
let imagePackManifestValue=null;
function imagePackError(code){return Object.assign(new Error(code),{code})}
function imagePackLive(job){return !!job&&!job.cancelled&&Date.now()<job.expiresAt}
async function imagePackSource(event){
 const client=await recoverySource(event),url=new URL(client.url);
 if(![sameOriginPath('./'),sameOriginPath('./index.html'),sameOriginPath('./nero.html')].includes(url.pathname))throw imagePackError('image-source');
 const controlled=await updateDeadline(()=>self.clients.matchAll({type:'window',includeUncontrolled:false}),IMAGE_PACK_READ_MS,'image client');
 if(!controlled.some(item=>item.id===client.id&&item.url===client.url))throw imagePackError('image-source');
 return client;
}
async function imagePackGuard(job){
 if(!imagePackLive(job))return false;
 try{
  const client=await self.clients.get(job.clientId);if(!imagePackLive(job)||client?.type!=='window'||client.url!==job.sourceUrl)return false;
  const names=await updateDeadline(()=>caches.keys(),IMAGE_PACK_READ_MS,'image controls');
  if(!names.includes(RECOVERY_CONTROL_CACHE)||!!(await updateDeadline(recoveryReadState,IMAGE_PACK_READ_MS,'image recovery')).pin){job.fenceError='image-update-required';return false}
  // Navigation/controller loss can occur while recovery storage is awaited.
  // Take the final controlled-client snapshot after those asynchronous checks.
  const controlled=await updateDeadline(()=>self.clients.matchAll({type:'window',includeUncontrolled:false}),IMAGE_PACK_READ_MS,'image client');
  return imagePackLive(job)&&controlled.some(item=>item.id===job.clientId&&item.url===job.sourceUrl);
 }catch(_){job.fenceError='image-update-required';return false}
}
function imagePackCheck(job){if(!imagePackLive(job))throw imagePackError('image-cancelled')}
async function imagePackRead(response,max,job){
 imagePackCheck(job);
 if(!response?.body?.getReader)throw imagePackError('image-cache-unreadable');
 const reader=response.body.getReader(),parts=[];let length=0,timer,abort,completed=false;
 const stop=()=>{try{reader.cancel().catch(()=>{})}catch(_){}};
 const cancelled=new Promise((_,reject)=>{abort=()=>{stop();reject(imagePackError('image-cancelled'))};job.controller.signal.addEventListener('abort',abort,{once:true});timer=setTimeout(()=>{stop();reject(imagePackError('image-cache-unreadable'))},IMAGE_PACK_READ_MS)});
 const work=(async()=>{for(;;){imagePackCheck(job);const part=await reader.read();imagePackCheck(job);if(part.done){completed=true;break}length+=part.value.byteLength;if(length>max)throw imagePackError('image-integrity');parts.push(part.value)}const bytes=new Uint8Array(length);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.byteLength}return bytes})();
 try{return await Promise.race([work,cancelled])}finally{clearTimeout(timer);job.controller.signal.removeEventListener('abort',abort);if(!completed)stop();try{reader.releaseLock()}catch(_){}}
}
async function imagePackDigest(bytes,job){imagePackCheck(job);const digest=await updateDeadline(()=>crypto.subtle.digest('SHA-256',bytes),IMAGE_PACK_READ_MS,'image hash');imagePackCheck(job);return Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('')}
async function imagePackManifest(job){
 if(imagePackManifestValue)return imagePackManifestValue;
 const value=await (async()=>{
  const descriptor=REQUIRED_RUNTIME.find(row=>sameOriginPath(row.url)===sameOriginPath(IMAGE_PACK_MANIFEST));
  if(!descriptor||descriptor.sha256!==IMAGE_PACK_SHA256)throw imagePackError('image-update-required');
  const names=await updateDeadline(()=>caches.keys(),IMAGE_PACK_READ_MS,'image caches');if(!names.includes(CACHE))throw imagePackError('image-update-required');
  const cache=await caches.open(CACHE),response=await updateDeadline(()=>cache.match(descriptor.url,{ignoreSearch:false}),IMAGE_PACK_READ_MS,'image manifest');
  if(!response?.ok||response.type==='opaque')throw imagePackError('image-manifest');
  const bytes=await imagePackRead(response,131072,job);if(await imagePackDigest(bytes,job)!==IMAGE_PACK_SHA256)throw imagePackError('image-manifest');
  let manifest;try{manifest=JSON.parse(new TextDecoder().decode(bytes))}catch(_){throw imagePackError('image-manifest')}
  if(manifest?.app!=='SUKUN_IMAGE_PACK'||manifest.schema!==1||manifest.version!=='r1095'||JSON.stringify(manifest.packages)!=='["phone","all"]'||!Array.isArray(manifest.assets)||!manifest.assets.length||manifest.assets.length>ART_MAX_ENTRIES)throw imagePackError('image-manifest');
  const seen=new Set();let total=0;
  const assets=manifest.assets.map(row=>{
   let url;try{url=new URL(row.url,self.location.href)}catch(_){throw imagePackError('image-manifest')}
   if(typeof row.url!=='string'||!/^\.\/assets\/[a-zA-Z0-9_./-]+\.(?:png|jpe?g|webp|svg)$/.test(row.url)||row.url.includes('..')||url.origin!==self.location.origin||url.search||url.hash||seen.has(url.href)||!Number.isSafeInteger(row.bytes)||row.bytes<1||row.bytes>32*1048576||!/^[a-f0-9]{64}$/.test(row.sha256||'')||typeof row.private!=='boolean'||typeof row.phone!=='boolean'||!['scene','thumbnail','original','wheel','navigation'].includes(row.kind))throw imagePackError('image-manifest');
   seen.add(url.href);total+=row.bytes;
   const required=REQUIRED_RUNTIME.find(item=>sameOriginPath(item.url)===url.pathname);
   if(required&&required.sha256!==row.sha256)throw imagePackError('image-manifest');
   return Object.freeze({...row,requiredUrl:required?.url||null});
  });
  if(total>ART_MAX_BYTES)throw imagePackError('image-manifest');return Object.freeze(assets);
 })();
 imagePackCheck(job);imagePackManifestValue=value;return value;
}
function imagePackRows(assets,packageId,includePrivate){
 if(!['phone','all'].includes(packageId)||typeof includePrivate!=='boolean')throw imagePackError('image-selection');
 return assets.filter(row=>(includePrivate||!row.private)&&(packageId==='all'||row.phone));
}
async function imagePackVerify(response,row,job){
 if(!response)return 'missing';
 if(response.type==='opaque'||response.type==='error')return 'unknown';
 if(!validArt(response))return 'corrupt';
 try{const bytes=await imagePackRead(response.clone(),row.bytes,job);return bytes.byteLength===row.bytes&&await imagePackDigest(bytes,job)===row.sha256?'verified':'corrupt'}catch(error){if(!imagePackLive(job))throw imagePackError('image-cancelled');return error?.code==='image-integrity'?'corrupt':'unknown'}
}
function imagePackProgress(job,phase,done,total,downloadedBytes=0,receipt=null){replyUpdate(job.port,{kind:'progress',protocol:IMAGE_PACK_PROTOCOL,requestId:job.requestId,build:SURUM,packageId:job.packageId,phase,done,total,downloadedBytes,...(receipt?{receipt}:{})})}
async function imagePackCoreReady(names){
 // A package inspection is read-only: never create a cache or enroll a proof.
 if(!names.includes(CACHE)||!names.includes(RECOVERY_CONTROL_CACHE))return false;
 try{if((await updateDeadline(recoveryReadState,IMAGE_PACK_READ_MS,'image recovery')).pin)return false;return !!await updateDeadline(()=>recoveryVerifyCache(CACHE,false),30000,'image core')}catch(_){return false}
}
async function imagePackInspect(rows,job){
 imagePackCheck(job);let names=[],cacheError=false;
 try{names=await updateDeadline(()=>caches.keys(),IMAGE_PACK_READ_MS,'image caches')}catch(_){cacheError=true}
 imagePackCheck(job);
 const report={packageId:job.packageId,includePrivate:job.includePrivate,totalCount:rows.length,totalBytes:rows.reduce((sum,row)=>sum+row.bytes,0),verifiedCount:0,verifiedBytes:0,missingCount:0,missingBytes:0,corruptCount:0,unknownCount:0,unknownBytes:0,ready:false,errorCode:''};
 const states=new Map(),coreReady=!cacheError&&await imagePackCoreReady(names);
 const opened=new Map();let cursor=0,done=0;
 const checks=await Promise.allSettled([0,1].map(async()=>{while(cursor<rows.length){
  imagePackCheck(job);const row=rows[cursor++],cacheName=row.requiredUrl?CACHE:ART_CACHE;let state;
  try{
   if(cacheError)state='unknown';else if(!names.includes(cacheName))state='missing';else{
    if(!opened.has(cacheName))opened.set(cacheName,caches.open(cacheName));const cache=await opened.get(cacheName);
    const response=await updateDeadline(()=>cache.match(row.requiredUrl||artKey(row.url),{ignoreSearch:false}),IMAGE_PACK_READ_MS,'image read');
    state=await imagePackVerify(response,row,job);
   }
  }catch(error){if(!imagePackLive(job))throw imagePackError('image-cancelled');state='unknown'}
  states.set(row.url,state);
  if(state==='verified'){report.verifiedCount++;report.verifiedBytes+=row.bytes}else if(state==='unknown'){report.unknownCount++;report.unknownBytes+=row.bytes}else{report.missingCount++;report.missingBytes+=row.bytes;if(state==='corrupt')report.corruptCount++}
  imagePackProgress(job,'checking',++done,rows.length,job.downloadedBytes||0);
 }}));
 imagePackCheck(job);for(const outcome of checks)if(outcome.status==='rejected')throw outcome.reason;
 const requiredInvalid=rows.some(row=>row.requiredUrl&&states.get(row.url)!=='verified');
 report.errorCode=!coreReady||requiredInvalid?'image-update-required':report.unknownCount?'image-cache-unreadable':'';
 report.ready=!report.errorCode&&report.verifiedCount===report.totalCount&&report.verifiedBytes===report.totalBytes&&report.missingCount===0&&report.unknownCount===0;
 return {report,states};
}
async function imagePackFetch(row,job){
 imagePackCheck(job);const controller=new AbortController(),abort=()=>controller.abort();job.controller.signal.addEventListener('abort',abort,{once:true});let timer,completed=false;
 const deadline=new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(imagePackError('image-download-timeout'))},20000)});
 const work=(async()=>{
  const response=await fetch(new Request(new URL(row.url,self.location.href).href,{cache:'no-store',redirect:'error',signal:controller.signal}));imagePackCheck(job);
  if(response?.redirected||response?.url&&new URL(response.url).origin!==self.location.origin)throw imagePackError('image-integrity');
  if(!validArt(response))throw imagePackError(response?.ok?'image-integrity':'image-download-failed');
  const bytes=await imagePackRead(response,row.bytes,job);completed=true;if(bytes.byteLength!==row.bytes||await imagePackDigest(bytes,job)!==row.sha256)throw imagePackError('image-integrity');
  imagePackCheck(job);return new Response(bytes,{status:200,headers:response.headers});
 })();
 try{return await Promise.race([work,deadline])}catch(error){if(!imagePackLive(job))throw imagePackError('image-cancelled');throw error?.code?error:imagePackError('image-download-failed')}finally{clearTimeout(timer);job.controller.signal.removeEventListener('abort',abort);if(!completed)try{controller.abort()}catch(_){}}
}
async function imagePackDownload(rows,job){
 const before=await imagePackInspect(rows,job);if(before.report.errorCode)return before.report;
 const missing=rows.filter(row=>before.states.get(row.url)!=='verified');let cursor=0,done=0,errorCode='';
 // Required images are never admitted to ART_CACHE or repaired by this owner.
 if(missing.some(row=>row.requiredUrl))return {...before.report,ready:false,errorCode:'image-update-required'};
 // Refresh the memoized admission budget once for this explicit job. Receipts
 // above always inspected actual entries, including eviction since last use.
 artBudgetPromise=null;imagePackProgress(job,'downloading',0,missing.length,0,before.report);
 const workers=await Promise.allSettled([0,1].map(async()=>{while(cursor<missing.length&&!errorCode){
  imagePackCheck(job);const row=missing[cursor++];
  try{
   const response=await imagePackFetch(row,job);if(!await imagePackGuard(job))throw imagePackError(job.fenceError||'image-cancelled');
   await storeOptionalArt(row.url,response,{strict:true,signal:job.controller.signal,guard:()=>imagePackGuard(job),verify:async saved=>{try{return await imagePackVerify(saved,row,job)==='verified'}catch(_){return false}}});
   imagePackCheck(job);job.downloadedBytes+=row.bytes;before.report.verifiedCount++;before.report.verifiedBytes+=row.bytes;before.report.missingCount--;before.report.missingBytes-=row.bytes;if(before.states.get(row.url)==='corrupt')before.report.corruptCount--;
   imagePackProgress(job,'downloading',++done,missing.length,job.downloadedBytes,{...before.report,ready:false});
  }catch(error){if(error?.cleanupFailed)job.cleanupError='image-cache-write';if(!imagePackLive(job))throw imagePackError('image-cancelled');errorCode=error?.code||'image-download-failed'}
 }}));
 imagePackCheck(job);for(const outcome of workers)if(outcome.status==='rejected')throw outcome.reason;const after=await imagePackInspect(rows,job);
 return {...after.report,ready:after.report.ready&&!errorCode,downloadedBytes:job.downloadedBytes,errorCode:after.report.errorCode||errorCode};
}
async function imagePackHandle(event){
 const data=event.data||{},port=event.ports?.[0];let job;
 const finish=value=>replyUpdate(port,{kind:'result',protocol:IMAGE_PACK_PROTOCOL,requestId:data.requestId,build:SURUM,...value});
 try{
  // Cancellation may arrive after controllerchange. The owning same-origin
  // WindowClient can always stop its own old job; new work requires control.
  const client=data.type==='IMAGE_PACK_CANCEL'?await recoverySource(event):await imagePackSource(event);
  if(typeof data.requestId!=='string'||!/^[A-Za-z0-9_-]{8,100}$/.test(data.requestId))throw imagePackError('image-request');
  const key=client.id+':'+data.requestId;
  if(data.type==='IMAGE_PACK_CANCEL'){
   imagePackPlans.delete(client.id);const current=imagePackJobs.get(key);
   if(current){current.cancelled=true;current.controller.abort();await current.done;if(current.cleanupError)throw imagePackError(current.cleanupError)}
   finish({ok:true,cancelled:true});return;
  }
  if(imagePackJobs.has(key)||imagePackJobs.size>=16||[...imagePackJobs.values()].some(item=>item.clientId===client.id))throw imagePackError('image-busy');
  if(data.type==='IMAGE_PACK_DOWNLOAD'&&[...imagePackJobs.values()].some(item=>item.mode==='IMAGE_PACK_DOWNLOAD'))throw imagePackError('image-busy');
  if(!['phone','all'].includes(data.packageId)||typeof data.includePrivate!=='boolean')throw imagePackError('image-selection');
  if(data.type==='IMAGE_PACK_DOWNLOAD'){
   const plan=imagePackPlans.get(client.id);imagePackPlans.delete(client.id);
   if(!plan||plan.token!==data.planToken||plan.expiresAt<Date.now()||plan.packageId!==data.packageId||plan.includePrivate!==data.includePrivate||plan.sourceUrl!==client.url)throw imagePackError('image-plan-stale');
  }else imagePackPlans.delete(client.id);
  let resolveDone;job={mode:data.type,clientId:client.id,sourceUrl:client.url,requestId:data.requestId,packageId:data.packageId,includePrivate:data.includePrivate,port,cancelled:false,controller:new AbortController(),expiresAt:Date.now()+IMAGE_PACK_JOB_MS,downloadedBytes:0,done:new Promise(resolve=>{resolveDone=resolve}),resolveDone:()=>resolveDone()};imagePackJobs.set(key,job);
  const assets=await imagePackManifest(job),rows=imagePackRows(assets,job.packageId,job.includePrivate);
  const report=data.type==='IMAGE_PACK_DOWNLOAD'?await imagePackDownload(rows,job):(await imagePackInspect(rows,job)).report;
  if(!await imagePackGuard(job))throw imagePackError(job.fenceError||'image-cancelled');
  if(!report.errorCode){
   const token=Array.from(crypto.getRandomValues(new Uint8Array(24)),x=>x.toString(16).padStart(2,'0')).join('');
   imagePackPlans.set(client.id,{token,expiresAt:Date.now()+300000,packageId:job.packageId,includePrivate:job.includePrivate,sourceUrl:client.url});report.planToken=token;
  }
  finish({ok:true,...report});
 }catch(error){finish({ok:false,errorCode:error?.code||'image-cache-unreadable'})}
 finally{if(job){imagePackJobs.delete(job.clientId+':'+job.requestId);job.resolveDone()}}
}
/* r1095: verified archive downloads own their bounded IndexedDB staging.
   These exact non-executable requests must not create a second optional copy
   in CacheStorage or reuse an unverified historical cache on network failure. */
function isArchiveStageRequest(request,url){
 if(request.method!=='GET'||request.destination||request.mode==='navigate'||url.origin!==self.location.origin||url.href!==url.origin+url.pathname||request.headers.get('X-Sukun-Archive-Stage')!=='1')return false;
 const prefix=sameOriginPath('./assets/generic-recordings/');
 return url.pathname===prefix+'manifest.json'||url.pathname.startsWith(prefix+'audio/')&&/^[a-f0-9]{64}\.webm$/.test(url.pathname.slice((prefix+'audio/').length));
}
async function assetResponse(request){
  const url=new URL(request.url);
  if(isArchiveStageRequest(request,url)){
   try{return await fetch(new Request(request,{cache:'no-store',redirect:'error'}));}catch(_){return Response.error();}
  }
  if(recoveryUnsafeExecutable(url))return Response.error();
  if(url.pathname===recoveryPath(RECOVERY_ROUTE))return recoveryPage();
  if(url.pathname===recoveryPath('./rescue.html')){
   const entry=REQUIRED_RUNTIME.find(e=>recoveryPath(e.url)===url.pathname);
   if(!entry)return recoveryPage();
   // A recovery page is outside the pinned application's executable graph.
   // Use only the active worker's hash-verified independent page, never a
   // generic cache/network fallback or an older unverified HTML response.
   return runtimeResponse(new Request(new URL(entry.url,self.location.href)),entry);
  }
  try{const pin=await recoveryPinned();if(pin)return recoveryAsset(request,pin)}catch(e){return Response.error()}
  const current=await caches.open(CACHE);
  const runtime=REQUIRED_RUNTIME.find(entry=>sameOriginPath(entry.url)===url.pathname);if(runtime)return runtimeResponse(request,runtime);
  if(isArt(url))return artResponse(request);
  const latestPath=sameOriginPath(LATEST_MARKER),manifestPath=sameOriginPath('./manifest.webmanifest');
  const updateProbe=(url.pathname===latestPath)||url.pathname.endsWith('/sw.js')||/\/(?:sukun-build-r\d+|__sukun_build_r\d+__)\.json$/.test(url.pathname);
  /* Update probeları cache-first olamaz; aksi halde latest marker kendi cache'inde
     sonsuza dek kalır ve bir sonraki sürüm hiç algılanmaz. */
  if(updateProbe){
    try{
      const fresh=await fetch(new Request(request,{cache:'no-store'}));
      // Probes are observations. Only prepareShell may commit the current
      // immutable marker; an unverified online body must not poison an
      // already verified offline graph while checking for an update.
      if(fresh?.ok&&fresh.type!=='opaque'&&url.pathname!==sameOriginPath(BUILD_MARKER))put(current,new Request(url.origin+url.pathname),fresh.clone());
      return fresh;
    }catch(e){
      const fb=await current.match(new Request(url.origin+url.pathname),{ignoreSearch:true});
      if(fb)return fb;
    }
  }
  // The shell stores a version-checked canonical manifest. Its current
  // build alias is safe offline; ordinary art never ignores its query.
  if(url.pathname===manifestPath&&(!url.searchParams.get('v')||url.searchParams.get('v')===SURUM)){
    const manifest=await current.match('./manifest.webmanifest',{ignoreSearch:false});
    if(manifest)try{const data=await manifest.clone().json();if(new URL(data.start_url||'',self.location.href).searchParams.get('v')===SURUM)return manifest}catch(_){}
  }
  const cached=await current.match(request,{ignoreSearch:false});
  if(cached)return cached;
  try{
    const res=await fetch(request);
    if(res?.ok&&res.type!=='opaque'&&(!/\.(?:png|jpe?g|webp|svg)$/i.test(url.pathname)||/^image\//i.test(res.headers.get('content-type')||'')))await put(current,request,res.clone());
    return res;
  }catch(e){
    const keys=(await caches.keys()).filter(k=>isAppCacheName(k)&&k!==CACHE&&!recoveryUnsafeBuild(k.match(/^sukun-(r\d+)(?:-|$)/)?.[1])).sort((a,b)=>vnum(b)-vnum(a));
    for(const k of keys){try{const c=await caches.open(k),r=await c.match(request,{ignoreSearch:false});if(r)return r}catch(_){} }
    return Response.error();
  }
}

self.addEventListener('fetch',event=>{
  const req=event.request;if(req.method!=='GET')return;
  const url=new URL(req.url);if(url.origin!==self.location.origin)return;
  // Installed launchers retain their old start_url query. Recognized app
  // navigations still choose a verified safe shell; this exception never
  // permits an old executable or an arbitrary auxiliary HTML response.
  const appNavigation=req.mode==='navigate'&&isAppNavigation(req);
  if(!appNavigation&&recoveryUnsafeExecutable(url)){event.respondWith(Promise.resolve(Response.error()));return;}
  event.respondWith(appNavigation?navigationResponse(req):assetResponse(req));
});

self.addEventListener('message',event=>{
  const d=event.data||{},port=event.ports?.[0];
  if(/^IMAGE_PACK_(?:STATUS|DOWNLOAD|CANCEL)$/.test(d.type||'')){event.waitUntil(imagePackHandle(event));return;}
  if(d.type==='ARCHIVE_STAGE_STATUS'){
   event.waitUntil((async()=>{try{
    const state=await recoveryReadState();
    replyUpdate(port,{ok:!state.pin,protocol:1,build:SURUM,networkOnly:!state.pin});
   }catch(_){replyUpdate(port,{ok:false,protocol:1,build:SURUM,networkOnly:false})}})());return;
  }
  if(/^RECOVERY_(?:LIST|STATUS|CURRENT_STATUS|ROLLBACK|CURRENT|SINGLE_CLIENT)$/.test(d.type||'')){
   event.waitUntil(recoverySerialize(async()=>{try{
    await recoverySource(event);
    const result=d.type==='RECOVERY_SINGLE_CLIENT'?{single:true,clientId:(await recoverySingleSource(event)).id}:d.type==='RECOVERY_CURRENT_STATUS'?{current:SURUM,currentCache:CACHE,currentReady:await currentComplete()}:d.type==='RECOVERY_ROLLBACK'?await recoverySwitch(event,'rollback'):d.type==='RECOVERY_CURRENT'?await recoverySwitch(event,'current'):await recoveryVersions(true);
    replyUpdate(port,{ok:true,...result});
   }catch(e){replyUpdate(port,{ok:false,error:String(e?.message||e),current:SURUM})}}));return;
  }

  if(d.type==='TEKKE_READY_STATUS'){
    event.waitUntil((async()=>{const art=await caches.open(ART_CACHE),paths=Array.isArray(d.paths)?d.paths.slice(0,40):[];let saved=0;for(const path of paths){try{const url=new URL(path,self.location.href);if(url.origin===self.location.origin&&isArt(url)&&validArt(await art.match(artKey(url.href))))saved++;}catch(_){}}port?.postMessage({shell:await tekkeShellReady(),saved,total:paths.length});})());return;
  }
  if(d.type==='ART_STATUS'){
    event.waitUntil((async()=>{const art=await caches.open(ART_CACHE),paths=Array.isArray(d.paths)?d.paths.slice(0,200):[];let saved=0;for(const path of paths){const url=new URL(path,self.location.href);if(url.origin===self.location.origin&&isArt(url)&&validArt(await art.match(artKey(url.href))))saved++}port?.postMessage({saved,total:paths.length})})());return;
  }
  if(d.type==='SKIP_WAITING'){
    event.waitUntil((async()=>{try{
      let ready=await updateDeadline(currentComplete,12000,'Önbellek doğrulama');
      if(!ready){const meta=await prepareShell();ready=!!meta.complete}
      if(!ready)throw Error('release incomplete');
      await updateDeadline(()=>self.skipWaiting(),4000,'Servis aktivasyonu');
      replyUpdate(port,{ok:true,v:SURUM,complete:true});
    }catch(e){replyUpdate(port,{ok:false,v:SURUM,complete:false,error:String(e?.message||e)})}})());return;
  }
  if(d.type==='SURUM_NOTU'){try{port?.postMessage({v:SURUM,notlar:NOTLAR})}catch(e){};return}
  if(d.type==='STATUS'){
    event.waitUntil((async()=>{try{
      const result=await updateDeadline(async()=>{const state=await recoveryReadState();if(state.pin){const pin=await recoveryPinned(true);return {v:pin.build,workerV:SURUM,cache:pin.cache,complete:true,recoveryPinned:true,recoveryVersion:'r1019'}}const m=await readCacheMeta();return {v:SURUM,cache:CACHE,recoveryVersion:'r1019',complete:await currentComplete(),marker:m,error:m?.errors?.join(' | ')||''}},12000,'Önbellek doğrulama');
      replyUpdate(port,result);
    }catch(e){replyUpdate(port,{v:SURUM,cache:CACHE,complete:false,error:String(e?.message||e)})}})());return;
  }
  if(d.type==='CACHE_REFRESH'){
    event.waitUntil((async()=>{const state=await recoveryReadState();if(state.pin){try{const pin=await recoveryPinned(true);replyUpdate(port,{ok:true,v:pin.build,workerV:SURUM,cache:pin.cache,complete:true,recoveryPinned:true})}catch(e){replyUpdate(port,{ok:false,error:String(e?.message||e),recoveryPinned:true})}return;}const m=await prepareShell();replyUpdate(port,{ok:!!m.complete,v:SURUM,cache:CACHE,complete:!!m.complete,marker:m,error:m.errors?.join(' | ')||''});})().catch(e=>replyUpdate(port,{ok:false,error:String(e?.message||e)})));return;
    // Reply first. A delayed client enumeration must not hide verified readiness.
    event.waitUntil(prepareShell().then(async m=>{
      replyUpdate(port,{ok:!!m.complete,v:SURUM,cache:CACHE,complete:!!m.complete,marker:m,error:m.errors?.join(' | ')||''});
      try{await updateDeadline(()=>broadcastStatus({phase:'refresh'}),2000,'Durum bildirimi')}catch(_){}
    }).catch(e=>replyUpdate(port,{ok:false,v:SURUM,cache:CACHE,complete:false,error:String(e?.message||e)})));return;
  }
  if(d.type==='CHECK_UPDATE'){
    event.waitUntil((async()=>{try{await self.registration.update();port?.postMessage({ok:true,v:SURUM})}catch(e){port?.postMessage({ok:false,v:SURUM,error:String(e?.message||e)})}})());
  }
});
