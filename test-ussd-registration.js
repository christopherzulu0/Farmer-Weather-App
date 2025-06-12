const { Register } = require('./menu');

async function testUssdRegistration() {
  try {
    console.log('Testing USSD registration flow...');

    // Simulate USSD flow
    const phoneNumber = '+260987654322'; // Different from the previous test

    // Step 1: Initial registration request
    let textArray = ['1'];
    let response = await Register(textArray, phoneNumber);
    console.log('Step 1 response:', response);

    // Step 2: Enter name
    textArray = ['1', 'Test User 2'];
    response = await Register(textArray, phoneNumber);
    console.log('Step 2 response:', response);

    // Step 3: Enter email
    textArray = ['1', 'Test User 2', 'test2@example.com'];
    response = await Register(textArray, phoneNumber);
    console.log('Step 3 response:', response);

    // Step 4: Enter location
    textArray = ['1', 'Test User 2', 'test2@example.com', 'Test Location 2'];
    response = await Register(textArray, phoneNumber);
    console.log('Step 4 response:', response);

    // Step 5: Enter main crop
    textArray = ['1', 'Test User 2', 'test2@example.com', 'Test Location 2', 'Maize'];
    response = await Register(textArray, phoneNumber);
    console.log('Step 5 response:', response);

    // Step 6: Enter farm size
    textArray = ['1', 'Test User 2', 'test2@example.com', 'Test Location 2', 'Maize', '10'];
    response = await Register(textArray, phoneNumber);
    console.log('Step 6 response:', response);

    // Step 7: Enter PIN
    textArray = ['1', 'Test User 2', 'test2@example.com', 'Test Location 2', 'Maize', '10', '1234'];
    response = await Register(textArray, phoneNumber);
    console.log('Step 7 response:', response);

    // Step 8: Confirm PIN
    textArray = ['1', 'Test User 2', 'test2@example.com', 'Test Location 2', 'Maize', '10', '1234', '1234'];
    response = await Register(textArray, phoneNumber);
    console.log('Step 8 response:', response);

    // Step 9: Confirm registration
    textArray = ['1', 'Test User 2', 'test2@example.com', 'Test Location 2', 'Maize', '10', '1234', '1234', '1'];
    response = await Register(textArray, phoneNumber);
    console.log('Step 9 response:', response);

    console.log('USSD registration flow test completed.');

  } catch (error) {
    console.error('Error during USSD registration test:', error);
  }
}

testUssdRegistration();
