const express = require('express');
const passport = require('passport');
const User = require('../models/User');
const router = express.Router();
// const nodemailer = require('nodemailer');  // Uncomment this if you plan to send emails

// Register Route (GET)
router.get('/register', (req, res) => {
    res.render('register');  // Renders the registration form
});

router.post('/register', async (req, res) => {
    const { username, email, password, password2 } = req.body;
    let errors = [];

    // Validate the form input
    if (!username || !email || !password || !password2) {
        errors.push({ msg: 'Please enter all fields' });
    }

    if (password !== password2) {
        errors.push({ msg: 'Passwords do not match' });
    }

    if (password.length < 6) {
        errors.push({ msg: 'Password must be at least 6 characters' });
    }

    if (errors.length > 0) {
        return res.render('register', { errors });  // Render with error messages
    }

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            errors.push({ msg: 'Email is already registered' });
            return res.render('register', { errors });
        }

        // Create new user object (password will be hashed automatically in the User model)
        const newUser = new User({
            username,
            email,
            password  // Store plain password; it will be hashed by the pre('save') hook in User model
        });

        // Save the new user to the database
        await newUser.save();
        res.redirect('/auth/login');  // Redirect to login after successful registration

    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Login Route (GET)
router.get('/login', (req, res) => {
    res.render('login');  // Serve the login form
});

// Login Route (POST)
router.post('/login', passport.authenticate('local', {
    successRedirect: '/tasks',
    failureRedirect: '/auth/login',
    failureFlash: true
}));

// Logout Route
router.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) return next(err);
        req.flash('success_msg', 'You are logged out');
        res.redirect('/auth/login');
    });
});

// Forgot Password Routes
// GET: Serve the forgot password form
router.get('/forgot-password', (req, res) => {
    res.render('forgot-password');  // Renders forgot-password.ejs
});

// POST: Handle forgot password form submission
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        // Check if user with the given email exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.render('forgot-password', { msg: 'No account with that email address exists.' });
        }

        // You can implement password reset functionality here, such as sending a reset email.
        // For now, we'll just simulate a successful request.
        res.send(`Password reset link would be sent to ${email}`);
        
        // Optional: Use nodemailer to send email (uncomment and configure properly if needed)
        /*
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: 'your_email@gmail.com',
                pass: 'your_email_password'
            }
        });

        const mailOptions = {
            to: user.email,
            from: 'passwordreset@todoapp.com',
            subject: 'Password Reset',
            text: `You requested a password reset. Please click on the link below to reset your password: \n\n
                   http://${req.headers.host}/auth/reset-password/${user._id}`
        };

        await transporter.sendMail(mailOptions);
        res.send('Password reset email sent.');
        */
    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred while processing your request.');
    }
});

module.exports = router;
