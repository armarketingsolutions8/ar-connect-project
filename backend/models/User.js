const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    kata_laluan: { type: String, required: true },
    nama_syarikat: { type: String, required: true },
    kredit: { type: Number, default: 100 },
    profilePic: { type: String, default: null },
    sesi_whatsapp_aktif: { type: Boolean, default: false },
    
    // ===============================================
    // MEDAN BAHARU UNTUK KAWALAN ADMIN (TAMBAH INI)
    // ===============================================
    status_langganan: { type: String, default: 'free' },
    isSuspended: { type: Boolean, default: false },
    isCreditLocked: { type: Boolean, default: false },
    expiryDate: { type: Date, default: null }

}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);