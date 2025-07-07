// Test script to verify which date formats are working
const { Crops } = require('./pages/CropManagement');
const prisma = require('./prisma/client');

async function testDateFormats() {
    console.log("Testing all date formats mentioned in the documentation");
    console.log("====================================================");

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

    // Define all date formats to test based on the documentation
    const dateFormats = [
        { format: "DD/MM/YYYY", example: "01/02/2026", description: "Standard format with slash separators" },
        { format: "DD-MM-YYYY", example: "01-02-2026", description: "With hyphen separators" },
        { format: "DD.MM.YYYY", example: "01.02.2026", description: "With dot separators" },
        { format: "YYYY/MM/DD", example: "2026/02/01", description: "ISO-like format" },
        { format: "YYYY-MM-DD", example: "2026-02-01", description: "ISO format" },
        { format: "DDMMYYYY", example: "01022026", description: "No separators" },
        { format: "Natural language", example: "Feb 1, 2026", description: "Month name, day, year" },
        { format: "ISO string", example: "2026-02-01T00:00:00.000Z", description: "Full ISO date-time string" },
        // Additional test cases
        { format: "DD MM YYYY", example: "01 02 2026", description: "With space separators" },
        { format: "DD,MM,YYYY", example: "01,02,2026", description: "With comma separators" },
        { format: "DD;MM;YYYY", example: "01;02;2026", description: "With semicolon separators" },
        { format: "DD:MM:YYYY", example: "01:02:2026", description: "With colon separators" },
        { format: "DD\\MM\\YYYY", example: "01\\02\\2026", description: "With backslash separators" }
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
    for (const dateFormat of dateFormats) {
        console.log(`\nTesting: ${dateFormat.format} (${dateFormat.example})`);
        console.log(`Description: ${dateFormat.description}`);

        try {
            const textArray = ["2", "2", "TestCrop", dateFormat.example];
            const response = await Crops(textArray, phoneNumber);

            // Check if the response indicates success or failure
            const isSuccess = response.includes("successfully");
            const isError = response.includes("Invalid date format");

            results[dateFormat.format] = {
                example: dateFormat.example,
                success: isSuccess,
                error: isError,
                response: response.substring(0, 100) + (response.length > 100 ? "..." : "")
            };

            console.log(`  Result: ${isSuccess ? "SUCCESS" : (isError ? "ERROR" : "UNKNOWN")}`);

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
                        console.log(`  Test crop deleted (ID: ${testCrops[0].id})`);
                    }
                } catch (deleteError) {
                    console.error(`  Error deleting test crop:`, deleteError.message);
                }
            }
        } catch (error) {
            console.error(`  Error testing format '${dateFormat.format}':`, error.message);
            results[dateFormat.format] = {
                example: dateFormat.example,
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
    console.log("Format                | Example                    | Result  | Response");
    console.log("--------------------- | -------------------------- | ------- | ---------------------------");

    for (const [format, result] of Object.entries(results)) {
        const formattedFormat = format.padEnd(21);
        const formattedExample = result.example.padEnd(26);
        const formattedResult = (result.success ? "SUCCESS" : (result.error ? "ERROR" : "UNKNOWN")).padEnd(9);
        console.log(`${formattedFormat}| ${formattedExample}| ${formattedResult}| ${result.response}`);
    }

    // Count successes and failures
    const successCount = Object.values(results).filter(r => r.success).length;
    const errorCount = Object.values(results).filter(r => r.error).length;
    const unknownCount = Object.values(results).filter(r => !r.success && !r.error).length;

    console.log(`\nTotal formats tested: ${Object.keys(results).length}`);
    console.log(`Successful: ${successCount}`);
    console.log(`Failed: ${errorCount}`);
    console.log(`Unknown: ${unknownCount}`);
}

// Run the test
testDateFormats()
    .then(() => {
        console.log("\nTest completed");
        process.exit(0);
    })
    .catch(error => {
        console.error("Error running test:", error);
        process.exit(1);
    });
