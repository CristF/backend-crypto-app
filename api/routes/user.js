//const express = require('express');
//const user = require('../models/User');
import express from 'express';
import User from '../models/User.js';
import { check, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';

// to complete later
// import jwt from 'jsonwebtoken';
// import nodemailer from 'nodemailer'; // for sending emails
// jwt secret key, to be stored in .env file

const router = express.Router();
router.post('/register',
    [
        // Validate required fields
        check('email', 'Email is required').isEmail(),
        check('password', 'Password must be at least 6 characters long').isLength({ min: 6 }),
        check('userName', 'Username is required')
    ],
    async (req, res) => {
        // Check for validation errors
        console.log('Here is the request body', req.body); // Debug incoming data
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { userName, email, password, firstName, lastName, token} = req.body;
        // Validate required fields
        try {
            //finding an existing user with the same email or username
            const existingUser = await User.findOne({ email });
            const existingUsername = await User.findOne({ userName });
            if (existingUser || existingUsername) {
                return res.status(400).json({ message: 'User already exists' });
            };//
            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);
            // Create a new user instance
            const newUser = new User({
                userName, 
                email,
                password: hashedPassword,
                name: {
                    firstName,
                    lastName
                },
                token,
                isVerified: false // Default to false, will be updated later
            });
            // Save the user to the database
            const savedUser = await newUser.save();
            console.log('User saved successfully:', savedUser);
            res.status(201).json({message: 'User registered successfully'});
            
        } catch (error) {
            console.error('Error registering user,', error);
            return res.status(500).json({ message: 'Server error' });
        }

});

router.post('/login', [
    check('userName', 'Username is required').exists(),
    check('password', 'Password is required').exists()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { userName, password } = req.body;
    

    try {
        const existingUser = await User.findOne({ userName });
        // Add detailed password debugging
        // console.log('Password details:', {
        //     providedPassword: password,
        //     storedHash: existingUser.password,
        //     passwordLength: password.length,
        //     hashLength: existingUser.password.length
        // });

        if (!existingUser || ! (await bcrypt.compare(password, existingUser.password))) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        if (!existingUser.isVerified) {
            return res.status(400).json({ message: 'Email not verified' });
        }

        

        // Success case
        console.log('Login successful.');
        res.status(200).json({ 
            message: 'Login successful',
            user: {
                userName: existingUser.userName,
                email: existingUser.email
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/getName', async (req, res) => {
    res.send('Hello World!');
})

//module.exports = router;
export default router;