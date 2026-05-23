const express = require('express');
const dotenv= require("dotenv");

dotenv.config();

const app = express();

app.use(express.json());

// import main routes
const routes = require("./index");

// use routes
app.use(routes);


app.get("/", (request,response) =>{
    response.send("Student Management API Running ... Powered by MHI");
});

const PORT = process.env.PORT || 4000;

app.listen(PORT,() =>{
    console.log(`Server is running on port ${PORT}`);
})