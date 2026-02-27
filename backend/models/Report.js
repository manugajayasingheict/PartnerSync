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
        enum: {
            values: ['financial', 'people_helped', 'milestone', 'other'],
            message: '{VALUE} is not a valid report type'
        },
        default: 'financial'
    },
    amountLKR: {
        type: Number,
        required: function() {
            return this.reportType === 'financial';
        },
        validate: {
            validator: function(value) {
                // Skip validation if field is not present and not required
                if (value == null && this.reportType !== 'financial') {
                    return true;
                }
                // For financial reports, must be positive
                if (this.reportType === 'financial') {
                    return value != null && value > 0;
                }
                return true;
            },
            message: 'Financial reports must have a positive amount in LKR'
        }
    },
    amountUSD: {
        type: Number,
        required: false, // Auto-calculated from exchange rate
        validate: {
            validator: function(value) {
                // Only validate if value is present
                if (value == null) return true;
                return value >= 0;
            },
            message: 'USD amount cannot be negative'
        }
    },
    peopleImpacted: {
        type: Number,
        required: function() {
            return this.reportType === 'people_helped';
        },
        validate: {
            validator: function(value) {
                // Skip validation if field is not present and not required
                if (value == null && this.reportType !== 'people_helped') {
                    return true;
                }
                // For people_helped reports, must be positive integer
                if (this.reportType === 'people_helped') {
                    return value != null && Number.isInteger(value) && value > 0;
                }
                return true;
            },
            message: 'People impacted must be a positive whole number'
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
