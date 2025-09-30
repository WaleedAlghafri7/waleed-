const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { nanoid } = require('nanoid');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static('.'));

// Create uploads directory if it doesn't exist
const uploadsDir = 'uploads';
if (!require('fs').existsSync(uploadsDir)) {
    require('fs').mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for avatar uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname) || '.png';
        cb(null, `${Date.now()}_${nanoid()}${ext}`);
    }
});

function imageFileFilter(req, file, cb) {
    const allowed = ['image/jpeg', 'image/png'];
    const okMime = allowed.includes(file.mimetype);
    const ext = path.extname(file.originalname).toLowerCase();
    const okExt = ['.jpg', '.jpeg', '.png'].includes(ext);
    if (okMime && okExt) return cb(null, true);
    cb(new Error('Only JPG and PNG images are allowed'));
}

const upload = multer({ storage, fileFilter: imageFileFilter });
app.use('/uploads', express.static('uploads'));

// Helper functions
function sanitizeUser(user) {
    const { password, passwordHash, ...safe } = user;
    return safe;
}
function readUsers() {
    try {
        const data = require('fs').readFileSync('users.json', 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

function writeUsers(users) {
    require('fs').writeFileSync('users.json', JSON.stringify(users, null, 2));
}

// Routes
app.post('/api/register', async (req, res) => {
    try {
        const { fullName, email, password } = req.body;
        
        if (!fullName || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const users = readUsers();
        
        // Check if user already exists
        if (users.find(user => user.email === email)) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create new user (store as passwordHash for consistency)
        const newUser = {
            id: nanoid(),
            fullName,
            email,
            passwordHash: hashedPassword,
            createdAt: new Date().toISOString(),
            avatarUrl: null
        };

        users.push(newUser);
        writeUsers(users);

        // Generate token
        const token = nanoid();
        
        // Return user data (without password fields)
        const userWithoutPassword = sanitizeUser(newUser);
        
        res.json({
            message: 'User registered successfully',
            user: userWithoutPassword,
            token
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const users = readUsers();
        const user = users.find(u => u.email === email);
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const storedHash = user.password || user.passwordHash;
        if (!storedHash) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const isValidPassword = await bcrypt.compare(password, storedHash);
        
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = nanoid();
        
        // Return user data (without password fields)
        const userWithoutPassword = sanitizeUser(user);
        
        res.json({
            message: 'Login successful',
            user: userWithoutPassword,
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/profile/update', async (req, res) => {
    try {
        const { id, fullName, email, phone, bio, gender, birthdate, newPassword, username, location, occupation, language, website } = req.body;
        
        if (!id) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const users = readUsers();
        const userIndex = users.findIndex(u => u.id === id);
        
        if (userIndex === -1) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update user data
        users[userIndex] = {
            ...users[userIndex],
            fullName: fullName || users[userIndex].fullName,
            email: email || users[userIndex].email,
            phone: phone || users[userIndex].phone,
            bio: bio || users[userIndex].bio,
            gender: gender || users[userIndex].gender,
            birthdate: birthdate || users[userIndex].birthdate,
            username: username || users[userIndex].username,
            location: location || users[userIndex].location,
            occupation: occupation || users[userIndex].occupation,
            language: language || users[userIndex].language,
            website: website || users[userIndex].website,
            updatedAt: new Date().toISOString()
        };

        // Handle password change if requested
        if (newPassword && typeof newPassword === 'string' && newPassword.length >= 6) {
            const hashed = await bcrypt.hash(newPassword, 10);
            users[userIndex].passwordHash = hashed;
        }

        writeUsers(users);

        // Return updated user data (without password fields)
        const userWithoutPassword = sanitizeUser(users[userIndex]);
        
        res.json({
            message: 'Profile updated successfully',
            user: userWithoutPassword
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/profile/avatar', upload.single('avatar'), (req, res) => {
    try {
        const { id } = req.body;
        
        if (!id) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const users = readUsers();
        const userIndex = users.findIndex(u => u.id === id);
        
        if (userIndex === -1) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update user avatar
        const avatarUrl = `/uploads/${req.file.filename}`;
        users[userIndex].avatarUrl = avatarUrl;
        users[userIndex].updatedAt = new Date().toISOString();

        writeUsers(users);

        // Return updated user data (without password fields)
        const userWithoutPassword = sanitizeUser(users[userIndex]);
        
        res.json({
            message: 'Avatar updated successfully',
            user: userWithoutPassword,
            avatarUrl
        });
    } catch (error) {
        console.error('Avatar upload error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/profile/delete', (req, res) => {
    try {
        const { id } = req.body;
        if (!id) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        const users = readUsers();
        const userIndex = users.findIndex(u => u.id === id);
        if (userIndex === -1) {
            return res.status(404).json({ error: 'User not found' });
        }
        const [deleted] = users.splice(userIndex, 1);
        writeUsers(users);
        res.json({ message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});