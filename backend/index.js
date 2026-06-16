const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
require('dotenv').config();

// ==========================================
// IMPORT SEMUA MODEL
// ==========================================
const User = require('./models/User');
const Contact = require('./models/Contact'); 
const Campaign = require('./models/Campaign');
const Setting = require('./models/Setting');   
const Voucher = require('./models/Voucher');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'ar_connect_secret_key_2024';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const sessions = new Map();

// Email Configuration (Nodemailer)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
    }
});

// Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: "Akses ditolak. Sila log masuk semula." });
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: "Token tidak sah atau telah tamat tempoh." });
        req.user = user;
        next();
    });
};

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ar_connect')
  .then(() => console.log("✅ Berjaya bersambung ke pangkalan data (MongoDB)"))
  .catch(err => console.error("❌ Gagal bersambung ke MongoDB:", err));

app.get('/api/system/status', async (req, res) => {
    try {
        const setting = await Setting.findOne({ key: 'maintenanceMode' });
        res.json({ maintenance: setting && setting.value === true });
    } catch (error) {
        res.json({ maintenance: false });
    }
});

// ==========================================
// API: AUTHENTICATION & PROFILE
// ==========================================
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, kata_laluan, nama_syarikat } = req.body;
        
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "Emel telah digunakan." });

        const hashedPassword = await bcrypt.hash(kata_laluan, 10);
        
        let defaultCredit = 100;
        const creditSetting = await Setting.findOne({ key: 'defaultRegistrationCredit' });
        if (creditSetting && creditSetting.value !== undefined) {
            defaultCredit = Number(creditSetting.value);
        }

        const newUser = new User({
            email,
            kata_laluan: hashedPassword,
            nama_syarikat,
            kredit: defaultCredit
        });
        await newUser.save();
        res.status(201).json({ message: "Pendaftaran berjaya! Sila log masuk." });
    } catch (error) {
        res.status(500).json({ message: "Gagal mendaftar pengguna", error: error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, kata_laluan } = req.body;

        const maintenance = await Setting.findOne({ key: 'maintenanceMode' });
        if (maintenance && maintenance.value === true && email !== 'admin@arconnect.my') {
            return res.status(403).json({ message: "Sistem sedang diselenggara (Maintenance Mode). Sila cuba sebentar lagi." });
        }

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "Akaun tidak dijumpai." });

        if (user.isSuspended) {
            return res.status(403).json({ message: "Akaun ini telah digantung. Sila hubungi admin." });
        }

        const isMatch = await bcrypt.compare(kata_laluan, user.kata_laluan);
        if (!isMatch) return res.status(400).json({ message: "Kata laluan salah." });

        const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
        const userData = {
            id: user._id,
            email: user.email,
            nama_syarikat: user.nama_syarikat,
            kredit: user.kredit,
            profilePic: user.profilePic,
            status_langganan: user.status_langganan,
            isSuspended: user.isSuspended,
            isCreditLocked: user.isCreditLocked,
            expiryDate: user.expiryDate
        };
        res.json({ token, user: userData });
    } catch (error) {
        res.status(500).json({ message: "Ralat log masuk", error: error.message });
    }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-kata_laluan');
        if (!user) return res.status(404).json({ message: "Pengguna tidak dijumpai." });
        
        if (user.isSuspended && user.email !== 'admin@arconnect.my') {
             return res.status(403).json({ message: "Akaun telah digantung." });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Ralat pelayan", error: error.message });
    }
});

app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
    try {
        const { userId, old, new: newPass } = req.body;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "Akaun tidak dijumpai." });

        const isMatch = await bcrypt.compare(old, user.kata_laluan);
        if (!isMatch) return res.status(400).json({ message: "Kata laluan lama salah." });

        user.kata_laluan = await bcrypt.hash(newPass, 10);
        await user.save();
        res.json({ message: "Kata laluan berjaya ditukar." });
    } catch (error) {
        res.status(500).json({ message: "Gagal menukar kata laluan.", error: error.message });
    }
});

app.post('/api/auth/update-profile', authenticateToken, async (req, res) => {
    try {
        const { nama_syarikat, profilePic } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { nama_syarikat, profilePic },
            { new: true }
        ).select('-kata_laluan');
        res.json({ message: "Profil dikemaskini", user });
    } catch (error) {
        res.status(500).json({ message: "Gagal kemaskini profil.", error: error.message });
    }
});

