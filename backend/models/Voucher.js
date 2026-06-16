const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema({
    code: { 
        type: String, 
        required: true, 
        unique: true,
        uppercase: true,
        trim: true
    },
    amount: { 
        type: Number, 
        required: true 
    },
    maxUses: { 
        type: Number, 
        default: 1 
    },
    currentUses: { 
        type: Number, 
        default: 0 
    },
    usedBy: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }]
}, { timestamps: true });

module.exports = mongoose.model('Voucher', voucherSchema);