const express = require("express");
const ussdRoute = require("./index");
const bodyParser = require("body-parser");
const i18n = require("i18n");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();

i18n.configure({
  defaultLocale: "en", // Set the default language
  locales: ["en", "fr", "es", "bem", "nya"], // Available languages
  directory: __dirname + "/locales", // Path to the locales folder
  objectNotation: true, // Enable object notation
});

app.use(i18n.init);
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use("/", ussdRoute);

module.exports = app; // Export the app for Vercel
