const prisma = require('../prisma/client');
const { getCurrentWeather, getAgriculturalAdvice } = require('../util/weatherService');

const CropManagement = {
    Crops: async (textArray, phoneNumber) => {
        const level = textArray.length;
        let response = "";

        try {
            // Find the user by phone number
            const user = await prisma.user.findUnique({
                where: { phoneNumber },
                include: {
                    farms: {
                        include: {
                            crops: true
                        }
                    }
                }
            });

            if (!user) {
                return "END User not found. Please register first.";
            }

            if (user.farms.length === 0) {
                return "END You don't have any farms yet. Please add a farm first.";
            }

            // Check for special "add_crop" signal
            if (level === 2 && textArray[1] === "add_crop") {
                if (user.farms.length === 1) {
                    // If user has only one farm, skip farm selection
                    response = `CON Enter crop name for farm "${user.farms[0].name}":`;
                } else {
                    response = `CON Select farm to add crop to:
                    ${user.farms.map((farm, index) => `${index + 1}. ${farm.name}`).join('\n')}`;
                }
                return response;
            }

            if (level === 1) {
                // Main crop management menu
                response = `CON Crop Management:
                1. View all crops
                2. Add a new crop
                3. Get crop advice
                4. Crop calendar
                5. Back to Main Menu`;
                return response;
            }

            // View all crops
            else if (level === 2 && textArray[1] === '1') {
                // Collect all crops from all farms
                const allCrops = [];
                user.farms.forEach(farm => {
                    farm.crops.forEach(crop => {
                        allCrops.push({
                            id: crop.id,
                            name: crop.name,
                            farmName: farm.name
                        });
                    });
                });

                if (allCrops.length === 0) {
                    response = `END You don't have any crops yet. Please add crops to your farms.`;
                } else {
                    response = `CON Your Crops:
                    ${allCrops.map((crop, index) => `${index + 1}. ${crop.name} (${crop.farmName})`).join('\n')}

                    Enter a number to view crop details or 0 to go back:`;
                }
                return response;
            }

            // View crop details
            else if (level === 3 && textArray[1] === '1' && textArray[2] !== '0') {
                // Collect all crops from all farms
                const allCrops = [];
                user.farms.forEach(farm => {
                    farm.crops.forEach(crop => {
                        allCrops.push({
                            id: crop.id,
                            name: crop.name,
                            farmName: farm.name,
                            farmLocation: farm.location,
                            plantingDate: crop.plantingDate,
                            harvestDate: crop.harvestDate
                        });
                    });
                });

                const cropIndex = parseInt(textArray[2]) - 1;
                if (isNaN(cropIndex) || cropIndex < 0 || cropIndex >= allCrops.length) {
                    return "END Invalid crop selection.";
                }

                const crop = allCrops[cropIndex];

                // Get weather-based advice for this crop
                const weatherData = await getCurrentWeather(crop.farmLocation);
                const advice = getAgriculturalAdvice(crop.name, weatherData);

                response = `END Crop: ${crop.name}
                Farm: ${crop.farmName}
                Location: ${crop.farmLocation}
                Planting Date: ${crop.plantingDate ? new Date(crop.plantingDate).toLocaleDateString() : 'Not set'}
                Harvest Date: ${crop.harvestDate ? new Date(crop.harvestDate).toLocaleDateString() : 'Not set'}

                Current Weather: ${weatherData.description}, ${weatherData.temperature}°C

                Advice: ${advice}`;
                return response;
            }

            // Add a new crop - select farm
            else if (level === 2 && textArray[1] === '2') {
                if (user.farms.length === 1) {
                    // If user has only one farm, skip farm selection
                    response = `CON Enter crop name for farm "${user.farms[0].name}":`;
                } else {
                    response = `CON Select farm to add crop to:
                    ${user.farms.map((farm, index) => `${index + 1}. ${farm.name}`).join('\n')}`;
                }
                return response;
            }

            // Add a new crop - enter crop name (for multiple farms)
            else if ((level === 3 && textArray[1] === '2' && user.farms.length > 1) ||
                     (level === 3 && textArray[1] === 'add_crop' && user.farms.length > 1)) {
                const farmIndex = parseInt(textArray[2]) - 1;
                if (isNaN(farmIndex) || farmIndex < 0 || farmIndex >= user.farms.length) {
                    return "END Invalid farm selection.";
                }

                response = `CON Enter crop name for farm "${user.farms[farmIndex].name}":`;
                return response;
            }

            // Add a new crop - enter planting date (for single farm)
            else if ((level === 3 && textArray[1] === '2' && user.farms.length === 1) ||
                     (level === 3 && textArray[1] === 'add_crop' && user.farms.length === 1)) {
                response = `CON Enter planting date for ${textArray[2]} (DD/MM/YYYY) or 0 to skip:`;
                return response;
            }

            // Add a new crop - enter planting date (for multiple farms)
            else if ((level === 4 && textArray[1] === '2' && user.farms.length > 1) ||
                     (level === 4 && textArray[1] === 'add_crop' && user.farms.length > 1)) {
                response = `CON Enter planting date for ${textArray[3]} (DD/MM/YYYY) or 0 to skip:`;
                return response;
            }

            // Add a new crop - save crop (for single farm)
            else if ((level === 4 && textArray[1] === '2' && user.farms.length === 1) ||
                     (level === 4 && textArray[1] === 'add_crop' && user.farms.length === 1)) {
                const cropName = textArray[2];
                const plantingDateStr = textArray[3];

                let plantingDate = null;
                if (plantingDateStr !== '0') {
                    // Parse date in DD/MM/YYYY format
                    const [day, month, year] = plantingDateStr.split('/').map(Number);
                    plantingDate = new Date(year, month - 1, day);
                }

                // Add the crop to the farm
                await prisma.crop.create({
                    data: {
                        name: cropName,
                        plantingDate: plantingDate,
                        farmId: user.farms[0].id
                    }
                });

                response = `END Crop "${cropName}" has been added to farm "${user.farms[0].name}" successfully!`;
                return response;
            }

            // Add a new crop - save crop (for multiple farms)
            else if ((level === 5 && textArray[1] === '2' && user.farms.length > 1) ||
                     (level === 5 && textArray[1] === 'add_crop' && user.farms.length > 1)) {
                const farmIndex = parseInt(textArray[2]) - 1;
                const cropName = textArray[3];
                const plantingDateStr = textArray[4];

                let plantingDate = null;
                if (plantingDateStr !== '0') {
                    // Parse date in DD/MM/YYYY format
                    const [day, month, year] = plantingDateStr.split('/').map(Number);
                    plantingDate = new Date(year, month - 1, day);
                }

                // Add the crop to the farm
                await prisma.crop.create({
                    data: {
                        name: cropName,
                        plantingDate: plantingDate,
                        farmId: user.farms[farmIndex].id
                    }
                });

                response = `END Crop "${cropName}" has been added to farm "${user.farms[farmIndex].name}" successfully!`;
                return response;
            }

            // Get crop advice - select crop
            else if (level === 2 && textArray[1] === '3') {
                // Collect all crops from all farms
                const allCrops = [];
                user.farms.forEach(farm => {
                    farm.crops.forEach(crop => {
                        allCrops.push({
                            id: crop.id,
                            name: crop.name,
                            farmName: farm.name,
                            farmLocation: farm.location
                        });
                    });
                });

                if (allCrops.length === 0) {
                    response = `END You don't have any crops yet. Please add crops to your farms.`;
                } else {
                    response = `CON Select crop for advice:
                    ${allCrops.map((crop, index) => `${index + 1}. ${crop.name} (${crop.farmName})`).join('\n')}`;
                }
                return response;
            }

            // Get crop advice - display advice
            else if (level === 3 && textArray[1] === '3') {
                // Collect all crops from all farms
                const allCrops = [];
                user.farms.forEach(farm => {
                    farm.crops.forEach(crop => {
                        allCrops.push({
                            id: crop.id,
                            name: crop.name,
                            farmName: farm.name,
                            farmLocation: farm.location
                        });
                    });
                });

                const cropIndex = parseInt(textArray[2]) - 1;
                if (isNaN(cropIndex) || cropIndex < 0 || cropIndex >= allCrops.length) {
                    return "END Invalid crop selection.";
                }

                const crop = allCrops[cropIndex];

                // Get weather-based advice for this crop
                const weatherData = await getCurrentWeather(crop.farmLocation);
                const advice = getAgriculturalAdvice(crop.name, weatherData);

                // Store the advice in the database
                await prisma.cropAdvice.create({
                    data: {
                        cropId: crop.id,
                        userId: user.id,
                        advice: advice,
                        weatherCondition: weatherData.description
                    }
                });

                response = `END Agricultural Advice for ${crop.name}:

                ${advice}

                Weather: ${weatherData.description}, ${weatherData.temperature}°C`;
                return response;
            }

            // Back to Main Menu
            else if (level === 2 && textArray[1] === '5') {
                // This will be handled by the main menu logic
                return "CON";
            }

            else {
                return "END Invalid option. Please try again.";
            }
        } catch (error) {
            console.error('Error in Crops function:', error);
            return "END An error occurred. Please try again later.";
        }
    }
}

module.exports = CropManagement;
