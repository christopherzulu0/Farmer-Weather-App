# Farmers Weather App

A weather updates and agricultural advice application for farmers via USSD.

## Features

- Weather updates and forecasts
- Farm management
- Crop management
- Crop calendar and planting advice
- Market prices
- Weather alerts
- Emergency assistance
- Notifications
- Multi-language support

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
   or
   ```
   pnpm install
   ```
3. Set up environment variables (see below)
4. Generate Prisma client:
   ```
   npm run prisma:generate
   ```
5. Run database migrations:
   ```
   npm run prisma:migrate
   ```
6. Start the application:
   ```
   npm start
   ```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
WEATHER_API_KEY=your_accuweather_api_key
AT_USERNAME=your_africastalking_username
AT_API_KEY=your_africastalking_api_key
DATABASE_URL="postgresql://username:password@localhost:5432/farmers_weather?schema=public"
PORT=3000
```

**Important Notes:**
- For Africa's Talking sandbox testing, use `sandbox` as the `AT_USERNAME`
- Generate your Africa's Talking API key from the [Africa's Talking Dashboard](https://account.africastalking.com/)
- Make sure to use the full API key without any modifications
- The API key format may vary, but it should be a valid key from your Africa's Talking account

## AccuWeather API Setup

This application uses the [AccuWeather API](https://developer.accuweather.com/) for weather data. To set up the AccuWeather API:

1. **Sign up for a free account**:
   - Go to [AccuWeather Developer Portal](https://developer.accuweather.com/user/register)
   - Create a free account
   - The free plan includes 50 API calls per day

2. **Create a new application**:
   - After signing up and logging in, go to "My Apps" section
   - Click "Add a new App" button
   - Fill in the required information (App name, description, etc.)
   - Select "Limited Trial" for the plan

3. **Get your API Key**:
   - After creating the app, you'll see your API Key in the app details
   - Copy this API Key
   - It should look something like: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

4. **Update your .env file**:
   - Open your `.env` file
   - Replace `YOUR_ACCUWEATHER_API_KEY` with your actual AccuWeather API Key
   - Example: `WEATHER_API_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`
   - Make sure there are no spaces or quotes around the API key

5. **Verify your API key**:
   - Start the application
   - Try accessing the weather features
   - If you see weather data, your API key is working correctly

6. **Understanding AccuWeather API Endpoints**:
   - This application uses the following AccuWeather API endpoints:
     - Location Search: `https://dataservice.accuweather.com/locations/v1/search`
     - Current Conditions: `https://dataservice.accuweather.com/currentconditions/v1/{locationKey}`
     - 5-Day Forecast: `https://dataservice.accuweather.com/forecasts/v1/daily/5day/{locationKey}`
   - Each endpoint requires your API key as a parameter

7. **Troubleshooting AccuWeather API Issues**:
   - If you see an error about an invalid API key, double-check that you've copied it correctly
   - Ensure there are no extra spaces or characters in your API key
   - The free plan has a limit of 50 calls per day, which may be quickly exhausted
   - Each location search and weather request counts as a separate API call
   - If you see a 401 Unauthorized error, your API key may be invalid or expired
   - For production use, consider upgrading to a paid plan

## Africa's Talking Integration

This application uses Africa's Talking for SMS and USSD services. To test the connection to Africa's Talking, run:

```
npm run test:at
```

### Troubleshooting Africa's Talking Connection Issues

If you're having trouble connecting to Africa's Talking, try the following steps:

1. **Verify your credentials**:
   - Check that your `AT_USERNAME` and `AT_API_KEY` are correct in the `.env` file
   - For sandbox testing, use `sandbox` as the username
   - Ensure there are no extra spaces or quotes in your credentials

2. **Regenerate your API key**:
   - The current API key appears to be invalid or has expired
   - Log in to your Africa's Talking account at https://account.africastalking.com/
   - Go to Settings > API Key > Generate New API Key
   - Replace the old API key in your `.env` file with the new one
   - Make sure the API key is exactly 43 characters long
   - API keys should be kept confidential and not shared publicly

3. **Test the connection**:
   - Run `npm run test:at` to test the connection to Africa's Talking
   - Check the console output for detailed error messages

