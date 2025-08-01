const sql = require("mssql");
const postModel = require("../models/posts_model");

jest.mock("mssql");

describe("Post Model - getAllPosts", () => {
  let mockRequest;

  beforeEach(() => {
    mockRequest = {
      query: jest.fn(),
      input: jest.fn().mockReturnThis()
    };

    sql.connect.mockResolvedValue({
      request: () => mockRequest
    });
  });

  it("should fetch posts with profilePicture", async () => {
    const mockPosts = [
      { PostID: 1, UserID: 10, Author: "John Doe", profilePicture: "john.jpg", Content: "Hello World" }
    ];

    mockRequest.query.mockResolvedValue({ recordset: mockPosts });

    const result = await postModel.getAllPosts();

    expect(result).toEqual(mockPosts);
    expect(mockRequest.query).toHaveBeenCalledTimes(1);
  });

  it("should apply date and owner filters when provided", async () => {
    mockRequest.query.mockResolvedValue({ recordset: [] });

    await postModel.getAllPosts("2025-08-01", "John");

    expect(mockRequest.input).toHaveBeenCalledWith("date", expect.anything(), "2025-08-01");
    expect(mockRequest.input).toHaveBeenCalledWith("owner", expect.anything(), "John");
  });
});
