const prisma = require('../prisma/client');
const { sendWeatherAlert, sendBulkWeatherAlerts } = require('../util/africasTalking');
const { getCurrentWeather, checkWeatherAlerts } = require('../util/weatherService');

const Dashboard = {
    Admin: async (textArray, phoneNumber) => {
        const level = textArray.length;
        let response = "";

        try {
            // Get user details with Prisma
            const user = await prisma.user.findUnique({
                where: { phoneNumber: phoneNumber }
            });

            if (!user) {
                return "END User not found or you don't have admin privileges.";
            }

            if (user.role !== 'Admin') {
                return "END You don't have admin privileges to access this section.";
            }

            const name = user.name;

            console.log("Admin Name:", name);

            if (level === 1) {
                response = `CON 
                Welcome to your Admin Dashboard, ${name}!

                1. View All Farmers
                2. Send Weather Alerts
                3. Manage Crop Database
                4. View Farm Statistics
                5. System Reports
                6. Manage Agricultural Officers
                `;
                return response;
            }

            // View All Farmers
            else if (level === 2 && textArray[1] === '1') {
                // Get all farmers from the database
                const farmers = await prisma.user.findMany({
                    where: { role: 'Farmer' },
                    take: 10, // Limit to 10 farmers for USSD display
                    orderBy: { createdAt: 'desc' }
                });

                if (farmers.length === 0) {
                    response = `END No farmers registered in the system yet.`;
                } else {
                    response = `CON Recent Farmers (${farmers.length}):
                    ${farmers.map((farmer, index) => 
                        `${index + 1}. ${farmer.name} - ${farmer.location} - ${farmer.phoneNumber}`
                    ).join('\n')}

                    Enter farmer number for details or 0 to go back:`;
                }
                return response;
            }

            // View Farmer Details
            else if (level === 3 && textArray[1] === '1' && textArray[2] !== '0') {
                const farmerIndex = parseInt(textArray[2]) - 1;

                // Get all farmers again (not efficient but works for USSD)
                const farmers = await prisma.user.findMany({
                    where: { role: 'Farmer' },
                    take: 10,
                    orderBy: { createdAt: 'desc' }
                });

                if (isNaN(farmerIndex) || farmerIndex < 0 || farmerIndex >= farmers.length) {
                    return "END Invalid farmer selection.";
                }

                const selectedFarmer = farmers[farmerIndex];

                // Get farmer's farms and crops
                const farmerWithFarms = await prisma.user.findUnique({
                    where: { id: selectedFarmer.id },
                    include: {
                        farms: {
                            include: {
                                crops: true
                            }
                        }
                    }
                });

                response = `END Farmer Details:

                Name: ${farmerWithFarms.name}
                Phone: ${farmerWithFarms.phoneNumber}
                Location: ${farmerWithFarms.location}
                Farms: ${farmerWithFarms.farms.length}
                Crops: ${farmerWithFarms.farms.reduce((total, farm) => total + farm.crops.length, 0)}
                Registered: ${new Date(farmerWithFarms.createdAt).toLocaleDateString()}`;

                return response;
            }

            // Send Weather Alerts
            else if (level === 2 && textArray[1] === '2') {
                response = `CON Send Weather Alerts:
                1. Send alert to all farmers
                2. Send alert to farmers in specific region
                3. Send custom alert
                4. Back to Admin Menu`;
                return response;
            }

            // Send alert to all farmers
            else if (level === 3 && textArray[1] === '2' && textArray[2] === '1') {
                response = `CON Select alert type:
                1. Extreme weather warning
                2. Rainfall forecast
                3. Drought alert
                4. Frost warning
                5. Custom message`;
                return response;
            }

            // Send specific alert type to all farmers
            else if (level === 4 && textArray[1] === '2' && textArray[2] === '1') {
                const alertType = textArray[3];
                let alertMessage = "";

                switch (alertType) {
                    case '1':
                        alertMessage = "EXTREME WEATHER WARNING: Strong winds and heavy rainfall expected in the next 24 hours. Secure farm structures and livestock.";
                        break;
                    case '2':
                        alertMessage = "RAINFALL FORECAST: Moderate to heavy rainfall expected over the next 3 days. Good time for planting drought-sensitive crops.";
                        break;
                    case '3':
                        alertMessage = "DROUGHT ALERT: Dry conditions expected to continue. Conserve water and prioritize irrigation for critical crops.";
                        break;
                    case '4':
                        alertMessage = "FROST WARNING: Temperatures expected to drop below freezing tonight. Protect sensitive crops and seedlings.";
                        break;
                    case '5':
                        response = `CON Enter your custom alert message:`;
                        return response;
                    default:
                        return "END Invalid alert type selection.";
                }

                if (alertType !== '5') {
                    response = `CON You are about to send the following alert to ALL farmers:

                    "${alertMessage}"

                    1. Confirm and send
                    2. Cancel`;
                }
                return response;
            }

            // Send custom message to all farmers
            else if (level === 5 && textArray[1] === '2' && textArray[2] === '1' && textArray[3] === '5') {
                const customMessage = textArray[4];

                response = `CON You are about to send the following custom alert to ALL farmers:

                "${customMessage}"

                1. Confirm and send
                2. Cancel`;
                return response;
            }

            // Confirm sending alert to all farmers
            else if ((level === 5 && textArray[1] === '2' && textArray[2] === '1' && textArray[3] !== '5' && textArray[4] === '1') ||
                     (level === 6 && textArray[1] === '2' && textArray[2] === '1' && textArray[3] === '5' && textArray[5] === '1')) {

                let alertMessage;
                if (textArray[3] === '5') {
                    // Custom message
                    alertMessage = textArray[4];
                } else {
                    // Predefined message
                    switch (textArray[3]) {
                        case '1':
                            alertMessage = "EXTREME WEATHER WARNING: Strong winds and heavy rainfall expected in the next 24 hours. Secure farm structures and livestock.";
                            break;
                        case '2':
                            alertMessage = "RAINFALL FORECAST: Moderate to heavy rainfall expected over the next 3 days. Good time for planting drought-sensitive crops.";
                            break;
                        case '3':
                            alertMessage = "DROUGHT ALERT: Dry conditions expected to continue. Conserve water and prioritize irrigation for critical crops.";
                            break;
                        case '4':
                            alertMessage = "FROST WARNING: Temperatures expected to drop below freezing tonight. Protect sensitive crops and seedlings.";
                            break;
                    }
                }

                try {
                    // Get all farmers' phone numbers
                    const farmers = await prisma.user.findMany({
                        where: { role: 'Farmer' },
                        select: { id: true, phoneNumber: true }
                    });

                    const phoneNumbers = farmers.map(farmer => farmer.phoneNumber);

                    if (phoneNumbers.length === 0) {
                        return "END No farmers registered to send alerts to.";
                    }

                    // Send bulk SMS
                    await sendBulkWeatherAlerts(phoneNumbers, alertMessage);

                    // Store the alert in the database for each farmer
                    for (const farmer of farmers) {
                        await prisma.weatherAlert.create({
                            data: {
                                userId: farmer.id,
                                message: alertMessage,
                                alertType: 'admin_alert'
                            }
                        });
                    }

                    response = `END Alert successfully sent to ${phoneNumbers.length} farmers.`;
                } catch (error) {
                    console.error('Error sending bulk alerts:', error);
                    response = `END Failed to send alerts. Error: ${error.message}`;
                }

                return response;
            }

            // Manage Crop Database
            else if (level === 2 && textArray[1] === '3') {
                response = `CON Manage Crop Database:
                1. View all crops
                2. Add new crop type
                3. Update crop information
                4. Back to Admin Menu`;
                return response;
            }

            // View Farm Statistics
            else if (level === 2 && textArray[1] === '4') {
                try {
                    // Get system statistics
                    const farmerCount = await prisma.user.count({
                        where: { role: 'Farmer' }
                    });

                    const farmCount = await prisma.farm.count();

                    const cropCount = await prisma.crop.count();

                    const alertCount = await prisma.weatherAlert.count();

                    // Get most common crops
                    const crops = await prisma.crop.groupBy({
                        by: ['name'],
                        _count: {
                            name: true
                        },
                        orderBy: {
                            _count: {
                                name: 'desc'
                            }
                        },
                        take: 3
                    });

                    const topCrops = crops.map(c => `${c.name} (${c._count.name})`).join(', ');

                    response = `END System Statistics:

                    Total Farmers: ${farmerCount}
                    Total Farms: ${farmCount}
                    Total Crops: ${cropCount}
                    Weather Alerts Sent: ${alertCount}

                    Top Crops: ${topCrops || 'No crops registered yet'}

                    Last Updated: ${new Date().toLocaleString()}`;
                } catch (error) {
                    console.error('Error fetching statistics:', error);
                    response = `END Error fetching statistics: ${error.message}`;
                }

                return response;
            }

            // Default response for unhandled options
            else {
                return "END This feature is coming soon. Please check back later.";
            }

        } catch (error) {
            console.error('Error in Admin function:', error);
            return "END An error occurred. Please try again later.";
        }
      }

}

module.exports = Dashboard;
