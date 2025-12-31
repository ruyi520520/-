const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();

app.use(express.json());
app.use(express.static('public'));

const db = new sqlite3.Database('health.db');

// create table
db.run(`
CREATE TABLE IF NOT EXISTS record (
  date TEXT PRIMARY KEY,
  morning_weight REAL,
  night_weight REAL,
  food TEXT,
  food_cal INTEGER,
  exercise TEXT,
  exercise_cal INTEGER,
  period INTEGER
)
`);

// get all records
app.get('/api/records', (req, res) => {
  db.all(`SELECT * FROM record`, (err, rows) => {
    res.json(rows);
  });
});

// get single day
app.get('/api/record/:date', (req, res) => {
  db.get(
    `SELECT * FROM record WHERE date = ?`,
    [req.params.date],
    (err, row) => res.json(row)
  );
});

// save / update
app.post('/api/record', (req, res) => {
  const r = req.body;
  db.run(
    `
    INSERT INTO record VALUES (?,?,?,?,?,?,?,?)
    ON CONFLICT(date) DO UPDATE SET
      morning_weight=?,
      night_weight=?,
      food=?,
      food_cal=?,
      exercise=?,
      exercise_cal=?,
      period=?
    `,
    [
      r.date, r.morning_weight, r.night_weight,
      r.food, r.food_cal,
      r.exercise, r.exercise_cal,
      r.period,
      r.morning_weight, r.night_weight,
      r.food, r.food_cal,
      r.exercise, r.exercise_cal,
      r.period
    ],
    () => res.json({ success: true })
  );
});

app.listen(3000, () => {
  console.log('running on http://localhost:3000');
});
