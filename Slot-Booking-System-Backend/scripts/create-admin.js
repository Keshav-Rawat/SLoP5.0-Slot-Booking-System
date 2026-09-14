#!/usr/bin/env node
/**
 * create-admin.js — One-shot script to bootstrap a super_admin user.
 *
 * Usage (from Slot-Booking-System-Backend directory):
 *   node scripts/create-admin.js --name "Admin Name" --email admin@example.com --password "SecurePass123"
 *
 * The script reads MONGODB_URI from the .env file in the backend root.
 * Run this once after deploying the backend to Render (or locally with a
 * live Atlas URI) to create the first super_admin account.
 *
 * Requirements: npm dependencies must be installed (npm install).
 */

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

// Load .env from the backend root
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '..', '.env') });

// ── Parse CLI args ────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const get = (flag) => {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : null;
};

const name     = get('--name');
const email    = get('--email');
const password = get('--password');

if (!name || !email || !password) {
  console.error(
    '\n❌  Missing required arguments.\n\n' +
    'Usage:\n' +
    '  node scripts/create-admin.js --name "Admin Name" --email admin@example.com --password "SecurePass123"\n'
  );
  process.exit(1);
}

if (password.length < 6) {
  console.error('❌  Password must be at least 6 characters.');
  process.exit(1);
}

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error(
    '❌  MONGODB_URI is not set.\n' +
    '    Make sure Slot-Booking-System-Backend/.env contains MONGODB_URI, or export it before running.'
  );
  process.exit(1);
}

// ── Connect & create ──────────────────────────────────────────────────────────
(async () => {
  try {
    console.log('🔌  Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅  Connected.');

    // Use the raw collection so we don't have to import the full User model
    // (avoids dependency on the module graph at script-run time).
    const db = mongoose.connection.db;
    const users = db.collection('users');

    const normalised = email.toLowerCase().trim();

    const existing = await users.findOne({ email: normalised });
    if (existing) {
      console.error(`❌  A user with email "${normalised}" already exists (role: ${existing.role}).`);
      process.exit(1);
    }

    const salt = await bcrypt.genSalt(12);
    const hashed = await bcrypt.hash(password, salt);

    const doc = {
      name: name.trim(),
      email: normalised,
      password: hashed,
      role: 'super_admin',
      isActive: true,
      lastLogin: null,
      avatar: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await users.insertOne(doc);
    console.log(`\n✅  super_admin created successfully!`);
    console.log(`    Name  : ${doc.name}`);
    console.log(`    Email : ${doc.email}`);
    console.log(`    ID    : ${result.insertedId}\n`);
    console.log('You can now log in with these credentials at the frontend.\n');
  } catch (err) {
    console.error('❌  Error:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
})();
