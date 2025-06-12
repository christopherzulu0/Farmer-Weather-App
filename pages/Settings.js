const prisma = require('../prisma/client');
const crypto = require('crypto');

// Helper function to hash passwords using crypto instead of bcrypt
const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
};

// Helper function to verify passwords
const verifyPassword = (password, hashedPassword) => {
  const [salt, storedHash] = hashedPassword.split(':');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return storedHash === hash;
};

const Settings = {
    UserSettings: async (textArray, phoneNumber) => {
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
                // Main settings menu
                response = `CON Settings:
                1. View profile
                2. Update profile
                3. Change PIN
                4. Notification preferences
                5. Language settings
                6. Help & Support
                7. Back to Main Menu`;
                return response;
            }

            // View profile
            else if (level === 2 && textArray[1] === '1') {
                response = `END Your Profile:

                Name: ${user.name}
                Phone: ${user.phoneNumber}
                Email: ${user.email || 'Not provided'}
                Location: ${user.location}
                Role: ${user.role}
                Account Created: ${new Date(user.createdAt).toLocaleDateString()}`;
                return response;
            }

            // Update profile
            else if (level === 2 && textArray[1] === '2') {
                response = `CON Update Profile:
                1. Update name
                2. Update email
                3. Update location
                4. Back to Settings`;
                return response;
            }

            // Update name
            else if (level === 3 && textArray[1] === '2' && textArray[2] === '1') {
                response = `CON Current name: ${user.name}
                Enter new name:`;
                return response;
            }

            // Update name - save
            else if (level === 4 && textArray[1] === '2' && textArray[2] === '1') {
                const newName = textArray[3];

                // Update the user's name in the database
                await prisma.user.update({
                    where: { id: user.id },
                    data: { name: newName }
                });

                response = `END Your name has been updated from "${user.name}" to "${newName}".`;
                return response;
            }

            // Update email
            else if (level === 3 && textArray[1] === '2' && textArray[2] === '2') {
                response = `CON Current email: ${user.email || 'Not provided'}
                Enter new email (or 0 to remove):`;
                return response;
            }

            // Update email - save
            else if (level === 4 && textArray[1] === '2' && textArray[2] === '2') {
                const newEmail = textArray[3] === '0' ? null : textArray[3];

                // Update the user's email in the database
                await prisma.user.update({
                    where: { id: user.id },
                    data: { email: newEmail }
                });

                if (newEmail) {
                    response = `END Your email has been updated to "${newEmail}".`;
                } else {
                    response = `END Your email has been removed.`;
                }
                return response;
            }

            // Update location
            else if (level === 3 && textArray[1] === '2' && textArray[2] === '3') {
                response = `CON Current location: ${user.location}
                Enter new location:`;
                return response;
            }

            // Update location - save
            else if (level === 4 && textArray[1] === '2' && textArray[2] === '3') {
                const newLocation = textArray[3];

                // Update the user's location in the database
                await prisma.user.update({
                    where: { id: user.id },
                    data: { location: newLocation }
                });

                response = `END Your location has been updated from "${user.location}" to "${newLocation}".`;
                return response;
            }

            // Change PIN
            else if (level === 2 && textArray[1] === '3') {
                response = `CON Enter your current PIN:`;
                return response;
            }

            // Change PIN - enter new PIN
            else if (level === 3 && textArray[1] === '3') {
                const currentPin = textArray[2];

                // Verify the current PIN
                const isValidPin = verifyPassword(currentPin, user.pin);

                if (!isValidPin) {
                    return "END Incorrect PIN. Please try again.";
                }

                response = `CON Enter new PIN (4 digits):`;
                return response;
            }

            // Change PIN - confirm new PIN
            else if (level === 4 && textArray[1] === '3') {
                const newPin = textArray[3];

                // Check if the PIN is 4 digits
                if (newPin.length !== 4 || isNaN(newPin)) {
                    return "END PIN must be 4 digits. Please try again.";
                }

                response = `CON Confirm new PIN:`;
                return response;
            }

            // Change PIN - save
            else if (level === 5 && textArray[1] === '3') {
                const newPin = textArray[3];
                const confirmPin = textArray[4];

                // Check if PINs match
                if (newPin !== confirmPin) {
                    return "END PINs do not match. Please try again.";
                }

                // Hash the new PIN
                const hashedPin = hashPassword(newPin);

                // Update the user's PIN in the database
                await prisma.user.update({
                    where: { id: user.id },
                    data: { pin: hashedPin }
                });

                response = `END Your PIN has been updated successfully.`;
                return response;
            }

            // Notification preferences
            else if (level === 2 && textArray[1] === '4') {
                response = `CON Notification Preferences:
                1. Weather alerts
                2. Crop advice notifications
                3. Market price alerts
                4. SMS notifications
                5. Back to Settings`;
                return response;
            }

            // Weather alerts
            else if (level === 3 && textArray[1] === '4' && textArray[2] === '1') {
                response = `CON Weather Alert Settings:
                1. Enable all weather alerts
                2. Disable all weather alerts
                3. Customize alert types
                4. Back to Notification Preferences`;
                return response;
            }

            // Language settings
            else if (level === 2 && textArray[1] === '5') {
                response = `CON Select your preferred language:
                1. English
                2. French (Français)
                3. Spanish (Español)
                4. Bemba
                5. Nyanja
                6. Back to Settings`;
                return response;
            }

            // Language settings - save
            else if (level === 3 && textArray[1] === '5') {
                const languageIndex = parseInt(textArray[2]);
                let language;

                switch (languageIndex) {
                    case 1:
                        language = 'English';
                        break;
                    case 2:
                        language = 'French';
                        break;
                    case 3:
                        language = 'Spanish';
                        break;
                    case 4:
                        language = 'Bemba';
                        break;
                    case 5:
                        language = 'Nyanja';
                        break;
                    case 6:
                        // Back to settings
                        return "CON";
                    default:
                        return "END Invalid language selection.";
                }

                // In a real application, this would be stored in the database
                // For now, we'll just return a confirmation message
                response = `END Your language has been set to ${language}.`;
                return response;
            }

            // Help & Support
            else if (level === 2 && textArray[1] === '6') {
                response = `END Help & Support:

                For assistance with the Farmers Weather Service, please contact:

                Customer Support: +260 97X XXX XXX
                Email: support@farmersweather.com

                Operating hours: Mon-Fri, 8:00 AM - 5:00 PM

                For agricultural emergencies, please use the Farm Emergency Services option from the main menu.`;
                return response;
            }

            // Back to Main Menu
            else if (level === 2 && textArray[1] === '7') {
                // This will be handled by the main menu logic
                return "CON";
            }

            else {
                return "END Invalid option. Please try again.";
            }
        } catch (error) {
            console.error('Error in Settings function:', error);
            return "END An error occurred. Please try again later.";
        }
    }
}

module.exports = Settings;