// ==========================================
// API: FORGOT & RESET PASSWORD (TELAH DIBAIKI)
// ==========================================
app.post('/api/auth/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "Emel tidak wujud dalam sistem." });

        const resetToken = jwt.sign({ id: user._id.toString() }, JWT_SECRET, { expiresIn: '1h' });
        const resetLink = `${FRONTEND_URL}/?token=${resetToken}`;

        const mailOptions = {
            from: process.env.EMAIL_USER || 'admin@arconnect.my',
            to: user.email,
            subject: 'AR Connect - Reset Password',
            html: `
                <h3>Reset Kata Laluan</h3>
                <p>Klik pautan di bawah untuk menetapkan kata laluan baru (Sah selama 1 jam):</p>
                <a href="${resetLink}">${resetLink}</a>
            `
        };

        await transporter.sendMail(mailOptions);
        res.json({ message: "Pautan reset kata laluan telah dihantar ke emel anda." });
    } catch (error) {
        res.status(500).json({ message: "Gagal menghantar emel", error: error.message });
    }
});

app.post('/api/auth/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (jwtError) {
            return res.status(400).json({ message: "Token telah tamat tempoh atau tidak sah." });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        const user = await User.findByIdAndUpdate(
            decoded.id,
            { kata_laluan: hashedPassword },
            { new: true }
        );

        if (!user) return res.status(404).json({ message: "Akaun tidak dijumpai." });

        res.json({ message: "Kata laluan berjaya ditetapkan." });
    } catch (error) {
        res.status(500).json({ message: "Ralat sistem.", error: error.message });
    }
});

