const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define the schema for user registration
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,  // Ensure unique usernames
    },
    email: {
        type: String,
        required: true,
        unique: true,  // Ensure unique emails
    },
    password: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

// Pre-save hook to hash the password before saving a user to the database
userSchema.pre('save', async function (next) {
    // Only hash the password if it has been modified or is new
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);  // Generate salt
        this.password = await bcrypt.hash(this.password, salt);  // Hash password
        next();  // Continue with the save process
    } catch (err) {
        next(err);  // Pass the error to the next middleware
    }
});

// Method to compare entered password with the hashed password stored in the database
userSchema.methods.comparePassword = async function (inputPassword) {
    return bcrypt.compare(inputPassword, this.password);  // Compare passwords
};

// Export the User model
module.exports = mongoose.model('User', userSchema);
