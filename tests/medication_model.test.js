const sql = require("mssql");
const medicationModel = require("../models/medication_models");

jest.mock("mssql");

describe("Medication Model", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {}); // silence console errors in tests
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  describe("fetchTodayMeds", () => {
    it("should fetch today's medications successfully", async () => {
      const mockMeds = [{ medicineName: "Panadol", dosage: "500mg" }];

      // Mock the chained request().input().query()
      const mockRequest = {
        input: jest.fn().mockReturnThis(),
        query: jest.fn().mockResolvedValue({ recordset: mockMeds })
      };

      const mockConnection = {
        request: jest.fn().mockReturnValue(mockRequest),
        close: jest.fn()
      };

      sql.connect.mockResolvedValue(mockConnection);

      const meds = await medicationModel.fetchTodayMeds(1, new Date(), new Date());

      expect(sql.connect).toHaveBeenCalled();
      expect(mockRequest.input).toHaveBeenCalledWith("userID", expect.anything(), 1);
      expect(mockRequest.query).toHaveBeenCalled();
      expect(meds).toEqual(mockMeds);
    });

    it("should throw an error if DB query fails", async () => {
      sql.connect.mockRejectedValue(new Error("DB Error"));

      await expect(medicationModel.fetchTodayMeds(1, new Date(), new Date())).rejects.toThrow("DB Error");
    });
  });

  describe("insertMedication", () => {
    it("should insert a medication successfully", async () => {
      const mockRequest = {
        input: jest.fn().mockReturnThis(),
        query: jest.fn().mockResolvedValue({})
      };

      const mockConnection = {
        request: jest.fn().mockReturnValue(mockRequest),
        close: jest.fn()
      };

      sql.connect.mockResolvedValue(mockConnection);

      const data = {
        medicineName: "Aspirin",
        dosage: "100mg",
        frequency: "Daily",
        consumptionTime: "08:00:00",
        startDate: "2025-08-01",
        endDate: "2025-08-05",
        notes: "Take after meals"
      };

      await medicationModel.insertMedication(1, data);

      expect(mockRequest.input).toHaveBeenCalledWith("medicineName", expect.anything(), "Aspirin");
      expect(mockRequest.query).toHaveBeenCalled();
    });

    it("should throw an error if insertion fails", async () => {
      sql.connect.mockRejectedValue(new Error("Insert Error"));

      await expect(
        medicationModel.insertMedication(1, {
          medicineName: "Aspirin",
          dosage: "100mg"
        })
      ).rejects.toThrow("Insert Error");
    });
  });

  describe("updateMedicationAsTaken", () => {
    it("should update a medication's status to Taken", async () => {
      const mockRequest = {
        input: jest.fn().mockReturnThis(),
        query: jest.fn().mockResolvedValue({})
      };

      const mockConnection = {
        request: jest.fn().mockReturnValue(mockRequest),
        close: jest.fn()
      };

      sql.connect.mockResolvedValue(mockConnection);

      await medicationModel.updateMedicationAsTaken(1, 123);

      expect(mockRequest.input).toHaveBeenCalledWith("medicationID", expect.anything(), 123);
      expect(mockRequest.query).toHaveBeenCalled();
    });

    it("should throw an error if update fails", async () => {
      sql.connect.mockRejectedValue(new Error("Update Error"));

      await expect(medicationModel.updateMedicationAsTaken(1, 123)).rejects.toThrow("Update Error");
    });
  });
});