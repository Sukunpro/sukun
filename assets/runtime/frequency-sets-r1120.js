/* SÜKÛN r1120 — manual frequency sets. The audio bridge owns playback.
 * This module never reads, migrates or writes the microphone's legacy store. */
(() => {
  'use strict';
  if (window.SukunFrequencySetsR1120) return;
  const KEY = 'sukun.frequencySets.v2', LIMIT = 100, NAME_LIMIT = 60, DESCRIPTION_LIMIT = 300;
  const copy = value => JSON.parse(JSON.stringify(value));
  const en = () => window.I18N?.lang === 'en';
  const tr = (turkish, english) => en() ? english : turkish;
  const bridge = () => window.SukunFrequencyR1120;
  const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const fields = [
    {key:'c',label:['Taşıyıcı (Hz)','Carrier (Hz)'],min:20,max:18000,step:.1},
    {key:'b',label:['Vuruş (Hz)','Beat (Hz)'],min:.5,max:40,step:.01},
    {key:'mode',label:['Mod','Mode'],options:[['bin','Binaural','Binaural'],['mono','Monaural','Monaural'],['iso','İzokronik','Isochronic'],['mix','Karma','Mixed']]},
    {key:'wave',label:['Dalga biçimi','Waveform'],options:[['sine','Sinüs','Sine'],['square','Kare','Square'],['sawtooth','Testere','Sawtooth'],['triangle','Üçgen','Triangle']]},
    ...['fm','am','rm','pwm'].map((key,i)=>({key,label:[['Vibrato (FM)','Tremolo (AM)','Halka modülasyonu (RM)','PWM (yalnız kare)'][i],['Vibrato (FM)','Tremolo (AM)','Ring modulation (RM)','PWM (square only)'][i]],boolean:true,optional:true})),
    {key:'vol',label:['Frekans seviyesi (%)','Frequency level (%)'],min:0,max:1,step:.01,scale:100},
    {key:'levelProfile',label:['Seviye profili','Level profile'],options:[['legacy','Mevcut seviye','Existing level'],['balanced','Daha belirgin (isteğe bağlı)','More present (optional)']]},
    {key:'balL',label:['Sol kanal (%)','Left channel (%)'],min:0,max:1,step:.01,scale:100},
    {key:'balR',label:['Sağ kanal (%)','Right channel (%)'],min:0,max:1,step:.01,scale:100},
    {key:'harmonik',label:['Harmonik sayısı','Harmonic count'],min:0,max:4,step:1,integer:true},
    {key:'harmSeri',label:['Harmonik dizisi','Harmonic series'],options:[['dogal','Doğal dizi','Natural'],['tek','Tek katlar','Odd'],['oktav','Oktavlar','Octaves']]},
    {key:'uzam',label:['3B uzamsal dönüş','3D spatial rotation'],boolean:true},
    {key:'uzamHiz',label:['Dönüş süresi (sn)','Rotation duration (s)'],min:6,max:60,step:1},
    {key:'pink',label:['Pembe gürültü yastığı','Pink noise cushion'],boolean:true},
    {key:'noise',label:['Gürültü türü','Noise type'],options:[['off','Kapalı','Off'],['white','Beyaz','White'],['pink','Pembe','Pink'],['brown','Kahverengi','Brown']]},
    {key:'noiseVol',label:['Gürültü seviyesi (%)','Noise level (%)'],min:0,max:1,step:.01,scale:100},
    {key:'filterOn',label:['Filtreleri etkinleştir','Enable filters'],boolean:true},
    {key:'lpf',label:['Alçak geçiren (Hz)','Low-pass (Hz)'],min:200,max:8000,step:1},
    {key:'hpf',label:['Yüksek geçiren (Hz)','High-pass (Hz)'],min:20,max:2000,step:1},
    {key:'secondary.on',label:['İkinci katmanı etkinleştir','Enable second layer'],boolean:true},
    {key:'secondary.c',label:['İkinci taşıyıcı (Hz)','Second carrier (Hz)'],min:20,max:18000,step:.1},
    {key:'secondary.b',label:['İkinci vuruş (Hz)','Second beat (Hz)'],min:.5,max:40,step:.01}
  ];
  const valueAt = (settings, key) => key.startsWith('secondary.') ? settings.secondary?.[key.slice(10)] : settings[key];
  function putValue(settings, key, value) {
    if (key.startsWith('secondary.')) { settings.secondary ||= {}; settings.secondary[key.slice(10)] = value; }
    else settings[key] = value;
  }
  function validateSettings(settings) {
    if (!isObject(settings) || !isObject(settings.secondary)) return {ok:false,field:'settings'};
    const normalized = {};
    for (const field of fields) {
      const raw = valueAt(settings, field.key);
      const value = field.optional && raw === undefined ? false : raw;
      const valid = field.boolean ? typeof value === 'boolean'
        : field.options ? field.options.some(option => option[0] === value)
        : typeof value === 'number' && Number.isFinite(value) && value >= field.min && value <= field.max && (!field.integer || Number.isInteger(value));
      if (!valid) return {ok:false,field:field.key};
      putValue(normalized, field.key, value);
    }
    // Do not silently discard fields written by a newer app version.
    const keys = new Set(fields.filter(field => !field.key.includes('.')).map(field => field.key).concat('secondary'));
    if (Object.keys(settings).some(key => !keys.has(key)) || Object.keys(settings.secondary).some(key => !['on','c','b'].includes(key))) return {ok:false,field:'unknown'};
    if(normalized.wave!=='square')normalized.pwm=false;
    return {ok:true,value:normalized};
  }
  function validateRecord(record) {
    if (!isObject(record) || typeof record.id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(record.id)) return {ok:false,field:'record'};
    if (typeof record.name !== 'string' || !record.name.trim() || record.name.length > NAME_LIMIT) return {ok:false,field:'name'};
    if (typeof record.description !== 'string' || record.description.length > DESCRIPTION_LIMIT) return {ok:false,field:'description'};
    if (!Number.isFinite(record.createdAt) || record.createdAt < 0 || !Number.isFinite(record.updatedAt) || record.updatedAt < 0) return {ok:false,field:'record'};
    if (Object.keys(record).some(key => !['id','name','description','settings','createdAt','updatedAt'].includes(key))) return {ok:false,field:'unknown'};
    const validated = validateSettings(record.settings);
    return validated.ok ? {ok:true,value:{id:record.id,name:record.name,description:record.description,settings:validated.value,createdAt:record.createdAt,updatedAt:record.updatedAt}} : validated;
  }
  function fingerprint(settings) {
    const result = validateSettings(settings);
    return result.ok ? JSON.stringify(result.value) : null;
  }
  const state = {host:null,sets:[],raw:null,readOnly:false,storageProblem:'',selectedId:null,draft:null,busy:false,message:null,epoch:null,revision:0,revisions:{}};
  const ui = {};
  const DB = 'sukun-frequency-sets-r1241', STORE = 'state', STATE_KEY = 'sets';
  let connection = null, opening = null, channel = null;
  const storageError = code => Object.assign(new Error(code), {code});
  function decode(raw) {
    const sets = [], ids = new Set(); let problem = '';
    if (raw !== null) try {
      const data = JSON.parse(raw);
      if (!isObject(data) || data.version !== 2 || !Array.isArray(data.sets) || Object.keys(data).some(key => !['version','sets'].includes(key))) throw new Error('format');
      for (const item of data.sets) {
        const result = validateRecord(item);
        if (!result.ok || ids.has(result.value.id)) { problem = 'format'; continue; }
        ids.add(result.value.id); sets.push(result.value);
      }
      if (data.sets.length > LIMIT) problem = 'limit';
    } catch (_) { problem = 'format'; }
    return {sets,problem};
  }
  function validateStore(row) {
    if (!isObject(row) || row.schema !== 1 || typeof row.epoch !== 'string' || !row.epoch || !Number.isSafeInteger(row.revision) || row.revision < 1 || !(row.legacyRaw === null || typeof row.legacyRaw === 'string') || !isObject(row.revisions)) throw storageError('format');
    const parsed = decode(JSON.stringify({version:2,sets:row.sets}));
    if (parsed.problem || parsed.sets.some(record => !Number.isSafeInteger(row.revisions[record.id]) || row.revisions[record.id] < 1 || row.revisions[record.id] > row.revision)) throw storageError(parsed.problem || 'format');
    return {...row,sets:parsed.sets};
  }
  function disconnect(db) {
    try { db?.close(); } catch (_) {}
    if (connection === db) connection = null;
  }
  function openStore() {
    if (connection) return Promise.resolve(connection);
    if (opening) return opening;
    const task = new Promise((resolve,reject) => {
      let request, settled = false;
      const finish = (error,db) => {
        if (settled) { if (db) disconnect(db); return; }
        settled = true; clearTimeout(timer);
        if (error) reject(error);
        else { connection = db; db.onversionchange = () => disconnect(db); db.onclose = () => { if (connection === db) connection = null; }; resolve(db); }
      };
      const timer = setTimeout(() => finish(storageError('database')),10000);
      try { request = window.indexedDB.open(DB,1); } catch (_) { finish(storageError('database')); return; }
      request.onupgradeneeded = () => {
        if (settled) { request.transaction.abort(); return; }
        if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE);
      };
      request.onsuccess = () => finish(null,request.result);
      request.onerror = request.onblocked = () => finish(storageError('database'));
    });
    opening = task;
    task.then(() => { if (opening === task) opening = null; },() => { if (opening === task) opening = null; });
    return task;
  }
  // The canonical row and per-record revisions are read and changed in ONE
  // IndexedDB readwrite transaction. localStorage is never a write authority
  // after bootstrap, and never mirrored: doing so could erase an old tab's copy.
  async function transact(operation = null, retry = true) {
    const db = await openStore();
    return new Promise((resolve,reject) => {
      let tx, row, observedRaw = null, result = true, failure = null, changed = false, settled = false;
      try { tx = db.transaction(STORE,'readwrite'); }
      catch (error) {
        if (retry && error.name === 'InvalidStateError') { disconnect(db); resolve(transact(operation,false)); }
        else reject(storageError('database'));
        return;
      }
      const finish = error => { if (settled) return; settled = true; clearTimeout(timer); error ? reject(error) : resolve({row,result,changed,observedRaw}); };
      const abort = error => { failure = error; try { tx.abort(); } catch (_) { finish(error); } };
      const timer = setTimeout(() => abort(storageError('database')),10000);
      tx.oncomplete = () => finish();
      tx.onabort = tx.onerror = () => finish(failure || storageError('write'));
      const store = tx.objectStore(STORE), request = store.get(STATE_KEY);
      request.onsuccess = () => {
        try {
          let raw;
          try { raw = window.localStorage.getItem(KEY); } catch (_) { throw storageError('read'); }
          observedRaw = raw;
          const initial = request.result === undefined;
          if (initial) {
            const parsed = decode(raw); if (parsed.problem) throw storageError(parsed.problem);
            row = {schema:1,epoch:window.crypto?.randomUUID?.() || Date.now().toString(36)+'-'+Math.random().toString(36).slice(2),revision:1,legacyRaw:raw,sets:parsed.sets,revisions:Object.fromEntries(parsed.sets.map(item => [item.id,1]))};
          } else row = validateStore(request.result);
          // A legacy import, deletion or old-version write is a separate copy,
          // not an instruction to replace the canonical records.
          if (raw !== row.legacyRaw) { result = 'legacy'; return; }
          if (operation) {
            const current = row.sets.find(item => item.id === operation.id);
            if (operation.base === null ? !!current : !current || operation.epoch !== row.epoch || operation.revision !== row.revisions[operation.id] || JSON.stringify(current) !== operation.base) { result = 'conflict'; return; }
            const sets = operation.record
              ? current ? row.sets.map(item => item.id === operation.id ? operation.record : item) : row.sets.concat(operation.record)
              : row.sets.filter(item => item.id !== operation.id);
            if (sets.length > LIMIT) { result = 'capacity'; return; }
            if (sets.some(record => !validateRecord(record).ok)) throw storageError('format');
            if (!Number.isSafeInteger(row.revision+1)) throw storageError('format');
            row = {...row,revision:row.revision+1,sets,revisions:{...row.revisions}};
            if (operation.record) row.revisions[operation.id] = row.revision;
            else delete row.revisions[operation.id];
          }
          if (initial || operation) { store.put(row,STATE_KEY); changed = true; }
        } catch (error) { abort(error); }
      };
    });
  }
  function accept(receipt) {
    const {row} = receipt;
    if (!row) return;
    if (state.epoch === row.epoch && state.revision > row.revision) return;
    state.sets = row.sets; state.epoch = row.epoch; state.revision = row.revision; state.revisions = row.revisions;
    state.storageProblem = receipt.result === 'legacy' ? 'legacy' : '';
    state.readOnly = !!state.storageProblem;
  }
  async function storageRead() {
    try { accept(await transact()); }
    catch (error) { state.readOnly = true; state.storageProblem = error.code || 'database'; }
    renderList(); paintStorage();
    return !state.readOnly;
  }
  async function exportPayload() {
    await ready;
    const receipt = await transact();
    // Do not silently omit an old-version edit from a supposedly full backup.
    if (receipt.result === 'legacy') throw storageError('frequency-sets-legacy-conflict');
    return {version:2,sets:copy(receipt.row.sets)};
  }
  async function exportConflictPayload() {
    await ready;
    const receipt = await transact();
    if (receipt.result !== 'legacy' || window.localStorage.getItem(KEY) !== receipt.observedRaw) throw storageError('conflict-changed');
    return {app:'SUKUN-Frequency-Conflict',schema:1,exportedAt:Date.now(),canonical:{version:2,sets:copy(receipt.row.sets)},canonicalRevision:receipt.row.revision,canonicalEpoch:receipt.row.epoch,migrationBaselineRaw:receipt.row.legacyRaw,legacyRaw:receipt.observedRaw};
  }
  async function downloadConflict() {
    if (state.exporting) return;
    state.exporting = true; paintStorage();
    try {
      const payload = await exportConflictPayload();
      const url = URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
      const link = document.createElement('a'); link.href = url; link.download = 'sukun-frequency-conflict-'+Date.now()+'.json';
      document.body.append(link); link.click(); link.remove(); setTimeout(()=>URL.revokeObjectURL(url),1000);
      notify('conflictExported');
    } catch (_) { notify('conflictExportError'); }
    finally { state.exporting = false; paintStorage(); }
  }
  const messages = {
    conflictExported:['İki kopyanın indirilmesi istendi. Bu karşılaştırma dosyası normal geri yükleme dosyası değildir; düzenleme hâlâ kapalı.','Download of both copies was requested. This comparison file is not a normal restore file; editing remains disabled.'],
    conflictExportError:['Kopyalar indirilemedi veya bu sırada değişti. Veriler değiştirilmedi; yeniden dene.','Copies could not be downloaded or changed during export. No data was modified; try again.'],
    saved:['Set bu cihazda kaydedildi. Çalma durumu değişmedi.','Set saved on this device. Playback was not changed.'],
    deleted:['Set bu cihazdan silindi. Çalma durumu değişmedi.','Set deleted from this device. Playback was not changed.'],
    loaded:['Set yüklendi. Duran ses başlatılmadı; duraklatma korundu.','Set loaded. Stopped audio was not started; pause was preserved.'],
    played:['Set yüklendi ve çalıyor.','Set loaded and playing.'],
    held:['Set yüklendi; genel duraklatma açık olduğu için başlatılmadı. Devam etmek için genel oynatma kontrolünü kullan.','Set loaded but not started because global pause is active. Use the global playback control to resume.'],
    cancelled:['Düzenleme iptal edildi. Kayıtlı set ve çalma ayarları değiştirilmedi.','Edit cancelled. The saved set and playback settings were not changed.'],
    captured:['Şu anki frekans ayarları taslağa alındı. Kaydetmeden önce inceleyebilirsin.','Current frequency settings copied to the draft. Review them before saving.'],
    capacity:['En fazla 100 set saklanabilir. Önce istemediğin bir seti sil; hiçbir set otomatik silinmez.','Up to 100 sets can be stored. Delete an unwanted set first; no set is removed automatically.'],
    conflict:['Bu set başka bir sekmede değişti veya silindi. Taslağın korunuyor; güncel kaydı inceleyip düzenlemeyi yeniden aç.','This set changed or was deleted in another tab. Your draft was kept; review the current record and reopen editing.'],
    write:['Kaydedilemedi. Tarayıcı depolama alanını veya iznini denetle. Önceki setler korundu.','Could not save. Check browser storage space or permission. Previous sets were preserved.'],
    verify:['Yazma sonucu doğrulanamadı. Kaydedildiği varsayılmadı; listeyi yeniden oku.','The write could not be verified. It is not assumed saved; reload the list.'],
    unavailable:['Frekans ayarları şu anda hazır değil. Biraz sonra yeniden dene.','Frequency settings are not ready. Try again shortly.'],
    apply:['Set uygulanamadı. Frekans ayarlarını ve çalma durumunu denetle.','The set could not be applied. Check frequency settings and playback state.'],
    name:['Set adı 1–60 karakter olmalı.','Set name must be 1–60 characters.'],
    description:['Açıklama en fazla 300 karakter olabilir.','Description can contain up to 300 characters.'],
    reloaded:['Set listesi yeniden okundu.','The set list was reloaded.']
  };
  function notify(code, field) {
    state.message = {code,field}; paintMessage();
  }
  function paintMessage() {
    if (!ui.status) return;
    if (!state.message) { ui.status.textContent = ''; return; }
    const {code,field} = state.message;
    ui.status.textContent = code === 'invalid'
      ? tr('Geçerli bir değer gir: ', 'Enter a valid value: ') + (fields.find(item => item.key === field)?.label[en()?1:0] || tr('frekans ayarları','frequency settings')) + '.'
      : tr(...(messages[code] || messages.unavailable));
    ui.status.dataset.kind = ['saved','deleted','loaded','played','cancelled','captured','reloaded'].includes(code) ? 'ok' : 'notice';
  }
  async function persist(operation) {
    if (state.readOnly) { paintStorage(); return false; }
    try {
      const receipt = await transact(operation); accept(receipt);
      if (receipt.result !== true) { notify(receipt.result === 'legacy' ? 'conflict' : receipt.result); return false; }
      try { channel?.postMessage({revision:receipt.row.revision}); } catch (_) {}
      return true;
    } catch (error) {
      if (['format','limit','read','database'].includes(error.code)) { state.readOnly = true; state.storageProblem = error.code; }
      notify('write'); return false;
    }
  }
  function paintBusy() {
    // A queued save must not consume a different draft or discard typed changes.
    if (ui.form) for (const control of ui.form.querySelectorAll('input,select,textarea,button')) {
      control.disabled = state.busy || (control === ui.save && state.readOnly);
    }
    if (ui.inputs?.get('pwm') && !state.busy) ui.inputs.get('pwm').disabled = ui.inputs.get('wave').value !== 'square';
    renderList(); paintStorage();
  }
  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function button(text, action, className) {
    const node = element('button',className || 'btn r1120-set-button',text); node.type = 'button';
    node.addEventListener('click',action); return node;
  }
  function capture() {
    try { const result = validateSettings(bridge()?.capture()); if (result.ok) return result.value; }
    catch (_) {}
    notify('unavailable'); return null;
  }
  function summary(settings) {
    return settings.c.toLocaleString(en()?'en-GB':'tr-TR',{maximumFractionDigits:2}) + ' Hz · ' + tr('vuruş ','beat ') + settings.b + ' Hz · ' + (fields.find(field=>field.key==='mode').options.find(option=>option[0]===settings.mode)?.[en()?2:1] || settings.mode) + ' · ' + tr('harmonik ','harmonics ') + settings.harmonik + (settings.levelProfile==='balanced'?' · '+tr('Daha belirgin','More present'):'') + (settings.secondary.on ? ' · '+tr('2 katman','2 layers') : '');
  }
  function selectedRecord() { return state.sets.find(record => record.id === state.selectedId); }
  function refreshSelection() {
    if (!ui.selection) return;
    const record = selectedRecord();
    if (!record) { state.selectedId = null; ui.selection.textContent = tr('Seçili kayıtlı set yok.','No saved set selected.'); ui.selection.dataset.modified = 'false'; return; }
    let current = null;
    try { current = fingerprint(bridge()?.capture()); } catch (_) {}
    const modified = current !== fingerprint(record.settings);
    ui.selection.textContent = tr('Seçili: ','Selected: ') + record.name + (modified ? tr(' · değiştirildi (kaydedilmedi)',' · modified (not saved)') : tr(' · kayıtlı ayarlarla aynı',' · matches saved settings'));
    ui.selection.dataset.modified = String(modified);
    for (const row of ui.list.children) row.classList.toggle('is-selected',row.dataset.setId === record.id);
  }
  function paintStorage() {
    if (!ui.storage) return;
    ui.storage.hidden = !state.readOnly;
    const text = state.storageProblem === 'loading'
      ? tr('Kayıt deposu açılıyor…','Opening saved sets…')
      : state.storageProblem === 'legacy'
      ? tr('Eski sürümdeki kayıt kopyası değişti veya temizlendi. İki kopya da korunuyor; üzerine yazmamak için düzenleme kapalı. Çakışan kopyaları indirip karşılaştır. Yenilemek veya eski sekmeleri kapatmak bu çakışmayı çözmez; kayıtları uzlaştırmadan düzenleme açılmaz.','The old-version copy changed or was cleared. Both copies are preserved; editing is disabled to avoid overwriting either. Download and compare the conflicting copies. Reloading or closing old tabs does not resolve this conflict; the records need reconciliation before editing can resume.')
      : state.storageProblem === 'database'
      ? tr('Kayıt veritabanı açılamadı. Veriler silinmedi; tarayıcı depolama iznini denetle ve listeyi yeniden oku.','The saved-set database could not be opened. No data was deleted; check browser storage permission and reload the list.')
      : state.storageProblem === 'limit'
      ? tr('Depoda 100’den fazla set var. Hiçbiri kesilmedi veya silinmedi; korumak için yazma kapalı.','The store contains more than 100 sets. None were truncated or deleted; writes are disabled to preserve them.')
      : state.storageProblem === 'read'
      ? tr('Tarayıcı depolaması okunamadı. Kayıtların boş olduğu varsayılmadı; yazma kapalı.','Browser storage could not be read. Existing sets are not assumed empty; writes are disabled.')
      : state.storageProblem === 'verify'
      ? tr(...messages.verify)
      : tr('Bazı kayıtlar okunamadı veya daha yeni bir biçim kullanıyor. Veriler değiştirilmedi; korumak için yazma kapalı.','Some records could not be read or use a newer format. No data was changed; writes are disabled to preserve it.');
    ui.storageText.textContent = text;
    if (ui.conflictBackup) { ui.conflictBackup.hidden = state.storageProblem !== 'legacy'; ui.conflictBackup.disabled = !!state.exporting; }
    ui.newButton.disabled = state.readOnly || state.busy;
    if (ui.save) ui.save.disabled = state.readOnly || state.busy;
  }
  async function load(record, play) {
    if (state.busy) return;
    const valid = validateRecord(record); if (!valid.ok) { notify('invalid',valid.field); return; }
    if (typeof bridge()?.apply !== 'function') { notify('unavailable'); return; }
    state.busy = true; renderList(); paintStorage();
    try {
      const result = await bridge().apply(copy(valid.value.settings),{play:play === true});
      if (!result || result.ok !== true) throw new Error('apply');
      state.selectedId = record.id;
      notify(play && result.paused ? 'held' : play && result.playing ? 'played' : 'loaded');
    } catch (_) { notify('apply'); }
    finally { state.busy = false; renderList(); paintStorage(); refreshSelection(); }
  }
  async function remove(record, revision, epoch) {
    if (state.busy || state.readOnly) return;
    if (!window.confirm(tr('“','“') + record.name + tr('” seti silinsin mi? Bu işlem yalnız bu kayıtlı seti siler.','” will be deleted. Delete only this saved set?'))) return;
    state.busy = true; paintBusy();
    let saved;
    try { saved = await persist({id:record.id,base:JSON.stringify(record),revision,epoch,record:null}); }
    finally { state.busy = false; paintBusy(); }
    if (!saved) return;
    if (state.draft?.id === record.id) closeDraft(false);
    if (state.selectedId === record.id) state.selectedId = null;
    renderList(); refreshSelection(); notify('deleted');
  }
  function duplicate(record) {
    if (state.busy || state.readOnly) return;
    if (state.sets.length >= LIMIT) { notify('capacity'); return; }
    if (!window.confirm(tr('“','“') + record.name + tr('” için bağımsız bir kopya taslağı oluşturulsun mu?','”: create a separate copy draft?'))) return;
    openDraft('duplicate',record);
  }
  function renderList() {
    if (!ui.list) return;
    ui.list.replaceChildren();
    ui.count.textContent = state.sets.length + ' / ' + LIMIT;
    ui.empty.hidden = state.sets.length > 0;
    for (const record of state.sets) {
      const revision = state.revisions[record.id], epoch = state.epoch;
      const row = element('li','r1120-set-card'); row.dataset.setId = record.id;
      const title = element('h4','',record.name), description = element('p','r1120-set-description',record.description), detail = element('p','r1120-set-summary',summary(record.settings));
      description.hidden = !record.description;
      row.append(title,description,detail);
      const actions = element('div','r1120-set-actions');
      for (const [label,action,mutating] of [
        [tr('Yükle','Load'),()=>load(record,false),false],
        [tr('Yükle ve çal','Load & play'),()=>load(record,true),false],
        [tr('Düzenle','Edit'),()=>openDraft('edit',record),true],
        [tr('Çoğalt','Duplicate'),()=>duplicate(record),true],
        [tr('Sil','Delete'),()=>remove(record,revision,epoch),true]
      ]) {
        const control = button(label,action); control.disabled = state.busy || (mutating && state.readOnly);
        control.setAttribute('aria-label',label + ': ' + record.name); actions.append(control);
      }
      row.append(actions); ui.list.append(row);
    }
    refreshSelection();
  }
  function readDraftFields() {
    if (!state.draft || !ui.form) return null;
    const settings = {};
    for (const field of fields) {
      const input = ui.inputs.get(field.key);
      const value = field.boolean ? input.checked : field.options ? input.value : input.value.trim() === '' ? NaN : Number(input.value) / (field.scale || 1);
      putValue(settings,field.key,value);
    }
    return {name:ui.name.value,description:ui.description.value,settings};
  }
  function preserveDraft() {
    if (!state.draft || !ui.form) return;
    const value = readDraftFields();
    state.draft.name = value.name; state.draft.description = value.description; state.draft.settings = value.settings;
    state.draft.expanded = ui.details.open;
  }
  function closeDraft(message = true) {
    if (state.busy) return;
    state.draft = null; ui.editor.replaceChildren(); ui.editor.hidden = true;
    ui.form = ui.name = ui.description = ui.save = ui.details = null; ui.inputs = null;
    if (message) notify('cancelled');
    ui.newButton.focus();
  }
  function openDraft(kind, record) {
    if (state.busy || state.readOnly) return;
    if (state.draft && !window.confirm(tr('Açık taslak kaydedilmedi. Taslağı bırakıp devam edilsin mi?','The open draft is not saved. Discard that draft and continue?'))) return;
    if (kind !== 'edit' && state.sets.length >= LIMIT) { notify('capacity'); return; }
    const settings = kind === 'create' ? capture() : copy(record.settings); if (!settings) return;
    state.draft = {kind,epoch:state.epoch,revision:record ? state.revisions[record.id] : null,id:kind === 'edit' ? record.id : null,baseRecord:kind === 'edit' ? JSON.stringify(record) : null,name:kind === 'create' ? '' : record.name + (kind === 'duplicate' ? tr(' (kopya)',' (copy)') : ''),description:record?.description || '',settings,expanded:false};
    renderDraft(); ui.name.focus();
  }
  function renderDraft() {
    if (!state.draft) return;
    const draft = state.draft; ui.editor.replaceChildren(); ui.editor.hidden = false;
    const form = element('form','r1120-set-form'); form.noValidate = true; ui.form = form;
    const title = element('h4','',draft.kind === 'edit' ? tr('Seti düzenle','Edit set') : draft.kind === 'duplicate' ? tr('Setin kopyası','Copy of set') : tr('Yeni frekans seti','New frequency set'));
    title.id = 'r1120SetFormTitle'; form.setAttribute('aria-labelledby',title.id); form.append(title);
    for (const [key,label,max,tag] of [['name',tr('Set adı','Set name'),NAME_LIMIT,'input'],['description',tr('Açıklama (isteğe bağlı)','Description (optional)'),DESCRIPTION_LIMIT,'textarea']]) {
      const wrap = element('label','r1120-set-field'), caption = element('span','',label + ' · '+tr('en fazla ','max. ')+max);
      const input = element(tag); input.id = 'r1120Set'+key; input.value = draft[key]; if (key === 'name') { input.type = 'text'; input.required = true; } else input.rows = 2;
      wrap.append(caption,input); form.append(wrap); ui[key] = input;
    }
    form.append(element('p','r1120-set-hint',tr('Bu taslak mikrofon kullanmaz. Kaydetmek veya iptal etmek çalma ayarlarını değiştirmez.','This draft does not use the microphone. Saving or cancelling does not change playback settings.')));
    const captureButton = button(tr('Şu anki ayarları taslağa al','Use current settings in draft'),()=>{
      if (state.busy) return;
      const settings = capture(); if (!settings) return;
      preserveDraft(); state.draft.settings = settings; renderDraft(); notify('captured');
    }); form.append(captureButton);
    const details = element('details','r1120-set-details'); details.open = !!draft.expanded; ui.details = details;
    details.append(element('summary','',tr('Taslağın tüm frekans ayarları','All draft frequency settings')));
    const grid = element('div','r1120-set-grid'); ui.inputs = new Map();
    for (const field of fields) {
      const wrap = element('label','r1120-set-field' + (field.boolean ? ' is-checkbox' : ''));
      const label = element('span','',field.label[en()?1:0]);
      let input;
      if (field.options) {
        input = element('select');
        for (const option of field.options) { const node = element('option','',option[en()?2:1]); node.value = option[0]; input.append(node); }
        input.value = valueAt(draft.settings,field.key);
      } else {
        input = element('input'); input.type = field.boolean ? 'checkbox' : 'number';
        if (field.boolean) input.checked = valueAt(draft.settings,field.key);
        else { const scale = field.scale || 1; input.min = field.min*scale; input.max = field.max*scale; input.step = field.step*scale; input.inputMode = 'decimal'; const value = valueAt(draft.settings,field.key); input.value = Number.isFinite(value) ? String(value*scale) : ''; input.required = true; }
      }
      input.id = 'r1120SetField-'+field.key.replace('.','-'); wrap.append(label,input); grid.append(wrap); ui.inputs.set(field.key,input);
      const helpKey={c:'binaural',b:'binaural',mode:'binaural',wave:'wave',fm:'effects',am:'effects',rm:'effects',pwm:'effects',vol:'level',levelProfile:'level',balL:'channels',balR:'channels',harmonik:'harmonics',harmSeri:'harmonics',noise:'noise',noiseVol:'noise',filterOn:'filters',lpf:'filters',hpf:'filters'}[field.key];
      if(helpKey){const help=document.getElementById('fr1120-'+helpKey+'-help');if(help)input.setAttribute('aria-describedby',[...help.querySelectorAll('p[id]')].map(p=>p.id).join(' '));}
    }
    const syncPwm=()=>{const pwm=ui.inputs.get('pwm');pwm.disabled=ui.inputs.get('wave').value!=='square';if(pwm.disabled)pwm.checked=false;};
    ui.inputs.get('wave').addEventListener('change',syncPwm);syncPwm();
    details.append(grid); form.append(details);
    const actions = element('div','r1120-set-actions');
    ui.save = element('button','btn r1120-set-button',tr('Seti kaydet','Save set')); ui.save.type = 'submit'; ui.save.disabled = state.readOnly || state.busy;
    actions.append(ui.save,button(tr('İptal','Cancel'),()=>closeDraft())); form.append(actions);
    form.addEventListener('submit',event=>{event.preventDefault();saveDraft();});
    ui.editor.append(form);
    paintBusy();
  }
  async function saveDraft() {
    if (!state.draft || state.readOnly || state.busy) return;
    const input = readDraftFields(), name = input.name.trim();
    if (!name || input.name.length > NAME_LIMIT) { notify('name'); ui.name.focus(); return; }
    if (input.description.length > DESCRIPTION_LIMIT) { notify('description'); ui.description.focus(); return; }
    const checked = validateSettings(input.settings);
    if (!checked.ok) { notify('invalid',checked.field); ui.details.open = true; ui.inputs.get(checked.field)?.focus(); return; }
    const now = Date.now(), old = state.sets.find(record=>record.id===state.draft.id);
    if (state.draft.kind === 'edit' && (!old || JSON.stringify(old) !== state.draft.baseRecord)) { notify('conflict'); return; }
    const id = old?.id || ('set_' + now.toString(36) + '_' + Math.random().toString(36).slice(2,12));
    const record = {id,name,description:input.description,settings:checked.value,createdAt:old?.createdAt ?? now,updatedAt:old ? Math.max(now,old.updatedAt+1) : now};
    const base = state.draft.kind === 'edit' ? state.draft.baseRecord : null, revision = state.draft.revision, epoch = state.draft.epoch;
    state.busy = true; paintBusy();
    let saved;
    try { saved = await persist({id,base,revision,epoch,record}); }
    finally { state.busy = false; paintBusy(); }
    if (!saved) return;
    state.selectedId = id; closeDraft(false); renderList(); notify('saved');
  }
  function translate() {
    if (!ui.heading) return;
    ui.heading.textContent = tr('Kendi frekans setlerim','My frequency sets');
    ui.intro.textContent = tr('Mevcut frekans, harmonik ve katman ayarlarını mikrofon kullanmadan sakla. Setler bu tarayıcıda kalır. Sekmeler arası kayıtlar güvenle birleştirilir; aynı setin eski düzenlemesi yeni kaydı ezmez. Güncellemeden önce açılmış sekmeleri yenile. Yeni kayıtlar eski uygulama sürümlerinde görünmez; güncel sürümden yedekle.','Save current frequency, harmonic and layer settings without using the microphone. Sets stay in this browser. Changes across tabs are safely merged; stale edits cannot overwrite a newer set. Reload tabs opened before this update. New sets are not visible in older app versions; back up from the current version.');
    ui.newButton.textContent = tr('+ Şu anki ayarlardan set oluştur','+ Create set from current settings');
    ui.empty.textContent = tr('Henüz el ile oluşturulmuş set yok. Frekans dursa bile yukarıdaki düğmeyle ilk setini kaydedebilirsin.','No manual sets yet. Save your first set with the button above, even while playback is stopped.');
    ui.help.textContent = tr('Yükle yalnız ayarları uygular. Yükle ve çal açık bir başlatma isteğidir; genel duraklatmayı kaldırmaz.','Load applies settings only. Load & play explicitly requests playback; it does not release global pause.');
    ui.reload.textContent = tr('Listeyi yeniden oku','Reload list');
    ui.conflictBackup.textContent = tr('Çakışan kopyaları indir','Download conflicting copies');
    renderList(); paintStorage(); paintMessage();
  }
  function mount(host = document.getElementById('manualFrequencySetsR1120')) {
    if (!host) return false;
    if (state.host === host && ui.heading) return true;
    state.host = host; host.classList.add('r1120-frequency-sets'); host.setAttribute('data-i18n-owned',''); host.replaceChildren();
    const header = element('div','r1120-set-heading'); ui.heading = element('h3'); ui.heading.id = 'r1120ManualSetsTitle'; host.setAttribute('aria-labelledby',ui.heading.id); ui.count = element('span','r1120-set-count'); header.append(ui.heading,ui.count);
    ui.intro = element('p','r1120-set-intro'); ui.newButton = button('',()=>openDraft('create')); ui.newButton.id = 'r1120SetCreate';
    ui.selection = element('p','r1120-set-selection'); ui.selection.setAttribute('aria-live','polite'); ui.selection.setAttribute('aria-atomic','true');
    ui.status = element('p','r1120-set-status'); ui.status.id = 'r1120SetStatus'; ui.status.setAttribute('role','status'); ui.status.setAttribute('aria-live','polite'); ui.status.setAttribute('aria-atomic','true');
    ui.storage = element('div','r1120-set-storage'); ui.storage.setAttribute('role','alert'); ui.storageText = element('p');
    ui.reload = button('',async()=>{await storageRead();if(!state.readOnly)notify('reloaded');}); ui.conflictBackup = button('',downloadConflict); ui.storage.append(ui.storageText,ui.reload,ui.conflictBackup);
    ui.editor = element('div','r1120-set-editor'); ui.editor.hidden = true; ui.list = element('ul','r1120-set-list'); ui.list.id = 'r1120SetList';
    ui.empty = element('p','r1120-set-empty'); ui.help = element('p','r1120-set-help');
    host.append(header,ui.intro,ui.newButton,ui.selection,ui.storage,ui.editor,ui.status,ui.empty,ui.list,ui.help);
    translate(); if (state.draft) renderDraft(); return true;
  }
  // Preserve readable legacy records while the asynchronous canonical store opens.
  try { const parsed = decode(window.localStorage.getItem(KEY)); state.sets = parsed.sets; state.storageProblem = parsed.problem || 'loading'; }
  catch (_) { state.storageProblem = 'read'; }
  state.readOnly = true;
  const ready = storageRead();
  try { if (window.BroadcastChannel) { channel = new window.BroadcastChannel(DB); channel.onmessage = () => storageRead(); } } catch (_) {}
  window.SukunFrequencySetsR1120 = Object.freeze({version:'r1120',storageKey:KEY,databaseName:DB,ready,exportPayload,exportConflictPayload,refresh:storageRead,mount,refreshSelection,validateSettings,validateRecord,snapshot:()=>({sets:copy(state.sets),selectedId:state.selectedId,readOnly:state.readOnly,storageProblem:state.storageProblem,draftOpen:!!state.draft,revision:state.revision,epoch:state.epoch,busy:state.busy})});
  window.addEventListener('sukun:frequencychange',refreshSelection);
  window.addEventListener('sukun:languagechange',()=>{preserveDraft();translate();if(state.draft)renderDraft();});
  window.addEventListener('storage',event=>{if(event.key===KEY || event.key===null)storageRead();});
  window.addEventListener('focus',()=>storageRead());
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')storageRead();});
  // Old controls may mutate lexical FR without emitting an event. Observe their
  // user events after their handlers, rather than replacing any existing owner.
  document.addEventListener('input',event=>{if(!state.host?.contains(event.target))Promise.resolve().then(refreshSelection);});
  document.addEventListener('change',event=>{if(!state.host?.contains(event.target))Promise.resolve().then(refreshSelection);});
  document.addEventListener('click',event=>{if(!state.host?.contains(event.target))Promise.resolve().then(refreshSelection);});
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',()=>mount(),{once:true}); else mount();
})();
