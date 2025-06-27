/**
 * Test script for AI-Powered Crop Calendar functionality
 *
 * This script tests the crop calendar service functions to ensure they work correctly
 * with the AI integration. It verifies both AI-powered functionality and fallback methods.
 *
 * Run with: node test-crop-calendar.js
 */

const {
    getCropInfo,
    getOptimalPlantingWindow,
    getPlantingAdvice,
    getRecommendedCrops
} = require('./util/cropCalendarService');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function testCropCalendar() {
    try {
        console.log('Testing AI-Powered Crop Calendar functionality...\n');

        // Check if OpenAI API key is configured
        const openaiApiKey = process.env.OPENAI_API_KEY;
        if (!openaiApiKey || openaiApiKey === 'your_openai_api_key_here') {
            console.warn('⚠️ OpenAI API key is not configured. Tests will use fallback methods.');
            console.warn('To enable AI-powered features, add your OpenAI API key to the .env file.');
        } else {
            console.log('✓ OpenAI API key is configured. AI-powered features will be tested.');
        }

        // Check if AccuWeather API key is configured
        const weatherApiKey = process.env.WEATHER_API_KEY;
        if (!weatherApiKey || weatherApiKey === 'YOUR_ACCUWEATHER_API_KEY') {
            console.warn('⚠️ AccuWeather API key is not configured. Weather-dependent tests may fail.');
            console.warn('To enable weather features, add your AccuWeather API key to the .env file.');
        } else {
            console.log('✓ AccuWeather API key is configured. Weather features will be tested.');
        }

        console.log('\n-----------------------------------\n');

        // Test 1: Get crop information using AI
        console.log('Test 1: Get AI-powered crop information');
        try {
            console.log('Fetching information for maize...');
            const maizeInfo = await getCropInfo('maize');
            console.log('Maize info:', JSON.stringify(maizeInfo, null, 2));

            console.log('\nFetching information for tomato...');
            const tomatoInfo = await getCropInfo('tomato');
            console.log('Tomato info:', JSON.stringify(tomatoInfo, null, 2));

            // Test unknown crop (should use AI or fallback)
            console.log('\nFetching information for an unusual crop (quinoa)...');
            const unusualCrop = await getCropInfo('quinoa');
            console.log('Unusual crop info:', JSON.stringify(unusualCrop, null, 2));
        } catch (error) {
            console.error('Error getting crop information:', error.message);
        }
        console.log('\n-----------------------------------\n');

        // Test 2: Get optimal planting window
        console.log('Test 2: Get optimal planting window');
        try {
            console.log('Calculating optimal planting window for maize in Lusaka...');
            const maizePlantingWindow = await getOptimalPlantingWindow('maize', 'Lusaka');
            console.log('Maize planting window:');
            console.log('- Season:', maizePlantingWindow.season);
            console.log('- Planting window:',
                maizePlantingWindow.plantingWindow.start.toLocaleDateString(),
                'to',
                maizePlantingWindow.plantingWindow.end.toLocaleDateString());
            console.log('- Harvest window:',
                maizePlantingWindow.harvestWindow.earliest.toLocaleDateString(),
                'to',
                maizePlantingWindow.harvestWindow.latest.toLocaleDateString());
        } catch (error) {
            console.error('Error getting maize planting window:', error.message);
            console.log('Note: This test requires valid API keys to be set in .env');
        }
        console.log('\n-----------------------------------\n');

        // Test 3: Get AI-powered planting advice
        console.log('Test 3: Get AI-powered planting advice');
        try {
            console.log('Generating planting advice for maize in Lusaka...');
            const maizeAdvice = await getPlantingAdvice('maize', 'Lusaka');
            console.log('Maize planting advice:');
            console.log(maizeAdvice);

            console.log('\nGenerating planting advice for tomato in Lusaka...');
            const tomatoAdvice = await getPlantingAdvice('tomato', 'Lusaka');
            console.log('Tomato planting advice:');
            console.log(tomatoAdvice);
        } catch (error) {
            console.error('Error getting planting advice:', error.message);
            console.log('Note: This test requires valid API keys to be set in .env');
        }
        console.log('\n-----------------------------------\n');

        // Test 4: Get AI-recommended crops
        console.log('Test 4: Get AI-recommended crops');
        try {
            console.log('Getting recommended crops for Lusaka...');
            const recommendedCrops = await getRecommendedCrops('Lusaka');
            console.log('Recommended crops for current season:');
            if (recommendedCrops.length === 0) {
                console.log('No recommended crops found for the current season.');
            } else {
                recommendedCrops.forEach((crop, index) => {
                    console.log(`${index + 1}. ${crop.name} (${crop.suitability})`);
                    console.log(`   Season: ${crop.season}`);
                    console.log(`   Planting window: ${crop.plantingWindow.start.toLocaleDateString()} to ${crop.plantingWindow.end.toLocaleDateString()}`);
                    console.log(`   Growing period: ${crop.growingPeriod}`);
                });
            }
        } catch (error) {
            console.error('Error getting recommended crops:', error.message);
            console.log('Note: This test requires valid API keys to be set in .env');
        }

        console.log('\n-----------------------------------\n');
        console.log('AI-Powered Crop Calendar tests completed!');
        console.log('API Requirements:');
        console.log('1. AccuWeather API key - Required for weather data');
        console.log('   Set in .env as: WEATHER_API_KEY=your_accuweather_api_key');
        console.log('2. OpenAI API key - Required for AI-powered features');
        console.log('   Set in .env as: OPENAI_API_KEY=your_openai_api_key');
        console.log('\nIf any API key is missing, the system will use fallback methods.');

    } catch (error) {
        console.error('Error during Crop Calendar tests:', error);
    }
}

// Run the tests
testCropCalendar();
