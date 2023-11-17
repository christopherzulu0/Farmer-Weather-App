const ChangeLanguage = {
    Langauges: async (textArray, phoneNumber) => {
        const level = textArray.length;
        let response = "";
        
        if(level ===1){
          response  = `CON Welcome to languages area`;
          return response;
        }
        
      }
}

module.exports = ChangeLanguage;