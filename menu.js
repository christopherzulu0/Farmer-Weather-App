const prisma = require('./prisma/client');
const crypto = require("crypto");
const qs = require("qs");
const { response } = require('express');
const i18n = require("i18n");
const { getCurrentWeather, getAgriculturalAdvice } = require('./util/weatherService');
const { sendWeatherAlert } = require('./util/africasTalking');

// Helper function to hash passwords using crypto instead of bcrypt
const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
};

// Helper function to verify passwords
const verifyPassword = (password, hashedPassword) => {
  const [salt, storedHash] = hashedPassword.split(':');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return storedHash === hash;
};

i18n.configure({
  defaultLocale: 'en', // Set the default language code here
  directory: __dirname + '/locales', // Specify the directory where your language files are located
});

// Function to get crop advice based on weather
const getCropAdvice = async (cropType, location) => {
  try {
    // Get current weather for the location
    const weatherData = await getCurrentWeather(location);

    // Get agricultural advice based on weather and crop type
    const advice = getAgriculturalAdvice(cropType, weatherData);

    return {
      cropType,
      location,
      weather: weatherData,
      advice
    };
  } catch (error) {
    console.error('Error getting crop advice:', error);
    return {
      cropType,
      location,
      error: 'Unable to fetch weather data. Please try again later.'
    };
  }
};

// Function to get farm information
const getFarmInfo = async (userId) => {
  try {
    const farms = await prisma.farm.findMany({
      where: { userId: parseInt(userId) },
      include: { crops: true }
    });

    return farms;
  } catch (error) {
    console.error('Error fetching farm information:', error);
    return [];
  }
};

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
        response = "CON What is your email address? (optional, reply with 0 to skip)";
        break;
      case 3:
        response = "CON What is your location/district?";
        break;
      case 4:
        response = "CON What is your main crop?";
        break;
      case 5:
        response = "CON What is the size of your farm? (in hectares)";
        break;
      case 6:
        response = "CON Set a login PIN (4 Digits)";
        break;
      case 7:
        response = "CON Please confirm your PIN:";
        break;
      case 8:
        const email = textArray[2] === '0' ? 'Not provided' : textArray[2];
        response = `CON Confirm Your Details:
Name: ${textArray[1]}
Email: ${email}
Location: ${textArray[3]}
Main Crop: ${textArray[4]}
Farm Size: ${textArray[5]} hectares
PIN: ${textArray[6]}

1. Confirm & continue
2. Cancel & start over`;
        break;
      case 9:
        if(textArray[8] == 1){
          const pin = textArray[6];
          const confirmPin = textArray[7];

          // Check if the pin is 4 characters long and is purely numerical
          if (pin.toString().length != 4 || isNaN(pin)) {
            response = "END Your PIN must be 4 digits. Please try again!";
          }
          // Check if the pin and confirmed pin are the same
          else if (pin != confirmPin) {
            response = "END Your PIN does not match. Please try again";
          } else {
            try {
              console.log('Attempting to register user:', {
                name: textArray[1],
                email: textArray[2] === '0' ? null : textArray[2],
                phoneNumber: phoneNumber,
                location: textArray[3],
                mainCrop: textArray[4],
                farmSize: textArray[5]
              });

              // Hash the PIN using crypto instead of bcrypt
              const hashedPin = hashPassword(pin);

              // Create user in database using Prisma
              const email = textArray[2] === '0' ? null : textArray[2];
              const user = await prisma.user.create({
                data: {
                  name: textArray[1],
                  email: email,
                  phoneNumber: phoneNumber,
                  location: textArray[3],
                  pin: hashedPin,
                  role: 'Farmer'
                }
              });

              console.log('User created successfully:', user);

              // Create the user's first farm
              const farm = await prisma.farm.create({
                data: {
                  name: `${textArray[1]}'s Farm`,
                  location: textArray[3],
                  size: parseFloat(textArray[5]),
                  userId: user.id,
                  crops: {
                    create: [{
                      name: textArray[4]
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
          }
        } else if (textArray[8] == 2) {
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
