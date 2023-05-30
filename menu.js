const {Transaction, Wallet, User,Savings,PersonalSavings} = require('./models/Schemas');
const axios = require("axios");
const countryCode = require("./util/countryCode");
const bcrypt = require("bcrypt");
const qs = require("qs");
const { response } = require('express');



const sendSMS = async (phoneNumber, message) => {
  const API_KEY = "1ee443c7d1bbe988ba87ead7b338cdc3aca397ecb471337570ac0b18b74ad7f9";
  const USERNAME = "sandbox";
  const SMS_URL = `https://api.sandbox.africastalking.com/version1/messaging`;

  try {
    const response = await axios.post(SMS_URL, qs.stringify({
      to: phoneNumber,
      message: message,
      apiKey: API_KEY,
      username: USERNAME,
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        apiKey: API_KEY,
        username: USERNAME,
      }
    });
    console.log(response.data);
  } catch (error) {
    console.error(error);
  }
};

const credentials = {
  apiKey: process.env.apiKey,
  username: process.env.username
};

const sendSMS2 = async (phoneNumber, message) => {
  const API_KEY = "1ee443c7d1bbe988ba87ead7b338cdc3aca397ecb471337570ac0b18b74ad7f9";
  const USERNAME = "sandbox";
  const SMS_URL = `https://api.sandbox.africastalking.com/version1/messaging`;

  try {
    const response = await axios.post(SMS_URL, qs.stringify({
      to: phoneNumber,
      message: message,
      apiKey: API_KEY,
      username: USERNAME,
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        apiKey: API_KEY,
        username: USERNAME,
      }
    });
    console.log(response.data);
  } catch (error) {
    console.error(error);
  }
};




const menu = {
  MainMenu: (userName) => {
    const response = `CON Welcome John! to Livingstone Tourism Portal
                         Choose an option to proceed
                    
                    1. Tours & Activities
                    2. Weather Updates
                    3. Emergency Services
                    4. Transportation Information
                    5. Accommodation Listings
                    6. Location Based Recommendations
                    7. Point Of interest
                    8. Notifications(5)
                    8. Change Language

            `;

    return response;
  },
  unregisteredMenu: () => {
    const response = `CON Welcome to Livingstone Tourism Portal. The best tourist attraction in Zambia.
            1. Open an account
            `;

    return response;
  },
  Register: async (textArray, phoneNumber) => {
    const level = textArray.length;
    let response = "";
    
    switch (level) {
      case 1:
        response = "CON What is your name";
        break;
      case 2:
        response = "CON What is your email address";
        break;
      case 3:
        response = "CON What is your travel month";
        break;
      case 4:
        response = "CON What is your trip budget";
        break;
      case 5:
        response = "What is your travel interest";
        break;
      case 6:
        response = "CON Please confirm your PIN:";
        break;
      case 7:
        response = `CON Confirm Your Details:
                    Name: ${textArray[1]}
                    Email: ${textArray[2]}
                    Travel Month: ${textArray[3]}
                    Budget:${textArray[4]},
                    Travel Interest: ${textArray[5]}
                    Pin: ${textArray[6]}

                    1.Confirm & continue
                   `;
        break;
      case 8:
        if(textArray[7] == 1){
        const pin = textArray[6];
        const confirmPin = textArray[7];
        // Check if the name is strictly alphabets via regex
        if (/[^a-zA-Z]/.test(textArray[1])) {
          response = "END Your full name must not consist of any number or symbol. Please try again";
        }
        // Check if the pin is 5 characters long and is purely numerical
        else if (pin.toString().length != 4 || isNaN(pin)) {
          response = "END Your must be 4 digits.Please try again!";
        }
        // Check if the pin and confirmed pin is the same
        else if (pin != confirmPin) {
          response = "END Your pin does not match. Please try again";
        } else {
          // proceed to register user
          async function createUser() {
            const userData = {
              Name: textArray[1],
              Email: textArray[2],
              Travel_Month: textArray[3],
              Budget:textArray[4],
              Travel_Interest: textArray[5],
              pin: textArray[6],
              phoneNumber: phoneNumber
            };
    
            // hashes the user pin and updates the userData object
            bcrypt.hash(userData.pin, 10, (err, hash) => {
              userData.pin = hash;
            });
    
            // create user and register to DB
            let user = await User.create(userData);

            return user;
          }
    
          // Assigns the created user to a variable for manipulation
          let user = await createUser();
          // If user creation failed
          if (!user) {
            response = "END An unexpected error occurred... Please try again later";
          }
          // if user creation was successful
          else {
            let userName = user.FirstName;
            let phoneNumber = user.number;
            
    
            response = `END Congratulations ${userName}, You've been successfully registered.Dial *384*82933# to start using our services`;
          }
        }
        }
        break;
      default:
        break;
    }
    return response;
  }
  ,
  

Tours: async (textArray, phoneNumber) => {
    const level = textArray.length;
    let response = "";
    
    if(level ===1){
      response  = `CON Welcome to tour guide`;
      return response;
    }
    
},
Weather: async (textArray, phoneNumber) => {
  const level = textArray.length;
  let response = "";
  
  if(level ===1){
    response  = `CON Welcome to weather area`;
    return response;
  }
  
},
Emergency: async (textArray, phoneNumber) => {
  const level = textArray.length;
  let response = "";
  
  if(level ===1){
    response  = `CON Welcome to emergency area`;
    return response;
  }
  
},
Transportation: async (textArray, phoneNumber) => {
  const level = textArray.length;
  let response = "";
  
  if(level ===1){
    response  = `CON Welcome to transportation area`;
    return response;
  }
  
},
Accommodation: async (textArray, phoneNumber) => {
  const level = textArray.length;
  let response = "";
  
  if(level ===1){
    response  = `CON Welcome to Accommodation area`;
    return response;
  }
  
},
LocationBased: async (textArray, phoneNumber) => {
  const level = textArray.length;
  let response = "";
  
  if(level ===1){
    response  = `CON Welcome to LocationBased area`;
    return response;
  }
  
},
POI: async (textArray, phoneNumber) => {
  const level = textArray.length;
  let response = "";
  
  if(level ===1){
    response  = `CON Welcome to POI area`;
    return response;
  }
  
},
Notifications: async (textArray, phoneNumber) => {
  const level = textArray.length;
  let response = "";
  
  if(level ===1){
    response  = `CON Welcome to notifications area`;
    return response;
  }
  
},
Langauges: async (textArray, phoneNumber) => {
  const level = textArray.length;
  let response = "";
  
  if(level ===1){
    response  = `CON Welcome to languages area`;
    return response;
  }
  
}

   
};

module.exports = menu;
