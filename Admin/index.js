const { User,Destination,Emergency,Transportation,Accommodation,Recommendations,PointOfInterest} = require('../models/Schemas');
const Dashboard = {
    Admin: async (textArray, phoneNumber) => {
        const level = textArray.length;
        let response = "";
      
        //Get user Details
        const users = await User.findOne({phoneNumber:phoneNumber});
        const name = users.Name;

        console.log("Admin Name:",name)

        if (level === 1) {
          response = `CON 
           Welcome to your dashboard <b>${name}!</b>

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
      
}

module.exports = Dashboard;