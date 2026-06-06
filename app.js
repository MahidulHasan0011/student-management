const express = require("express");
const app = express();

const errorHandler = require("./middleware/error.middleware");
const notFound = require("./middleware/notFound.middleware");

// MAIN ROUTES
const routes = require("./api/v1/index");

// BODY PARSER
app.use(express.json());

// ROUTES
app.use(routes);

// HOME ROUTE
app.get("/", (req, res) => {
  res.send("Student Management API Running ... Powered by MHI");
});

// NOT FOUND
app.use(notFound);

// GLOBAL ERROR HANDLER
app.use(errorHandler);

module.exports = app;