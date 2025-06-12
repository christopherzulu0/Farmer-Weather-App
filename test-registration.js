const prisma = require('./prisma/client');

async function testRegistration() {
  try {
    console.log('Testing user registration...');

    // Test data for a new user
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      phoneNumber: '+260987654321',
      location: 'Test Location',
      pin: 'test:hash', // Simplified for testing
      role: 'Farmer'
    };

    console.log('Attempting to create user with data:', userData);

    // Try to create the user
    const user = await prisma.user.create({
      data: userData
    });

    console.log('User created successfully:', user);

    // Test data for a new farm
    const farmData = {
      name: `${userData.name}'s Farm`,
      location: userData.location,
      size: 5.0,
      userId: user.id,
      crops: {
        create: [{
          name: 'Test Crop'
        }]
      }
    };

    console.log('Attempting to create farm with data:', farmData);

    // Try to create the farm
    const farm = await prisma.farm.create({
      data: farmData
    });

    console.log('Farm created successfully:', farm);

    console.log('Registration test completed successfully!');

    // Clean up test data
    await prisma.crop.deleteMany({
      where: { farmId: farm.id }
    });

    await prisma.farm.delete({
      where: { id: farm.id }
    });

    await prisma.user.delete({
      where: { id: user.id }
    });

    console.log('Test data cleaned up.');

  } catch (error) {
    console.error('Error during registration test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRegistration();
