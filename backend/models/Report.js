const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: [true, 'Please specify a project']
    },
    reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reportType: {
        type: String,
        enum: ['financial', 'people_helped', 'milestone', 'other'],
        default: 'financial'
    },
    amountLKR: {
        type: Number,
        required: function() {
            return this.reportType === 'financial';
        }
    },
    amountUSD: {
        type: Number,
        required: false // Auto-calculated from exchange rate
    },
    peopleImpacted: {
        type: Number,
        required: function() {
            return this.reportType === 'people_helped';
        }
    },
    description: {
        type: String,
        required: [true, 'Please add a description'],
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    reportDate: {
        type: Date,
        default: Date.now
    },
    exchangeRate: {
        type: Number,
        required: false // Store the rate used at time of report
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Report', ReportSchema);
