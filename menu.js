const { User,Destination,Emergency,Transportation,Accommodation,Recommendations,PointOfInterest} = require('./models/Schemas');
const axios = require("axios");
const countryCode = require("./util/countryCode");
const bcrypt = require("bcrypt");
const qs = require("qs");
const { response } = require('express');
const i18n = require("i18n");

i18n.configure({
  defaultLocale: 'fr', // Set the default language code here (e.g., 'en' for English)
  directory: __dirname + '/locales', // Specify the directory where your language files are located
});
// Function to fetch location key from AccuWeather Locations API
async function fetchLocationKey(city) {
  const apiKey = 'g3VtqZ06g0iGKFrbEVDGCuEgSTBn7c7N'; // Replace with your AccuWeather API key
  const country = 'ZM'; // Country code for Zambia

  const url = `http://dataservice.accuweather.com/locations/v1/cities/${country}/search?apikey=${apiKey}&q=${city}`;
  const response = await axios.get(url);
  const locationData = response.data;

  if (Array.isArray(locationData) && locationData.length > 0) {
    return locationData[0].Key;
  } else {
    return null;
  }
}

// Function to fetch weather data from AccuWeather API
async function fetchWeatherData(locationKey) {
  const apiKey = 'g3VtqZ06g0iGKFrbEVDGCuEgSTBn7c7N'; // Replace with your AccuWeather API key

  const url = `http://dataservice.accuweather.com/currentconditions/v1/${locationKey}?apikey=${apiKey}`;
  const response = await axios.get(url);
  const weatherData = response.data;

  if (Array.isArray(weatherData) && weatherData.length > 0) {
    return weatherData[0];
  } else {
    return null;
  }
}


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
  MainMenu: (userName) => {
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
                    10. Admin

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
  }
  ,
  

  Tours: async (textArray, phoneNumber) => {
    const level = textArray.length;
    let response = "";
  
    if (level === 1) {
      response = `CON Welcome to the tours and activities area. Please select an option:
      1. Find available tours
      2. Get tour contact information
      `;
      return response;
    } else if (level === 2) {
      const option = textArray[1];
  
      if (option === '1') {
        // Handle finding available tours logic here
        response = `CON Please enter your desired destination:`;
        return response;
      } else if (option === '2') {
        response = `CON Please select the type of tour contact information:
        1. Livingstone's Adventure
        2. Livingstone Tours & Travel
        3. Livingstone Lourie Safari`;
        return response;
      }
    } else if (level === 3) {
      const option = textArray[1];
  
      if (option === '1') {
        // Handle finding available tours based on desired destination logic here
        const desiredDestination = textArray[2];
        // Add your code here to find available tours based on the user's desired destination
  
        // Fetch the destination from the database
        const destination = await Destination.findOne({ name: desiredDestination });
  
        if (destination) {
          const activities = destination.activities.map((activity, index) => `${index + 1}. ${activity.name}`).join('\n');
          response = `END Available tours in <b>${desiredDestination}</b>:
          <b>${destination.description}</b>\n\n<b>Activities:</b>\n<p style="color:blue">${activities}</p>`;
        } else {
          response = `END Destination not found.`;
        }
      } else if (option === '2') {
        const contactOption = textArray[2];
  
        if (contactOption === '1') {
          response = `END Livingstone's Adventure Contact Information:
                          Phone: +260 213 323 589
                          `;
        } else if (contactOption === '2') {
          response = `END Livingstone Tours & Travel Contact Information:
                          Phone: +260 97 3224400
                          `;
        } else if (contactOption === '3') {
          response = `END Livingstone Lourie Safari Contact Information:
                          Phone: +260 97 7417482
                          `;
        } else {
          response = `END Invalid option selected for tour contact information.`;
        }
      }
    }
  
    return response;
  }
  
  
  ,
