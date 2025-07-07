// Test script to verify edge cases for date formats
const { Crops } = require('./pages/CropManagement');
const prisma = require('./prisma/client');

async function testDateEdgeCases() {
    console.log("Testing edge cases for date formats");
    console.log("==================================");

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

    // Define edge cases to test
    const edgeCases = [
        { case: "Leading whitespace", value: "  01/02/2026", expected: "success" },
        { case: "Trailing whitespace", value: "01/02/2026  ", expected: "success" },
        { case: "Mixed whitespace", value: " 01 / 02 / 2026 ", expected: "success" },
        { case: "Unusual separators", value: "01#02#2026", expected: "error" },
        { case: "Invalid day (too high)", value: "32/01/2026", expected: "error" },
        { case: "Invalid day (zero)", value: "00/01/2026", expected: "error" },
        { case: "Invalid month (too high)", value: "01/13/2026", expected: "error" },
        { case: "Invalid month (zero)", value: "01/00/2026", expected: "error" },
        { case: "Year too low", value: "01/02/1999", expected: "error" },
        { case: "Year exactly 2000", value: "01/02/2000", expected: "error" },
        { case: "Year exactly 2001", value: "01/02/2001", expected: "success" },
        { case: "Invalid date (Feb 30)", value: "30/02/2026", expected: "error" },
        { case: "Empty string", value: "", expected: "error" },
        { case: "Non-date string", value: "not-a-date", expected: "error" },
        { case: "Special characters", value: "01/02/2026!", expected: "error" },
        { case: "SQL injection attempt", value: "01/02/2026'; DROP TABLE crops; --", expected: "error" },
        { case: "Very long string", value: "01/02/" + "2".repeat(1000), expected: "error" },
        { case: "Mixed format (DD/MM with YYYY-MM-DD)", value: "01/02-2026", expected: "success" }
    ];

    // Setup for testing - get to the point where we can enter a date
    const setupArray1 = ["2", "2"];
    console.log("\nSetting up test - selecting 'Add a new crop'");
    await Crops(setupArray1, phoneNumber);

    const setupArray2 = ["2", "2", "TestCrop"];
    console.log("Setting up test - entering crop name");
    await Crops(setupArray2, phoneNumber);

    // Test each edge case and collect results
    const results = {};

    console.log("\nTesting edge cases:");
    for (const edgeCase of edgeCases) {
        console.log(`\nTesting: ${edgeCase.case}`);
        console.log(`Value: "${edgeCase.value}"`);
        console.log(`Expected: ${edgeCase.expected}`);

        try {
            const textArray = ["2", "2", "TestCrop", edgeCase.value];
            const response = await Crops(textArray, phoneNumber);

            // Check if the response indicates success or failure
            const isSuccess = response.includes("successfully");
            const isError = response.includes("Invalid date format");

            const actualResult = isSuccess ? "success" : (isError ? "error" : "unknown");
            const matchesExpected = actualResult === edgeCase.expected;

            results[edgeCase.case] = {
                value: edgeCase.value,
                expected: edgeCase.expected,
                actual: actualResult,
                matches: matchesExpected,
                response: response.substring(0, 100) + (response.length > 100 ? "..." : "")
            };

            console.log(`  Result: ${actualResult.toUpperCase()} (${matchesExpected ? "MATCHES EXPECTED" : "DOES NOT MATCH EXPECTED"})`);

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
            console.error(`  Error testing case '${edgeCase.case}':`, error.message);
            results[edgeCase.case] = {
                value: edgeCase.value,
                expected: edgeCase.expected,
                actual: "error",
                matches: edgeCase.expected === "error",
                response: error.message
            };
        }

        // Add a small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Print summary
    console.log("\n=== SUMMARY OF RESULTS ===");
    console.log("Case                      | Value                     | Expected | Actual  | Matches | Response");
    console.log("------------------------- | ------------------------- | -------- | ------- | ------- | ---------------------------");

    for (const [caseName, result] of Object.entries(results)) {
        const formattedCase = caseName.padEnd(25);
        const formattedValue = result.value.toString().substring(0, 25).padEnd(25);
        const formattedExpected = result.expected.padEnd(8);
        const formattedActual = result.actual.padEnd(7);
        const formattedMatches = result.matches ? "YES     " : "NO      ";
        console.log(`${formattedCase}| ${formattedValue}| ${formattedExpected}| ${formattedActual}| ${formattedMatches}| ${result.response}`);
    }

    // Count matches and mismatches
    const matchCount = Object.values(results).filter(r => r.matches).length;
    const mismatchCount = Object.values(results).filter(r => !r.matches).length;

    console.log(`\nTotal edge cases tested: ${Object.keys(results).length}`);
    console.log(`Matches expected behavior: ${matchCount}`);
    console.log(`Does not match expected behavior: ${mismatchCount}`);

    // List mismatches
    if (mismatchCount > 0) {
        console.log("\nMismatches:");
        for (const [caseName, result] of Object.entries(results)) {
            if (!result.matches) {
                console.log(`- ${caseName}: Expected ${result.expected}, got ${result.actual}`);
            }
        }
    }
}

// Run the test
testDateEdgeCases()
    .then(() => {
        console.log("\nTest completed");
        process.exit(0);
    })
    .catch(error => {
        console.error("Error running test:", error);
        process.exit(1);
    });
