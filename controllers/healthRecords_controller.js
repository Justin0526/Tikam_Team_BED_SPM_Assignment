const healthRecordsModel = require("../models/healthRecords_model");

//READ - Get all health records for a user
async function getHealthRecords(req, res) {
  try {
    const userID = parseInt(req.params.userID);
    const records = await healthRecordsModel.getHealthRecordsByUser(userID);
    res.json(records);
  } catch (error) {
    console.error("Error fetching health records:", error);
    res.status(500).json({ error: "Failed to fetch health records" });
  }
}

//CREATE - Add new health record
async function addRecord(req, res) {
  try {
    const { userID, recordType, value1, value2, recordedAt } = req.body;

    if (!userID || !recordType || !value1 || !recordedAt) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await healthRecordsModel.addHealthRecord(userID, recordType, value1, value2, recordedAt);
    res.status(201).json(result);
  } catch (error) {
    console.error("Error adding record:", error);
    res.status(500).json({ error: "Failed to add record" });
  }
}

//UPDATE - Update an existing record by recordID
async function updateRecord(req, res) {
  try {
    const recordID = parseInt(req.params.recordID);
    const { value1, value2, recordedAt } = req.body;

    if (!recordID || !value1 || !recordedAt) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await healthRecordsModel.updateHealthRecord(recordID, value1, value2, recordedAt);
    res.json(result);
  } catch (error) {
    console.error("Error updating record:", error);
    res.status(500).json({ error: "Failed to update record" });
  }
}

//DELETE - Delete record by recordID
async function deleteRecord(req, res) {
  try {
    const recordID = parseInt(req.params.recordID);
    const result = await healthRecordsModel.deleteHealthRecord(recordID);
    res.json(result);
  } catch (error) {
    console.error("Error deleting record:", error);
    res.status(500).json({ error: "Failed to delete record" });
  }
}

module.exports = {
  getHealthRecords,
  addRecord,
  updateRecord,
  deleteRecord,
};
