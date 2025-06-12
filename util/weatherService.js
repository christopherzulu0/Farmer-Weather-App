const axios = require('axios');
const prisma = require('../prisma/client');
const dotenv = require('dotenv');

dotenv.config();

const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

// Check if API key is set and not the placeholder
if (!WEATHER_API_KEY || WEATHER_API_KEY === 'YOUR_ACCUWEATHER_API_KEY' || WEATHER_API_KEY === 'YOUR_WEATHERSTACK_API_KEY') {
  console.error('AccuWeather API key is not configured. Please set a valid API key in the .env file.');
  console.error('Get a free API key from https://developer.accuweather.com/');
}

/**
 * Fetch current weather data for a location
 * @param {string} location - The location to get weather for
 * @returns {Promise<Object>} - Weather data object
 */
async function getCurrentWeather(location) {
  try {
    // Check if API key is set and not the placeholder
    if (!WEATHER_API_KEY || WEATHER_API_KEY === 'YOUR_ACCUWEATHER_API_KEY' || WEATHER_API_KEY === 'YOUR_WEATHERSTACK_API_KEY') {
      throw new Error('AccuWeather API key is not configured. Please set a valid API key in the .env file.');
    }

    // Step 1: Get location key from AccuWeather API
    const locationUrl = `https://dataservice.accuweather.com/locations/v1/search?apikey=${WEATHER_API_KEY}&q=${encodeURIComponent(location)}`;
    const locationResponse = await axios.get(locationUrl);

    if (!locationResponse.data || locationResponse.data.length === 0) {
      throw new Error(`Location not found: ${location}`);
    }

    const locationKey = locationResponse.data[0].Key;
    const locationName = locationResponse.data[0].LocalizedName;

    // Step 2: Get current conditions using the location key
    const currentUrl = `https://dataservice.accuweather.com/currentconditions/v1/${locationKey}?apikey=${WEATHER_API_KEY}&details=true`;
    const currentResponse = await axios.get(currentUrl);

    if (!currentResponse.data || currentResponse.data.length === 0) {
      throw new Error(`Weather data not available for location: ${location}`);
    }

    const currentData = currentResponse.data[0];

    const weatherData = {
      location: locationName,
      temperature: currentData.Temperature.Metric.Value,
      humidity: currentData.RelativeHumidity,
      description: currentData.WeatherText,
      windSpeed: currentData.Wind.Speed.Metric.Value,
      rainfall: currentData.Precip1hr?.Metric?.Value || 0,
      date: new Date(currentData.EpochTime * 1000),
      forecast: false
    };

    // Store weather data in database
    await prisma.weatherData.create({
      data: weatherData
    });

    return weatherData;
  } catch (error) {
    console.error('Error fetching current weather:', error);

    // Check for API key related errors
    if (error.message && error.message.includes('API key')) {
      console.error('API Key Error: This appears to be an issue with your AccuWeather API key.');
      console.error('Please check that you have:');
      console.error('1. Signed up for a free account at https://developer.accuweather.com/');
      console.error('2. Copied your API Key from the My Apps section');
      console.error('3. Updated the WEATHER_API_KEY value in your .env file');
      throw new Error(`Weather API key error: ${error.message}`);
    }
    // Add more context to the error
    else if (error.code === 'ECONNREFUSED') {
      throw new Error(`Weather API connection refused: ${error.message}`);
    } else if (error.code === 'ENOTFOUND') {
      throw new Error(`Weather API host not found: ${error.message}`);
    } else if (error.response) {
      throw new Error(`Weather API error (${error.response.status}): ${error.message}`);
    } else if (error.request) {
      throw new Error(`Weather API request failed: ${error.message}`);
    } else if (error.message && error.message.includes('timeout')) {
      throw new Error(`Weather API request timed out: ${error.message}`);
    }

    // If it's another type of error, rethrow with additional context
    throw new Error(`Weather API error: ${error.message}`);
  }
}

/**
 * Get weather forecast for a location
 * @param {string} location - The location to get forecast for
 * @returns {Promise<Array>} - Array of forecast data
 */