Weather: async (textArray, phoneNumber) => {
  const level = textArray.length;
  let response = "";

  if (level === 1) {
    response = `CON Welcome to the weather area. Please enter your city:`;
    return response;
  } else if (level === 2) {
    const city = textArray[1];

    // Fetch location key from AccuWeather Locations API
    try {
      const locationKey = await fetchLocationKey(city);

      if (locationKey) {
        // Fetch weather data from the API using location key
        const weatherData = await fetchWeatherData(locationKey);

        if (weatherData) {
          // Display weather data from the API
          response = `CON Weather updates for ${city}:`;
          response += `\n- Description: ${weatherData.WeatherText}`;
          response += `\n- Temperature: ${weatherData.Temperature.Metric.Value}°C`;
          response += `\n- Humidity: ${weatherData.RelativeHumidity ? weatherData.RelativeHumidity : 'N/A'}%`;
        } else {
          response = `END No weather data found for ${city}.`;
        }
      } else {
        response = `END Location not found for ${city}.`;
      }
    } catch (error) {
      response = `END Failed to retrieve weather data for ${city}.`;
    }
  }

  return response;
},
Emergency: async (textArray, phoneNumber) => {
  const level = textArray.length;
  let response = "";

  if (level === 1) {
    response = `CON Welcome to the emergency area. Please select an option:
    1. Report an emergency
    2. Get emergency contact numbers`;
    return response;
  } else if (level === 2) {
    const option = textArray[1];

    if (option === '1') {
      response = `CON Please describe the emergency:`;
      return response;
    } else if (option === '2') {
      response = `CON Please select the type of emergency contact numbers:
      1. Police
      2. Ambulance
      3. Fire Department
      4. Medical Center
      5. Tourism Information
      `;
      return response;
    }
  } else if (level === 3) {
    const option = textArray[1];

    if (option === '1') {
      const emergencyDescription = textArray[2];
      const userInformation = await User.findOne({number:phoneNumber});
      const number = userInformation.phoneNumber;
      const name = userInformation.Name;
      // Create a new emergency report and save it to the database
      const emergency = new Emergency({
        emergencyType: 'Reported', // Set the emergency type as needed
        description: emergencyDescription,
        emergencyContact: {
          name: name, // Replace with the appropriate emergency contact details
          phoneNumber:number // Replace with the appropriate emergency contact details
        }
      });
      await emergency.save();

      response = `CON Thank you for reporting the emergency. Help is on the way!`;
      // Add your code here to handle the emergency report, such as sending notifications to authorities, etc.

      return response;
    } else if (option === '2') {
      const contactOption = textArray[2];

      if (contactOption === '1') {
        response = `END Emergency Contact Numbers - Police:
        Call:+260 213 322222`;
      } else if (contactOption === '2') {
        response = `END Emergency Contact Numbers - Ambulance:
        Call: +260 213 322111`;
      } else if (contactOption === '3') {
        response = `END Emergency Contact Numbers - Fire Department:
        Call: +260 213 322333`;
      } else if (contactOption === '4') {
        response = `END Emergency Contact Numbers - Medical Center:
        Call: +260 213 322000`;
      } else if (contactOption === '5') {
        response = `END Emergency Contact Numbers - Tourism Information:
        Call: +260 213 322365`;
      } else {
        response = `END Invalid option selected for emergency contact numbers.`;
      }
    }
  }

  return response;  
}
,
Transportation: async (textArray, phoneNumber) => {
  const level = textArray.length;
  let response = "";

  if (level === 1) {
    response = `CON Welcome to the transportation area. Please select an option:
    1. Find transportation options
    2. Get transportation contact information`;
    return response;
  } else if (level === 2) {
    const option = textArray[1];

    if (option === '1') {
      response = `CON Please enter your current location:`;
      return response;
    } else if (option === '2') {
      response = `CON Please select the type of transportation contact information:
      1. Taxi services
      2. Airport shuttle
      3. Buses
      4. Private Car
      `;
      return response;
    }
  } else if (level === 3) {
    const option = textArray[1];

    if (option === '1') {
      const currentLocation = textArray[2];
      
      try {
        const transportation = await Transportation.findOne({ location: currentLocation });
        
        if (transportation) {
          const transportOptions = transportation.transportOptions;
          
          if (transportOptions.length > 0) {
            response = `CON Available transportation options near ${currentLocation}:\n`;
            transportOptions.forEach((option, index) => {
              response += `${index + 1}. ${option}\n`;
            });
          } else {
            response = `END No transportation options found near ${currentLocation}.`;
          }
        } else {
          response = `END No transportation options found for ${currentLocation}.`;
        }
      } catch (error) {
        response = `END Failed to retrieve transportation options. Please try again.`;
      }

      return response;
    } else if (option === '2') {
      const contactOption = textArray[2];

      if (contactOption === '1') {
        response = `END Taxi Services Contact Information:
        Call: +260 213 322365`;
      } else if (contactOption === '2') {
        response = `END Airport shuttle Contact Information:
        Call: +260 97 7311547`;
      } else if (contactOption === '3') {
        response = `END Buses Contact Information:
        Call: +260 213 322222
        `;
      } else if (contactOption === '4') {
        response = `END Private Car Contact Information:
        Call: +260 213 322111  
        `;
      } else {
        response = `END Invalid option selected for transportation contact information.`;
      }
    }
  }

  return response;
}
,
Accommodation: async (textArray, phoneNumber) => {
  const level = textArray.length;
  let response = "";

  if (level === 1) {
    response = `CON Welcome to the accommodation area. Please select an option:
    1. Find accommodation options
    2. Get accommodation contact information`;
    return response;
  } else if (level === 2) {
    const option = textArray[1];

    if (option === '1') {
      response = `CON Please enter your desired location:`;
      return response;
    } else if (option === '2') {
      response = `CON Please select the type of accommodation contact information:
      1. The Royal Livingstone Hotel
      2. Livingstone Safari Lodge
      3. Tasha Lodge
      4. Jollyboys Backpackers
      `;
      return response;
    }
  } else if (level === 3) {
    const option = textArray[1];

    if (option === '1') {
      const desiredLocation = textArray[2];
      
      try {
        const accommodation = await Accommodation.findOne({ location: desiredLocation });
        
        if (accommodation) {
          const accommodationsList = accommodation.accommodations;
          
          if (accommodationsList.length > 0) {
            response = `CON Available accommodation options in ${desiredLocation}:\n`;
            accommodationsList.forEach((accommodation, index) => {
              response += `${index + 1}. <b>${accommodation}</b>\n`;
            });
          } else {
            response = `END No accommodation options found in ${desiredLocation}.`;
          }
        } else {
          response = `END No accommodation options found for ${desiredLocation}.`;
        }
      } catch (error) {
        response = `END Failed to retrieve accommodation options. Please try again.`;
      }

      return response;
    } else if (option === '2') {
      const contactOption = textArray[2];

      if (contactOption === '1') {
        response = `END The Royal Livingstone Hotel Contact Information:
        Call: +260 213 321122`;
      } else if (contactOption === '2') {
        response = `END Livingstone Safari Lodge Contact Information:
        Call: +260 213 323 589`;
      } else if (contactOption === '3') {
        response = `END Tasha Lodge Contact Information:
        Call: +260 213 322096`;
      } else if (contactOption === '4') {
        response = `END Jollyboys Backpackers Contact Information:
        Call: +260 213 322365`;
      } else {
        response = `END Invalid option selected for accommodation contact information.`;
      }
    }
  }

  return response;
}
,
LocationBased: async (textArray, phoneNumber) => {
  const level = textArray.length;
  let response = "";

  if (level === 1) {
    response = `CON Welcome to the LocationBased area. Please enter your current location:`;
    return response;
  } else if (level === 2) {
    const currentLocation = textArray[1];

    try {
      const recommendations = await Recommendations.findOne({ location: currentLocation });
      
      if (recommendations) {
        const recommendationsList = recommendations. recommendatons;
        
        if (recommendationsList.length > 0) {
          response = `CON Location-based recommendations for ${currentLocation}:`;
          recommendationsList.forEach((recommendation, index) => {
            response += `\n${index + 1}. <b>${recommendation}</b>`;
          });
        } else {
          response = `END No location-based recommendations found for ${currentLocation}.`;
        }
      } else {
        response = `END No location-based recommendations found for ${currentLocation}.`;
      }
    } catch (error) {
      response = `END Failed to retrieve location-based recommendations. Please try again.`;
    }
  }

  return response;
}

