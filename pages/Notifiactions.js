const Notifications = {
    Alert: async (textArray, phoneNumber) => {
        const level = textArray.length;
        let response = "";
        
        if(level ===1){
          response  = `CON Welcome to notifications area`;
          return response;
        }
        
      },
}

module.exports = Notifications;