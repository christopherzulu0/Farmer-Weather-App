const ModeOfTransport = {
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
}

module.exports = ModeOfTransport;