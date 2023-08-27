const mongoose = require('mongoose');
const shortid = require('shortid');

const ActivitySchema = mongoose.Schema({
  name: {
    type: String,
    required: true
  }
});

const PointOfInterestSchema = mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
});

const DestinationSchema = mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  activities: [ActivitySchema],
  pointsOfInterest: [PointOfInterestSchema] // New field for Points of Interest
});

const EmergencySchema = mongoose.Schema({
  emergencyType: String,
  description: String,
  emergencyContact: {
    name: String,
    phoneNumber: Number
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const TransportationSchema = mongoose.Schema({
  location: {
    type: String,
    required: true
  },
  transportOptions: [String]
});

const AccommodationSchema = mongoose.Schema({
  location: {
    type: String,
    required: true
  },
  accommodations: [String]
});

const RecommendationSchema = mongoose.Schema({
  location: {
    type: String,
    required: true
  },
  recommendatons: [String]
});

const PointOfInterest = mongoose.model('PointOfInterest', PointOfInterestSchema);
const Destination = mongoose.model('Destination', DestinationSchema);
const Emergency = mongoose.model('Emergency', EmergencySchema);
const Transportation = mongoose.model('Transportation', TransportationSchema);
const Accommodation = mongoose.model('Accommodation', AccommodationSchema);
const Recommendations = mongoose.model('Recommendations', RecommendationSchema);

const UserSchema = mongoose.Schema({
  Name: {
    type: String,
    required: true
  },
  Email: {
    type: String,
    required: true
  },
  Travel_Month: {
    type: String,
    required: true
  },
  Budget: {
    type: Number,
    required: true
  },
  Travel_Interest: {
    type: [String],
    required: true
  },
  pin: {
    type: String,
    required: true
  },
  phoneNumber: {
    type:Number,
    required: true
  },
  destinations: [DestinationSchema],
  emergencies: [EmergencySchema],
  transportations: [TransportationSchema],
  accommodations: [AccommodationSchema],
  recommendatons : [RecommendationSchema]
});

const User = mongoose.model('User', UserSchema);

module.exports = {
  User,
  Destination,
  Emergency,
  Transportation,
  Accommodation,
  Recommendations,
  PointOfInterest
};
