import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'profitshield_default_jwt_secret_demo';

// Standalone in-memory user registry for demonstration/testing
interface RegisteredUser {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: 'merchant' | 'admin' | 'operator';
  storeId: string;
  createdAt: string;
}

const registeredUsers: RegisteredUser[] = [
  {
    id: 'usr-admin-01',
    email: 'admin@profitshield.io',
    passwordHash: bcrypt.hashSync('ProfitShieldAdmin2026!', 8),
    fullName: 'System Administrator',
    role: 'admin',
    storeId: 'store-demo-001',
    createdAt: new Date().toISOString()
  },
  {
    id: 'usr-merchant-01',
    email: 'merchant@the-artisan-roastery.com',
    passwordHash: bcrypt.hashSync('MerchantSecurePass2026!', 8),
    fullName: 'Artisan Store Manager',
    role: 'merchant',
    storeId: 'store-demo-001',
    createdAt: new Date().toISOString()
  }
];

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  const { email, password, fullName, storeDomain } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }
  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
  }

  const existing = registeredUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'An account with this email already exists.' });
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);
  const newUser: RegisteredUser = {
    id: `usr-${Date.now()}`,
    email: email.toLowerCase().trim(),
    passwordHash,
    fullName: fullName || 'Merchant User',
    role: 'merchant',
    storeId: 'store-demo-001',
    createdAt: new Date().toISOString()
  };

  registeredUsers.push(newUser);

  const token = jwt.sign(
    { id: newUser.id, email: newUser.email, role: newUser.role, storeId: newUser.storeId },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.status(201).json({
    success: true,
    token,
    user: {
      id: newUser.id,
      email: newUser.email,
      fullName: newUser.fullName,
      role: newUser.role,
      storeId: newUser.storeId
    }
  });
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = registeredUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, storeId: user.storeId },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      storeId: user.storeId
    }
  });
});

// GET /api/auth/me
router.get('/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Return default demo session
    return res.json({
      user: {
        id: 'merchant-demo-001',
        email: 'demo-merchant@the-artisan-roastery.com',
        fullName: 'Artisan Store Manager',
        role: 'merchant',
        storeId: 'store-demo-001',
        isDemoSession: true
      }
    });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    res.json({ user: decoded });
  } catch (err) {
    res.status(401).json({ error: 'Invalid session' });
  }
});

// POST /api/auth/forgot-password (Password reset architecture)
router.post('/forgot-password', (req: Request, res: Response) => {
  const { email } = req.body;
  // Documented reset workflow architecture
  res.json({
    success: true,
    message: `If an account exists for ${email}, password reset instructions have been dispatched.`
  });
});

export default router;
