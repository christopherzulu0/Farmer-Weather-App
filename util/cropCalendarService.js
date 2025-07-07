/**
 * Crop Calendar Service
 *
 * This service provides functionality for determining optimal planting and harvesting dates
 * for various crops based on their type, location, and weather conditions.
 *
 * This version uses OpenAI API to provide AI-powered crop recommendations and advice
 * instead of static data.
 */

const prisma = require('../prisma/client');
const { getCurrentWeather, getWeatherForecast } = require('./weatherService');
const dotenv = require('dotenv');

dotenv.config();

// Initialize OpenAI API client
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
let openai;
let OpenAI;

// Try to load the OpenAI module, but don't crash if it's not available
try {
    const openaiModule = require('openai');
    OpenAI = openaiModule.OpenAI;
} catch (error) {
    console.error('Error loading OpenAI module:', error.message);
    console.warn('OpenAI module is not available. Please install it using "npm install openai"');
    console.warn('AI-powered crop recommendations will not be available until the module is installed.');
    // Continue without OpenAI - the code will use fallback methods
}

try {
    if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key_here') {
        console.warn('OpenAI API key is not configured. AI-powered crop recommendations will not be available.');
        console.warn('Get your API key from https://platform.openai.com/api-keys');
        console.warn('Add it to your .env file as OPENAI_API_KEY=your_key_here');
    } else {
        openai = new OpenAI({
            apiKey: OPENAI_API_KEY
        });
    }
} catch (error) {
    console.error('Error initializing OpenAI client:', error);
}

// Fallback database for when AI is not available
const fallbackCropDatabase = {
    // Default for unknown crops or when AI is unavailable
    'default': {
        growingPeriod: { min: 90, max: 120 },
        optimalTemp: { min: 18, max: 30 },
        waterRequirement: { min: 500, max: 800 },
        plantingSeasons: [
            { name: 'Rainy season', startMonth: 10, endMonth: 12 } // Oct-Dec
        ]
    },
    // Common crops with basic data
    'maize': {
        growingPeriod: { min: 90, max: 120 },
        optimalTemp: { min: 18, max: 30 },
        waterRequirement: { min: 500, max: 800 },
        plantingSeasons: [
            { name: 'Early season', startMonth: 9, endMonth: 11 }, // Sep-Nov
            { name: 'Late season', startMonth: 1, endMonth: 3 }    // Jan-Mar
        ]
    },
    'rice': {
        growingPeriod: { min: 100, max: 150 },
        optimalTemp: { min: 20, max: 35 },
        waterRequirement: { min: 1000, max: 1500 },
        plantingSeasons: [
            { name: 'Rainy season', startMonth: 11, endMonth: 2 }  // Nov-Feb
        ]
    },
    'beans': {
        growingPeriod: { min: 60, max: 90 },
        optimalTemp: { min: 15, max: 25 },
        waterRequirement: { min: 300, max: 500 },
        plantingSeasons: [
            { name: 'Early season', startMonth: 9, endMonth: 11 }, // Sep-Nov
            { name: 'Late season', startMonth: 2, endMonth: 4 }    // Feb-Apr
        ]
    },
    'sorghum': {
        growingPeriod: { min: 100, max: 130 },
        optimalTemp: { min: 20, max: 35 },
        waterRequirement: { min: 400, max: 600 },
        plantingSeasons: [
            { name: 'Rainy season', startMonth: 10, endMonth: 12 } // Oct-Dec
        ]
    }
};

/**
 * Get crop information using AI or fallback to static data
 * @param {string} cropName - The name of the crop
 * @returns {Promise<Object>} - Crop information
 */
