function countryCode (number) {
    if (number.slice(0,4) != "+260") {
       number = number.slice(1);
      let newNumber = `+260${number}`
      return newNumber
    } else {
      return number
    }
  }
  
module.exports = countryCode;
  