async function getWeatherForecast(location) {
  try {
    // Check if API key is set and not the placeholder
    if (!WEATHER_API_KEY || WEATHER_API_KEY === 'YOUR_ACCUWEATHER_API_KEY' || WEATHER_API_KEY === 'YOUR_WEATHERSTACK_API_KEY') {
      throw new Error('AccuWeather API key is not configured. Please set a valid API key in the .env file.');
    }

    // Step 1: Get location key from AccuWeather API
    const locationUrl = `https://dataservice.accuweather.com/locations/v1/search?apikey=${WEATHER_API_KEY}&q=${encodeURIComponent(location)}`;
    const locationResponse = await axios.get(locationUrl);

    if (!locationResponse.data || locationResponse.data.length === 0) {
      throw new Error(`Location not found: ${location}`);
    }

    const locationKey = locationResponse.data[0].Key;
    const locationName = locationResponse.data[0].LocalizedName;

    // Step 2: Get 5-day forecast using the location key
    const forecastUrl = `https://dataservice.accuweather.com/forecasts/v1/daily/5day/${locationKey}?apikey=${WEATHER_API_KEY}&metric=true&details=true`;
    const forecastResponse = await axios.get(forecastUrl);

    if (!forecastResponse.data || !forecastResponse.data.DailyForecasts) {
      throw new Error(`Forecast data not available for location: ${location}`);
    }

    // Process forecast data
    const forecastData = forecastResponse.data.DailyForecasts.map(day => {
      return {
        location: locationName,
        date: new Date(day.EpochDate * 1000),
        minTemperature: day.Temperature.Minimum.Value,
        maxTemperature: day.Temperature.Maximum.Value,
        dayDescription: day.Day.IconPhrase,
        nightDescription: day.Night.IconPhrase,
        rainfall: day.Day.RainProbability,
        humidity: day.Day.RelativeHumidity,
        windSpeed: day.Day.Wind.Speed.Value,
        forecast: true
      };
    });

    // Store forecast data in database (optional)
    for (const forecast of forecastData) {
      await prisma.weatherData.create({
        data: {
          location: forecast.location,
          temperature: (forecast.minTemperature + forecast.maxTemperature) / 2, // Average temp
          humidity: forecast.humidity || 0,
          description: forecast.dayDescription,
          windSpeed: forecast.windSpeed,
          rainfall: forecast.rainfall,
          date: forecast.date,
          forecast: true
        }
      });
    }

    return forecastData;
  } catch (error) {
    console.error('Error fetching weather forecast:', error);

    // Check for API key related errors
    if (error.message && error.message.includes('API key')) {
      console.error('API Key Error: This appears to be an issue with your AccuWeather API key.');
      console.error('Please check that you have:');
      console.error('1. Signed up for a free account at https://developer.accuweather.com/');
      console.error('2. Copied your API Key from the My Apps section');
      console.error('3. Updated the WEATHER_API_KEY value in your .env file');
      console.error('Note: The free tier of AccuWeather API has limited calls per day.');
      throw new Error(`Weather forecast API key error: ${error.message}`);
    }
    // Add more context to the error
    else if (error.code === 'ECONNREFUSED') {
      throw new Error(`Weather forecast API connection refused: ${error.message}`);
    } else if (error.code === 'ENOTFOUND') {
      throw new Error(`Weather forecast API host not found: ${error.message}`);
    } else if (error.response) {
      throw new Error(`Weather forecast API error (${error.response.status}): ${error.message}`);
    } else if (error.request) {
      throw new Error(`Weather forecast API request failed: ${error.message}`);
    } else if (error.message && error.message.includes('timeout')) {
      throw new Error(`Weather forecast API request timed out: ${error.message}`);
    }

    // If it's another type of error, rethrow with additional context
    throw new Error(`Weather forecast API error: ${error.message}`);
  }
}

/**
 * Get agricultural advice based on weather conditions
 * @param {string} cropType - The type of crop
 * @param {Object} weatherData - Current weather data
 * @returns {string} - Agricultural advice
 */
function getAgriculturalAdvice(cropType, weatherData) {
  // This is a simplified example - in production, use more sophisticated logic
  let advice = '';

  // Temperature-based advice
  if (weatherData.temperature > 30) {
    advice += `High temperature alert (${weatherData.temperature}°C). Ensure ${cropType} has adequate water. `;
  } else if (weatherData.temperature < 10) {
    advice += `Low temperature alert (${weatherData.temperature}°C). Protect ${cropType} from frost. `;
  }

  // Rainfall-based advice
  if (weatherData.rainfall > 10) {
    advice += `Heavy rainfall detected (${weatherData.rainfall}mm). Check drainage for ${cropType}. `;
  } else if (weatherData.rainfall < 0.5 && weatherData.humidity < 40) {
    advice += `Dry conditions detected. Consider irrigation for ${cropType}. `;
  }

  // Wind-based advice
  if (weatherData.windSpeed > 20) {
    advice += `Strong winds detected (${weatherData.windSpeed}km/h). Secure any supports for ${cropType}. `;
  }

  return advice || `Weather conditions are favorable for ${cropType}.`;
}

/**
 * Check if weather conditions require an alert
 * @param {Object} weatherData - Current weather data
 * @returns {Object|null} - Alert object or null if no alert needed
 */
function checkWeatherAlerts(weatherData) {
  // This is a simplified example - in production, use more sophisticated logic
  if (weatherData.temperature > 35) {
    return {
      alertType: 'extreme_heat',
      message: `ALERT: Extreme heat detected (${weatherData.temperature}°C). Take precautions to protect crops and livestock.`
    };
  }

  if (weatherData.rainfall > 20) {
    return {
      alertType: 'heavy_rain',
      message: `ALERT: Heavy rainfall detected (${weatherData.rainfall}mm). Potential flooding risk. Check farm drainage.`
    };
  }

  if (weatherData.windSpeed > 30) {
    return {
      alertType: 'strong_wind',
      message: `ALERT: Strong winds detected (${weatherData.windSpeed}km/h). Secure farm structures and protect crops.`
    };
  }

  return null;
}

module.exports = {
  getCurrentWeather,
  getWeatherForecast,
  getAgriculturalAdvice,
  checkWeatherAlerts
};