async function getCropInfo(cropName) {
    try {
        // Check if OpenAI is available
        if (!openai) {
            console.warn('OpenAI client not available. Using fallback data for crop information.');
            const cropKey = cropName.toLowerCase();
            const fallbackData = fallbackCropDatabase[cropKey] || fallbackCropDatabase.default;
            return { ...fallbackData, name: cropKey };
        }

        // Check if we recently hit a rate limit (within last 5 minutes)
        if (global.lastRateLimit && (Date.now() - global.lastRateLimit) < 300000) {
            console.warn('OpenAI rate limit recently hit. Using cached data or fallback.');
            // Try to get from database cache first
            try {
                const cachedInfo = await prisma.cropInfo.findUnique({
                    where: { name: cropName.toLowerCase() }
                });

                if (cachedInfo) {
                    console.log(`Using cached crop info for ${cropName} (rate limit active)`);
                    return JSON.parse(cachedInfo.data);
                }
            } catch (dbError) {
                console.warn('Could not retrieve crop info from database:', dbError.message);
            }

            // Fall back to default values
            console.log(`Using fallback data for ${cropName} (rate limit active)`);
            const cropKey = cropName.toLowerCase();
            const fallbackData = fallbackCropDatabase[cropKey] || fallbackCropDatabase.default;
            return { ...fallbackData, name: cropKey };
        }

        // Use OpenAI to get crop information
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are an agricultural expert assistant. Provide accurate information about crops in JSON format."
                },
                {
                    role: "user",
                    content: `Provide detailed growing information for ${cropName} including:
                    1. Growing period (minimum and maximum days)
                    2. Optimal temperature range (minimum and maximum in Celsius)
                    3. Water requirements (minimum and maximum in mm per growing season)
                    4. Planting seasons (name, start month number, end month number)

                    Format your response as a valid JSON object with the following structure:
                    {
                        "growingPeriod": { "min": number, "max": number },
                        "optimalTemp": { "min": number, "max": number },
                        "waterRequirement": { "min": number, "max": number },
                        "plantingSeasons": [
                            { "name": "string", "startMonth": number, "endMonth": number }
                        ]
                    }

                    Do not include any explanations or text outside the JSON object.`
                }
            ],
            temperature: 0.7,
            max_tokens: 500
        });

        // Parse the response
        const content = response.choices[0].message.content.trim();
        let cropInfo;

        try {
            // Extract JSON from the response (in case there's any text around it)
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                cropInfo = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error("No valid JSON found in response");
            }

            // Add the crop name to the info
            cropInfo.name = cropName.toLowerCase();

            // Store this information in the database for future use
            // This helps reduce API calls and provides a cache
            try {
                await prisma.cropInfo.upsert({
                    where: { name: cropName.toLowerCase() },
                    update: {
                        data: JSON.stringify(cropInfo),
                        updatedAt: new Date()
                    },
                    create: {
                        name: cropName.toLowerCase(),
                        data: JSON.stringify(cropInfo),
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }
                });
            } catch (dbError) {
                console.warn('Could not store crop info in database:', dbError.message);
                // Continue even if database storage fails
            }

            return cropInfo;
        } catch (parseError) {
            console.error('Error parsing AI response:', parseError);
            console.error('Raw response:', content);
            throw new Error(`Failed to parse AI response: ${parseError.message}`);
        }
    } catch (error) {
        console.error(`Error getting crop information for ${cropName}:`, error);

        // Check if it's a rate limit error
        if (error.message && error.message.includes('RateLimitError')) {
            console.warn(`OpenAI rate limit reached for ${cropName}. Using cached data or fallback.`);
            global.lastRateLimit = Date.now(); // Track rate limit
        }

        // Try to get from database cache first
        try {
            const cachedInfo = await prisma.cropInfo.findUnique({
                where: { name: cropName.toLowerCase() }
            });

            if (cachedInfo) {
                console.log(`Using cached crop info for ${cropName}`);
                return JSON.parse(cachedInfo.data);
            }
        } catch (dbError) {
            console.warn('Could not retrieve crop info from database:', dbError.message);
        }

        // Fall back to default values if all else fails
        console.log(`Using fallback data for ${cropName}`);
        const cropKey = cropName.toLowerCase();
        const fallbackData = fallbackCropDatabase[cropKey] || fallbackCropDatabase.default;
        return { ...fallbackData, name: cropKey };
    }
}

/**
 * Calculate optimal planting window based on crop type and location
 * @param {string} cropName - The name of the crop
 * @param {string} location - The location for planting
 * @returns {Promise<Object>} - Optimal planting window information
 */
