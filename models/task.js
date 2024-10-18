const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    description: String,
    dueDate: Date,
    priority: String,
    completed: Boolean,
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }  // Reference to the user
});

module.exports = mongoose.model('Task', taskSchema);

app.get('/tasks', ensureAuthenticated, (req, res) => {
    Task.find({ user: req.user._id }, (err, tasks) => {
        if (err) throw err;
        res.render('tasks', { tasks: tasks });
    });
});

app.post('/addtask', ensureAuthenticated, (req, res) => {
    const newTask = new Task({
        description: req.body.description,
        dueDate: req.body.dueDate,
        priority: req.body.priority,
        completed: false,
        user: req.user._id  // Associate task with the logged-in user
    });

    newTask.save((err) => {
        if (err) throw err;
        res.redirect('/tasks');
    });
});
