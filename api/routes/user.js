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
            const token = jwt.sign({ email: email }, process.env.JWT_SECRET, { expiresIn: '1h' });
            
            // Send verification email (to be implemented)
            const verificationUrl = `${process.env.FRONTEND_URL}/api/user/verify-email?token=${token}`;

            const info = await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Email Verification',
                html: `<p>Please verify your email by clicking the link: <a href="${verificationUrl}" target="_blank" rel="noopener noreferrer">${verificationUrl}</a></p>`,
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
        return res.status(400).send(`
            <html>
                <head>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            height: 100vh;
                            margin: 0;
                            background-color: #0864c7;
                            color: white;
                            text-align: center;
                            line-height: 1.6;
                        }
                    </style>
                </head>
                <body>
                    <h1>Error: No verification token provided</h1>
                </body>
            </html>
        `);
    }

    try {
        // Add token validation check
        if (token.includes('eyJ') && token.split('.').length !== 3) {
            return res.status(400).json({ message: 'Invalid token format' });
        }

        // decode the token to get the email
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (!decoded.email) {
            return res.status(400).json({ message: 'Invalid token payload' });
        }

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
        res.send(`
            <html>
                <head>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            height: 100vh;
                            margin: 0;
                            background-color: #0864c7;
                            color: white;
                            text-align: center;
                            line-height: 1.6;
                        }
                        .message {
                            font-size: 24px;
                            margin-bottom: 16px;
                        }
                        .sub-message {
                            font-size: 18px;
                            opacity: 0.9;
                        }
                    </style>
                </head>
                <body>
                    <div class="message">Your email has been verified</div>
                    <div class="sub-message">You may now close this tab</div>
                </body>
            </html>
        `);

    } catch (error) {
        console.error('Error verifying email:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(400).json({ message: 'Invalid token format' });
        }
        res.status(500).send(`
            <html>
                <head>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            height: 100vh;
                            margin: 0;
                            background-color: #0864c7;
                            color: white;
                            text-align: center;
                            line-height: 1.6;
                        }
                    </style>
                </head>
                <body>
                    <h1>Error verifying email</h1>
                    <p>${error.message}</p>
                </body>
            </html>
        `);
    }
});

router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (!existingUser) {
            // For security, don't reveal if user exists
            return res.status(200).json({ 
                message: 'If an account exists with this email, a password reset link will be sent.' 
            });
        }

        // Generate a password reset token
        const resetToken = jwt.sign(
            { id: existingUser._id }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1h' }
        );

        // Create password reset URL
        const resetUrl = `${process.env.FRONTEND_URL}/forgot-password/${resetToken}`;

        // Send the reset token to the user's email
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset Request',
            html: `
                <h1>Password Reset Request</h1>
                <p>You requested a password reset. Click the link below to reset your password:</p>
                <a href="${resetUrl}">${resetUrl}</a>
                <p>This link will expire in 1 hour.</p>
                <p>If you didn't request this, please ignore this email.</p>
            `
        });

        console.log('Reset email sent:', info.messageId);
        res.status(200).json({ 
            message: 'Password reset link has been sent to your email.' 
        });

    } catch (error) {
        console.error('Error in forgot password:', error);
        res.status(500).json({ 
            message: 'An error occurred while processing your request.' 
        });
    }
});

//module.exports = router;
export default router;