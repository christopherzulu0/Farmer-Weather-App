const express = require("express");

const router = express.Router();
const {
    MainMenu,
    Register,
    Tours,
    Weather, 
    Emergency, 
    Transportation,
    Accommodation,
    LocationBased,
    POI,
    Notifications,
    Languages,
    unregisteredMenu
  } = require("./menu");

  const {CircleSavings} = require("./CircleController")
  
  const {Transaction, Wallet, User,Savings} = require('./models/Schemas');
  const mongoose = require("mongoose");
  const dotenv = require("dotenv");
  const cors = require("cors");
  const app = express();

  
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
  
  
  
  User.findOne({ number: phoneNumber })
    .then( async (user) => {
      // AUTHENTICATION PARAMETERS
      let userName;
      let userRegistered;
      let response = "";

      if (!user) {
        userRegistered = false;
      } else {
        userRegistered = true;
        userName = user.Name;
      }

      
      

      // MAIN LOGIC
      if (text == "" && userRegistered == true) {
        response = MainMenu(userName);
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
            response = await Tours(textArray, phoneNumber);
            break;
          case "2": 
            response = await Weather(textArray, phoneNumber);
              break;
          case "3":
            response = await Emergency(textArray,phoneNumber);
              break;
          case "4":
            response = await Transportation(textArray, phoneNumber);
              break;
          case "5":
            response = await Accommodation(textArray, phoneNumber);
              break;
          case "6":
            response = await LocationBased(textArray,phoneNumber);
            break;  
          case "7":
            response = await POI(textArray,phoneNumber);
            break;  
          case "8":
            response = await Notifications(textArray,phoneNumber);
              break; 
          case "9":
            response = await Languages(textArray,phoneNumber);
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