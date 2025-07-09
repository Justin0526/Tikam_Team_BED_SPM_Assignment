function validateMedication(req, res, next) {
  const {
    medicineName,
    dosage,
    frequency,
    consumptionTime,
    startDate
  } = req.body;

  // Required fields check
  if (!medicineName || !dosage || !frequency || !consumptionTime || !startDate) {
    return res.status(400).json({
      error: "Missing required fields. Please fill in all mandatory fields."
    });
  }

  // Type checks (basic string/date validation)
  if (typeof medicineName !== 'string' || typeof dosage !== 'string') {
    return res.status(400).json({ error: "Invalid input type for medicineName or dosage." });
  }

  const allowedFrequencies = ['Daily', 'Weekly', 'As Needed'];
  if (!allowedFrequencies.includes(frequency)) {
    return res.status(400).json({ error: "Invalid frequency. Must be Daily, Weekly, or As Needed." });
  }

  // Time format check (basic HH:mm or HH:mm:ss)
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;
  if (!timeRegex.test(consumptionTime)) {
    return res.status(400).json({ error: "Invalid time format. Use HH:mm or HH:mm:ss." });
  }

  // Date format check
  if (isNaN(Date.parse(startDate))) {
    return res.status(400).json({ error: "Invalid start date." });
  }

  if (req.body.endDate && isNaN(Date.parse(req.body.endDate))) {
    return res.status(400).json({ error: "Invalid end date." });
  }

  next(); //Passed all checks
}

module.exports = validateMedication;
