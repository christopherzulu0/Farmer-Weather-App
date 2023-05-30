const mongoose = require('mongoose');
const shortid = require('shortid');




const UserSchema = mongoose.Schema({
    Name: {
       type: String,
       required: true,
     },
     Email: {
       type: String,
       required: true,
     },
     Travel_Month: {
       type: String,
       required: true,
     },
    Budget: {
       type: Number,
       required: true,
     },
     Travel_Interest: {
       type: Number,
       required: true,
     },
     pin: {
       type: String,
       required:true
     },
    phoneNumber: {
      type: String,
      required:true
    },
     
   });

const User = mongoose.model('User', UserSchema);
// const LoanRequest = mongoose.model('LoanRequest', loanRequestSchema);

module.exports = {User};
