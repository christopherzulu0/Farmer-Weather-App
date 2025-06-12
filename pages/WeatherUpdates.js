const prisma = require('../prisma/client');
const { getCurrentWeather, getWeatherForecast, getAgriculturalAdvice, checkWeatherAlerts } = require('../util/weatherService');
const { sendWeatherAlert } = require('../util/africasTalking');

const WeatherUpdates = {
    Weather: async (textArray, phoneNumber) => {
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
                // Main weather menu
                response = `CON Weather Services for Farmers
1. Current Weather
2. Weather Forecast (5 days)
3. Weather Alerts
4. Crop-specific Advice
5. Back to Main Menu`;
                return response;
            }

            // Current Weather
            else if (level === 2 && textArray[1] === '1') {
                response = `CON Select location:
1. My Farm (${user.location})
2. Enter different location`;
                return response;
            }

            // Current Weather - My Farm
            else if (level === 3 && textArray[1] === '1' && textArray[2] === '1') {
                const weatherData = await getCurrentWeather(user.location);

                // Check if there are any weather alerts
                const alert = checkWeatherAlerts(weatherData);

                response = `END Current Weather for ${weatherData.location}:
- Condition: ${weatherData.description}
- Temperature: ${weatherData.temperature}°C
- Humidity: ${weatherData.humidity}%
- Wind Speed: ${weatherData.windSpeed} km/h
- Rainfall: ${weatherData.rainfall} mm

${alert ? '⚠️ ' + alert.message : ''}`;
                return response;
            }

            // Current Weather - Different Location
            else if (level === 3 && textArray[1] === '1' && textArray[2] === '2') {
                response = `CON Enter location name:`;
                return response;
            }

            // Current Weather - Process Different Location
            else if (level === 4 && textArray[1] === '1' && textArray[2] === '2') {
                const location = textArray[3];
                const weatherData = await getCurrentWeather(location);

                // Check if there are any weather alerts
                const alert = checkWeatherAlerts(weatherData);

                response = `END Current Weather for ${weatherData.location}:
- Condition: ${weatherData.description}
- Temperature: ${weatherData.temperature}°C
- Humidity: ${weatherData.humidity}%
- Wind Speed: ${weatherData.windSpeed} km/h
- Rainfall: ${weatherData.rainfall} mm

${alert ? '⚠️ ' + alert.message : ''}`;
                return response;
            }

            // Weather Forecast
            else if (level === 2 && textArray[1] === '2') {
                response = `CON Select location for forecast:
1. My Farm (${user.location})
2. Enter different location`;
                return response;
            }

            // Weather Forecast - My Farm
            else if (level === 3 && textArray[1] === '2' && textArray[2] === '1') {
                // Note: This is a placeholder. In production, implement actual forecast data
                response = `END 5-Day Weather Forecast for ${user.location}:

Today: Partly cloudy, 25°C
Tomorrow: Sunny, 27°C
Day 3: Scattered showers, 24°C
Day 4: Sunny, 26°C
Day 5: Partly cloudy, 25°C`;
                return response;
            }

            // Crop-specific Advice
            else if (level === 2 && textArray[1] === '4') {
                if (user.farms.length === 0 || user.farms[0].crops.length === 0) {
                    return "END No crops found. Please add crops to your farm first.";
                }

                // List user's crops
                response = "CON Select crop for advice:\n";
                user.farms[0].crops.forEach((crop, index) => {
                    response += `${index + 1}. ${crop.name}\n`;
                });
                return response;
            }

            // Crop-specific Advice - Selected Crop
            else if (level === 3 && textArray[1] === '4') {
                const cropIndex = parseInt(textArray[2]) - 1;

                if (isNaN(cropIndex) || cropIndex < 0 || cropIndex >= user.farms[0].crops.length) {
                    return "END Invalid crop selection.";
                }

                const crop = user.farms[0].crops[cropIndex];
                const weatherData = await getCurrentWeather(user.location);
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

            // Weather Alerts
            else if (level === 2 && textArray[1] === '3') {
                // Get recent alerts for the user's location
                const weatherData = await getCurrentWeather(user.location);
                const alert = checkWeatherAlerts(weatherData);

                if (alert) {
                    // Store the alert in the database
                    await prisma.weatherAlert.create({
                        data: {
                            userId: user.id,
                            message: alert.message,
                            alertType: alert.alertType
                        }
                    });

                    response = `CON Weather Alert for ${user.location}:

${alert.message}

Would you like to receive SMS alerts?
1. Yes
2. No`;
                } else {
                    response = `END No weather alerts for ${user.location} at this time.`;
                }
                return response;
            }

            // Weather Alerts - SMS Confirmation
            else if (level === 3 && textArray[1] === '3' && textArray[2] === '1') {
                const weatherData = await getCurrentWeather(user.location);
                const alert = checkWeatherAlerts(weatherData);

                if (alert) {
                    // Send SMS alert
                    await sendWeatherAlert(phoneNumber, alert.message);
                    response = `END Weather alert has been sent to your phone.`;
                } else {
                    response = `END No weather alerts to send at this time.`;
                }
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
            console.error('Error in Weather function:', error);

            // Provide more specific error messages based on the type of error
            if (error.message && error.message.includes('API key')) {
                return "END Weather service API key error. Please contact the administrator to configure a valid API key.";
            } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
                return "END Unable to connect to weather service. Please try again later.";
            } else if (error.response && error.response.status === 404) {
                return "END Location not found. Please check the location name and try again.";
            } else if (error.message && error.message.includes("ngrok")) {
                return "END Weather service is temporarily unavailable. Please try again later.";
            } else if (error.message && error.message.includes("timeout")) {
                return "END Weather service request timed out. Please try again later.";
            }

            return "END An error occurred while fetching weather data. Please try again later.";
        }
    }
}

module.exports = WeatherUpdates;
