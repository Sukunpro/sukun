// Only voices the Android speech engine identifies as installed on this device
// may receive text from Sükûn. Existing player wrappers attach their callbacks later.
(() => {
  const synth = window.speechSynthesis;
  if (!synth) return;
  const getVoices = synth.getVoices.bind(synth);
  const speak = synth.speak.bind(synth);
  const language = text => String(text || '').replace(/_/g, '-').toLowerCase();
  const localVoices = () => getVoices().filter(voice => voice.localService === true);
  synth.getVoices = localVoices;
  synth.speak = function(utterance) {
    if (!utterance) return speak(utterance);
    const voices = localVoices();
    const wanted = language(utterance.lang || utterance.voice?.lang || document.documentElement.lang || 'tr');
    const matches = voices.filter(voice => language(voice.lang).split('-')[0] === wanted.split('-')[0]);
    const chosen = matches.find(voice => voice === utterance.voice) ||
      matches.find(voice => language(voice.lang) === wanted) || matches[0];
    if (!chosen) {
      setTimeout(() => {
        const error = new Event('error');
        Object.defineProperty(error, 'error', {value:'voice-unavailable'});
        Object.defineProperty(error, 'utterance', {value:utterance});
        utterance.dispatchEvent(error);
      }, 0);
      return;
    }
    utterance.voice = chosen;
    return speak(utterance);
  };
})();
