const { User,Destination,Emergency,Transportation,Accommodation,Recommendations,PointOfInterest} = require('../models/Schemas');
const Tours = {

    Tour: async (textArray, phoneNumber) => {
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
};

module.exports = Tours;