async function getOptimalPlantingWindow(cropName, location) {
    try {
        // Get crop information
        const cropInfo = getCropInfo(cropName);

        // Get current weather and forecast for the location
        const currentWeather = await getCurrentWeather(location);
        const forecast = await getWeatherForecast(location);

        // Get current date
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed

        // Find the next planting season
        let nextSeason = null;
        for (const season of cropInfo.plantingSeasons) {
            // If current month is before or within the planting season
            if (currentMonth <= season.endMonth) {
                nextSeason = season;
                break;
            }
        }

        // If no upcoming season found this year, use the first season for next year
        if (!nextSeason) {
            nextSeason = cropInfo.plantingSeasons[0];
        }

        // Calculate start and end dates for the planting window
        const year = currentMonth > nextSeason.endMonth ?
            currentDate.getFullYear() + 1 : currentDate.getFullYear();

        const startDate = new Date(year, nextSeason.startMonth - 1, 1);
        const endDate = new Date(year, nextSeason.endMonth - 1,
            new Date(year, nextSeason.endMonth, 0).getDate()); // Last day of end month

        // Calculate expected harvest date range (based on growing period)
        const minHarvestDate = new Date(startDate);
        minHarvestDate.setDate(minHarvestDate.getDate() + cropInfo.growingPeriod.min);

        const maxHarvestDate = new Date(endDate);
        maxHarvestDate.setDate(maxHarvestDate.getDate() + cropInfo.growingPeriod.max);

        // Adjust planting window based on current weather conditions
        let adjustedWindow = { startDate, endDate };

        // If current temperature is outside optimal range, adjust planting window
        if (currentWeather.temperature < cropInfo.optimalTemp.min) {
            // Too cold, delay planting
            adjustedWindow.startDate.setDate(adjustedWindow.startDate.getDate() + 14); // Delay by 2 weeks
        } else if (currentWeather.temperature > cropInfo.optimalTemp.max) {
            // Too hot, suggest earlier planting if possible or delay until cooler
            if (currentDate < startDate) {
                adjustedWindow.endDate.setDate(adjustedWindow.endDate.getDate() - 14); // End window earlier
            } else {
                adjustedWindow.startDate.setDate(adjustedWindow.startDate.getDate() + 30); // Delay by a month
            }
        }

        return {
            cropName,
            cropInfo,
            season: nextSeason.name,
            plantingWindow: {
                start: adjustedWindow.startDate,
                end: adjustedWindow.endDate
            },
            harvestWindow: {
                earliest: minHarvestDate,
                latest: maxHarvestDate
            },
            weatherConditions: {
                current: currentWeather,
                forecast: forecast
            }
        };
    } catch (error) {
        console.error('Error calculating optimal planting window:', error);
        throw new Error(`Failed to calculate planting window: ${error.message}`);
    }
}

/**
 * Get planting advice based on crop and location using AI
 * @param {string} cropName - The name of the crop
 * @param {string} location - The location for planting
 * @returns {Promise<string>} - Planting advice
 */
async function getPlantingAdvice(cropName, location) {
    try {
        // Get crop information and weather data
        const cropInfo = await getCropInfo(cropName);
        const currentWeather = await getCurrentWeather(location);
        const forecast = await getWeatherForecast(location);

        // Check if OpenAI is available for generating personalized advice
        if (!openai) {
            // Fallback to traditional method if AI is not available
            return generateTraditionalPlantingAdvice(cropName, location, cropInfo, currentWeather);
        }

        // Format weather data for the AI
        const weatherSummary = {
            current: {
                temperature: currentWeather.temperature,
                humidity: currentWeather.humidity,
                description: currentWeather.description,
                windSpeed: currentWeather.windSpeed,
                rainfall: currentWeather.rainfall
            },
            forecast: forecast.map(day => ({
                date: day.date.toISOString().split('T')[0],
                minTemp: day.minTemperature,
                maxTemp: day.maxTemperature,
                description: day.dayDescription,
                rainfall: day.rainfall
            })).slice(0, 3) // Just include next 3 days
        };

        // Current date information
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1; // 1-12

        // Use OpenAI to generate personalized planting advice
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are an agricultural expert assistant providing personalized planting advice to farmers. Your advice should be practical, specific, and based on the crop, location, and current weather conditions."
                },
                {
                    role: "user",
                    content: `Generate detailed planting advice for ${cropName} in ${location}.

                    Current date: ${currentDate.toISOString().split('T')[0]}
                    Current month: ${currentMonth}

                    Crop information:
                    ${JSON.stringify(cropInfo, null, 2)}

                    Weather conditions:
                    ${JSON.stringify(weatherSummary, null, 2)}

                    Include in your advice:
                    1. Whether now is a good time to plant this crop based on the season and current weather
                    2. Specific planting recommendations considering the current conditions
                    3. Expected planting and harvest dates
                    4. Any precautions needed due to current or forecasted weather
                    5. Soil preparation advice
                    6. Watering recommendations

                    Format the advice in plain text, suitable for display on a mobile phone via USSD.
                    Keep your response under 500 characters if possible, with the most important information first.
                    Start with "Planting advice for [crop] in [location]:" and organize the rest in short paragraphs.`
                }
            ],
            temperature: 0.7,
            max_tokens: 500
        });

        // Get the advice from the response
        const advice = response.choices[0].message.content.trim();

        // Store the advice in the database if possible
        try {
            // Find any existing crops with this name
            const crops = await prisma.crop.findMany({
                where: {
                    name: {
                        contains: cropName,
                        mode: 'insensitive'
                    }
                },
                take: 1
            });

            if (crops.length > 0) {
                // Store the advice for the first matching crop
                await prisma.cropAdvice.create({
                    data: {
                        cropId: crops[0].id,
                        userId: 1, // Default user ID for system-generated advice
                        advice: advice,
                        weatherCondition: currentWeather.description
                    }
                });
            }
        } catch (dbError) {
            console.warn('Could not store crop advice in database:', dbError.message);
            // Continue even if database storage fails
        }

        return advice;
    } catch (error) {
        console.error('Error generating AI planting advice:', error);

        // Fall back to traditional method if AI fails
        try {
            const cropInfo = await getCropInfo(cropName);
            const currentWeather = await getCurrentWeather(location);
            return generateTraditionalPlantingAdvice(cropName, location, cropInfo, currentWeather);
        } catch (fallbackError) {
            console.error('Fallback advice generation also failed:', fallbackError);
            return `Unable to generate planting advice for ${cropName} in ${location}. Please try again later.`;
        }
    }
}

