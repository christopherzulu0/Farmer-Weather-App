const Emergency ={
    Emergencies: async (textArray, phoneNumber) => {
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
}

module.exports = Emergency;