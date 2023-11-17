const PointOfInterest = {
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
      
}

module.exports = PointOfInterest;