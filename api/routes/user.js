//const express = require('express');
//const user = require('../models/User');
import express from 'express';
import User from '../models/User.js';
import { check, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer'; // for sending emails
//import { verifyToken } from '../middleware/userMiddleware.js';
dotenv.config();

// to complete later
// update email link so that it uses the frontend link instead of localhost:5000

let transporter;
try {
    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        },
    });
    console.log('Email transporter created successfully');
} catch (error) {
    console.error('Error creating email transporter:', error);
    throw new Error('Failed to initialize email transporter');
}
//testing wtih ether
// const testAccount = await nodemailer.createTestAccount();
// const transporter = nodemailer.createTransport({
//     host: 'smtp.ethereal.email',
//     port: 587,
//     secure: false, // true for 465, false for other ports
//     auth: {
//         user: testAccount.user, // generated ethereal user
//         pass: testAccount.pass, // generated ethereal password
//     },
// });


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
        const { userName, email, password, firstName, lastName} = req.body;
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
            // Generate a verification token (for email verification)
            const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });
            
            // Send verification email (to be implemented)
            const info = await transporter.sendMail({
                //this ones are for testing with ethereal
                //from: testAccount.user, // sender address
                // this ones are for testing with gmail
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Email Verification',
                html: `<p>Please verify your email by clicking the link: <a href="http://localhost:5000/api/user/verify-email?token=${token}"> CLICK HERE</a></p>`,
            });

            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

            // Create a new user instance
            const newUser = new User({
                userName, 
                email,
                password: hashedPassword,
                name: {
                    firstName,
                    lastName
                },
                token, // Store the verification token
                isVerified: false // Default to false, will be updated later
            });
            // Save the user to the database
            const savedUser = await newUser.save();
            console.log('User saved successfully:', savedUser);
            res.status(201).json({message: 'User registered successfully', token: token}); // Send the token back to the client
            
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
        const token = jwt.sign({ id: existingUser._id}, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ 
            message: 'Login successful',
            user: {
                userName: existingUser.userName,
                email: existingUser.email,
                token: token // Send the token back to the client
            }
            
             // Generate a token for the user
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/verify-email', async (req, res) => {
    const { token } = req.query;
    if (!token) {
        return res.status(400).json({ message: 'No token provided' });
    }
    console.log('Token received for verification:', token);

    try {
        // decode the token to get the email
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const email = decoded.email;
        // find the user by email
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(400).json({ message: 'Invalid token' });
        }
        // check if the user is already verified
        if (user.isVerified) {
            return res.status(400).json({ message: 'Email already verified.' });
        }
        // update the user's isVerified field to true
        user.isVerified = true;
        await user.save();
        console.log('Email verified successfully:', user);
        res.status(200).json({ message: 'Email verified successfully' });

    } catch (error) {
        console.error('Error verifying email:', error);
        res.status(500).json({ message: 'Server error' });
    }
})

router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (!existingUser) {
            return res.status(400).json({ message: 'User not found' });
        }
        // Generate a password reset token
        const resetToken = jwt.sign({ id: existingUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        //to implement : nodemailer to send the reset token to the user's email

        // Send the reset token to the user's email (not implemented yet)
        // so for now we will just log it as the api response
        res.status(200).json({ message: 'Password reset token sent to email', token: resetToken });
        //
    } catch (error) {
        console.error('Error in resetting password:', error);
        res.status(500).json({ message: 'Server error' });
    }
})

router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = await User.findById(decoded.id);

        if(!userId) return res.status(400).json({ message: 'User not found'});
        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        //update password
        userId.password = hashedPassword;
        await userId.save();

        console.log('Password reset successfully:', userId);
        res.status(200).json({ message: 'Password reset successfully' });
    }
    catch (error) {
        console.error('Error in resetting password:', error);
        return res.status(400).json({ message: 'Invalid or expired token' });
    }
})

//module.exports = router;
export default router;