,
POI: async (textArray, phoneNumber) => {
  const level = textArray.length;
  let response = "";

  if (level === 1) {
    response = `CON Welcome to the Point of Interest (POI) area. Please select an option:
    1. Find popular points of interest
    2. Get information about a specific point of interest`;
    return response;
  } else if (level === 2) {
    const option = textArray[1];

    if (option === '1') {
      // Handle finding popular points of interest logic here
      // You can retrieve the names of points of interest from the database
      const pointsOfInterest = await PointOfInterest.find({}, 'name');

      let poiList = "";
      for (let i = 0; i < pointsOfInterest.length; i++) {
        poiList += `${i + 1}. ${pointsOfInterest[i].name}\n`;
      }

      response = `END Here are some popular points of interest:\n${poiList}`;
    } else if (option === '2') {
      response = `CON Please enter the name of the point of interest:`;
      return response;
    }
  } else if (level === 3) {
    const poiName = textArray[2];

    // Handle getting information about a specific point of interest logic here
    const poiInfo = await PointOfInterest.findOne({ name: poiName });

    if (poiInfo) {
      response = `END Information about <b>${poiName}</b>:
      - Description: <p style='color:blue;'>${poiInfo.description}</p>
      `;
    } else {
      response = `END No information found for ${poiName}.`;
    }
  }

  return response;
}

