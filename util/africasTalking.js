const AfricasTalking = require('africastalking');
const dotenv = require('dotenv');

dotenv.config();

// Initialize Africa's Talking
const africastalking = AfricasTalking({
  apiKey: process.env.AT_API_KEY,
  username: process.env.AT_USERNAME
});

// Log initialization status
console.log('Africa\'s Talking SDK initialized with:');
console.log('Username:', process.env.AT_USERNAME);
console.log('API Key:', process.env.AT_API_KEY ? '****' + process.env.AT_API_KEY.slice(-4) : 'Not set');

const sms = africastalking.SMS;

/**
 * Send weather alert SMS to a farmer
 * @param {string} phoneNumber - The recipient's phone number
 * @param {string} message - The message to send
 * @returns {Promise} - Promise resolving to the SMS send result
 */
async function sendWeatherAlert(phoneNumber, message) {
  try {
    console.log(`Attempting to send SMS to ${phoneNumber}...`);

    // Validate phone number format
    if (!phoneNumber.startsWith('+')) {
      console.log('Adding + prefix to phone number');
      phoneNumber = '+' + phoneNumber;
    }

    const result = await sms.send({
      to: phoneNumber,
      message: message,
      from: 'FarmWeather' // Optional sender ID
    });

    console.log(`SMS sent successfully to ${phoneNumber}`);
    console.log('SMS Response:', JSON.stringify(result));
    return result;
  } catch (error) {
    console.error(`Error sending SMS to ${phoneNumber}:`);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error details:', JSON.stringify(error, null, 2));

    // Rethrow with more context
    throw new Error(`Failed to send SMS: ${error.message}`);
  }
}

/**
 * Send bulk weather alerts to multiple farmers
 * @param {Array<string>} phoneNumbers - Array of recipient phone numbers
 * @param {string} message - The message to send
 * @returns {Promise} - Promise resolving to the SMS send result
 */
async function sendBulkWeatherAlerts(phoneNumbers, message) {
  try {
    console.log(`Attempting to send bulk SMS to ${phoneNumbers.length} recipients...`);

    // Validate and format phone numbers
    const formattedNumbers = phoneNumbers.map(number => {
      if (!number.startsWith('+')) {
        return '+' + number;
      }
      return number;
    });

    console.log(`Sending to numbers: ${formattedNumbers.join(', ')}`);

    const result = await sms.send({
      to: formattedNumbers,
      message: message,
      from: 'FarmWeather' // Optional sender ID
    });

    console.log(`Bulk SMS sent successfully to ${formattedNumbers.length} farmers`);
    console.log('SMS Response:', JSON.stringify(result));
    return result;
  } catch (error) {
    console.error('Error sending bulk SMS:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error details:', JSON.stringify(error, null, 2));

    // Rethrow with more context
    throw new Error(`Failed to send bulk SMS: ${error.message}`);
  }
}

/**
 * Test the connection to Africa's Talking
 * @returns {Promise} - Promise resolving to the connection test result
 */
async function testConnection() {
  try {
    console.log('Testing connection to Africa\'s Talking...');
    // Remove the strict length check since API key formats may vary
    console.log('API Key length:', process.env.AT_API_KEY.length, 'chars');

    // First, try using the SDK directly (original method)
    try {
      console.log('Method 1: Using SDK directly...');
      const account = africastalking.ACCOUNT;
      const sdkResponse = await account.fetchAccount();
      console.log('SDK method successful!');
      return {
        success: true,
        message: 'Successfully connected to Africa\'s Talking using SDK',
        data: sdkResponse
      };
    } catch (sdkError) {
      console.error('SDK method failed:', sdkError.message);
      // Continue to next method
    }

    // If SDK method fails, try direct API call with different auth methods
    const axios = require('axios');

    const baseURL = 'https://api.sandbox.africastalking.com/version1';
    const username = process.env.AT_USERNAME;
    const apiKey = process.env.AT_API_KEY;

    // Method 2: Using apiKey header
    try {
      console.log('Method 2: Using apiKey header...');
      const response = await axios({
        method: 'get',
        url: '/user',
        baseURL: baseURL,
        params: { username },
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
          'apiKey': apiKey
        }
      });

      console.log('apiKey header method successful!');
      return {
        success: true,
        message: 'Successfully connected to Africa\'s Talking using apiKey header',
        data: response.data
      };
    } catch (apiKeyError) {
      console.error('apiKey header method failed:', apiKeyError.message);
      // Continue to next method
    }

    // Method 3: Using Apikey header (capital A)
    try {
      console.log('Method 3: Using Apikey header (capital A)...');
      const response = await axios({
        method: 'get',
        url: '/user',
        baseURL: baseURL,
        params: { username },
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Apikey': apiKey
        }
      });

      console.log('Apikey header method successful!');
      return {
        success: true,
        message: 'Successfully connected to Africa\'s Talking using Apikey header',
        data: response.data
      };
    } catch (ApikeyError) {
      console.error('Apikey header method failed:', ApikeyError.message);
      // Continue to next method
    }

    // Method 4: Using Authorization header with Basic auth
    try {
      console.log('Method 4: Using Basic Authentication...');
      const authHeader = 'Basic ' + Buffer.from(apiKey + ':').toString('base64');
      const response = await axios({
        method: 'get',
        url: '/user',
        baseURL: baseURL,
        params: { username },
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': authHeader
        }
      });

      console.log('Basic auth method successful!');
      return {
        success: true,
        message: 'Successfully connected to Africa\'s Talking using Basic auth',
        data: response.data
      };
    } catch (basicAuthError) {
      console.error('Basic auth method failed:', basicAuthError.message);
      // All methods failed
    }

    // If we get here, all methods failed
    return {
      success: false,
      message: 'All authentication methods failed to connect to Africa\'s Talking',
      error: { message: 'Multiple authentication failures' }
    };
  } catch (error) {
    console.error('Connection test failed:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error details:', JSON.stringify(error, null, 2));

    return {
      success: false,
      message: `Failed to connect to Africa's Talking: ${error.message}`,
      error: error
    };
  }
}

// Run the connection test on module load
testConnection()
  .then(result => {
    if (result.success) {
      console.log('✅ Africa\'s Talking connection verified');
    } else {
      console.error('❌ Africa\'s Talking connection failed');
    }
  })
  .catch(err => {
    console.error('❌ Error during connection test:', err.message);
  });

module.exports = {
  sendWeatherAlert,
  sendBulkWeatherAlerts,
  testConnection
};
