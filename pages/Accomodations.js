const { User,Destination,Emergency,Transportation,Accommodation,Recommendations,PointOfInterest} = require('../models/Schemas');
const Accommodations = {
    Accommodated: async (textArray, phoneNumber) => {
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
                  response = `END Available accommodation options in ${desiredLocation}:\n`;
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



};




async function getCategoriesFromDB() {
    try {
        // Fetch categories from the database
        const categories = await Category.find({}, 'Category'); // Assuming you have a 'Category' field in your Category schema
        return categories.map(category => category.Category); // Extract category names
    } catch (error) {
        console.error(error);
        throw error;
    }
}

const getPendingApplications = async () => {
    try {
        // Perform a database query to find all applications with status 'pending'
        const pendingApplications = await Applications.find({ Status: 'Pending' });
        return pendingApplications;
    } catch (error) {
        console.error('Error retrieving pending applications:', error);
        throw new Error('Error retrieving pending applications. Please try again later.');
    }


};

module.exports = Accommodations;
