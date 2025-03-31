//const mongoose = require('mongoose');
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    // Define the schema for the User model
    //name will have first and last name
    userName: {type: String, required: true, unique:true},
    email : {type: String, required: true, unique:true},
    password: {type: String, required: true},
    name :{
        firstName: {type: String, required: true},
        lastName: {type: String, required: true},
    },
    // verification token for email, incomplete as of now
    token: {type: String},
    // is email verified, incomplete as of now
    isVerified: {type: Boolean, default: false},
});

//module.exports = mongoose.model('User', userSchema);
export default mongoose.model('User', userSchema);