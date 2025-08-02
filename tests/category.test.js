// Justin Tang Jia Ze S10269496B
beforeAll(() =>{
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
    console.error.mockRestore();
})

const category = require("../models/category_model");
const sql = require("mssql");

// Mock the sql library
jest.mock("mssql");

describe("category.getAllCategories", ()=>{
    beforeEach(()=>{
        jest.clearAllMocks(); // Clear mock calls before each test
    });

    it("should retrieve all categories", async() => {
        const userID = 1;

        const mockCategories = [
            {
                categoryID: 1,
                userID: 1,
                categoryName: "Health & Wellness", 
            },
            {
                categoryID: 2,
                userID: 1,
                categoryName: "Hobbies & Interests"
            },
        ];

        const mockRequest = {
            input: jest.fn().mockReturnThis(), // allows chaining
            query: jest.fn().mockResolvedValue({ recordset: mockCategories })
        };

        const mockConnection = {
            request: jest.fn().mockReturnValue(mockRequest),
            close: jest.fn().mockResolvedValue(undefined),
        };


        sql.connect.mockResolvedValue(mockConnection); // Return the mock connection

        const categories = await category.getAllCategories(userID);

        expect(sql.connect).toHaveBeenCalled();
        expect(mockConnection.request).toHaveBeenCalled();
        expect(mockRequest.input).toHaveBeenCalledWith("userID", userID);
        expect(mockRequest.query).toHaveBeenCalledWith("SELECT * FROM Categories WHERE userID = @userID");
        expect(mockConnection.close).toHaveBeenCalledTimes(1);
        expect(categories).toHaveLength(2);

        expect(categories[0].categoryID).toBe(1);
        expect(categories[0].userID).toBe(1);
        expect(categories[0].categoryName).toBe("Health & Wellness");

        expect(categories[1].categoryID).toBe(2);
        expect(categories[1].userID).toBe(1);
        expect(categories[1].categoryName).toBe("Hobbies & Interests");
    })

    it("should handle errors when retrieving categories", async()=>{
        const errorMessage = "Database error";
        sql.connect.mockRejectedValue(new Error(errorMessage));
        await expect(category.getAllCategories()).rejects.toThrow(errorMessage);
    })
})