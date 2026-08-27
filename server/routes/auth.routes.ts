import { Router, Response } from 'express';
import {
  findUserByEmail,
  findUserByRoll,
  findUserByRollAndBatch,
  findUserById,
  getAllUsers,
  createUser,
  updateUserPassword,
} from '../db/index.ts';
import {
  generateToken,
  requireAuth,
  AuthenticatedRequest,
} from '../auth.ts';
import {
  User,
  Gender,
  HSCBatch,
  AcademicGroup,
  Section,
} from '../../src/types.ts';

export const authRouter = Router();

// Student Registration
authRouter.post('/register', async (req, res) => {
  try {
    const {
      fullName,
      rollNumber,
      email,
      phoneNumber,
      gender,
      batch,
      group,
      section,
      address,
      password,
    } = req.body;

    if (
      !fullName ||
      !rollNumber ||
      !email ||
      !phoneNumber ||
      !gender ||
      !batch ||
      !group ||
      !section ||
      !address ||
      !password
    ) {
      res.status(400).json({ error: 'All fields are required for student registration.' });
      return;
    }

    const rawRoll = (rollNumber || '').toString().trim().replace(/\D/g, '').slice(0, 3);
    const cleanRoll = rawRoll.replace(/^0+/, '') || '0';

    if (!cleanRoll) {
      res.status(400).json({ error: 'Please provide a valid numeric roll number (max 3 digits).' });
      return;
    }

    const existingEmail = await findUserByEmail(email);
    if (existingEmail) {
      res.status(400).json({ error: `An account with email '${email}' is already registered.` });
      return;
    }

    const existingRollInBatch = await findUserByRollAndBatch(cleanRoll, batch);
    if (existingRollInBatch) {
      res.status(400).json({ error: `Roll number '${cleanRoll}' is already registered in ${batch}.` });
      return;
    }

    const allUsers = await getAllUsers();
    const isFirstUser = allUsers.length === 0;
    const assignedRole = isFirstUser ? 'admin' : (req.body.role || 'student');
    const assignedApproval = isFirstUser ? 'approved' : 'pending';

    const newUser: User = {
      id: `usr-${assignedRole}-${Date.now()}`,
      fullName: fullName.trim(),
      rollNumber: cleanRoll,
      email: email.trim().toLowerCase(),
      phoneNumber: phoneNumber.trim(),
      gender: gender as Gender,
      batch: batch as HSCBatch,
      group: group as AcademicGroup,
      section: section as Section,
      address: address.trim(),
      role: assignedRole,
      approval: assignedApproval,
      password: password,
      createdAt: new Date().toISOString(),
    };

    await createUser(newUser);

    res.status(201).json({
      success: true,
      message: isFirstUser
        ? 'Account registered successfully as the Administrator! You can log in immediately.'
        : 'Registration submitted successfully! Your account status is currently PENDING. Please wait for approval by your Class Captain or Academic Administrator before logging in.',
      user: {
        id: newUser.id,
        fullName: newUser.fullName,
        rollNumber: newUser.rollNumber,
        email: newUser.email,
        batch: newUser.batch,
        section: newUser.section,
        role: newUser.role,
        approval: newUser.approval,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Server error during registration.' });
  }
});

// Login
authRouter.post('/login', async (req, res) => {
  try {
    const { email, emailOrRoll, password } = req.body;
    const loginEmail = (email || emailOrRoll || '').trim().toLowerCase();

    if (!loginEmail || !password) {
      res.status(400).json({ error: 'Please provide your registered email address and password.' });
      return;
    }

    const user = await findUserByEmail(loginEmail);

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials. No user found with this email address.' });
      return;
    }

    const userStoredPassword = user.password || (user as any).passwordHash;
    if (userStoredPassword && userStoredPassword !== password) {
      res.status(401).json({ error: 'Invalid credentials. Incorrect password.' });
      return;
    }

    if (user.approval === 'pending') {
      res.status(403).json({
        error:
          'Your account registration is currently pending approval by your Class Captain or Academic Administrator. Please check back shortly.',
        approval: 'pending',
        user: {
          fullName: user.fullName,
          rollNumber: user.rollNumber,
          batch: user.batch,
          section: user.section,
          email: user.email,
        },
      });
      return;
    }

    if (user.approval === 'rejected') {
      res.status(403).json({
        error: 'Your student account registration was declined by the academic administration.',
        approval: 'rejected',
      });
      return;
    }

    const sessionPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      rollNumber: user.rollNumber,
      batch: user.batch,
      section: user.section,
      group: user.group,
      approval: user.approval,
      phoneNumber: user.phoneNumber,
      address: user.address,
      assignedBatch: user.assignedBatch || user.batch,
      assignedSection: user.assignedSection || user.section,
    };

    const token = generateToken(sessionPayload);

    res.clearCookie('token', { path: '/', sameSite: 'lax', httpOnly: false });
    res.cookie('token', token, {
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 3 * 60 * 60 * 1000,
      path: '/',
    });

    res.json({
      success: true,
      token,
      user: sessionPayload,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Server error during login.' });
  }
});

// Quick Demo Login Switcher
authRouter.post('/quick-login', async (req, res) => {
  try {
    const { role, email } = req.body;
    const allUsers = await getAllUsers();
    let targetUser: User | undefined;

    if (email) {
      targetUser = allUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    } else if (role) {
      if (role === 'admin') {
        targetUser = allUsers.find((u) => u.role === 'admin');
      } else if (role === 'captain') {
        targetUser = allUsers.find((u) => u.role === 'captain');
      } else {
        targetUser = allUsers.find((u) => u.role === 'student' && u.approval === 'approved');
      }
    }

    if (!targetUser) {
      res.status(404).json({ error: 'Target demo account not found.' });
      return;
    }

    const sessionPayload = {
      userId: targetUser.id,
      email: targetUser.email,
      role: targetUser.role,
      fullName: targetUser.fullName,
      rollNumber: targetUser.rollNumber,
      batch: targetUser.batch,
      section: targetUser.section,
      group: targetUser.group,
      approval: targetUser.approval,
      phoneNumber: targetUser.phoneNumber,
      address: targetUser.address,
      assignedBatch: targetUser.assignedBatch || targetUser.batch,
      assignedSection: targetUser.assignedSection || targetUser.section,
    };

    const token = generateToken(sessionPayload);

    res.clearCookie('token', { path: '/', sameSite: 'lax', httpOnly: false });
    res.cookie('token', token, {
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 3 * 60 * 60 * 1000,
      path: '/',
    });

    res.json({
      success: true,
      token,
      user: sessionPayload,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Quick login error.' });
  }
});

// Current session
authRouter.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  res.json({
    user: req.user,
  });
});

// Change Password
authRouter.post('/change-password', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters long.' });
      return;
    }

    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized session.' });
      return;
    }

    const user = await findUserById(userId);
    if (!user) {
      res.status(404).json({ error: 'User profile not found.' });
      return;
    }

    if (user.password && currentPassword && user.password !== currentPassword) {
      res.status(400).json({ error: 'Current password does not match.' });
      return;
    }

    await updateUserPassword(userId, newPassword);

    res.json({
      success: true,
      message: 'Password updated successfully!',
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to update password.' });
  }
});

// Logout
authRouter.post('/logout', (req, res) => {
  res.clearCookie('token', {
    path: '/',
    sameSite: 'lax',
    httpOnly: false,
  });
  res.json({ success: true, message: 'Logged out successfully.' });
});