4. **API Key Header Format**:
   - The application tries multiple authentication methods automatically:
     - Using the SDK directly
     - Using the `apiKey` header
     - Using the `Apikey` header (with a capital 'A')
     - Using Basic Authentication
   - If all methods fail, there's likely an issue with the API key itself

5. **Check network connectivity**:
   - Ensure your server has internet access
   - Check if there are any firewalls blocking outgoing connections

6. **Verify API key permissions**:
   - Log in to your Africa's Talking account
   - Verify that your API key has the necessary permissions for SMS and USSD

7. **Check for rate limiting**:
   - If you're making many requests, you might be rate-limited
   - Add delays between requests or contact Africa's Talking support

8. **Update the SDK**:
   - Ensure you're using the latest version of the Africa's Talking SDK
   - Update with `npm update africastalking`

9. **Contact support**:
   - If all else fails, contact Africa's Talking support with the error details
   - Include the error messages from the connection test

## Crop Calendar Functionality

The application includes an AI-powered crop calendar feature that provides farmers with personalized advice on optimal planting times for various crops based on their location and current weather conditions.

### Features

- **AI-Powered Recommendations**: Get intelligent crop recommendations using OpenAI's advanced language models.
- **Personalized Planting Advice**: Receive tailored advice specific to your crop, location, and current weather conditions.
- **Optimal Planting Windows**: Get recommended planting dates for specific crops based on AI analysis of growing requirements and local weather conditions.
- **Weather-Adjusted Recommendations**: Planting windows are dynamically adjusted based on current temperature, rainfall, and other weather factors.
- **Harvest Date Predictions**: Estimate when crops will be ready for harvest based on AI-analyzed growing periods.
- **Seasonal Crop Recommendations**: Get AI-suggested crops that are most suitable to plant in the current season at your location.

### AI Integration

The crop calendar uses OpenAI's GPT models to provide intelligent agricultural advice:

- **Dynamic Crop Information**: Instead of relying on static data, the system uses AI to generate crop information based on the latest agricultural knowledge.
- **Contextual Understanding**: The AI considers multiple factors including crop type, location, current weather, and seasonal patterns.
- **Fallback Mechanism**: If the AI service is unavailable, the system falls back to traditional methods to ensure continuous service.
- **Data Caching**: AI-generated crop information is cached in the database to reduce API calls and provide faster responses.

### Using the Crop Calendar

Farmers can access the AI-powered crop calendar through the USSD menu:

1. Dial the USSD code to access the application
2. Select "Crop Management" from the main menu
3. Select "Crop Calendar" from the crop management menu
4. Choose from the following options:
   - View recommended crops for the current season
   - Get planting advice for a specific crop

### Setting Up OpenAI Integration

To use the AI-powered features, you need to install the OpenAI module and set up an API key:

1. **Install the OpenAI module**:
   - Run the following command in your project directory:
     ```
     npm install openai
     ```
   - This will install the OpenAI Node.js client library

2. **Create an OpenAI account**:
   - Go to [OpenAI Platform](https://platform.openai.com/signup)
   - Sign up for an account

3. **Get your API Key**:
   - After signing up, go to [API Keys](https://platform.openai.com/api-keys)
   - Create a new secret key
   - Copy the key (you won't be able to see it again)

4. **Update your .env file**:
   - Open your `.env` file
   - Add your OpenAI API key: `OPENAI_API_KEY=your_openai_api_key_here`
   - Make sure there are no spaces or quotes around the API key

5. **Verify your setup**:
   - Run the OpenAI setup test to verify that everything is configured correctly:
     ```
     npm run test:openai
     ```
   - This will check if the module is installed and the API key is properly configured

6. **Restart the application**:
   - The application will automatically use the AI-powered features when the module is installed and an API key is available

### Testing the Crop Calendar

To test the crop calendar functionality, run:

```
npm run test:crop-calendar
```

This will execute a series of tests that verify:
- AI-powered crop information retrieval
- Optimal planting window calculations
- Personalized planting advice generation
- Seasonal crop recommendations

Note: 
- The tests that interact with the AccuWeather API require a valid API key to be set in your `.env` file.
- The AI-powered features require a valid OpenAI API key to be set in your `.env` file.
- If the OpenAI API key is not set, the system will fall back to traditional methods.

## License

MIT
