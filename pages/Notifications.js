const prisma = require('../prisma/client');
const { sendWeatherAlert } = require('../util/africasTalking');

const Notifications = {
    Notify: async (textArray, phoneNumber) => {
        const level = textArray.length;
        let response = "";

        try {
            // Find the user by phone number
            const user = await prisma.user.findUnique({
                where: { phoneNumber },
                include: {
                    weatherAlerts: true,
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
                // Main notifications menu
                response = `CON Notifications:
                1. Weather alerts
                2. Crop advice notifications
                3. Market price alerts
                4. Notification settings
                5. Back to Main Menu`;
                return response;
            }

            // Weather alerts
            else if (level === 2 && textArray[1] === '1') {
                // Get recent weather alerts for the user
                if (user.weatherAlerts && user.weatherAlerts.length > 0) {
                    // Sort alerts by date (newest first)
                    const sortedAlerts = user.weatherAlerts.sort((a, b) =>
                        new Date(b.sentAt) - new Date(a.sentAt)
                    );

                    // Display the 5 most recent alerts
                    const recentAlerts = sortedAlerts.slice(0, 5);

                    response = `END Recent Weather Alerts:
                    
                    ${recentAlerts.map((alert, index) => 
                        `${index + 1}. ${alert.alertType.toUpperCase()}: ${alert.message} (${new Date(alert.sentAt).toLocaleDateString()})`
                    ).join('\n\n')}`;
                } else {
                    response = `END You have no recent weather alerts.`;
                }
                return response;
            }

            // Crop advice notifications
            else if (level === 2 && textArray[1] === '2') {
                // Get recent crop advice for the user
                const cropAdvice = await prisma.cropAdvice.findMany({
                    where: { userId: user.id },
                    include: {
                        crop: true
                    },
                    orderBy: {
                        createdAt: 'desc'
                    },
                    take: 5
                });

                if (cropAdvice && cropAdvice.length > 0) {
                    response = `END Recent Crop Advice:
                    
                    ${cropAdvice.map((advice, index) => 
                        `${index + 1}. ${advice.crop.name}: ${advice.advice} (${new Date(advice.createdAt).toLocaleDateString()})`
                    ).join('\n\n')}`;
                } else {
                    response = `END You have no recent crop advice notifications.`;
                }
                return response;
            }

            // Market price alerts
            else if (level === 2 && textArray[1] === '3') {
                // In a real application, these would be fetched from the database
                // For now, we'll use static sample data
                response = `END Market Price Alerts:
                
                1. Maize prices have increased by 5% in Lusaka (2 days ago)
                2. Tomato prices have decreased by 10% in Ndola (5 days ago)
                
                Note: This is sample data. In a real application, this would be based on your actual price alerts.`;
                return response;
            }

            // Notification settings
            else if (level === 2 && textArray[1] === '4') {
                response = `CON Notification Settings:
                1. Weather alert settings
                2. Crop advice settings
                3. Market price alert settings
                4. SMS notification preferences
                5. Back to Notifications`;
                return response;
            }

            // Weather alert settings
            else if (level === 3 && textArray[1] === '4' && textArray[2] === '1') {
                response = `CON Weather Alert Settings:
                1. Enable all weather alerts
                2. Disable all weather alerts
                3. Customize alert types
                4. Back to Settings`;
                return response;
            }

            // Customize weather alert types
            else if (level === 4 && textArray[1] === '4' && textArray[2] === '1' && textArray[3] === '3') {
                response = `CON Select weather alerts to receive:
                1. Extreme heat alerts
                2. Heavy rainfall alerts
                3. Strong wind alerts
                4. Frost alerts
                5. Drought alerts
                6. All of the above
                7. None of the above`;
                return response;
            }

            // Process weather alert type selection
            else if (level === 5 && textArray[1] === '4' && textArray[2] === '1' && textArray[3] === '3') {
                const selection = textArray[4];
                let alertTypes = [];

                switch (selection) {
                    case '1':
                        alertTypes = ['extreme_heat'];
                        break;
                    case '2':
                        alertTypes = ['heavy_rain'];
                        break;
                    case '3':
                        alertTypes = ['strong_wind'];
                        break;
                    case '4':
                        alertTypes = ['frost'];
                        break;
                    case '5':
                        alertTypes = ['drought'];
                        break;
                    case '6':
                        alertTypes = ['extreme_heat', 'heavy_rain', 'strong_wind', 'frost', 'drought'];
                        break;
                    case '7':
                        alertTypes = [];
                        break;
                    default:
                        return "END Invalid selection. Please try again.";
                }

                // In a real application, this would be stored in the database
                // For now, we'll just return a confirmation message

                if (alertTypes.length > 0) {
                    response = `END You will now receive alerts for: ${alertTypes.join(', ')}.`;
                } else {
                    response = `END You have disabled all weather alert notifications.`;
                }
                return response;
            }

            // SMS notification preferences
            else if (level === 3 && textArray[1] === '4' && textArray[2] === '4') {
                response = `CON SMS Notification Preferences:
                1. Enable all SMS notifications
                2. Disable all SMS notifications
                3. Receive only urgent alerts
                4. Back to Settings`;
                return response;
            }

            // Process SMS notification preference
            else if (level === 4 && textArray[1] === '4' && textArray[2] === '4') {
                const selection = textArray[3];
                let message = '';

                switch (selection) {
                    case '1':
                        message = 'You have enabled all SMS notifications.';
                        break;
                    case '2':
                        message = 'You have disabled all SMS notifications.';
                        break;
                    case '3':
                        message = 'You will now receive SMS notifications only for urgent alerts.';
                        break;
                    case '4':
                        // Back to settings
                        return "CON";
                    default:
                        return "END Invalid selection. Please try again.";
                }

                // In a real application, this would be stored in the database
                // For now, we'll just return a confirmation message
                response = `END ${message}`;
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
            console.error('Error in Notifications function:', error);
            return "END An error occurred. Please try again later.";
        }
    }
}

module.exports = Notifications;
