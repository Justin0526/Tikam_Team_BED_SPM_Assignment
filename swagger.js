// Group
const swaggerAutogen = require("swagger-autogen")();

const outputFile = "./swagger-output.json"; // Output file for the spec
const routes = ["./app.js"]; // Path to your API route files

const doc = {
  info: {
    title: "HealthyLah API",
    description: 
    `HealthyLah is a full-featured RESTful API designed to support seniors in their daily health, transport, and social activities. This API powers a web application that enables users to manage bookmarks, track health records, set medication and appointment reminders, view transport facilities, and connect with others through posts and comments.`,
  },
  host: "localhost:3000", // Replace with your actual host if needed
};

swaggerAutogen(outputFile, routes, doc);