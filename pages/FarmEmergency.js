const prisma = require('../prisma/client');
const { sendWeatherAlert } = require('../util/africasTalking');

const FarmEmergency = {
    Emergency: async (textArray, phoneNumber) => {
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
                // Main emergency menu
                response = `CON Farm Emergency Services:
                1. Report crop disease
                2. Report pest infestation
                3. Report livestock emergency
                4. Report weather damage
                5. Contact agricultural extension officer
                6. Back to Main Menu`;
                return response;
            }

            // Report crop disease
            else if (level === 2 && textArray[1] === '1') {
                // If user has no farms, prompt them to add one
                if (!user.farms || user.farms.length === 0) {
                    return "END You don't have any farms registered. Please add a farm first.";
                }

                response = `CON Select the affected crop:
                1. Maize
                2. Wheat
                3. Soybeans
                4. Rice
                5. Tomatoes
                6. Potatoes
                7. Other (specify)`;
                return response;
            }

            // Report crop disease - describe symptoms
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
                        cropName = "Other";
                        break;
                    default:
                        return "END Invalid crop selection.";
                }

                response = `CON Describe the symptoms (select):
                1. Yellow/brown spots on leaves
                2. Wilting plants
                3. White powdery substance
                4. Stunted growth
                5. Rotting stems/roots
                6. Other symptoms`;
                return response;
            }

            // Report crop disease - confirm and submit
            else if (level === 4 && textArray[1] === '1') {
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
                        cropName = "Other";
                        break;
                    default:
                        return "END Invalid crop selection.";
                }

                const symptomIndex = parseInt(textArray[3]);
                let symptom;

                switch (symptomIndex) {
                    case 1:
                        symptom = "Yellow/brown spots on leaves";
                        break;
                    case 2:
                        symptom = "Wilting plants";
                        break;
                    case 3:
                        symptom = "White powdery substance";
                        break;
                    case 4:
                        symptom = "Stunted growth";
                        break;
                    case 5:
                        symptom = "Rotting stems/roots";
                        break;
                    case 6:
                        symptom = "Other symptoms";
                        break;
                    default:
                        return "END Invalid symptom selection.";
                }

                // In a real application, this would be stored in the database and sent to agricultural officers
                // For now, we'll just return a confirmation message

                // Send SMS notification to the user
                const message = `Your crop disease report for ${cropName} with symptoms: ${symptom} has been received. An agricultural officer will contact you soon.`;
                await sendWeatherAlert(phoneNumber, message);

                response = `END Your crop disease report has been submitted. 
                
                Crop: ${cropName}
                Symptoms: ${symptom}
                
                An agricultural extension officer will contact you soon with advice. A confirmation SMS has been sent to your phone.`;
                return response;
            }

            // Report pest infestation
            else if (level === 2 && textArray[1] === '2') {
                response = `CON Select the type of pest:
                1. Insects (e.g., aphids, beetles)
                2. Rodents
                3. Birds
                4. Worms/caterpillars
                5. Other pests`;
                return response;
            }

            // Report pest infestation - describe severity
            else if (level === 3 && textArray[1] === '2') {
                const pestIndex = parseInt(textArray[2]);
                let pestType;

                switch (pestIndex) {
                    case 1:
                        pestType = "Insects";
                        break;
                    case 2:
                        pestType = "Rodents";
                        break;
                    case 3:
                        pestType = "Birds";
                        break;
                    case 4:
                        pestType = "Worms/caterpillars";
                        break;
                    case 5:
                        pestType = "Other pests";
                        break;
                    default:
                        return "END Invalid pest selection.";
                }

                response = `CON How severe is the infestation?
                1. Mild - few pests visible
                2. Moderate - noticeable damage
                3. Severe - significant crop damage
                4. Critical - risk of total crop loss`;
                return response;
            }

            // Report pest infestation - confirm and submit
            else if (level === 4 && textArray[1] === '2') {
                const pestIndex = parseInt(textArray[2]);
                let pestType;

                switch (pestIndex) {
                    case 1:
                        pestType = "Insects";
                        break;
                    case 2:
                        pestType = "Rodents";
                        break;
                    case 3:
                        pestType = "Birds";
                        break;
                    case 4:
                        pestType = "Worms/caterpillars";
                        break;
                    case 5:
                        pestType = "Other pests";
                        break;
                    default:
                        return "END Invalid pest selection.";
                }

                const severityIndex = parseInt(textArray[3]);
                let severity;

                switch (severityIndex) {
                    case 1:
                        severity = "Mild - few pests visible";
                        break;
                    case 2:
                        severity = "Moderate - noticeable damage";
                        break;
                    case 3:
                        severity = "Severe - significant crop damage";
                        break;
                    case 4:
                        severity = "Critical - risk of total crop loss";
                        break;
                    default:
                        return "END Invalid severity selection.";
                }

                // In a real application, this would be stored in the database and sent to agricultural officers
                // For now, we'll just return a confirmation message

                // Send SMS notification to the user
                const message = `Your pest infestation report for ${pestType} with severity: ${severity} has been received. An agricultural officer will contact you soon.`;
                await sendWeatherAlert(phoneNumber, message);

                response = `END Your pest infestation report has been submitted. 
                
                Pest Type: ${pestType}
                Severity: ${severity}
                
                An agricultural extension officer will contact you soon with advice. A confirmation SMS has been sent to your phone.`;
                return response;
            }

            // Report weather damage
            else if (level === 2 && textArray[1] === '4') {
                response = `CON Select the type of weather damage:
                1. Flood damage
                2. Drought damage
                3. Hail damage
                4. Wind damage
                5. Frost damage
                6. Other weather damage`;
                return response;
            }

            // Report weather damage - describe severity
            else if (level === 3 && textArray[1] === '4') {
                const damageIndex = parseInt(textArray[2]);
                let damageType;

                switch (damageIndex) {
                    case 1:
                        damageType = "Flood damage";
                        break;
                    case 2:
                        damageType = "Drought damage";
                        break;
                    case 3:
                        damageType = "Hail damage";
                        break;
                    case 4:
                        damageType = "Wind damage";
                        break;
                    case 5:
                        damageType = "Frost damage";
                        break;
                    case 6:
                        damageType = "Other weather damage";
                        break;
                    default:
                        return "END Invalid damage type selection.";
                }

                response = `CON How severe is the damage?
                1. Mild - minimal crop impact
                2. Moderate - partial crop damage
                3. Severe - significant crop loss
                4. Critical - total crop destruction`;
                return response;
            }

            // Report weather damage - confirm and submit
            else if (level === 4 && textArray[1] === '4') {
                const damageIndex = parseInt(textArray[2]);
                let damageType;

                switch (damageIndex) {
                    case 1:
                        damageType = "Flood damage";
                        break;
                    case 2:
                        damageType = "Drought damage";
                        break;
                    case 3:
                        damageType = "Hail damage";
                        break;
                    case 4:
                        damageType = "Wind damage";
                        break;
                    case 5:
                        damageType = "Frost damage";
                        break;
                    case 6:
                        damageType = "Other weather damage";
                        break;
                    default:
                        return "END Invalid damage type selection.";
                }

                const severityIndex = parseInt(textArray[3]);
                let severity;

                switch (severityIndex) {
                    case 1:
                        severity = "Mild - minimal crop impact";
                        break;
                    case 2:
                        severity = "Moderate - partial crop damage";
                        break;
                    case 3:
                        severity = "Severe - significant crop loss";
                        break;
                    case 4:
                        severity = "Critical - total crop destruction";
                        break;
                    default:
                        return "END Invalid severity selection.";
                }

                // In a real application, this would be stored in the database and sent to agricultural officers
                // For now, we'll just return a confirmation message

                // Send SMS notification to the user
                const message = `Your weather damage report for ${damageType} with severity: ${severity} has been received. An agricultural officer will contact you soon.`;
                await sendWeatherAlert(phoneNumber, message);

                response = `END Your weather damage report has been submitted. 
                
                Damage Type: ${damageType}
                Severity: ${severity}
                
                An agricultural extension officer will contact you soon with advice. A confirmation SMS has been sent to your phone.`;
                return response;
            }

            // Contact agricultural extension officer
            else if (level === 2 && textArray[1] === '5') {
                // In a real application, these would be fetched from a database
                // For now, we'll use static sample data
                response = `END Agricultural Extension Officers:
                
                Central Region:
                Mr. John Banda: +260 97X XXX XXX
                
                Eastern Region:
                Ms. Mary Phiri: +260 96X XXX XXX
                
                Western Region:
                Mr. David Mulenga: +260 95X XXX XXX
                
                Northern Region:
                Ms. Sarah Tembo: +260 97X XXX XXX
                
                Call any of these officers for immediate assistance.`;
                return response;
            }

            // Back to Main Menu
            else if (level === 2 && textArray[1] === '6') {
                // This will be handled by the main menu logic
                return "CON";
            }

            else {
                return "END Invalid option. Please try again.";
            }
        } catch (error) {
            console.error('Error in Emergency function:', error);
            return "END An error occurred. Please try again later.";
        }
    }
}

module.exports = FarmEmergency;