/**
 * Generate traditional planting advice without AI
 * @param {string} cropName - The name of the crop
 * @param {string} location - The location for planting
 * @param {Object} cropInfo - Crop information
 * @param {Object} currentWeather - Current weather data
 * @returns {string} - Planting advice
 */
function generateTraditionalPlantingAdvice(cropName, location, cropInfo, currentWeather) {
    try {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1; // 1-12

        // Format dates for display
        const formatDate = (date) => {
            return date.toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        };

        // Find the next planting season
        let nextSeason = null;
        for (const season of cropInfo.plantingSeasons) {
            // If current month is before or within the planting season
            if (currentMonth <= season.endMonth) {
                nextSeason = season;
                break;
            }
        }

        // If no upcoming season found this year, use the first season for next year
        if (!nextSeason) {
            nextSeason = cropInfo.plantingSeasons[0];
        }

        // Calculate start and end dates for the planting window
        const year = currentMonth > nextSeason.endMonth ?
            currentDate.getFullYear() + 1 : currentDate.getFullYear();

        const startDate = new Date(year, nextSeason.startMonth - 1, 1);
        const endDate = new Date(year, nextSeason.endMonth - 1,
            new Date(year, nextSeason.endMonth, 0).getDate()); // Last day of end month

        // Calculate expected harvest date range
        const minHarvestDate = new Date(startDate);
        minHarvestDate.setDate(minHarvestDate.getDate() + cropInfo.growingPeriod.min);

        const maxHarvestDate = new Date(endDate);
        maxHarvestDate.setDate(maxHarvestDate.getDate() + cropInfo.growingPeriod.max);

        let advice = `Planting advice for ${cropName} in ${location}:\n\n`;

        // Add season information
        advice += `Recommended planting season: ${nextSeason.name}\n`;
        advice += `Optimal planting window: ${formatDate(startDate)} to ${formatDate(endDate)}\n`;
        advice += `Expected harvest window: ${formatDate(minHarvestDate)} to ${formatDate(maxHarvestDate)}\n\n`;

        // Add current status
        if (currentDate < startDate) {
            const daysToWait = Math.ceil((startDate - currentDate) / (1000 * 60 * 60 * 24));
            advice += `It's too early to plant ${cropName} now. Wait approximately ${daysToWait} days before planting.\n`;
        } else if (currentDate > endDate) {
            advice += `The optimal planting window for ${cropName} has passed. Consider planting in the next season.\n`;
        } else {
            advice += `Now is a good time to plant ${cropName}!\n`;
        }

        // Add weather-specific advice
        if (currentWeather.temperature < cropInfo.optimalTemp.min) {
            advice += `Current temperature (${currentWeather.temperature}°C) is below optimal range for ${cropName}. Consider waiting for warmer conditions.\n`;
        } else if (currentWeather.temperature > cropInfo.optimalTemp.max) {
            advice += `Current temperature (${currentWeather.temperature}°C) is above optimal range for ${cropName}. Consider providing shade or waiting for cooler conditions.\n`;
        } else {
            advice += `Current temperature (${currentWeather.temperature}°C) is within optimal range for ${cropName}.\n`;
        }

        // Rainfall advice
        if (currentWeather.rainfall > 10) {
            advice += `Recent rainfall is high. Ensure proper drainage for planting ${cropName}.\n`;
        } else if (currentWeather.rainfall < 2 && currentWeather.humidity < 50) {
            advice += `Conditions are dry. Ensure adequate irrigation after planting ${cropName}.\n`;
        }

        return advice;
    } catch (error) {
        console.error('Error generating traditional planting advice:', error);
        return `Basic planting advice for ${cropName}: Plant during the appropriate season for your region, ensuring adequate water and proper soil conditions.`;
    }
}

