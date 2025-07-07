// Test script to reproduce the date validation issue
const { Crops } = require('./pages/CropManagement');
const prisma = require('./prisma/client');

async function testDateIssue() {
    console.log("Testing date validation issue");
    console.log("============================");

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

    // Test with various date formats
    const dateFormats = [
        "01/02/2026",       // Standard DD/MM/YYYY format
        "01-02-2026",       // Using hyphens
        "01.02.2026",       // Using dots
        "2026/02/01",       // YYYY/MM/DD format
        "2026-02-01",       // ISO format (YYYY-MM-DD)
        "01022026",         // No separators
        "Feb 1, 2026",      // Natural language format
        "2026-02-01T00:00:00.000Z" // Full ISO string
    ];

    // Setup for testing - get to the point where we can enter a date
    const setupArray1 = ["2", "2"];
    console.log("\nSetting up test - selecting 'Add a new crop'");
    await Crops(setupArray1, phoneNumber);

    const setupArray2 = ["2", "2", "TestCrop"];
    console.log("Setting up test - entering crop name");
    await Crops(setupArray2, phoneNumber);

    // Test each date format and collect results
    const results = {};

    console.log("\nTesting date formats:");
    for (const format of dateFormats) {
        console.log(`Testing: '${format}'`);

        try {
            const textArray = ["2", "2", "TestCrop", format];
            const response = await Crops(textArray, phoneNumber);

            // Check if the response indicates success or failure
            const isSuccess = response.includes("successfully");
            const isError = response.includes("Invalid date format");

            results[format] = {
                success: isSuccess,
                error: isError,
                response: response.substring(0, 100) + (response.length > 100 ? "..." : "")
            };

            console.log(`  Result: ${isSuccess ? "SUCCESS" : (isError ? "ERROR" : "UNKNOWN")}`);
        } catch (error) {
            console.error(`  Error testing format '${format}':`, error.message);
            results[format] = {
                success: false,
                error: true,
                response: error.message
            };
        }

        // Add a small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Print summary
    console.log("\n=== SUMMARY OF RESULTS ===");
    console.log("Format                      | Result  | Response");
    console.log("----------------------------|---------|---------------------------");

    for (const [format, result] of Object.entries(results)) {
        const formattedFormat = format.padEnd(28);
        const formattedResult = (result.success ? "SUCCESS" : (result.error ? "ERROR" : "UNKNOWN")).padEnd(9);
        console.log(`${formattedFormat}| ${formattedResult}| ${result.response}`);
    }

    // Now let's try to directly create a crop with a date to see if Prisma is handling it correctly
    console.log("\n=== TESTING DIRECT PRISMA CREATION ===");

    try {
        // Create a test crop with various date formats
        for (const format of dateFormats) {
            console.log(`\nTesting direct Prisma creation with date format: '${format}'`);

            let dateObj;
            try {
                // Try to parse the date string
                if (format.includes('/') || format.includes('-') || format.includes('.')) {
                    // Split by separator
                    const separator = format.includes('/') ? '/' : (format.includes('-') ? '-' : '.');
                    const parts = format.split(separator);

                    if (parts.length === 3) {
                        // Check if it's DD/MM/YYYY or YYYY/MM/DD
                        if (parts[0].length === 4) {
                            // YYYY/MM/DD
                            dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                        } else {
                            // DD/MM/YYYY
                            dateObj = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                        }
                    }
                } else {
                    // Try direct parsing
                    dateObj = new Date(format);
                }

                console.log(`  Parsed date: ${dateObj}`);
                console.log(`  Is valid date: ${!isNaN(dateObj.getTime())}`);

                // Only proceed if we have a valid date
                if (!isNaN(dateObj.getTime())) {
                    // Create a test crop with this date
                    const testCrop = await prisma.crop.create({
                        data: {
                            name: `TestCrop-${format}`,
                            plantingDate: dateObj,
                            farmId: user.farms[0].id
                        }
                    });

                    console.log(`  Successfully created crop with ID: ${testCrop.id}`);
                    console.log(`  Stored date: ${testCrop.plantingDate}`);

                    // Clean up - delete the test crop
                    await prisma.crop.delete({
                        where: { id: testCrop.id }
                    });

                    console.log(`  Test crop deleted`);
                } else {
                    console.log(`  Skipping creation - invalid date`);
                }
            } catch (error) {
                console.error(`  Error with date format '${format}':`, error.message);
            }
        }
    } catch (error) {
        console.error("Error in direct Prisma testing:", error);
    }
}

// Run the test
testDateIssue()
    .then(() => {
        console.log("\nTest completed");
        process.exit(0);
    })
    .catch(error => {
        console.error("Error running test:", error);
        process.exit(1);
    });
