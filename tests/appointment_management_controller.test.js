const appointmentController = require("../controllers/appointment_controller");
const appointmentModel = require("../models/appointment_model");

// Mock the appointment model
jest.mock("../models/appointment_model");

//Get Appointments by User ID
describe("appointmentController.getAppointmentsByUserID", () => {
  const mockUserID = 1;

  it("should return appointments for a valid user", async () => {
    const mockAppointments = [
      {
        appointmentID: 1,
        userID: mockUserID,
        doctorName: "Dr. Lim",
        appointmentDate: "2025-08-01",
      },
    ];

    // Mock the model function to return appointments
    appointmentModel.getAppointmentsByUserID.mockResolvedValue(mockAppointments);

    const req = {
      user: { userID: mockUserID },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await appointmentController.getAppointmentsByUserID(req, res);

    expect(appointmentModel.getAppointmentsByUserID).toHaveBeenCalledWith(mockUserID);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockAppointments);
  });

  it("should return empty array if no appointments are found", async () => {
    // Simulate no appointments returned
    appointmentModel.getAppointmentsByUserID.mockResolvedValue([]);

    const req = {
      user: { userID: mockUserID },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await appointmentController.getAppointmentsByUserID(req, res);

    expect(appointmentModel.getAppointmentsByUserID).toHaveBeenCalledWith(mockUserID);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ appointments: [] });
  });

  it("should return 500 on database error", async () => {
    const errorMessage = "DB failure";

    appointmentModel.getAppointmentsByUserID.mockRejectedValue(new Error(errorMessage));

    const req = {
      user: { userID: mockUserID },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await appointmentController.getAppointmentsByUserID(req, res);

    expect(appointmentModel.getAppointmentsByUserID).toHaveBeenCalledWith(mockUserID);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Error retrieving appointments" });
  });
});
