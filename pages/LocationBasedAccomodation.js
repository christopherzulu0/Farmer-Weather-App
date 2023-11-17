const { User,Destination,Emergency,Transportation,Accommodation,Recommendations,PointOfInterest} = require('../models/Schemas');
const LocationBasedAccomodation = {
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
}

module.exports = LocationBasedAccomodation;