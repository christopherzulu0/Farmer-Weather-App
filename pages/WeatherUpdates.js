const axios = require("axios");
// Function to fetch location key from AccuWeather Locations API
async function fetchLocationKey(city) {
  const apiKey = 'g3VtqZ06g0iGKFrbEVDGCuEgSTBn7c7N'; // Replace with your AccuWeather API key
  const country = 'ZM'; // Country code for Zambia

  const url = `http://dataservice.accuweather.com/locations/v1/cities/${country}/search?apikey=${apiKey}&q=${city}`;
  const response = await axios.get(url);
  const locationData = response.data;

  if (Array.isArray(locationData) && locationData.length > 0) {
    return locationData[0].Key;
  } else {
    return null;
  }
}

// Function to fetch weather data from AccuWeather API
async function fetchWeatherData(locationKey) {
  const apiKey = 'g3VtqZ06g0iGKFrbEVDGCuEgSTBn7c7N'; // Replace with your AccuWeather API key

  const url = `http://dataservice.accuweather.com/currentconditions/v1/${locationKey}?apikey=${apiKey}`;
  const response = await axios.get(url);
  const weatherData = response.data;

  if (Array.isArray(weatherData) && weatherData.length > 0) {
    return weatherData[0];
  } else {
    return null;
  }
}

const WeatherUpdates = {
    
    Weather: async (textArray, phoneNumber) => {
        const level = textArray.length;
        let response = "";
      
        if (level === 1) {
          response = `CON Welcome to the weather area. Please enter your city:`;
          return response;
        } else if (level === 2) {
          const city = textArray[1];
      
          // Fetch location key from AccuWeather Locations API
          try {
            const locationKey = await fetchLocationKey(city);
      
            if (locationKey) {
              // Fetch weather data from the API using location key
              const weatherData = await fetchWeatherData(locationKey);
      
              if (weatherData) {
                // Display weather data from the API
                response = `CON Weather updates for ${city}:`;
                response += `\n- Description: ${weatherData.WeatherText}`;
                response += `\n- Temperature: ${weatherData.Temperature.Metric.Value}°C`;
                response += `\n- Humidity: ${weatherData.RelativeHumidity ? weatherData.RelativeHumidity : 'N/A'}%`;
              } else {
                response = `END No weather data found for ${city}.`;
              }
            } else {
              response = `END Location not found for ${city}.`;
            }
          } catch (error) {
            response = `END Failed to retrieve weather data for ${city}.`;
          }
        }
      
        return response;
      }
}

module.exports = WeatherUpdates;