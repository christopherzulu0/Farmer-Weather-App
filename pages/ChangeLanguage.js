const prisma = require('../prisma/client');
const i18n = require('i18n');

const ChangeLanguage = {
    Langauges: async (textArray, phoneNumber) => {
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
                response = `CON Select your preferred language:
1. English
2. French (Français)
3. Spanish (Español)
4. Bemba
5. Nyanja
6. Back to Main Menu`;
                return response;
            }

            else if (level === 2) {
                let locale;
                switch (textArray[1]) {
                    case '1':
                        locale = 'en';
                        break;
                    case '2':
                        locale = 'fr';
                        break;
                    case '3':
                        locale = 'es';
                        break;
                    case '4':
                        locale = 'bem';
                        break;
                    case '5':
                        locale = 'nya';
                        break;
                    case '6':
                        // Back to main menu
                        return "CON";
                    default:
                        return "END Invalid option. Please try again.";
                }

                // In a real application, you would store the user's language preference
                // For now, we'll just return a confirmation message
                response = `END Your language has been set to ${locale === 'en' ? 'English' : 
                                                              locale === 'fr' ? 'French' : 
                                                              locale === 'es' ? 'Spanish' : 
                                                              locale === 'bem' ? 'Bemba' : 'Nyanja'}.`;
                return response;
            }

            else {
                return "END Invalid option. Please try again.";
            }
        } catch (error) {
            console.error('Error in Language function:', error);
            return "END An error occurred. Please try again later.";
        }
    }
}

module.exports = ChangeLanguage;
