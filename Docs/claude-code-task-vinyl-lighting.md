# Task: Vinyl Collection Smart Lighting — Session 1 (Web App + Database)

## Context
I'm building a system that maps individually-addressable LEDs to vinyl records on a shelf, organized by genre. A voice-controlled web app will let me say a genre (e.g. "deep house") and the LEDs above matching records light up. Full hardware spec is in the attached spec sheet — this session is software-only (no ESP32 firmware yet, no hardware in the loop). Stub out the hardware communication layer so it's easy to wire up real ESP32 calls later.

## Scope for this session
Build a working local web app with:
1. A SQLite-backed record catalog
2. A manual admin form to add/edit records
3. A backend endpoint that matches a spoken genre to LED indices
4. A voice-enabled frontend that captures speech, sends it to the backend, and displays which records matched

Do NOT build the ESP32 firmware or actual hardware communication in this session — stub that part out (see "Hardware stub" below).

## Tech stack preferences
- Backend: Node.js + Express (or suggest FastAPI/Python if you think it's meaningfully better for this — explain why)
- Database: SQLite (via better-sqlite3 or similar)
- Frontend: Plain HTML/JS, no framework needed unless you think React genuinely simplifies this — keep it lightweight
- Voice input: Browser Web Speech API (SpeechRecognition), no external voice service

## Database schema

```sql
CREATE TABLE records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  artist TEXT NOT NULL,
  title TEXT NOT NULL,
  genre TEXT NOT NULL,
  subgenres TEXT,            -- comma-separated, optional
  led_index INTEGER NOT NULL,
  shelf_position TEXT        -- human-readable, e.g. "Shelf A, slot 12"
);
```

## Backend endpoints needed

- `GET /catalog` — return all records
- `POST /catalog` — add a new record (artist, title, genre, subgenres, led_index, shelf_position)
- `PUT /catalog/:id` — edit an existing record
- `DELETE /catalog/:id` — remove a record
- `POST /command` — body: `{ query: string }`. Match `query` against `genre` (exact match first) and `subgenres` (contains match) fields. Return: `{ matched_records: [...], led_indices: [...] }`. Also call the hardware stub function with the matched `led_indices`.

## Hardware stub

Create a function `sendToLightController(ledIndices: number[])` in its own module (e.g. `hardware.js` / `hardware.py`). For now, just `console.log`/print the indices being "lit." Structure it so that later I can swap the internals for an actual HTTP POST or MQTT publish to an ESP32 without touching the rest of the codebase.

## Frontend requirements

- A mic button that starts/stops speech recognition
- Display the live transcript as the user speaks
- On final transcript, POST to `/command` and display:
  - The list of matched records (artist – title)
  - A confirmation message (e.g. "Lighting up 4 deep house records")
- A separate admin page/section with a form to add/edit/delete catalog records (this is how I'll populate the database as I go through my collection)
- Simple, clean styling is fine — this doesn't need to be polished, it's a personal tool

## Non-goals for this session
- No ESP32/firmware code
- No AI-assisted photo cataloging yet (that's a future session)
- No fuzzy/semantic genre matching yet — exact/contains matching is fine for now
- No authentication/multi-user support — this is a single-user local tool

## Deliverable
A runnable local app (`npm start` or equivalent) with the admin form and voice search both working against the SQLite database, and the hardware stub logging the correct LED indices to the console when a genre command is matched.
