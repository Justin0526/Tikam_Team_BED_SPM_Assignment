beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
    console.error.mockRestore();
})

const categoryController = require("../controllers/category_controller");
const category = require("../models/category_model");

// Mock the category model
jest.mock("../models/category_model");

// Test for get all categories
describe("categoryController.getAllCategories", () => {
    const userID = 1;
    beforeEach(() => {
        jest.clearAllMocks(); // Clear mock calls before each test 
    });

    it("should get all categories of the user and return a JSON reponse", async() =>{
        const mockCategories = [
            {
                categoryID: 1,
                userID: 1,
                categoryName: "Health & Wellness",
                createdAt: "2025-08-01T12:00:00.000Z"
            },
            {
                categoryID: 2,
                userID: 1,
                categoryName: "Hobbies & Interests",
                createdAt: "2025-08-01T13:00:00.000Z"
            }
        ];

        // Mock the categories.getAllCategories function to return the mock data
        category.getAllCategories.mockResolvedValue(mockCategories);

        const req = {
            user: userID
        };
        const res = {
            json: jest.fn(), // mock the res.json function
            status: jest.fn().mockReturnThis(),
        };

        await categoryController.getAllCategories(req, res);
        
        expect(category.getAllCategories).toHaveBeenCalledTimes(1); // Check if get all categories were called
        expect(res.json).toHaveBeenCalledWith(mockCategories); // Check the response body
    });

    it("should handle errors and return a 500 status with error message", async() => {
        const errorMessage = "Database error";
        category.getAllCategories.mockRejectedValue(new Error(errorMessage));

        const req = {};
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        }

        await categoryController.getAllCategories(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({error: "Error retrieving all categories"});
    })
})