const prisma = require('../prisma/client');

const MyFarms = {
    Farms: async (textArray, phoneNumber) => {
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

            // Check for special "add_farm" signal
            if (level === 2 && textArray[1] === "add_farm") {
                response = `CON Enter farm name:`;
                return response;
            }

            if (level === 1) {
                // Main farms menu
                if (user.farms.length === 0) {
                    response = `CON You don't have any farms yet.
                    1. Add a new farm
                    2. Back to Main Menu`;
                } else {
                    response = `CON My Farms:
                    ${user.farms.map((farm, index) => `${index + 1}. ${farm.name} (${farm.location})`).join('\n')}
                    ${user.farms.length + 1}. Add a new farm
                    ${user.farms.length + 2}. Back to Main Menu`;
                }
                return response;
            }

            // Add a new farm
            else if ((level === 2 && user.farms.length === 0 && textArray[1] === '1') ||
                     (level === 2 && textArray[1] === String(user.farms.length + 1))) {
                response = `CON Enter farm name:`;
                return response;
            }

            // Enter farm location
            else if ((level === 3 && user.farms.length === 0 && textArray[1] === '1') ||
                     (level === 3 && textArray[1] === String(user.farms.length + 1)) ||
                     (level === 3 && textArray[1] === "add_farm")) {
                response = `CON Enter farm location:`;
                return response;
            }

            // Enter farm size
            else if ((level === 4 && user.farms.length === 0 && textArray[1] === '1') ||
                     (level === 4 && textArray[1] === String(user.farms.length + 1)) ||
                     (level === 4 && textArray[1] === "add_farm")) {
                response = `CON Enter farm size (in hectares):`;
                return response;
            }

            // Enter main crop
            else if ((level === 5 && user.farms.length === 0 && textArray[1] === '1') ||
                     (level === 5 && textArray[1] === String(user.farms.length + 1)) ||
                     (level === 5 && textArray[1] === "add_farm")) {
                response = `CON Enter main crop:`;
                return response;
            }

            // Confirm and save farm
            else if ((level === 6 && user.farms.length === 0 && textArray[1] === '1') ||
                     (level === 6 && textArray[1] === String(user.farms.length + 1)) ||
                     (level === 6 && textArray[1] === "add_farm")) {
                const farmName = textArray[2];
                const farmLocation = textArray[3];
                const farmSize = parseFloat(textArray[4]);
                const mainCrop = textArray[5];

                // Create the farm in the database
                const farm = await prisma.farm.create({
                    data: {
                        name: farmName,
                        location: farmLocation,
                        size: farmSize,
                        userId: user.id,
                        crops: {
                            create: [{
                                name: mainCrop
                            }]
                        }
                    }
                });

                response = `END Farm "${farmName}" has been added successfully!`;
                return response;
            }

            // View farm details
            else if (level === 2 && parseInt(textArray[1]) <= user.farms.length) {
                const farmIndex = parseInt(textArray[1]) - 1;
                const farm = user.farms[farmIndex];

                response = `CON Farm: ${farm.name}
                Location: ${farm.location}
                Size: ${farm.size} hectares
                Crops: ${farm.crops.map(crop => crop.name).join(', ')}

                1. Add a crop
                2. Remove a crop
                3. Update farm details
                4. Delete farm
                5. Back to farms list`;
                return response;
            }

            // Add a crop to farm
            else if (level === 3 && parseInt(textArray[1]) <= user.farms.length && textArray[2] === '1') {
                response = `CON Enter crop name:`;
                return response;
            }

            // Save new crop
            else if (level === 4 && parseInt(textArray[1]) <= user.farms.length && textArray[2] === '1') {
                const farmIndex = parseInt(textArray[1]) - 1;
                const farm = user.farms[farmIndex];
                const cropName = textArray[3];

                // Add the crop to the farm
                await prisma.crop.create({
                    data: {
                        name: cropName,
                        farmId: farm.id
                    }
                });

                response = `END Crop "${cropName}" has been added to farm "${farm.name}" successfully!`;
                return response;
            }

            // Back to Main Menu
            else if ((level === 2 && user.farms.length === 0 && textArray[1] === '2') ||
                     (level === 2 && textArray[1] === String(user.farms.length + 2))) {
                // This will be handled by the main menu logic
                return "CON";
            }

            else {
                return "END Invalid option. Please try again.";
            }
        } catch (error) {
            console.error('Error in Farms function:', error);
            return "END An error occurred. Please try again later.";
        }
    }
}

module.exports = MyFarms;