,
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
  
},
Admin: async (textArray, phoneNumber) => {
  const level = textArray.length;
  let response = "";

  if (level === 1) {
    response = `CON 
    1. Add tours and activities
    2. Add emergency services
    3. Add transportation information
    4. Add Accommodation listings
    5. Add location-based recommendations
    6. Add point of interest
    `;
    return response;
  } else if (level === 2 && textArray[level - 1] === '1') {
    // Handle the logic for adding tours and activities
    response = `CON Please provide the destination name:
    `;
    return response;
  } else if (level === 3 && textArray[level - 2] === '1') {
    // Handle the logic for adding tours and activities (continued)
    const destinationName = textArray[level - 1];
    response = `CON Please provide the country:
    `;
    return response;
  } else if (level === 4 && textArray[level - 3] === '1') {
    // Handle the logic for adding tours and activities (continued)
    const destinationName = textArray[level - 2];
    const country = textArray[level - 1];
    response = `CON Please provide the description:
    `;
    return response;
  } else if (level === 5 && textArray[level - 4] === '1') {
    // Handle the logic for adding tours and activities (continued)
    const destinationName = textArray[level - 3];
    const country = textArray[level - 2];
    const description = textArray[level - 1];

    // Save the destination to the database
    const destination = new Destination({
      name: destinationName,
      country: country,
      description: description,
      activities: []
    });

    try {
      await destination.save();
      response = `CON Destination "${destinationName}" has been successfully added with country "${country}" and description "${description}".
      To add activities, enter the activity names separated by a comma (e.g., activity1, activity2). Enter "DONE" to finish.
      `;
    } catch (error) {
      response = `END Failed to add destination. Please try again.
      `;
      return response;
    }
    return response;
  } else if (level === 6 && textArray[level - 5] === '1') {
    // Handle the logic for adding activities to a destination
    const destinationName = textArray[level - 4];
    const activities = textArray[level - 1].split(',').map(activity => activity.trim());

    const destination = await Destination.findOne({ name: destinationName });

    if (destination) {
      destination.activities = activities.map(activity => ({ name: activity }));

      try {
        await destination.save();
        response = `CON Activities have been added to destination "${destinationName}".
        Thank you!
        `;
      } catch (error) {
        response = `END Failed to add activities. Please try again.
        `;
      }
    } else {
      response = `END Destination "${destinationName}" not found. Please try again.
      `;
    }
    return response;
  } else if (level === 2 && textArray[level - 1] === '3') {
    // Handle the logic for adding transport options
    response = `CON Please provide the destination name:
    `;
    return response;
  } else if (level === 3 && textArray[level - 2] === '3') {
    // Handle the logic for adding transport options (continued)
    const destinationName = textArray[level - 1];
    response = `CON Please provide the transport options separated by a comma:
    `;
    return response;
  } else if (level === 4 && textArray[level - 3] === '3') {
    // Handle the logic for adding transport options (continued)
    const destinationName = textArray[level - 2]; // Fix: use textArray[level - 2] instead of textArray[level - 1]
    const transportOptions = textArray[level - 1].split(',').map(option => option.trim());

    const transportation = new Transportation({
      location: destinationName,
      transportOptions: transportOptions
    });

    try {
      await transportation.save();
      response = `CON Transport options have been added to destination "${destinationName}".
      Thank you!
      `;
    } catch (error) {
      response = `END Failed to add transport options. Please try again.
      `;
    }
    return response;
  } else if (level === 2 && textArray[level - 1] === '4') {
    // Handle the logic for adding accommodation listings
    response = `CON Please provide the destination name:
    `;
    return response;
  } else if (level === 3 && textArray[level - 2] === '4') {
    // Handle the logic for adding accommodation listings (continued)
    const destinationName = textArray[level - 1];
    response = `CON Please provide the accommodation options separated by a comma:
    `;
    return response;
  } else if (level === 4 && textArray[level - 3] === '4') {
    // Handle the logic for adding accommodation listings (continued)
    const destinationName = textArray[level - 2]; // Fix: use textArray[level - 2] instead of textArray[level - 1]
    const accommodations = textArray[level - 1].split(',').map(option => option.trim());

    const accommodation = new Accommodation({
      location: destinationName,
      accommodations: accommodations
    });

    try {
      await accommodation.save();
      response = `CON Accommodation listings have been added to destination "${destinationName}".
      Thank you!
      `;
    } catch (error) {
      response = `END Failed to add accommodation listings. Please try again.
      `;
    }
    return response;
  } else if (level === 2 && textArray[level - 1] === '5') {
    // Handle the logic for adding location-based recommendations
    response = `CON Please provide the destination name:
    `;
    return response;
  } else if (level === 3 && textArray[level - 2] === '5') {
    // Handle the logic for adding location-based recommendations (continued)
    response = `CON Please provide the recommendation options separated by a comma:
    `;
    return response;
  } else if (level === 4 && textArray[level - 3] === '5') {
    // Handle the logic for adding location-based recommendations (continued)
    const destinationName = textArray[level - 2]; // Fix: use textArray[level - 2] instead of textArray[level - 1]
    const recommendations = textArray[level - 1].split(',').map(option => option.trim());

    const recommend = new Recommendations({
      location: destinationName,
      recommendations: recommendations
    });

    try {
      await recommend.save();
      response = `CON Location-based recommendations have been added to destination "${destinationName}".
      Thank you!
      `;
    } catch (error) {
      response = `END Failed to add location-based recommendations. Please try again.
      `;
    }
    return response;
  }else if (level === 2 && textArray[level - 1] === '6') {
    // Handle the logic for adding a point of interest
    response = `CON Please provide the name of the point of interest:
    `;
    return response;
  } else if (level === 3 && textArray[level - 2] === '6') {
    // Handle the logic for adding a point of interest (continued)
    response = `CON Please provide the description of the point of interest:
    `;
    return response;
  } else if (level === 4 && textArray[level - 3] === '6') {
    // Handle the logic for adding a point of interest (continued)
    const name = textArray[level - 2];
    const description = textArray[level - 1];
  
    // Save the point of interest to the database
    const pointOfInterest = new PointOfInterest({
      name: name,
      description: description
    });
  
    try {
      await pointOfInterest.save();
      response = `CON Point of interest "${name}" has been successfully.
      Thank you!
      `;
    } catch (error) {
      response = `END Failed to add point of interest. Please try again.
      `;
      return response;
    }
    return response;
  }
  


  
  
  

  // Handle other options and levels here
  // ...
}









   
};

module.exports = menu;
