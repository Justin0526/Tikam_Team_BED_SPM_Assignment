const medicationsController = require("../controllers/medications_controller");
const medicationModel = require("../models/medication_models");

// Mock the model
jest.mock("../models/medication_models");

describe("Medications Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getTodayMeds", () => {
    it("should return today's medications", async () => {
      const mockMeds = [{ medicineName: "Panadol", dosage: "500mg" }];
      medicationModel.fetchTodayMeds.mockResolvedValue(mockMeds);

      const req = { user: { userID: 1 } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      await medicationsController.getTodayMeds(req, res);

      expect(medicationModel.fetchTodayMeds).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockMeds);
    });

    it("should handle errors gracefully", async () => {
      medicationModel.fetchTodayMeds.mockRejectedValue(new Error("DB Error"));

      const req = { user: { userID: 1 } };
      const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };

      await medicationsController.getTodayMeds(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith("Failed to retrieve medications");
    });
  });

  describe("addMedication", () => {
    it("should add a new medication", async () => {
      medicationModel.insertMedication.mockResolvedValue();

      const req = { user: { userID: 1 }, body: { medicineName: "Aspirin" } };
      const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };

      await medicationsController.addMedication(req, res);

      expect(medicationModel.insertMedication).toHaveBeenCalledWith(1, req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith("Medication added");
    });

    it("should handle errors while adding medication", async () => {
      medicationModel.insertMedication.mockRejectedValue(new Error("Insert Error"));

      const req = { user: { userID: 1 }, body: { medicineName: "Aspirin" } };
      const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };

      await medicationsController.addMedication(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith("Failed to add medication");
    });
  });
});