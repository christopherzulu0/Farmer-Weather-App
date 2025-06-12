const prisma = require('../prisma/client');

const MarketPrices = {
    Prices: async (textArray, phoneNumber) => {
        const level = textArray.length;
        let response = "";

        try {
            // Find the user by phone number
            const user = await prisma.user.findUnique({
                where: { phoneNumber }
            });

            if (!user) {
                return "END User not found. Please register first.";
            }

            if (level === 1) {
                // Main market prices menu
                response = `CON Market Prices:
                1. Check prices by crop
                2. Check prices by market
                3. Price trends
                4. Price alerts
                5. Back to Main Menu`;
                return response;
            }

            // Check prices by crop
            else if (level === 2 && textArray[1] === '1') {
                // In a real application, these would be fetched from a database
                // For now, we'll use a static list of common crops
                response = `CON Select crop:
                1. Maize
                2. Wheat
                3. Soybeans
                4. Rice
                5. Tomatoes
                6. Potatoes
                7. Other crops`;
                return response;
            }

            // Display prices for selected crop
            else if (level === 3 && textArray[1] === '1') {
                const cropIndex = parseInt(textArray[2]);
                let cropName;

                switch (cropIndex) {
                    case 1:
                        cropName = "Maize";
                        break;
                    case 2:
                        cropName = "Wheat";
                        break;
                    case 3:
                        cropName = "Soybeans";
                        break;
                    case 4:
                        cropName = "Rice";
                        break;
                    case 5:
                        cropName = "Tomatoes";
                        break;
                    case 6:
                        cropName = "Potatoes";
                        break;
                    case 7:
                        cropName = "Other crops";
                        break;
                    default:
                        return "END Invalid crop selection.";
                }

                // In a real application, these prices would be fetched from an API or database
                // For now, we'll use static sample data
                response = `END Current Market Prices for ${cropName}:
                
                Lusaka Central Market: K${(Math.random() * 10 + 5).toFixed(2)}/kg
                Ndola Market: K${(Math.random() * 10 + 4).toFixed(2)}/kg
                Kitwe Market: K${(Math.random() * 10 + 4.5).toFixed(2)}/kg
                Chipata Market: K${(Math.random() * 10 + 3.5).toFixed(2)}/kg
                
                Last updated: ${new Date().toLocaleDateString()}`;
                return response;
            }

            // Check prices by market
            else if (level === 2 && textArray[1] === '2') {
                // In a real application, these would be fetched from a database
                // For now, we'll use a static list of common markets
                response = `CON Select market:
                1. Lusaka Central Market
                2. Ndola Market
                3. Kitwe Market
                4. Chipata Market
                5. Other markets`;
                return response;
            }

            // Display prices for selected market
            else if (level === 3 && textArray[1] === '2') {
                const marketIndex = parseInt(textArray[2]);
                let marketName;

                switch (marketIndex) {
                    case 1:
                        marketName = "Lusaka Central Market";
                        break;
                    case 2:
                        marketName = "Ndola Market";
                        break;
                    case 3:
                        marketName = "Kitwe Market";
                        break;
                    case 4:
                        marketName = "Chipata Market";
                        break;
                    case 5:
                        marketName = "Other markets";
                        break;
                    default:
                        return "END Invalid market selection.";
                }

                // In a real application, these prices would be fetched from an API or database
                // For now, we'll use static sample data
                response = `END Current Prices at ${marketName}:
                
                Maize: K${(Math.random() * 5 + 3).toFixed(2)}/kg
                Wheat: K${(Math.random() * 8 + 5).toFixed(2)}/kg
                Soybeans: K${(Math.random() * 12 + 8).toFixed(2)}/kg
                Rice: K${(Math.random() * 10 + 7).toFixed(2)}/kg
                Tomatoes: K${(Math.random() * 6 + 4).toFixed(2)}/kg
                Potatoes: K${(Math.random() * 4 + 2).toFixed(2)}/kg
                
                Last updated: ${new Date().toLocaleDateString()}`;
                return response;
            }

            // Price trends
            else if (level === 2 && textArray[1] === '3') {
                response = `END Market Price Trends (Last 3 months):
                
                Maize: ↑ Increased by 5%
                Wheat: ↓ Decreased by 2%
                Soybeans: ↑ Increased by 8%
                Rice: → Stable
                Tomatoes: ↓ Decreased by 15%
                Potatoes: ↑ Increased by 3%
                
                Note: This is sample data. In a real application, this would be based on actual market data.`;
                return response;
            }

            // Price alerts
            else if (level === 2 && textArray[1] === '4') {
                response = `CON Price Alert Settings:
                1. Set price alert
                2. View my alerts
                3. Remove alerts
                4. Back to Market Prices`;
                return response;
            }

            // Set price alert - select crop
            else if (level === 3 && textArray[1] === '4' && textArray[2] === '1') {
                response = `CON Select crop for price alert:
                1. Maize
                2. Wheat
                3. Soybeans
                4. Rice
                5. Tomatoes
                6. Potatoes`;
                return response;
            }

            // Set price alert - enter price threshold
            else if (level === 4 && textArray[1] === '4' && textArray[2] === '1') {
                const cropIndex = parseInt(textArray[3]);
                let cropName;

                switch (cropIndex) {
                    case 1:
                        cropName = "Maize";
                        break;
                    case 2:
                        cropName = "Wheat";
                        break;
                    case 3:
                        cropName = "Soybeans";
                        break;
                    case 4:
                        cropName = "Rice";
                        break;
                    case 5:
                        cropName = "Tomatoes";
                        break;
                    case 6:
                        cropName = "Potatoes";
                        break;
                    default:
                        return "END Invalid crop selection.";
                }

                response = `CON Enter price threshold for ${cropName} (in Kwacha per kg):`;
                return response;
            }

            // Set price alert - confirm
            else if (level === 5 && textArray[1] === '4' && textArray[2] === '1') {
                const cropIndex = parseInt(textArray[3]);
                let cropName;

                switch (cropIndex) {
                    case 1:
                        cropName = "Maize";
                        break;
                    case 2:
                        cropName = "Wheat";
                        break;
                    case 3:
                        cropName = "Soybeans";
                        break;
                    case 4:
                        cropName = "Rice";
                        break;
                    case 5:
                        cropName = "Tomatoes";
                        break;
                    case 6:
                        cropName = "Potatoes";
                        break;
                    default:
                        return "END Invalid crop selection.";
                }

                const priceThreshold = parseFloat(textArray[4]);

                if (isNaN(priceThreshold) || priceThreshold <= 0) {
                    return "END Invalid price. Please enter a positive number.";
                }

                // In a real application, this would be stored in the database
                // For now, we'll just return a confirmation message
                response = `END Price alert set for ${cropName}. You will be notified when the price reaches K${priceThreshold}/kg.`;
                return response;
            }

            // View my alerts
            else if (level === 3 && textArray[1] === '4' && textArray[2] === '2') {
                // In a real application, these would be fetched from the database
                // For now, we'll use static sample data
                response = `END Your Price Alerts:
                
                1. Maize: K5.00/kg
                2. Soybeans: K10.00/kg
                
                Note: This is sample data. In a real application, this would be based on your actual alerts.`;
                return response;
            }

            // Back to Main Menu
            else if (level === 2 && textArray[1] === '5') {
                // This will be handled by the main menu logic
                return "CON";
            }

            else {
                return "END Invalid option. Please try again.";
            }
        } catch (error) {
            console.error('Error in Market Prices function:', error);
            return "END An error occurred. Please try again later.";
        }
    }
}

module.exports = MarketPrices;
