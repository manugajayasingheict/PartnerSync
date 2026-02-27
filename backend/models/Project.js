const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'A project title is mandatory for registry'],
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Please provide a detailed description of the project impact'],
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    sdgGoal: {
        type: String,
        required: [true, 'You must link this project to a specific UN SDG goal'],
        enum: {
            values: [
                'No Poverty', 'Zero Hunger', 'Good Health', 'Quality Education', 
                'Gender Equality', 'Clean Water', 'Clean Energy', 'Decent Work', 
                'Industry', 'Reduced Inequalities', 'Sustainable Cities', 
                'Responsible Consumption', 'Climate Action', 'Life Below Water', 
                'Life on Land', 'Peace & Justice', 'Partnerships'
            ],
            message: 'Please select a valid SDG goal from the approved list'
        }
    },
    status: {
        type: String,
        enum: {
            values: ['Proposed', 'In Progress', 'Completed', 'Cancelled'],
            message: 'Status must be Proposed, In Progress, Completed, or Cancelled'
        },
        default: 'Proposed'
    },
    organization: {
        type: String,
        required: [true, 'An owning organization must be assigned to this project']
    },
    budget: {
        type: Number,
        required: false,
        min: [0, 'Project budget cannot be a negative value']
    },
    startDate: {
        type: Date,
        default: Date.now,
        required: [true, 'A start date is required']
    },
    endDate: {
        type: Date,
        validate: {
            validator: function(value) {
                // Ensure endDate is not before the startDate
                return !value || value >= this.startDate;
            },
            message: 'Project end date cannot be earlier than the start date'
        }
    }
}, {
    timestamps: true 
});

module.exports = mongoose.model('Project', ProjectSchema);