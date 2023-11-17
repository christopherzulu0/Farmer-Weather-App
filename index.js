const express = require("express");
const i18n = require("i18n");
const router = express.Router();
const {
    MainMenu,
    Register,
    unregisteredMenu
  } = require("./menu");

  const {Accommodated} = require("./pages/Accomodations");
  const {Tour} = require("./pages/Tours");
  const {Weather} = require("./pages/WeatherUpdates");
  const {Emergencies} = require("./pages/Emergency");
  const {Transportation} = require("./pages/ModeOfTransport");
  const {LocationBased} = require("./pages/LocationBasedAccomodation");
  const {POI} = require("./pages/PointOfInterest");
  const {Alert} = require("./pages/Notifiactions");
  const {Langauges} = require("./pages/ChangeLanguage");
  const {Admin} = require("./Admin/index");
 


  const {Transaction, Wallet, User,Savings} = require('./models/Schemas');
  const mongoose = require("mongoose");
  const dotenv = require("dotenv");
  const cors = require("cors");
  const app = express();

  i18n.configure({
    defaultLocale: "fr", // Set the default language (change "en" to your desired default language)
    locales: ["en", "fr", "es","bem","nya"], // Available languages
    directory: __dirname + "/locales", // Path to the locales folder
    objectNotation: true, // Enable object notation
  });
  
  // Set the default language for the app
  app.use(i18n.init);
  
  //Configuring Express
  dotenv.config();
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  mongoose.set('strictQuery', true);
  const connectionString = process.env.DB_URI;
  
  //Configure MongoDB Database
  mongoose
    .connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then((res) => {
      console.log("MongoDB Running Successfully");
    })
    .catch((err) => {
      console.log({ err });
      console.log("MongoDB not Connected ");
    });



router.post("/", (req, res) => {
  

  const { sessionId, serviceCode, phoneNumber, text } = req.body;

  console.log('#', req.body);
  
  
  
  User.findOne({phoneNumber: phoneNumber })
    .then( async (user) => {
      // AUTHENTICATION PARAMETERS
      let userName;
      let userRegistered;
      let response = "";
      let Admins = "";

      if (!user) {
        userRegistered = false;
      } else {
        userRegistered = true;
        userName = user.Name;
       Admins = user.Role;
      }



      

      // MAIN LOGIC
      if (text == "" && userRegistered == true) {
        response = MainMenu(userName,Admins);
      } else if (text == "" && userRegistered == false) {
        response = unregisteredMenu();
      } else if (text != "" && userRegistered == false) {
        const textArray = text.split("*");
        switch (textArray[0]) {
          case "1":
            response = await Register(textArray, phoneNumber);
            break;
          default:
            response = "END Invalid choice. Please try again";
        }
      } else {
        const textArray = text.split("*");

        switch (textArray[0]) {
          case "1":
            response = await Tour(textArray, phoneNumber);
            break;
          case "2": 
            response = await Weather(textArray, phoneNumber);
              break;
          case "3":
            response = await Emergencies(textArray,phoneNumber);
              break;
          case "4":
            response = await Transportation(textArray, phoneNumber);
              break;
          case "5":
            response = await Accommodated(textArray, phoneNumber);
              break;
          case "6":
            response = await LocationBased(textArray,phoneNumber);
            break;  
          case "7":
            response = await POI(textArray,phoneNumber);
            break;  
          case "8":
            response = await Alert(textArray,phoneNumber);
              break; 
          case "9":
            response = await Langauges(textArray,phoneNumber);
                break;  
          case "10":
                  response = await Admin(textArray,phoneNumber);
                      break;  
          default:
              response = "END Invalid choice. Please try again";
        }

      }
  
  // Print the response onto the page so that our SDK can read it
  res.set("Content-Type: text/plain");
  res.send(response);
  // DONE!!!
})





.catch((err) => {
    console.log({ err });
  });
});

module.exports = router;