/**
 * Get a list of recommended crops for the current season and location using AI
 * @param {string} location - The location for planting
 * @returns {Promise<Array>} - List of recommended crops with planting windows
 */
async function getRecommendedCrops(location) {
    try {
        // Get current weather for the location
        const currentWeather = await getCurrentWeather(location);
        const forecast = await getWeatherForecast(location);

        // Get current date and month
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1; // 1-12

        // Check if OpenAI is available
        if (!openai) {
            console.warn('OpenAI client not available. Using traditional method for crop recommendations.');
            return getTraditionalRecommendedCrops(location, currentWeather, currentDate);
        }

        // Format weather data for the AI
        const weatherSummary = {
            current: {
                temperature: currentWeather.temperature,
                humidity: currentWeather.humidity,
                description: currentWeather.description,
                windSpeed: currentWeather.windSpeed,
                rainfall: currentWeather.rainfall,
                date: currentDate.toISOString().split('T')[0],
                month: currentMonth
            },
            forecast: forecast.map(day => ({
                date: day.date.toISOString().split('T')[0],
                minTemp: day.minTemperature,
                maxTemp: day.maxTemperature,
                description: day.dayDescription,
                rainfall: day.rainfall
            })).slice(0, 3) // Just include next 3 days
        };

        // Check if we recently hit a rate limit (within last 5 minutes)
        if (global.lastRateLimit && (Date.now() - global.lastRateLimit) < 300000) {
            console.warn('OpenAI rate limit recently hit. Using traditional crop recommendations.');
            const currentWeather = await getCurrentWeather(location);
            const currentDate = new Date();
            return getTraditionalRecommendedCrops(location, currentWeather, currentDate);
        }

        // Use OpenAI to get recommended crops
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are an agricultural expert assistant. Provide accurate crop recommendations based on location and weather conditions. Your recommendations should be in JSON format."
                },
                {
                    role: "user",
                    content: `Recommend 5 suitable crops for planting in ${location} based on the current weather conditions and season.

                    Current date: ${currentDate.toISOString().split('T')[0]}
                    Current month: ${currentMonth}

                    Weather conditions:
                    ${JSON.stringify(weatherSummary, null, 2)}

                    For each recommended crop, provide:
                    1. Crop name
                    2. Season name (e.g., "Rainy season", "Cool season")
                    3. Planting window (start and end dates)
                    4. Suitability rating (Optimal or Acceptable)
                    5. Growing period in days (min-max)

                    Format your response as a valid JSON array with the following structure:
                    [
                      {
                        "name": "crop name",
                        "season": "season name",
                        "plantingWindow": {
                          "start": "YYYY-MM-DD",
                          "end": "YYYY-MM-DD"
                        },
                        "suitability": "Optimal or Acceptable",
                        "growingPeriod": "min-max days"
                      },
                      ...
                    ]

                    Do not include any explanations or text outside the JSON array.`
                }
            ],
            temperature: 0.7,
            max_tokens: 1000
        });

        // Parse the response
        const content = response.choices[0].message.content.trim();
        let recommendedCrops;

        try {
            // Extract JSON from the response (in case there's any text around it)
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const cropArray = JSON.parse(jsonMatch[0]);

                // Convert string dates to Date objects
                recommendedCrops = cropArray.map(crop => ({
                    ...crop,
                    plantingWindow: {
                        start: new Date(crop.plantingWindow.start),
                        end: new Date(crop.plantingWindow.end)
                    }
                }));
            } else {
                throw new Error("No valid JSON array found in response");
            }

            return recommendedCrops;
        } catch (parseError) {
            console.error('Error parsing AI crop recommendations:', parseError);
            console.error('Raw response:', content);
            throw new Error(`Failed to parse AI crop recommendations: ${parseError.message}`);
        }
    } catch (error) {
        console.error('Error getting AI crop recommendations:', error);

        // Check if it's a rate limit error
        if (error.message && error.message.includes('RateLimitError')) {
            console.warn('OpenAI rate limit reached for crop recommendations. Using traditional method.');
            global.lastRateLimit = Date.now(); // Track rate limit
        }

        // Fall back to traditional method
        try {
            const currentWeather = await getCurrentWeather(location);
            const currentDate = new Date();
            console.log('Using traditional crop recommendations due to AI unavailability');
            return getTraditionalRecommendedCrops(location, currentWeather, currentDate);
        } catch (fallbackError) {
            console.error('Traditional crop recommendation method also failed:', fallbackError);
            return [];
        }
    }
}

