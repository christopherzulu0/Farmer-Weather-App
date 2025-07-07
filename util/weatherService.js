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

    // Handle humidity data properly for current weather
    let humidityValue = 0;
    if (typeof currentData.RelativeHumidity === 'object' && currentData.RelativeHumidity !== null) {
      humidityValue = currentData.RelativeHumidity.Average || currentData.RelativeHumidity.Minimum || currentData.RelativeHumidity.Maximum || 0;
    } else if (typeof currentData.RelativeHumidity === 'number') {
      humidityValue = currentData.RelativeHumidity;
    }
    
    const weatherData = {
      location: locationName,
      temperature: currentData.Temperature.Metric.Value,
      humidity: humidityValue,
      description: currentData.WeatherText,
      windSpeed: currentData.Wind.Speed.Metric.Value,
      rainfall: currentData.Precip1hr?.Metric?.Value || 0,
      date: new Date(currentData.EpochTime * 1000),
      forecast: false
    };

    // Store weather data in database
    const skipDbStorage = process.env.SKIP_WEATHER_DB_STORAGE === 'true';
    
    if (!skipDbStorage) {
      try {
        await prisma.weatherData.create({
          data: weatherData
        });
      } catch (dbError) {
        console.warn('Failed to store current weather data in database:', dbError.message);
        // Continue processing even if database storage fails
      }
    } else {
      console.log('Skipping weather database storage as configured');
    }

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
    
    // For service unavailable (503) or other API errors, use fallback data
    if (error.response && error.response.status === 503) {
      console.warn('Weather API service unavailable (503). Using fallback data.');
      return getFallbackWeatherData(location);
    }
    
    // Add more context to the error
    else if (error.code === 'ECONNREFUSED') {
      console.warn('Weather API connection refused. Using fallback data.');
      return getFallbackWeatherData(location);
    } else if (error.code === 'ENOTFOUND') {
      console.warn('Weather API host not found. Using fallback data.');
      return getFallbackWeatherData(location);
    } else if (error.response) {
      console.warn(`Weather API error (${error.response.status}). Using fallback data.`);
      return getFallbackWeatherData(location);
    } else if (error.request) {
      console.warn('Weather API request failed. Using fallback data.');
      return getFallbackWeatherData(location);
    } else if (error.message && error.message.includes('timeout')) {
      console.warn('Weather API request timed out. Using fallback data.');
      return getFallbackWeatherData(location);
    }

    // If it's another type of error, use fallback data
    console.warn('Unknown weather API error. Using fallback data.');
    return getFallbackWeatherData(location);
  }
}

/**
 * Get fallback weather data when API is unavailable
 * @param {string} location - The location
 * @returns {Object} - Fallback weather data
 */
function getFallbackWeatherData(location) {
  console.warn(`Weather API unavailable. Using fallback data for ${location}`);
  
  // Get current month for seasonal adjustments
  const currentMonth = new Date().getMonth() + 1;
  
  // Basic fallback data based on typical conditions
  let temperature = 25; // Default moderate temperature
  let humidity = 60; // Default moderate humidity
  let description = "Partly cloudy";
  let windSpeed = 10;
  let rainfall = 0;
  
  // Adjust based on season (basic seasonal logic)
  if (currentMonth >= 12 || currentMonth <= 2) {
    // Winter months
    temperature = 15;
    humidity = 70;
    description = "Cool and clear";
  } else if (currentMonth >= 3 && currentMonth <= 5) {
    // Spring months
    temperature = 20;
    humidity = 65;
    description = "Mild and pleasant";
  } else if (currentMonth >= 6 && currentMonth <= 8) {
    // Summer months
    temperature = 30;
    humidity = 55;
    description = "Warm and sunny";
  } else if (currentMonth >= 9 && currentMonth <= 11) {
    // Fall months
    temperature = 22;
    humidity = 60;
    description = "Mild with occasional rain";
  }
  
  return {
    location: location,
    temperature: temperature,
    humidity: humidity,
    description: description,
    windSpeed: windSpeed,
    rainfall: rainfall,
    date: new Date(),
    forecast: false
  };
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
    const skipDbStorage = process.env.SKIP_WEATHER_DB_STORAGE === 'true';
    
    if (!skipDbStorage) {
      for (const forecast of forecastData) {
        try {
          // Handle humidity data properly
          let humidityValue = 0;
          if (typeof forecast.humidity === 'object' && forecast.humidity !== null) {
            humidityValue = forecast.humidity.Average || forecast.humidity.Minimum || forecast.humidity.Maximum || 0;
          } else if (typeof forecast.humidity === 'number') {
            humidityValue = forecast.humidity;
          }
          
          await prisma.weatherData.create({
            data: {
              location: forecast.location,
              temperature: (forecast.minTemperature + forecast.maxTemperature) / 2, // Average temp
              humidity: humidityValue,
              description: forecast.dayDescription,
              windSpeed: forecast.windSpeed,
              rainfall: forecast.rainfall,
              date: forecast.date,
              forecast: true
            }
          });
        } catch (dbError) {
          console.warn('Failed to store forecast data in database:', dbError.message);
          // Continue processing even if database storage fails
        }
      }
    } else {
      console.log('Skipping weather database storage as configured');
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
    
    // For service unavailable (503) or other API errors, return empty forecast
    if (error.response && error.response.status === 503) {
      console.warn('Weather forecast API service unavailable (503). Returning empty forecast.');
      return [];
    }
    
    // Add more context to the error
    else if (error.code === 'ECONNREFUSED') {
      console.warn('Weather forecast API connection refused. Returning empty forecast.');
      return [];
    } else if (error.code === 'ENOTFOUND') {
      console.warn('Weather forecast API host not found. Returning empty forecast.');
      return [];
    } else if (error.response) {
      console.warn(`Weather forecast API error (${error.response.status}). Returning empty forecast.`);
      return [];
    } else if (error.request) {
      console.warn('Weather forecast API request failed. Returning empty forecast.');
      return [];
    } else if (error.message && error.message.includes('timeout')) {
      console.warn('Weather forecast API request timed out. Returning empty forecast.');
      return [];
    }

    // If it's another type of error, return empty forecast
    console.warn('Unknown weather forecast API error. Returning empty forecast.');
    return [];
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
  checkWeatherAlerts,
  getFallbackWeatherData
};