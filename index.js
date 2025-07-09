const express = require("express");
const i18n = require("i18n");
const router = express.Router();
const {
    MainMenu,
    Register,
    unregisteredMenu
  } = require("./menu");

const { Weather } = require("./pages/WeatherUpdates");
const { Crops } = require("./pages/CropManagement");
const { Notify } = require("./pages/Notifications");

const prisma = require('./prisma/client');
const dotenv = require("dotenv");
const cors = require("cors");
const app = express();

i18n.configure({
  defaultLocale: "en", // Set the default language
  locales: ["en", "fr", "es", "bem", "nya"], // Available languages
  directory: __dirname + "/locales", // Path to the locales folder
  objectNotation: true, // Enable object notation
});

// Set the default language for the app
app.use(i18n.init);

// Configuring Express
dotenv.config();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));



router.post("/", async (req, res) => {
  try {
    const { sessionId, serviceCode, phoneNumber, text } = req.body;

    console.log('#', req.body);

    // Find user with Prisma
    const user = await prisma.user.findUnique({
      where: { phoneNumber: phoneNumber }
    });

    // AUTHENTICATION PARAMETERS
    let userName;
    let userRegistered;
    let response = "";
    let userRole = "";

    if (!user) {
      userRegistered = false;
    } else {
      userRegistered = true;
      userName = user.name;
      userRole = user.role;
    }

    // MAIN LOGIC
    if (text == "" && userRegistered == true) {
      response = MainMenu(userName, userRole);
    } else if (text == "" && userRegistered == false) {
      response = unregisteredMenu();
    } else if (text != "" && userRegistered == false) {
      // Ensure text is defined before splitting
      if (text === undefined) {
        response = "END An error occurred. Please try again.";
      } else {
        const textArray = text.split("*");
        switch (textArray[0]) {
          case "1":
            response = await Register(textArray, phoneNumber);
            break;
          default:
            response = "END Invalid choice. Please try again";
        }
      }
    } else {
      // Ensure text is defined before splitting
      if (text === undefined) {
        response = "END An error occurred. Please try again.";
      } else {
        const textArray = text.split("*");

        switch (textArray[0]) {
          case "1":
            response = await Weather(textArray, phoneNumber);
            break;
          case "2":
            response = await Crops(textArray, phoneNumber);
            break;
          case "3":
            // Directly access weather alerts by adding "3" to the textArray
            const weatherAlertsArray = [...textArray];
            weatherAlertsArray.push("3");
            response = await Weather(weatherAlertsArray, phoneNumber);
            break;
          case "4":
            const addCropArray = [...textArray];
            if (!addCropArray.includes("add_crop")) {
              // Insert "add_crop" after the first element
              addCropArray.splice(1, 0, "add_crop");
            }
            response = await Crops(addCropArray, phoneNumber);
            break;
          case "5":
            response = await Notify(textArray, phoneNumber);
            break;
          default:
            response = "END Invalid choice. Please try again";
        }
      }
    }

    // Print the response onto the page so that our SDK can read it
    res.set("Content-Type", "text/plain");
    res.send(response);

  } catch (error) {
    console.error("Error processing request:", error);

    // Check for specific error types
    let errorMessage = "END An error occurred. Please try again later.";

    // Handle ngrok offline error
    if (error.message && error.message.includes("ECONNREFUSED")) {
      errorMessage = "END Service temporarily unavailable. Please try again later.";
    } else if (error.response && error.response.status === 404) {
      errorMessage = "END Service endpoint not found. Please try again later.";
    } else if (error.message && error.message.includes("ngrok")) {
      errorMessage = "END Service connection issue. Please try again later.";
    }

    res.set("Content-Type", "text/plain");
    res.send(errorMessage);
  }
});

module.exports = router;
