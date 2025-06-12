const prisma = require('../prisma/client');

const FarmManagement = {
    Manage: async (textArray, phoneNumber) => {
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

            if (level === 1) {
                // Main farm management menu
                response = `CON Farm Management:
                1. View my farms
                2. Add a new farm
                3. Update farm details
                4. Delete a farm
                5. Farm statistics
                6. Back to Main Menu`;
                return response;
            }

            // View my farms
            else if (level === 2 && textArray[1] === '1') {
                if (user.farms.length === 0) {
                    response = `END You don't have any farms yet. Select 'Add a new farm' to get started.`;
                } else {
                    response = `CON Your Farms:
                    ${user.farms.map((farm, index) => `${index + 1}. ${farm.name} (${farm.location})`).join('\n')}
                    
                    Enter a number to view farm details:`;
                }
                return response;
            }

            // View farm details
            else if (level === 3 && textArray[1] === '1') {
                const farmIndex = parseInt(textArray[2]) - 1;
                if (isNaN(farmIndex) || farmIndex < 0 || farmIndex >= user.farms.length) {
                    return "END Invalid farm selection.";
                }

                const farm = user.farms[farmIndex];

                response = `END Farm Details:
                
                Name: ${farm.name}
                Location: ${farm.location}
                Size: ${farm.size} hectares
                Crops: ${farm.crops.map(crop => crop.name).join(', ') || 'No crops added yet'}
                Created: ${new Date(farm.createdAt).toLocaleDateString()}
                Last Updated: ${new Date(farm.updatedAt).toLocaleDateString()}`;
                return response;
            }

            // Add a new farm
            else if (level === 2 && textArray[1] === '2') {
                response = `CON Enter farm name:`;
                return response;
            }

            // Add a new farm - enter location
            else if (level === 3 && textArray[1] === '2') {
                response = `CON Enter farm location:`;
                return response;
            }

            // Add a new farm - enter size
            else if (level === 4 && textArray[1] === '2') {
                response = `CON Enter farm size (in hectares):`;
                return response;
            }

            // Add a new farm - enter main crop
            else if (level === 5 && textArray[1] === '2') {
                response = `CON Enter main crop:`;
                return response;
            }

            // Add a new farm - confirm and save
            else if (level === 6 && textArray[1] === '2') {
                const farmName = textArray[2];
                const farmLocation = textArray[3];
                const farmSize = parseFloat(textArray[4]);
                const mainCrop = textArray[5];

                if (isNaN(farmSize) || farmSize <= 0) {
                    return "END Invalid farm size. Please enter a positive number.";
                }

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

            // Update farm details
            else if (level === 2 && textArray[1] === '3') {
                if (user.farms.length === 0) {
                    response = `END You don't have any farms yet. Select 'Add a new farm' to get started.`;
                } else {
                    response = `CON Select farm to update:
                    ${user.farms.map((farm, index) => `${index + 1}. ${farm.name} (${farm.location})`).join('\n')}`;
                }
                return response;
            }

            // Update farm details - select field to update
            else if (level === 3 && textArray[1] === '3') {
                const farmIndex = parseInt(textArray[2]) - 1;
                if (isNaN(farmIndex) || farmIndex < 0 || farmIndex >= user.farms.length) {
                    return "END Invalid farm selection.";
                }

                const farm = user.farms[farmIndex];

                response = `CON Update ${farm.name}:
                1. Update farm name
                2. Update farm location
                3. Update farm size
                4. Back to farm list`;
                return response;
            }

            // Update farm name
            else if (level === 4 && textArray[1] === '3' && textArray[3] === '1') {
                const farmIndex = parseInt(textArray[2]) - 1;
                if (isNaN(farmIndex) || farmIndex < 0 || farmIndex >= user.farms.length) {
                    return "END Invalid farm selection.";
                }

                const farm = user.farms[farmIndex];

                response = `CON Current name: ${farm.name}
                Enter new farm name:`;
                return response;
            }

            // Update farm name - save
            else if (level === 5 && textArray[1] === '3' && textArray[3] === '1') {
                const farmIndex = parseInt(textArray[2]) - 1;
                if (isNaN(farmIndex) || farmIndex < 0 || farmIndex >= user.farms.length) {
                    return "END Invalid farm selection.";
                }

                const farm = user.farms[farmIndex];
                const newName = textArray[4];

                // Update the farm name in the database
                await prisma.farm.update({
                    where: { id: farm.id },
                    data: { name: newName }
                });

                response = `END Farm name has been updated from "${farm.name}" to "${newName}".`;
                return response;
            }

            // Update farm location
            else if (level === 4 && textArray[1] === '3' && textArray[3] === '2') {
                const farmIndex = parseInt(textArray[2]) - 1;
                if (isNaN(farmIndex) || farmIndex < 0 || farmIndex >= user.farms.length) {
                    return "END Invalid farm selection.";
                }

                const farm = user.farms[farmIndex];

                response = `CON Current location: ${farm.location}
                Enter new farm location:`;
                return response;
            }

            // Update farm location - save
            else if (level === 5 && textArray[1] === '3' && textArray[3] === '2') {
                const farmIndex = parseInt(textArray[2]) - 1;
                if (isNaN(farmIndex) || farmIndex < 0 || farmIndex >= user.farms.length) {
                    return "END Invalid farm selection.";
                }

                const farm = user.farms[farmIndex];
                const newLocation = textArray[4];

                // Update the farm location in the database
                await prisma.farm.update({
                    where: { id: farm.id },
                    data: { location: newLocation }
                });

                response = `END Farm location has been updated from "${farm.location}" to "${newLocation}".`;
                return response;
            }

            // Update farm size
            else if (level === 4 && textArray[1] === '3' && textArray[3] === '3') {
                const farmIndex = parseInt(textArray[2]) - 1;
                if (isNaN(farmIndex) || farmIndex < 0 || farmIndex >= user.farms.length) {
                    return "END Invalid farm selection.";
                }

                const farm = user.farms[farmIndex];

                response = `CON Current size: ${farm.size} hectares
                Enter new farm size (in hectares):`;
                return response;
            }

            // Update farm size - save
            else if (level === 5 && textArray[1] === '3' && textArray[3] === '3') {
                const farmIndex = parseInt(textArray[2]) - 1;
                if (isNaN(farmIndex) || farmIndex < 0 || farmIndex >= user.farms.length) {
                    return "END Invalid farm selection.";
                }

                const farm = user.farms[farmIndex];
                const newSize = parseFloat(textArray[4]);

                if (isNaN(newSize) || newSize <= 0) {
                    return "END Invalid farm size. Please enter a positive number.";
                }

                // Update the farm size in the database
                await prisma.farm.update({
                    where: { id: farm.id },
                    data: { size: newSize }
                });

                response = `END Farm size has been updated from "${farm.size} hectares" to "${newSize} hectares".`;
                return response;
            }

            // Delete a farm
            else if (level === 2 && textArray[1] === '4') {
                if (user.farms.length === 0) {
                    response = `END You don't have any farms yet. Select 'Add a new farm' to get started.`;
                } else {
                    response = `CON Select farm to delete:
                    ${user.farms.map((farm, index) => `${index + 1}. ${farm.name} (${farm.location})`).join('\n')}`;
                }
                return response;
            }

            // Delete a farm - confirm
            else if (level === 3 && textArray[1] === '4') {
                const farmIndex = parseInt(textArray[2]) - 1;
                if (isNaN(farmIndex) || farmIndex < 0 || farmIndex >= user.farms.length) {
                    return "END Invalid farm selection.";
                }

                const farm = user.farms[farmIndex];

                response = `CON Are you sure you want to delete "${farm.name}"?
                This will also delete all crops associated with this farm.
                
                1. Yes, delete the farm
                2. No, cancel`;
                return response;
            }

            // Delete a farm - process
            else if (level === 4 && textArray[1] === '4') {
                const farmIndex = parseInt(textArray[2]) - 1;
                if (isNaN(farmIndex) || farmIndex < 0 || farmIndex >= user.farms.length) {
                    return "END Invalid farm selection.";
                }

                const farm = user.farms[farmIndex];

                if (textArray[3] === '1') {
                    // Delete the farm from the database
                    // Note: This assumes cascading deletes are set up in the Prisma schema
                    await prisma.farm.delete({
                        where: { id: farm.id }
                    });

                    response = `END Farm "${farm.name}" has been deleted successfully.`;
                } else {
                    response = `END Farm deletion cancelled.`;
                }
                return response;
            }

            // Farm statistics
            else if (level === 2 && textArray[1] === '5') {
                if (user.farms.length === 0) {
                    response = `END You don't have any farms yet. Select 'Add a new farm' to get started.`;
                } else {
                    // Calculate total farm area
                    const totalArea = user.farms.reduce((sum, farm) => sum + (farm.size || 0), 0);

                    // Count total crops
                    let totalCrops = 0;
                    user.farms.forEach(farm => {
                        totalCrops += farm.crops.length;
                    });

                    // Get unique crop types
                    const cropTypes = new Set();
                    user.farms.forEach(farm => {
                        farm.crops.forEach(crop => {
                            cropTypes.add(crop.name);
                        });
                    });

                    response = `END Farm Statistics:
                    
                    Total Farms: ${user.farms.length}
                    Total Farm Area: ${totalArea.toFixed(2)} hectares
                    Total Crops: ${totalCrops}
                    Unique Crop Types: ${cropTypes.size}
                    
                    Most Recent Farm: ${user.farms.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0].name}`;
                }
                return response;
            }

            // Back to Main Menu
            else if (level === 2 && textArray[1] === '6') {
                // This will be handled by the main menu logic
                return "CON";
            }

            else {
                return "END Invalid option. Please try again.";
            }
        } catch (error) {
            console.error('Error in Farm Management function:', error);
            return "END An error occurred. Please try again later.";
        }
    }
}

module.exports = FarmManagement;
