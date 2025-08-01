const appointmentModel = require("../models/appointment_model");
const sql = require("mssql");

// Mock the mssql package
jest.mock("mssql");

//Get Appointments by User ID
describe("appointmentModel.getAppointmentsByUserID", () => {
  const mockUserID = 1;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return formatted appointments for a valid user", async () => {
    const mockRawData = [
      {
        appointmentID: 1,
        userID: mockUserID,
        doctorName: "Dr. Tan",
        clinicName: "Clementi Polyclinic",
        appointmentDate: new Date("2025-08-01T00:00:00.000Z"),
        appointmentTime: "09:00",
        purpose: "Follow-up",
        reminderDate: new Date("2025-07-31T00:00:00.000Z")
      }
    ];

    const mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockResolvedValue({ recordset: mockRawData })
    };

    const mockConnection = {
      request: jest.fn().mockReturnValue(mockRequest),
      close: jest.fn()
    };

    sql.connect.mockResolvedValue(mockConnection);

    const result = await appointmentModel.getAppointmentsByUserID(mockUserID);

    expect(sql.connect).toHaveBeenCalled();
    expect(mockRequest.input).toHaveBeenCalledWith("userID", sql.Int, mockUserID);
    expect(mockConnection.close).toHaveBeenCalled();

    expect(result).toEqual([
      {
        ...mockRawData[0],
        appointmentDate: "2025-08-01",
        reminderDate: "2025-07-31"
      }
    ]);
  });

  it("should return null if no appointments found", async () => {
    const mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockResolvedValue({ recordset: [] })
    };

    const mockConnection = {
      request: jest.fn().mockReturnValue(mockRequest),
      close: jest.fn()
    };

    sql.connect.mockResolvedValue(mockConnection);

    const result = await appointmentModel.getAppointmentsByUserID(mockUserID);

    expect(result).toBeNull();
  });

  it("should throw an error if DB fails", async () => {
    sql.connect.mockRejectedValue(new Error("DB error"));

    await expect(
      appointmentModel.getAppointmentsByUserID(mockUserID)
    ).rejects.toThrow("DB error");
  });
});