/**
 * Get recommended crops using traditional method (fallback when AI is unavailable)
 * @param {string} location - The location for planting
 * @param {Object} currentWeather - Current weather data
 * @param {Date} currentDate - Current date
 * @returns {Array} - List of recommended crops
 */
async function getTraditionalRecommendedCrops(location, currentWeather, currentDate) {
    try {
        // Common crops that might be suitable for various conditions
        const commonCrops = [
            'maize', 'rice', 'wheat', 'tomato', 'cabbage', 'onion',
            'beans', 'groundnuts', 'cotton', 'tobacco', 'potato', 'soybean'
        ];

        const currentMonth = currentDate.getMonth() + 1; // 1-12
        const recommendedCrops = [];

        // Get crop info for each common crop and check suitability
        for (const cropName of commonCrops) {
            try {
                const cropInfo = await getCropInfo(cropName);

                // Check if any planting season includes the current month
                const suitableSeason = cropInfo.plantingSeasons.find(season => {
                    // Handle seasons that span across year boundary (e.g., Nov-Feb)
                    if (season.startMonth > season.endMonth) {
                        return currentMonth >= season.startMonth || currentMonth <= season.endMonth;
                    }
                    return currentMonth >= season.startMonth && currentMonth <= season.endMonth;
                });

                if (suitableSeason) {
                    // Check if current temperature is within acceptable range
                    const tempSuitable = currentWeather.temperature >= cropInfo.optimalTemp.min - 5 &&
                                        currentWeather.temperature <= cropInfo.optimalTemp.max + 5;

                    if (tempSuitable) {
                        // Calculate planting window for this crop
                        const year = currentDate.getFullYear();
                        let startMonth = suitableSeason.startMonth - 1; // Convert to 0-indexed
                        let endMonth = suitableSeason.endMonth - 1;
                        let startYear = year;
                        let endYear = year;

                        // Handle seasons that span across year boundary
                        if (suitableSeason.startMonth > suitableSeason.endMonth) {
                            if (currentMonth < suitableSeason.endMonth) {
                                startYear = year - 1;
                            } else {
                                endYear = year + 1;
                            }
                        }

                        const startDate = new Date(startYear, startMonth, 1);
                        const endDate = new Date(endYear, endMonth,
                            new Date(endYear, endMonth + 1, 0).getDate()); // Last day of end month

                        recommendedCrops.push({
                            name: cropName,
                            season: suitableSeason.name,
                            plantingWindow: {
                                start: startDate,
                                end: endDate
                            },
                            suitability: tempSuitable ? 'Optimal' : 'Acceptable',
                            growingPeriod: `${cropInfo.growingPeriod.min}-${cropInfo.growingPeriod.max} days`
                        });
                    }
                }
            } catch (cropError) {
                console.warn(`Error processing crop ${cropName}:`, cropError);
                // Continue with next crop
            }
        }

        return recommendedCrops;
    } catch (error) {
        console.error('Error in traditional crop recommendations:', error);
        return [];
    }
}

module.exports = {
    getCropInfo,
    getOptimalPlantingWindow,
    getPlantingAdvice,
    getRecommendedCrops
};
