const prisma = require('./prisma/client');
const crypto = require("crypto");
const qs = require("qs");
const { response } = require('express');
const i18n = require("i18n");
const { getCurrentWeather, getAgriculturalAdvice } = require('./util/weatherService');
const { sendWeatherAlert } = require('./util/africasTalking');



i18n.configure({
  defaultLocale: 'en', // Set the default language code here
  directory: __dirname + '/locales', // Specify the directory where your language files are located
});

const menu = {
  MainMenu: (userName, userRole) => {
    if(userRole === 'Admin'){
      const response = `CON Welcome Admin ${userName}
1. Send Weather Alerts
2. Manage Crop Advice
3. Back to Main Menu`;
      return response;
    } else {
      const response = `CON Hi ${userName}! 
Welcome to Farmers Weather Service
1. Weather Updates
2. Crop Advice
3. Weather Alerts
4. Add New Crop
5. Notifications`;
      return response;
    }
  },

  unregisteredMenu: () => {
    const response = `CON Welcome to Farmers Weather Service. Get weather updates and agricultural advice for your farm.
1. Register as a Farmer`;
    return response;
  },
  Register: async (textArray, phoneNumber) => {
    const level = textArray.length;
    let response = "";

    switch (level) {
      case 1:
        response = "CON What is your full name?";
        break;
   
      case 2:
        response = "CON What is your location/district?";
        break;
      case 3:
        response = "CON What is your main crop?";
        break;
      case 4:
        // const email = textArray[2] === '0' ? 'Not provided' : textArray[2];
        response = `CON Confirm Your Details:
            Name: ${textArray[1]}
            Location: ${textArray[2]}
            Main Crop: ${textArray[3]}
            
            1. Confirm & continue
            2. Cancel & start over`;
        break;
      case 5:
        if(textArray[4] == 1){
            try {
              console.log('Attempting to register user:', {
                name: textArray[1],
            
                phoneNumber: phoneNumber,
                location: textArray[2],
                mainCrop: textArray[3],
            
              });

            
              // const email = textArray[2] === '0' ? null : textArray[2];
              const user = await prisma.user.create({
                data: {
                  name: textArray[1],
                  // email: email,
                  phoneNumber: phoneNumber,
                  location: textArray[2],       
                  role: 'Farmer'
                }
              });

              console.log('User created successfully:', user);

              // Create the user's first farm
              const farm = await prisma.farm.create({
                data: {
                  name: `${textArray[1]}'s Farm`,
                  location: textArray[2],
                  // size: parseFloat(textArray[5]),
                  userId: user.id,
                  crops: {
                    create: [{
                      name: textArray[3]
                    }]
                  }
                }
              });

              console.log('Farm created successfully:', farm);

              response = `END Congratulations ${user.name}, you've been successfully registered as a farmer. Dial *384*82933# to start using our weather service.`;
            } catch (error) {
              console.error('Error registering user:', error);

              // More detailed error message based on the error type
              if (error.code === 'P2002') {
                response = "END This phone number is already registered. Please try with a different number.";
              } else if (error.code === 'P2003') {
                response = "END Error creating farm. Please try again later.";
              } else {
                response = "END An unexpected error occurred. Please try again later.";
              }
            }
          // }
        } else if (textArray[4] == 2) {
          // User chose to cancel and start over
          response = "END Registration cancelled. Please dial the service code again to restart registration.";
        } else {
          // Invalid option selected
          response = "END Invalid option selected. Please dial the service code again to restart registration.";
        }
        break;
      default:
        break;
    }
    return response;
  },
};

module.exports = menu;
