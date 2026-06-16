const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
    // Merujuk kepada User mana yang memiliki contact ini
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    nama: {
        type: String,
        default: 'Pelanggan'
    },
    nombor_telefon: {
        type: String,
        required: true
    },
    // Boleh gunakan ini untuk asingkan pelanggan (contoh: "VIP", "Prospek 2026")
    kumpulan: {
        type: String,
        default: 'Umum' 
    }
}, { timestamps: true });

module.exports = mongoose.model('Contact', contactSchema);