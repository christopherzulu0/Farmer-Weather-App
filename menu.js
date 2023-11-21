const { User,Destination,Emergency,Transportation,Accommodation,Recommendations,PointOfInterest} = require('./models/Schemas');

const countryCode = require("./util/countryCode");
const bcrypt = require("bcrypt");
const qs = require("qs");
const { response } = require('express');
const i18n = require("i18n");

i18n.configure({
  defaultLocale: 'fr', // Set the default language code here (e.g., 'en' for English)
  directory: __dirname + '/locales', // Specify the directory where your language files are located
});



const fetchLocationBasedRecommendations = async (currentLocation) => {
  // Add your code here to fetch location-based recommendations based on the current location
  // You can query a database or make an API request to retrieve the recommendations

  // Return the location-based recommendations as an array of objects
  return [
    { name: 'Ndola', description: 'Description of Recommendation 1' },
    { name: 'Recommendation 2', description: 'Description of Recommendation 2' },
    { name: 'Recommendation 3', description: 'Description of Recommendation 3' },
  ];
};


const fetchPOIInformation = async (poiName) => {
  // Add your code here to fetch information about the specific point of interest
  // You can query a database or make an API request to retrieve the information

  // Return the information as an object
  return {
    name: poiName,
    description: 'Description of the point of interest',
    location: 'Location of the point of interest',
    contact: 'Contact information of the point of interest',
  };
}

const menu = {
  MainMenu: (userName,Admins) => {
    if(Admins){
    const  response = `CON 10. Enter(10) to View Dashboard
                 `;
      return response;

    }else{
      const response = `CON Hi <b>${userName}</b>! 
                         Select an option below:
                    1. Tours
                    2. Weather Updates
                    3. Emergency 
                    4. Transportation 
                    5. Accommodations
                    6. Location Based Recommendations
                    7. Point Of interest
                    8. Notifications(5)
                    9. Change Language

            `;

    return response;
    }
    
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
        response = "CON What is your travel interest";
        break;
      case 6:
          response = "CON Set a login pin(4 Digits)";
          break;
      case 7:
        response = "CON Please confirm your PIN:";
        break;
      case 8:
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
      case 9:
        if(textArray[8] == 1){
        const pin = textArray[6];
        const confirmPin = textArray[7];
        // Check if the name is strictly alphabets via regex
      
        // Check if the pin is 5 characters long and is purely numerical
         if (pin.toString().length != 4 || isNaN(pin)) {
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
              pin: textArray[7],
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
            let userName = user.Name;
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
  }, 
};

module.exports = menu;
