const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
    // Merujuk kepada User yang mencipta kempen blast ini
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    nama_kempen: {
        type: String,
        required: true
    },
    mesej: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
    },
    jumlah_sasaran: {
        type: Number,
        default: 0
    },
    jumlah_berjaya: {
        type: Number,
        default: 0
    },
    jumlah_gagal: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model('Campaign', campaignSchema);