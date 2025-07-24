const healthRecordsModel = require("../models/healthRecords_model");

// Get all health records for a user
async function getHealthRecords(req, res) {
  try {
    const userID = parseInt(req.params.userID);
    const records = await healthRecordsModel.getHealthRecordsByUser(userID);
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
}

// Add or update record
async function addOrUpdateRecord(req, res) {
  try {
    const { userID, recordType, value1, value2, recordedAt } = req.body;
    const result = await healthRecordsModel.addOrUpdateHealthRecord(userID, recordType, value1, value2, recordedAt);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
}

// Delete record
async function deleteRecord(req, res) {
  try {
    const recordID = parseInt(req.params.recordID);
    const result = await healthRecordsModel.deleteHealthRecord(recordID);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
}

module.exports = {
  getHealthRecords,
  addOrUpdateRecord,
  deleteRecord,
};
