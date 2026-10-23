const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const db = new sqlite3.Database('./venues.db');
const venuesList = JSON.parse(fs.readFileSync('venues.json', 'utf8'));

const run = (sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve(this);
    });
});

const all = (sql, params = []) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
    });
});

async function importVenues() {
    await run(`CREATE TABLE IF NOT EXISTS classrooms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        capacity INTEGER,
        type TEXT,
        soundSystem INTEGER NOT NULL DEFAULT 0,
        projector INTEGER NOT NULL DEFAULT 0
    )`);

    // Add the feature columns to databases created before they were introduced.
    const columns = await all('PRAGMA table_info(classrooms)');
    const existingColumns = new Set(columns.map((column) => column.name));
    if (!existingColumns.has('soundSystem')) {
        await run('ALTER TABLE classrooms ADD COLUMN soundSystem INTEGER NOT NULL DEFAULT 0');
    }
    if (!existingColumns.has('projector')) {
        await run('ALTER TABLE classrooms ADD COLUMN projector INTEGER NOT NULL DEFAULT 0');
    }

    await run('BEGIN TRANSACTION');
    try {
        await run('DELETE FROM classrooms');
        for (const venue of venuesList) {
            await run(
                `INSERT INTO classrooms (name, capacity, type, soundSystem, projector)
                 VALUES (?, ?, ?, ?, ?)`,
                [venue.name, venue.capacity, venue.type, venue.soundSystem, venue.projector]
            );
        }
        await run('COMMIT');
        console.log('Success! Venues, including equipment details, have been loaded into the database.');
    } catch (err) {
        await run('ROLLBACK');
        throw err;
    }
}

importVenues()
    .catch((err) => console.error('Error importing venues:', err.message))
    .finally(() => db.close());
