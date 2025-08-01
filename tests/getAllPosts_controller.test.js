const postController = require("../controllers/posts_controller");
const postModel = require("../models/posts_model");

jest.mock("../models/posts_model");

describe("Post Controller - getAllPosts", () => {
  let req, res;

  beforeEach(() => {
    req = { query: {} };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };

    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks(); 
  });

  it("should return posts with status 200", async () => {
    const mockPosts = [
      { PostID: 1, UserID: 10, Author: "John Doe", profilePicture: "john.jpg", Content: "Hello World" }
    ];

    postModel.getAllPosts.mockResolvedValue(mockPosts);
    await postController.getAllPosts(req, res);

    expect(res.json).toHaveBeenCalledWith(mockPosts);
    expect(res.status).not.toHaveBeenCalledWith(500);
  });

  it("should handle errors and return 500", async () => {
    postModel.getAllPosts.mockRejectedValue(new Error("DB error"));
    await postController.getAllPosts(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Error retrieving posts" });
  });
});
