const micBtn = document.getElementById('mic-btn');
const micStatus = document.getElementById('mic-status');
const transcriptEl = document.getElementById('transcript');
const resultMessageEl = document.getElementById('result-message');
const recordListEl = document.getElementById('record-list');

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

let recognition = null;
let listening = false;

function setListening(isListening) {
  listening = isListening;
  micBtn.classList.toggle('listening', isListening);
  micBtn.textContent = isListening ? '⏹' : '🎤';
  micStatus.textContent = isListening
    ? 'Listening… say a genre'
    : 'Tap the mic and say a genre, e.g. "deep house"';
}

function renderResults(data) {
  recordListEl.innerHTML = '';

  if (!data.matched_records.length) {
    resultMessageEl.textContent = 'No matching records found.';
    resultMessageEl.classList.remove('error');
    return;
  }

  resultMessageEl.classList.remove('error');
  resultMessageEl.textContent = `Lighting up ${data.matched_records.length} record${data.matched_records.length === 1 ? '' : 's'}.`;

  for (const record of data.matched_records) {
    const li = document.createElement('li');
    const label = document.createElement('span');
    label.textContent = `${record.artist} – ${record.title}`;
    const meta = document.createElement('span');
    meta.className = 'meta';
    meta.textContent = `LED ${record.led_index}${record.shelf_position ? ' · ' + record.shelf_position : ''}`;
    li.appendChild(label);
    li.appendChild(meta);
    recordListEl.appendChild(li);
  }
}

async function sendCommand(query) {
  resultMessageEl.textContent = 'Searching…';
  resultMessageEl.classList.remove('error');

  try {
    const res = await fetch('/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Request failed (${res.status})`);
    }

    const data = await res.json();
    renderResults(data);
  } catch (err) {
    resultMessageEl.classList.add('error');
    resultMessageEl.textContent = err.message;
    recordListEl.innerHTML = '';
  }
}

if (!SpeechRecognition) {
  micStatus.textContent = 'Speech recognition is not supported in this browser. Try Chrome.';
  micBtn.disabled = true;
} else {
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  recognition.onresult = (event) => {
    let interim = '';
    let final = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const text = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        final += text;
      } else {
        interim += text;
      }
    }

    if (final) {
      transcriptEl.textContent = final;
      transcriptEl.classList.remove('interim');
      sendCommand(final.trim());
    } else if (interim) {
      transcriptEl.textContent = interim;
      transcriptEl.classList.add('interim');
    }
  };

  recognition.onerror = (event) => {
    micStatus.textContent = `Mic error: ${event.error}`;
    setListening(false);
  };

  recognition.onend = () => {
    setListening(false);
  };

  micBtn.addEventListener('click', () => {
    if (listening) {
      recognition.stop();
      return;
    }
    transcriptEl.textContent = '';
    transcriptEl.classList.remove('interim');
    resultMessageEl.textContent = '';
    recordListEl.innerHTML = '';
    recognition.start();
    setListening(true);
  });
}
