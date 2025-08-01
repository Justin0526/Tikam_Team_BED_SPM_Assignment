beforeAll(() =>{
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
    console.error.mockRestore();
})

const healthRecordsController = require("../controllers/healthRecords_controller");
const healthRecordsModel = require("../models/healthRecords_model");

// Mock the model
jest.mock("../models/healthRecords_model");

describe("HealthRecords Controller - getHealthRecords", () => {
  let res;

  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  it("should return health records for a user", async () => {
    const mockRecords = [
      { recordID: 1, recordType: "Blood Pressure", value1: 120 },
      { recordID: 2, recordType: "Heart Rate", value1: 80 },
    ];

    healthRecordsModel.getHealthRecordsByUser.mockResolvedValue(mockRecords);

    const req = { params: { userID: "1" } };

    await healthRecordsController.getHealthRecords(req, res);

    expect(healthRecordsModel.getHealthRecordsByUser).toHaveBeenCalledWith(1);
    expect(res.json).toHaveBeenCalledWith(mockRecords);
  });

  it("should return 500 if an error occurs", async () => {
    healthRecordsModel.getHealthRecordsByUser.mockRejectedValue(new Error("DB Error"));

    const req = { params: { userID: "1" } };

    await healthRecordsController.getHealthRecords(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Failed to fetch health records" });
  });
});