// ==========================================
// API: WHATSAPP
// ==========================================
app.get('/api/whatsapp/connect/:userId', async (req, res) => {
    const userId = req.params.userId;
    
    if (sessions.has(userId)) {
        const existingClient = sessions.get(userId);
        if (existingClient.info && existingClient.info.wid) {
            await User.findByIdAndUpdate(userId, { sesi_whatsapp_aktif: true });
            return res.json({ status: 'connected', connected: true });
        }
        if (existingClient.qrCode) {
            return res.json({ status: 'qr_ready', qr: existingClient.qrCode });
        }
        return res.json({ status: 'loading' });
    }

    try {
        const client = new Client({
            authStrategy: new LocalAuth({ clientId: userId }),
            puppeteer: {
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-extensions']
            }
        });
        sessions.set(userId, client);

        client.on('qr', (qr) => {
            client.qrCode = qr;
        });
        client.on('ready', async () => {
            client.qrCode = null;
            await User.findByIdAndUpdate(userId, { sesi_whatsapp_aktif: true });
        });
        client.on('disconnected', async () => {
            sessions.delete(userId);
            await User.findByIdAndUpdate(userId, { sesi_whatsapp_aktif: false });
        });
        client.initialize().catch(err => {
            sessions.delete(userId);
        });
        res.json({ status: 'loading' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.post('/api/whatsapp/logout', async (req, res) => {
    const { userId } = req.body;
    if (sessions.has(userId)) {
        const client = sessions.get(userId);
        try { await client.logout(); } catch (e) {}
        try { await client.destroy(); } catch (e) {}
        sessions.delete(userId);
    }
    await User.findByIdAndUpdate(userId, { sesi_whatsapp_aktif: false });
    res.json({ success: true, message: "Berjaya log keluar peranti WhatsApp" });
});

app.post('/api/whatsapp/send', async (req, res) => {
    try {
        const { userId, to, message, media, mediaType, fileName } = req.body;
        
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "Pengguna tidak dijumpai." });
        if (user.isCreditLocked) return res.status(403).json({ message: "Kredit dikunci." });
        if (user.kredit <= 0) return res.status(400).json({ message: "Kredit tidak mencukupi." });
        
        const client = sessions.get(userId);
        if (!client || !client.info) return res.status(400).json({ message: "WhatsApp tidak bersambung." });

        const formattedNumber = `${to}@c.us`;

        if (media) {
            const mediaObject = new MessageMedia(mediaType, media, fileName);
            await client.sendMessage(formattedNumber, mediaObject, { caption: message || '' });
        } else {
            await client.sendMessage(formattedNumber, message);
        }

        await User.findByIdAndUpdate(userId, { $inc: { kredit: -1 } });
        res.json({ success: true, message: "Mesej berjaya dihantar." });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal menghantar mesej.", error: error.message });
    }
});

// ==========================================
// API: CONTACTS & CAMPAIGNS
// ==========================================
app.post('/api/contacts', async (req, res) => {
    try {
        const contact = new Contact(req.body);
        await contact.save();
        res.status(201).json(contact);
    } catch (error) {
        res.status(500).json({ message: "Gagal menyimpan nombor", error: error.message });
    }
});

app.post('/api/contacts/bulk', async (req, res) => {
    try {
        const { user_id, contacts } = req.body;
        const validContacts = contacts.map(c => ({
            user_id,
            nama: c.nama,
            nombor_telefon: c.nombor_telefon,
            kumpulan: c.kumpulan
        }));
        await Contact.insertMany(validContacts);
        res.status(201).json({ message: `${validContacts.length} nombor disimpan.` });
    } catch (error) {
        res.status(500).json({ message: "Gagal import nombor pukal", error: error.message });
    }
});

app.get('/api/contacts/:userId', async (req, res) => {
    try {
        const contacts = await Contact.find({ user_id: req.params.userId }).sort({ createdAt: -1 });
        res.json(contacts);
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil database", error: error.message });
    }
});

app.delete('/api/contacts/:id', async (req, res) => {
    try {
        await Contact.findByIdAndDelete(req.params.id);
        res.json({ message: "Berjaya dipadam" });
    } catch (error) {
        res.status(500).json({ message: "Gagal padam nombor" });
    }
});

app.post('/api/campaigns', async (req, res) => {
    try {
        const campaign = new Campaign(req.body);
        await campaign.save();
        res.status(201).json(campaign);
    } catch (error) {
        res.status(500).json({ message: "Gagal menyimpan sejarah", error: error.message });
    }
});

app.get('/api/campaigns/:userId', async (req, res) => {
    try {
        const campaigns = await Campaign.find({ user_id: req.params.userId }).sort({ createdAt: -1 });
        res.json(campaigns);
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil sejarah", error: error.message });
    }
});

// ==========================================
// API: ADMIN PORTAL (TERMASUK PADAM & TEMP PASS)
// ==========================================
app.get('/api/admin/users', authenticateToken, async (req, res) => {
    try {
        const users = await User.find({ email: { $ne: 'admin@arconnect.my' } }).select('-kata_laluan');
        res.json(users);
    } catch (error) { 
        res.status(500).json({ error: error.message }); 
    }
});

app.post('/api/admin/update-user', authenticateToken, async (req, res) => {
    try {
        const { userId, kredit, status_langganan, isSuspended, isCreditLocked, expiryDate } = req.body;
        
        const updateData = { 
            kredit, 
            status_langganan, 
            isSuspended: Boolean(isSuspended), 
            isCreditLocked: Boolean(isCreditLocked) 
        };
        if (expiryDate !== undefined) {
            updateData.expiryDate = expiryDate ? new Date(expiryDate) : null;
        }

        await User.findByIdAndUpdate(userId, updateData);
        res.json({ message: "Maklumat pengguna berjaya dikemaskini!" });
    } catch (error) { 
        res.status(500).json({ error: error.message }); 
    }
});

app.delete('/api/admin/users/:id', authenticateToken, async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (!deletedUser) return res.status(404).json({ message: "Pengguna tidak dijumpai." });
        res.json({ message: "Akaun berjaya dipadam." });
    } catch (error) { 
        res.status(500).json({ error: error.message }); 
    }
});

app.post('/api/admin/users/:id/temp-password', authenticateToken, async (req, res) => {
    try {
        const { tempPassword } = req.body;
        if (!tempPassword) return res.status(400).json({ message: "Kata laluan sementara diperlukan." });

        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id, 
            { kata_laluan: hashedPassword },
            { new: true }
        );

        if (!updatedUser) return res.status(404).json({ message: "Pengguna tidak dijumpai." });
        res.json({ message: "Kata laluan sementara berjaya ditetapkan." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/admin/settings/maintenance', authenticateToken, async (req, res) => {
    try {
        const { isMaintenance } = req.body;
        await Setting.findOneAndUpdate(
            { key: 'maintenanceMode' },
            { value: Boolean(isMaintenance) },
            { upsert: true, new: true }
        );
        res.json({ message: "Status penyelenggaraan sistem dikemaskini." });
    } catch (error) {
        res.status(500).json({ message: "Gagal kemaskini tetapan.", error: error.message });
    }
});

// ==========================================
// API: SETTINGS (ADMIN & GLOBAL)
// ==========================================

// SIMPAN TETAPAN ADMIN (TERMASUK PAKEJ)
app.post('/api/admin/settings', authenticateToken, async (req, res) => {
    try {
        const { defaultRegistrationCredit, packageSettings } = req.body;
        
        if (defaultRegistrationCredit !== undefined) {
             await Setting.findOneAndUpdate(
                 { key: 'defaultRegistrationCredit' },
                 { value: String(defaultRegistrationCredit) },
                 { upsert: true }
             );
        }
        
        // Simpan Plan Configuration sebagai JSON String supaya pangkalan data tak error
        if (packageSettings !== undefined) {
             await Setting.findOneAndUpdate(
                 { key: 'packageSettings' },
                 { value: JSON.stringify(packageSettings) }, 
                 { upsert: true }
             );
        }
        
        res.json({ message: "Tetapan sistem berjaya disimpan secara global." });
    } catch (error) {
        res.status(500).json({ message: "Ralat tetapan admin.", error: error.message });
    }
});

// DAPATKAN TETAPAN ADMIN
app.get('/api/admin/settings', authenticateToken, async (req, res) => {
    try {
        const creditSetting = await Setting.findOne({ key: 'defaultRegistrationCredit' });
        const pkgSetting = await Setting.findOne({ key: 'packageSettings' });
        
        let parsedPkg = null;
        if (pkgSetting && pkgSetting.value) {
            try { parsedPkg = JSON.parse(pkgSetting.value); } 
            catch(e) { parsedPkg = pkgSetting.value; }
        }

        res.json({ 
            defaultRegistrationCredit: creditSetting ? Number(creditSetting.value) : 100,
            packageSettings: parsedPkg
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ROUTE PUBLIC: Untuk sistem "tarik" data plan configuration secara automatik
app.get('/api/settings/packages', async (req, res) => {
    try {
        const pkgSetting = await Setting.findOne({ key: 'packageSettings' });
        let parsedPkg = null;
        if (pkgSetting && pkgSetting.value) {
            try { parsedPkg = JSON.parse(pkgSetting.value); } 
            catch(e) { parsedPkg = pkgSetting.value; }
        }
        res.json(parsedPkg);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// API: VOUCHERS
// ==========================================
app.post('/api/admin/vouchers', authenticateToken, async (req, res) => {
    try {
        const { code, amount, maxUses } = req.body;
        const newVoucher = new Voucher({ code, amount, maxUses });
        await newVoucher.save();
        res.status(201).json({ message: "Voucher berjaya dicipta.", voucher: newVoucher });
    } catch (error) {
        res.status(400).json({ message: "Kod voucher mungkin telah wujud.", error: error.message });
    }
});

app.get('/api/admin/vouchers', authenticateToken, async (req, res) => {
    try {
        const vouchers = await Voucher.find().sort({ createdAt: -1 });
        res.json(vouchers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/admin/vouchers/:id', authenticateToken, async (req, res) => {
    try {
        await Voucher.findByIdAndDelete(req.params.id);
        res.json({ message: "Voucher dipadam." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/vouchers/redeem', authenticateToken, async (req, res) => {
    try {
        const { userId, code } = req.body;
        
        const voucher = await Voucher.findOne({ code: code.toUpperCase() });
        if (!voucher) return res.status(404).json({ message: "Kod tidak wujud." });

        if (voucher.currentUses >= voucher.maxUses) {
            return res.status(400).json({ message: "Kod ini telah mencapai had penggunaan." });
        }

        if (voucher.usedBy.includes(userId)) {
            return res.status(400).json({ message: "Anda telah pun menebus kod ini." });
        }

        await User.findByIdAndUpdate(userId, { $inc: { kredit: voucher.amount } });
        
        voucher.currentUses += 1;
        voucher.usedBy.push(userId);
        await voucher.save();

        res.json({ message: "Berjaya ditebus!", amount: voucher.amount });
    } catch (error) {
        res.status(500).json({ message: "Gagal menebus voucher.", error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server backend AR Connect berjalan di port ${PORT}`);
});