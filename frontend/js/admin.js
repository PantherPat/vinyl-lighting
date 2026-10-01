const form = document.getElementById('record-form');
const recordIdField = document.getElementById('record-id');
const artistField = document.getElementById('artist');
const titleField = document.getElementById('title');
const genreField = document.getElementById('genre');
const subgenresField = document.getElementById('subgenres');
const labelField = document.getElementById('label');
const releaseYearField = document.getElementById('release_year');
const ledIndexField = document.getElementById('led_index');
const shelfPositionField = document.getElementById('shelf_position');
const formError = document.getElementById('form-error');
const submitBtn = document.getElementById('submit-btn');
const cancelEditBtn = document.getElementById('cancel-edit');
const tableBody = document.getElementById('record-table-body');
const emptyNote = document.getElementById('empty-note');

let currentRecords = [];

// Populate the LED index dropdown with slots not taken by other records.
// Pass excludeId when editing so the record's own slot stays available.
function populateLedDropdown(records, excludeId) {
  const taken = new Set(
    records
      .filter((r) => String(r.id) !== String(excludeId))
      .map((r) => r.led_index)
  );
  const maxIndex = records.length ? Math.max(...records.map((r) => r.led_index)) : 0;
  const limit = Math.max(20, maxIndex + 10);

  const previous = parseInt(ledIndexField.value, 10);
  ledIndexField.innerHTML = '';
  for (let i = 1; i <= limit; i++) {
    if (!taken.has(i)) {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = i;
      ledIndexField.appendChild(opt);
    }
  }
  // Restore previous selection if still available, otherwise first option wins.
  if (previous && !taken.has(previous)) {
    ledIndexField.value = previous;
  }
}

function resetForm() {
  form.reset();
  recordIdField.value = '';
  submitBtn.textContent = 'Add Record';
  cancelEditBtn.style.display = 'none';
  formError.textContent = '';
}

function fillForm(record) {
  recordIdField.value = record.id;
  artistField.value = record.artist;
  titleField.value = record.title;
  genreField.value = record.genre;
  subgenresField.value = record.subgenres || '';
  labelField.value = record.label || '';
  releaseYearField.value = record.release_year || '';
  populateLedDropdown(currentRecords, record.id);
  ledIndexField.value = record.led_index;
  shelfPositionField.value = record.shelf_position || '';
  submitBtn.textContent = 'Save Changes';
  cancelEditBtn.style.display = 'inline-block';
  formError.textContent = '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderTable(records) {
  tableBody.innerHTML = '';
  emptyNote.style.display = records.length ? 'none' : 'block';

  for (const record of records) {
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td>${record.led_index}</td>
      <td>${escapeHtml(record.artist)}</td>
      <td>${escapeHtml(record.title)}</td>
      <td>${escapeHtml(record.genre)}</td>
      <td>${escapeHtml(record.subgenres || '')}</td>
      <td>${escapeHtml(record.label || '')}</td>
      <td>${record.release_year || ''}</td>
      <td>${escapeHtml(record.shelf_position || '')}</td>
      <td class="actions">
        <button class="edit" data-id="${record.id}">Edit</button>
        <button class="delete" data-id="${record.id}">Delete</button>
      </td>
    `;

    tableBody.appendChild(tr);
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

async function loadRecords() {
  const res = await fetch('/catalog');
  currentRecords = await res.json();
  renderTable(currentRecords);
  populateLedDropdown(currentRecords, null);
  return currentRecords;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  formError.textContent = '';

  const payload = {
    artist: artistField.value.trim(),
    title: titleField.value.trim(),
    genre: genreField.value.trim(),
    subgenres: subgenresField.value.trim(),
    label: labelField.value.trim(),
    release_year: releaseYearField.value ? parseInt(releaseYearField.value, 10) : null,
    led_index: parseInt(ledIndexField.value, 10),
    shelf_position: shelfPositionField.value.trim(),
  };

  const id = recordIdField.value;
  const isEdit = Boolean(id);

  try {
    const res = await fetch(isEdit ? `/catalog/${id}` : '/catalog', {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Request failed (${res.status})`);
    }

    resetForm();
    await loadRecords();
  } catch (err) {
    formError.textContent = err.message;
  }
});

cancelEditBtn.addEventListener('click', () => {
  resetForm();
  populateLedDropdown(currentRecords, null);
});

tableBody.addEventListener('click', async (e) => {
  const id = e.target.dataset.id;
  if (!id) return;

  if (e.target.classList.contains('edit')) {
    const records = await loadRecords();
    const record = records.find((r) => String(r.id) === id);
    if (record) fillForm(record);
  }

  if (e.target.classList.contains('delete')) {
    if (!confirm('Delete this record?')) return;
    const res = await fetch(`/catalog/${id}`, { method: 'DELETE' });
    if (res.ok || res.status === 204) {
      await loadRecords();
    }
  }
});

loadRecords();
