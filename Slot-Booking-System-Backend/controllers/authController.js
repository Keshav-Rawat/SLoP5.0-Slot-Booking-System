import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import sendEmail from '../utils/sendEmail.js';

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role, club } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide name, email, and password',
        statusCode: 400
      });
    }

    // Check if user exists
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email',
        statusCode: 400
      });
    }

    // Validate role
    const validRoles = ['user', 'club_admin']; // Prevent super_admin registration
    const userRole = role && validRoles.includes(role) ? role : 'user';

    // Check if club is provided for club_admin
    if (userRole === 'club_admin' && !club) {
      return res.status(400).json({
        success: false,
        error: 'Club name is required for club admin role',
        statusCode: 400
      });
    }

    // Create user
    const userData = {
      name,
      email: email.toLowerCase(),
      password,
      role: userRole
    };

    if (userRole === 'club_admin' && club) {
      userData.club = club;
    }

    const user = await User.create(userData);

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          club: user.club
        },
        token
      },
      message: 'User registered successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email and password',
        statusCode: 400
      });
    }

    // Check for user and include password field
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        statusCode: 401
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'User account is deactivated',
        statusCode: 401
      });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        statusCode: 401
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          club: user.club,
          avatar: user.avatar
        },
        token
      },
      message: 'Login successful'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      avatar: req.body.avatar
    };

    // Remove undefined fields
    Object.keys(fieldsToUpdate).forEach(key => 
      fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
    );

    const user = await User.findByIdAndUpdate(
      req.user.id,
      fieldsToUpdate,
      {
        new: true,
        runValidators: true
      }
    );

    res.json({
      success: true,
      data: {
        user
      },
      message: 'Profile updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password — generate reset token & send Gmail
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email',
        statusCode: 400
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    // Always respond with the same message to prevent user enumeration
    const GENERIC_MSG = 'If an account with that email exists, a password reset link has been sent.';

    if (!user) {
      return res.json({ success: true, message: GENERIC_MSG });
    }

    // Generate token and persist hashed version
    const rawToken = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // Build the reset URL (works for both GitHub Pages and localhost dev)
    const frontendBase =
      process.env.FRONTEND_URL ||
      'http://localhost:5173';
    const resetUrl = `${frontendBase}/reset-password?token=${rawToken}&email=${encodeURIComponent(user.email)}`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:'Segoe UI',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#111827,#000);padding:32px 40px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;letter-spacing:-0.5px">🔐 Password Reset</h1>
          <p style="color:#9ca3af;margin:8px 0 0;font-size:13px">SLoP Slot Booking System</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:40px">
          <p style="color:#111827;font-size:16px;margin:0 0 12px">Hi <strong>${user.name}</strong>,</p>
          <p style="color:#4b5563;font-size:14px;line-height:1.6;margin:0 0 28px">
            We received a request to reset the password for your account (<strong>${user.email}</strong>).
            Click the button below to set a new password. This link expires in <strong>1 hour</strong>.
          </p>
          <div style="text-align:center;margin:32px 0">
            <a href="${resetUrl}"
               style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#111827,#000);
                      color:#fff;text-decoration:none;border-radius:10px;font-size:15px;
                      font-weight:600;letter-spacing:0.3px">
              Reset My Password
            </a>
          </div>
          <p style="color:#6b7280;font-size:12px;line-height:1.6;margin:24px 0 0">
            If the button above doesn't work, copy and paste this link into your browser:<br>
            <a href="${resetUrl}" style="color:#4f46e5;word-break:break-all">${resetUrl}</a>
          </p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0">
          <p style="color:#9ca3af;font-size:12px;margin:0">
            If you didn't request a password reset, you can safely ignore this email.
            Your password will not change.
          </p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f9fafb;padding:20px 40px;text-align:center">
          <p style="color:#9ca3af;font-size:11px;margin:0">© ${new Date().getFullYear()} SLoP Slot Booking System. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    try {
      await sendEmail({
        to: user.email,
        subject: 'Password Reset Request — SLoP Slot Booking System',
        html,
      });

      return res.json({ success: true, message: GENERIC_MSG });
    } catch (emailErr) {
      // Email failed — clear the token so the user can try again
      user.resetPasswordToken = null;
      user.resetPasswordExpire = null;
      await user.save({ validateBeforeSave: false });

      console.error('Email send error:', emailErr.message);
      return res.status(500).json({
        success: false,
        error:
          'Could not send the reset email. ' +
          'Please ensure GMAIL_USER and GMAIL_PASS are configured, then try again.',
        statusCode: 500
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password using token from email
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide token and new password',
        statusCode: 400
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters',
        statusCode: 400
      });
    }

    // Hash the incoming raw token to compare against the stored hash
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with matching non-expired token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    }).select('+resetPasswordToken +resetPasswordExpire');

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired password reset token. Please request a new one.',
        statusCode: 400
      });
    }

    // Update password and clear reset fields
    user.password = password;  // will be hashed by the pre-save hook
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;
    await user.save();

    // Issue a fresh JWT so the user is logged in immediately after reset
    const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || '7d'
    });

    res.json({
      success: true,
      message: 'Password reset successful. You are now logged in.',
      data: {
        token: jwtToken,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          club: user.club
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
