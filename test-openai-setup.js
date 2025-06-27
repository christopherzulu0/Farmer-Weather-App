/**
 * Test script for OpenAI module setup
 *
 * This script tests whether the OpenAI module is properly installed and configured.
 * Run with: node test-openai-setup.js
 */

const dotenv = require('dotenv');
dotenv.config();

console.log('Testing OpenAI module setup...\n');

// Step 1: Check if the OpenAI module is installed
console.log('Step 1: Checking if OpenAI module is installed...');
try {
    const openaiModule = require('openai');
    console.log('✓ OpenAI module is installed.');

    // Check the version
    try {
        console.log(`  Module version: ${openaiModule.version || 'unknown'}`);
    } catch (error) {
        console.log('  Could not determine module version.');
    }
} catch (error) {
    console.error('✗ OpenAI module is not installed.');
    console.error(`  Error: ${error.message}`);
    console.log('\nTo install the OpenAI module, run:');
    console.log('  npm install openai');
    process.exit(1);
}

// Step 2: Check if the API key is configured
console.log('\nStep 2: Checking if OpenAI API key is configured...');
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
    console.error('✗ OpenAI API key is not found in .env file.');
    console.log('\nPlease add your OpenAI API key to the .env file:');
    console.log('  OPENAI_API_KEY=your_api_key_here');
    process.exit(1);
} else if (apiKey === 'your_openai_api_key_here') {
    console.error('✗ OpenAI API key is set to the default placeholder value.');
    console.log('\nPlease replace the placeholder with your actual API key in the .env file:');
    console.log('  OPENAI_API_KEY=your_actual_api_key_here');
    process.exit(1);
} else {
    console.log('✓ OpenAI API key is configured.');
    // Don't print the actual key for security reasons
    console.log(`  Key format: ${apiKey.substring(0, 3)}...${apiKey.substring(apiKey.length - 3)}`);
}

// Step 3: Try to initialize the OpenAI client
console.log('\nStep 3: Trying to initialize OpenAI client...');
try {
    const { OpenAI } = require('openai');
    const openai = new OpenAI({
        apiKey: apiKey
    });
    console.log('✓ OpenAI client initialized successfully.');

    // Optional: Make a simple API call to verify the key works
    console.log('\nWould you like to test the API connection? (This will use API credits)');
    console.log('To test, uncomment the following code in this script:');
    console.log(`
    // Test API connection
    async function testConnection() {
        try {
            const response = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: "You are a helpful assistant." },
                    { role: "user", content: "Hello, are you working?" }
                ],
                max_tokens: 10
            });
            console.log('✓ API connection successful!');
            console.log('  Response:', response.choices[0].message.content);
        } catch (error) {
            console.error('✗ API connection failed.');
            console.error('  Error:', error.message);
        }
    }
    
    testConnection();
    `);
} catch (error) {
    console.error('✗ Failed to initialize OpenAI client.');
    console.error(`  Error: ${error.message}`);
    process.exit(1);
}

console.log('\nSetup test completed.');
console.log('If all checks passed, your OpenAI module is properly installed and configured.');
console.log('You can now use the AI-powered crop calendar features.');
