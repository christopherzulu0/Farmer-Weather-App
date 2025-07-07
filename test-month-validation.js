// Test script to debug the month validation issue
const { Crops } = require('./pages/CropManagement');
const prisma = require('./prisma/client');

async function testMonthValidation() {
    console.log("Testing month validation issue");
    console.log("=============================");

    // Get a valid phone number from the database
    let phoneNumber;
    try {
        // Find a user with at least one farm
        const user = await prisma.user.findFirst({
            where: {
                farms: {
                    some: {}
                }
            },
            include: {
                farms: true
            }
        });

        if (!user) {
            console.error("No users with farms found in the database. Please add a user with a farm first.");
            process.exit(1);
        }

        phoneNumber = user.phoneNumber;
        console.log(`Using phone number: ${phoneNumber}`);
        console.log(`User: ${user.name}`);
        console.log(`Farms: ${user.farms.map(farm => farm.name).join(', ')}`);
        console.log(`Number of farms: ${user.farms.length}`);
    } catch (error) {
        console.error("Error finding a valid user:", error);
        process.exit(1);
    }

    // Setup for testing - get to the point where we can enter a date
    const setupArray1 = ["2", "2"];
    console.log("\nSetting up test - selecting 'Add a new crop'");
    await Crops(setupArray1, phoneNumber);

    const setupArray2 = ["2", "2", "TestCrop"];
    console.log("Setting up test - entering crop name");
    await Crops(setupArray2, phoneNumber);

    // Test the invalid month case
    const invalidMonth = "01/13/2026";
    console.log(`\nTesting invalid month: ${invalidMonth}`);

    // Add debug logging to the isValidDate function
    // This is a hack to add logging without modifying the original code
    const originalConsoleLog = console.log;
    console.log = function() {
        originalConsoleLog.apply(console, arguments);

        // Check if this is a call from our test
        const stack = new Error().stack;
        if (stack.includes('testMonthValidation')) {
            // Get the arguments as a string
            const args = Array.from(arguments).join(' ');

            // If this looks like a date validation log, capture it
            if (args.includes('day') || args.includes('month') || args.includes('year') ||
                args.includes('isValidDate') || args.includes('Date')) {
                originalConsoleLog('CAPTURED LOG:', args);
            }
        }
    };

    try {
        // Try with direct parsing
        console.log("Testing direct JavaScript Date parsing:");
        const directDate = new Date(invalidMonth);
        console.log(`Direct parse result: ${directDate}`);
        console.log(`Is valid date: ${!isNaN(directDate.getTime())}`);
        if (!isNaN(directDate.getTime())) {
            console.log(`Year: ${directDate.getFullYear()}`);
            console.log(`Month: ${directDate.getMonth() + 1}`);
            console.log(`Day: ${directDate.getDate()}`);
        }

        // Try with manual parsing
        console.log("\nTesting manual parsing:");
        const parts = invalidMonth.split('/');
        if (parts.length === 3) {
            const day = parseInt(parts[0]);
            const month = parseInt(parts[1]);
            const year = parseInt(parts[2]);
            console.log(`Parsed day: ${day}, month: ${month}, year: ${year}`);

            // Check if these values would pass our validation
            console.log(`day > 0 && day <= 31: ${day > 0 && day <= 31}`);
            console.log(`month > 0 && month <= 12: ${month > 0 && month <= 12}`);
            console.log(`year > 2000: ${year > 2000}`);

            // Create a date object
            const dateObj = new Date(year, month - 1, day);
            console.log(`Date object: ${dateObj}`);
            console.log(`Is valid date: ${!isNaN(dateObj.getTime())}`);
            if (!isNaN(dateObj.getTime())) {
                console.log(`Year: ${dateObj.getFullYear()}`);
                console.log(`Month: ${dateObj.getMonth() + 1}`);
                console.log(`Day: ${dateObj.getDate()}`);
            }
        }

        // Now test with the actual USSD flow
        console.log("\nTesting with USSD flow:");
        const textArray = ["2", "2", "TestCrop", invalidMonth];
        const response = await Crops(textArray, phoneNumber);
        console.log(`Response: ${response}`);

        // Check if the response indicates success or failure
        const isSuccess = response.includes("successfully");
        const isError = response.includes("Invalid date format");

        console.log(`Result: ${isSuccess ? "SUCCESS" : (isError ? "ERROR" : "UNKNOWN")}`);

        // If successful, delete the test crop to avoid cluttering the database
        if (isSuccess) {
            try {
                // Find the crop we just created
                const testCrops = await prisma.crop.findMany({
                    where: {
                        name: "TestCrop"
                    },
                    orderBy: {
                        id: 'desc'
                    },
                    take: 1
                });

                if (testCrops.length > 0) {
                    // Delete the test crop
                    await prisma.crop.delete({
                        where: {
                            id: testCrops[0].id
                        }
                    });
                    console.log(`Test crop deleted (ID: ${testCrops[0].id})`);

                    // Check the plantingDate that was stored
                    console.log(`Planting date that was stored: ${testCrops[0].plantingDate}`);
                    if (testCrops[0].plantingDate) {
                        const storedDate = new Date(testCrops[0].plantingDate);
                        console.log(`Stored date object: ${storedDate}`);
                        console.log(`Year: ${storedDate.getFullYear()}`);
                        console.log(`Month: ${storedDate.getMonth() + 1}`);
                        console.log(`Day: ${storedDate.getDate()}`);
                    }
                }
            } catch (deleteError) {
                console.error(`Error deleting test crop:`, deleteError.message);
            }
        }
    } finally {
        // Restore the original console.log
        console.log = originalConsoleLog;
    }
}

// Run the test
testMonthValidation()
    .then(() => {
        console.log("\nTest completed");
        process.exit(0);
    })
    .catch(error => {
        console.error("Error running test:", error);
        process.exit(1);
    });
