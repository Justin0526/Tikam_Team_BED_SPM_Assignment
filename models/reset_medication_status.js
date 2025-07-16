const sql = require('mssql');
const cron = require('node-cron');
const dbConfig = require('../dbConfig');

// Helper to get current weekday number (0 = Sunday, 6 = Saturday)
function getTodayWeekdayNumber() {
  return new Date().getDay();
}

cron.schedule('1 0 * * *', async () => {
  console.log(`[${new Date().toISOString()}] Running smart medication reset...`);
  const todayDay = getTodayWeekdayNumber();

  let pool;
  try {
    pool = await sql.connect(dbConfig);

    // 1. Reset 'Daily' meds
    const resetDaily = await pool.request().query(`
      UPDATE Medications
      SET status = 'Not Yet'
      WHERE frequency = 'Daily' AND status = 'Taken'
    `);
    console.log(`Daily reset: ${resetDaily.rowsAffected} row(s)`);

    // 2. Reset 'Weekly' meds if today matches the weekday of startDate
    const resetWeekly = await pool.request()
      .input('todayDay', sql.Int, todayDay)
      .query(`
        UPDATE Medications
        SET status = 'Not Yet'
        WHERE frequency = 'Weekly'
          AND status = 'Taken'
          AND DATEPART(WEEKDAY, startDate) = @todayDay
      `);
    console.log(`Weekly reset: ${resetWeekly.rowsAffected} row(s)`);

    // 3. Do NOT reset 'As Needed' meds (they must be manually edited)
    console.log('⏭ Skipped: As Needed medications are not reset.');

  } catch (err) {
    console.error('Reset failed:', err);
  } finally {
    sql.close();
  }
});