const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a project title'],
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Please add a description'],
        maxlength: [500, 'Description cannot be more than 500 characters']
    },
    sdgGoal: {
        type: String,
        required: true,
        enum: [
            'No Poverty', 'Zero Hunger', 'Good Health', 'Quality Education', 
            'Gender Equality', 'Clean Water', 'Clean Energy', 'Decent Work', 
            'Industry', 'Reduced Inequalities', 'Sustainable Cities', 
            'Responsible Consumption', 'Climate Action', 'Life Below Water', 
            'Life on Land', 'Peace & Justice', 'Partnerships'
        ]
    },
    status: {
        type: String,
        enum: ['Proposed', 'In Progress', 'Completed', 'Cancelled'],
        default: 'Proposed'
    },
    organization: {
        type: String,
        required: true
    },
    budget: {
        type: Number,
        required: false
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date
    }
}, {
    timestamps: true // Automatically adds createdAt and updatedAt
});

module.exports = mongoose.model('Project', ProjectSchema);