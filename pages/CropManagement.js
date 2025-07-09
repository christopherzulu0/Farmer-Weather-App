const prisma = require('../prisma/client');
const { getCurrentWeather, getAgriculturalAdvice } = require('../util/weatherService');
const { getPlantingAdvice, getRecommendedCrops } = require('../util/cropCalendarService');

const CropManagement = {
    Crops: async (textArray, phoneNumber) => {
        console.log("DEBUG: textArray for Crops:", textArray, "phoneNumber:", phoneNumber);
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

            if (level === 1) {
                // Main crop management menu
                response = `CON Crop Management:
                1. View all crops
                2. Get crop advice
                3. Crop calendar
                4. Back to Main Menu`;
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
                Planting Date: ${crop.plantingDate || 'Not set'}
                Harvest Date: ${crop.harvestDate ? new Date(crop.harvestDate).toLocaleDateString() : 'Not set'}

                Current Weather: ${weatherData.description}, ${weatherData.temperature}°C

                Advice: ${advice}`;
                return response;
            }

            // Get crop advice - select crop
            else if (level === 2 && textArray[1] === '2') {
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
            else if (level === 3 && textArray[1] === '2') {
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
                        name: crop.name,
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

            // Crop calendar - main menu
            else if (level === 2 && textArray[1] === '3') {
                response = `CON Crop Calendar:
                1. View recommended crops for current season
                2. Get planting advice for a specific crop
                3. Back to Crop Management`;
                return response;
            }

            // Crop calendar - view recommended crops
            else if (level === 3 && textArray[1] === '3' && textArray[2] === '1') {
                try {
                    // Get recommended crops for the user's location
                    const recommendedCrops = await getRecommendedCrops(user.location);

                    if (recommendedCrops.length === 0) {
                        response = `END No recommended crops found for the current season in ${user.location}.

                        Try again later or check for specific crop planting advice.`;
                    } else {
                        // Format date for display
                        const formatDate = (date) => {
                            return date.toLocaleDateString('en-US', {
                                day: 'numeric',
                                month: 'short'
                            });
                        };

                        response = `END Recommended crops for current season in ${user.location}:

                        ${recommendedCrops.map(crop => 
                            `${crop.name.toUpperCase()} (${crop.suitability})
                            Season: ${crop.season}
                            Plant: ${formatDate(crop.plantingWindow.start)} - ${formatDate(crop.plantingWindow.end)}
                            Growing period: ${crop.growingPeriod}`
                        ).join('\n\n')}`;
                    }
                    return response;
                } catch (error) {
                    console.error('Error getting recommended crops:', error);
                    return "END Failed to get recommended crops. Please try again later.";
                }
            }

            // Crop calendar - get planting advice (select crop)
            else if (level === 3 && textArray[1] === '3' && textArray[2] === '2') {
                // If user has crops, let them select from their crops
                if (user.farms.some(farm => farm.crops.length > 0)) {
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

                    response = `CON Select crop for planting advice:
                    ${allCrops.map((crop, index) => `${index + 1}. ${crop.name} (${crop.farmName})`).join('\n')}
                    ${allCrops.length + 1}. Enter a different crop`;
                } else {
                    // If user has no crops, ask them to enter a crop name
                    response = `CON Enter crop name for planting advice:`;
                }
                return response;
            }

            // Crop calendar - get planting advice for selected crop
            else if (level === 4 && textArray[1] === '3' && textArray[2] === '2') {
                try {
                    let cropName;
                    let location = user.location;

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

                    // Check if user selected from their crops or wants to enter a different crop
                    const selection = parseInt(textArray[3]);
                    if (!isNaN(selection) && selection > 0) {
                        if (selection <= allCrops.length) {
                            // User selected one of their crops
                            cropName = allCrops[selection - 1].name;
                            location = allCrops[selection - 1].farmLocation;
                        } else if (selection === allCrops.length + 1) {
                            // User wants to enter a different crop
                            response = `CON Enter crop name for planting advice:`;
                            return response;
                        } else {
                            return "END Invalid selection. Please try again.";
                        }
                    } else {
                        // User entered a crop name directly
                        cropName = textArray[3];
                    }

                    // Get planting advice for the selected crop
                    const advice = await getPlantingAdvice(cropName, location);

                    response = `END ${advice}`;
                    return response;
                } catch (error) {
                    console.error('Error getting planting advice:', error);
                    return "END Failed to get planting advice. Please try again later.";
                }
            }

            // Crop calendar - get planting advice for manually entered crop
            else if (level === 5 && textArray[1] === '3' && textArray[2] === '2') {
                try {
                    const cropName = textArray[4];
                    const location = user.location;

                    // Get planting advice for the entered crop
                    const advice = await getPlantingAdvice(cropName, location);

                    response = `END ${advice}`;
                    return response;
                } catch (error) {
                    console.error('Error getting planting advice:', error);
                    return "END Failed to get planting advice. Please try again later.";
                }
            }

            // Crop calendar - back to crop management
            else if (level === 3 && textArray[1] === '3' && textArray[2] === '3') {
                // Return to crop management menu
                response = `CON Crop Management:
                1. View all crops
                2. Get crop advice
                3. Crop calendar
                4. Back to Main Menu`;
                return response;
            }

            // Back to Main Menu
            else if (level === 2 && textArray[1] === '4') {
                // This will be handled by the main menu logic
                return "CON";
            }

            // --- Add New Crop Flow ---
            else if (textArray.includes('add_crop')) {
                const addCropIdx = textArray.indexOf('add_crop');
                // Step 1: Prompt for crop name
                if (textArray.length === addCropIdx + 1) {
                    response = `CON Enter the name of the new crop:`;
                    return response;
                }
                // Step 2: If user has multiple farms, prompt for farm selection or add crop if only one farm
                else if (textArray.length === addCropIdx + 2) {
                    const cropName = textArray[addCropIdx + 1];
                    if (user.farms.length === 1) {
                        // Only one farm, add crop directly
                        const farm = user.farms[0];
                        await prisma.crop.create({
                            data: {
                                name: cropName,
                                farmId: farm.id
                            }
                        });
                        response = `END Crop "${cropName}" has been added to your farm "${farm.name}" successfully!`;
                        return response;
                    } else {
                        // Multiple farms, prompt for selection
                        response = `CON Select the farm to add "${cropName}":\n` +
                            user.farms.map((farm, idx) => `${idx + 1}. ${farm.name}`).join('\n');
                        return response;
                    }
                }
                // Step 3: Add crop to selected farm
                else if (textArray.length === addCropIdx + 3) {
                    const cropName = textArray[addCropIdx + 1];
                    const farmIndex = parseInt(textArray[addCropIdx + 2]) - 1;
                    if (isNaN(farmIndex) || farmIndex < 0 || farmIndex >= user.farms.length) {
                        return "END Invalid farm selection.";
                    }
                    const farm = user.farms[farmIndex];
                    await prisma.crop.create({
                        data: {
                            name: cropName,
                            farmId: farm.id
                        }
                    });
                    response = `END Crop "${cropName}" has been added to your farm "${farm.name}" successfully!`;
                    return response;
                }
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
