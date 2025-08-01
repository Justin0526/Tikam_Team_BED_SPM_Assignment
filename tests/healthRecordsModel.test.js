beforeAll(() =>{
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
    console.error.mockRestore();
})

const sql = require("mssql");
const healthRecordsModel = require("../models/healthRecords_model");

// Mock mssql
jest.mock("mssql");

describe("HealthRecords Model - getHealthRecordsByUser", () => {
  let mockRequest;
  let mockConnection;

  beforeEach(() => {
    mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn(),
    };
    mockConnection = {
      request: jest.fn().mockReturnValue(mockRequest),
      close: jest.fn(),
    };
    sql.connect.mockResolvedValue(mockConnection);
    jest.clearAllMocks();
  });

  it("should return health records for a given userID", async () => {
    const mockData = [
      { recordID: 1, recordType: "Blood Pressure", value1: 120, recordedAt: "2025-08-01" },
      { recordID: 2, recordType: "Heart Rate", value1: 80, recordedAt: "2025-08-01" },
    ];

    mockRequest.query.mockResolvedValue({ recordset: mockData });

    const result = await healthRecordsModel.getHealthRecordsByUser(1);

    expect(sql.connect).toHaveBeenCalled();
    expect(mockRequest.input).toHaveBeenCalledWith("userID", sql.Int, 1);
    expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining("SELECT"));
    expect(result).toEqual(mockData);
    expect(mockConnection.close).toHaveBeenCalled();
  });

  it("should throw an error if DB connection fails", async () => {
    sql.connect.mockRejectedValue(new Error("DB Error"));
    await expect(healthRecordsModel.getHealthRecordsByUser(1)).rejects.toThrow("DB Error");
  });
});
