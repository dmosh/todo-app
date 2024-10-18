const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const flash = require('connect-flash');
const User = require('./models/User');  // Your User model

const app = express();
const port = 3000;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/todo-app');
//mongoose.connect('mongodb+srv://moshmoses3:hOkOPwqUgylWgj23@cluster0.vheaf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')

// Define a Mongoose schema for tasks with user association
const taskSchema = new mongoose.Schema({
    description: { type: String, required: true },
    dueDate: { type: Date, required: false },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    completed: { type: Boolean, default: false },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }  // Reference to the user who created the task
});

const Task = mongoose.model('Task', taskSchema);

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static('public'));

// Express Session Middleware
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
}));

// Add flash middleware after session middleware
app.use(flash());

// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

// Global variable for flash messages (optional)
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');  // Passport error messages
    next();
});

// Passport Configuration - LocalStrategy for login
passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
    try {
        // Find the user by email
        const user = await User.findOne({ email });
        if (!user) {
            return done(null, false, { message: 'That email is not registered' });
        }

        // Compare the password using bcrypt
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            return done(null, user);
        } else {
            return done(null, false, { message: 'Password incorrect' });
        }
    } catch (err) {
        return done(err);
    }
}));

// Passport serializeUser and deserializeUser to support persistent sessions
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);  // Pass the user object to the done function
    } catch (err) {
        done(err, null);  // Pass the error if any
    }
});


// Authentication Middleware
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash('error_msg', 'Please log in to view that resource');  // Flash message on unauthorized access
    res.redirect('/auth/login');  // Redirect to login if not authenticated
}

// Home Route - Display tasks for logged-in users only
app.get('/', ensureAuthenticated, async (req, res) => {
    try {
        const tasks = await Task.find({ userId: req.user._id });  // Only fetch tasks for the logged-in user
        res.render('index', { tasks: tasks });
    } catch (error) {
        res.status(500).send('Error retrieving tasks');
    }
});

// Add a new task - Ensure the user is authenticated
app.post('/addtask', ensureAuthenticated, async (req, res) => {
    const newTask = new Task({
        description: req.body.newtask,
        dueDate: req.body.dueDate || null,
        priority: req.body.priority || 'Medium',
        completed: false,
        userId: req.user._id  // Associate the task with the logged-in user
    });

    try {
        await newTask.save();
        res.redirect('/');
    } catch (error) {
        res.status(500).send('Error saving task');
    }
});

// Delete a task
app.post('/removetask', ensureAuthenticated, async (req, res) => {
    try {
        const taskId = req.body.taskId;
        await Task.findOneAndDelete({ _id: taskId, userId: req.user._id });  // Ensure the task belongs to the user
        res.redirect('/');
    } catch (error) {
        res.status(500).send('Error deleting task');
    }
});

// Edit a task
app.post('/edittask', ensureAuthenticated, async (req, res) => {
    try {
        const taskId = req.body.taskId;
        await Task.findOneAndUpdate({ _id: taskId, userId: req.user._id }, {
            description: req.body.description,
            dueDate: req.body.dueDate || null,
            priority: req.body.priority,
            completed: req.body.completed === 'on' ? true : false
        });
        res.redirect('/');
    } catch (error) {
        res.status(500).send('Error updating task');
    }
});

// Auth routes
app.use('/auth', require('./routes/auth'));


// Tasks Route - Display tasks for logged-in users
app.get('/tasks', ensureAuthenticated, async (req, res) => {
    try {
        // Fetch tasks for the logged-in user
        const tasks = await Task.find({ userId: req.user._id });
        res.render('index', { tasks: tasks });  // Render the index.ejs view with tasks
    } catch (error) {
        res.status(500).send('Error retrieving tasks');
    }
});


// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
