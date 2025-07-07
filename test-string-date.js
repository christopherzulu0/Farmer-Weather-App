const { Crops } = require('./pages/CropManagement');
const prisma = require('./prisma/client');

async function testStringDate() {
    console.log("Testing string date storage");
    console.log("==========================");

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
        "2026-02-01T00:00:00.000Z", // Full ISO string
        "Invalid date",     // Invalid date
        "01/13/2026",       // Invalid month
        "32/01/2026"        // Invalid day
    ];

    // Setup for testing - get to the point where we can enter a date
    const setupArray1 = ["2", "2"];
    console.log("\nSetting up test - selecting 'Add a new crop'");
    await Crops(setupArray1, phoneNumber);

    // Test each date format and collect results
    const results = {};

    console.log("\nTesting date formats:");
    for (const format of dateFormats) {
        console.log(`Testing: '${format}'`);

        try {
            // Generate a unique crop name for each test
            const cropName = `TestCrop-${Date.now()}`;

            // Add a crop with this date format
            const textArray = ["2", "2", cropName, format];
            const response = await Crops(textArray, phoneNumber);

            // Check if the response indicates success
            const isSuccess = response.includes("successfully");

            results[format] = {
                success: isSuccess,
                response: response.substring(0, 100) + (response.length > 100 ? "..." : "")
            };

            console.log(`  Result: ${isSuccess ? "SUCCESS" : "FAILED"}`);

            // If successful, verify the crop was added with the correct date
            if (isSuccess) {
                // Find the crop we just added
                const crop = await prisma.crop.findFirst({
                    where: {
                        name: cropName
                    }
                });

                if (crop) {
                    console.log(`  Crop found in database with ID: ${crop.id}`);
                    console.log(`  Stored plantingDate: ${crop.plantingDate}`);

                    // Verify the stored date matches what we entered
                    const dateMatches = crop.plantingDate === format;
                    console.log(`  Date matches input: ${dateMatches}`);

                    results[format].dateMatches = dateMatches;
                    results[format].storedDate = crop.plantingDate;
                } else {
                    console.log(`  Crop not found in database!`);
                    results[format].dateMatches = false;
                }
            }
        } catch (error) {
            console.error(`  Error testing format '${format}':`, error.message);
            results[format] = {
                success: false,
                error: error.message
            };
        }

        // Add a small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Print summary
    console.log("\n=== SUMMARY OF RESULTS ===");
    console.log("Format                      | Success | Date Matches | Stored Date");
    console.log("----------------------------|---------|--------------|------------");

    for (const [format, result] of Object.entries(results)) {
        const formattedFormat = format.padEnd(28);
        const formattedSuccess = (result.success ? "YES" : "NO").padEnd(9);
        const formattedMatch = (result.dateMatches === undefined ? "N/A" : (result.dateMatches ? "YES" : "NO")).padEnd(14);
        const storedDate = result.storedDate || "N/A";
        console.log(`${formattedFormat}| ${formattedSuccess}| ${formattedMatch}| ${storedDate}`);
    }
}

// Run the test
testStringDate()
    .then(() => {
        console.log("\nTest completed");
        process.exit(0);
    })
    .catch(error => {
        console.error("Error running test:", error);
        process.exit(1);
    });
