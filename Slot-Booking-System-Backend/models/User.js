import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't return password by default
  },
  role: {
    type: String,
    enum: ['user', 'club_admin', 'super_admin'],
    default: 'user'
  },
  club: {
    type: String,
    trim: true,
    required: function() {
      return this.role === 'club_admin';
    }
  },
  avatar: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  // Password reset fields
  resetPasswordToken: {
    type: String,
    default: null,
    select: false  // Never included in query results by default
  },
  resetPasswordExpire: {
    type: Date,
    default: null,
    select: false
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate a password reset token.
// Returns the raw (un-hashed) token to include in the reset link.
// Stores only the SHA-256 hash in the DB — never the raw token.
userSchema.methods.generatePasswordResetToken = function() {
  // 32 random bytes → 64-character hex string
  const rawToken = crypto.randomBytes(32).toString('hex');

  // Hash and store (so the DB never contains the raw token)
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');

  // Token valid for 1 hour
  this.resetPasswordExpire = Date.now() + 60 * 60 * 1000;

  return rawToken; // send this in the email URL
};

// Method to remove password from JSON output
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpire;
  return obj;
};

const User = mongoose.model('User', userSchema);

export default User;
