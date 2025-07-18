const express = require("express");
const ussdRoute = require("./index");
const bodyParser = require("body-parser");

const app = express();
// const PORT = process.env.PORT || 3000; // Not needed for Vercel

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use("/", ussdRoute);

module.exports = app; // Export the app for Vercel
