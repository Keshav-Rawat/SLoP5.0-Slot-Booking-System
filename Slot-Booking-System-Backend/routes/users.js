import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { USER_ROLES } from '../utils/constants.js';
import {
  getAllUsers,
  getUserById,
  updateUserRole,
  deactivateUser
} from '../controllers/userController.js';

const router = express.Router();

// All user routes require super_admin authentication
router.use(protect);
router.use(authorize(USER_ROLES.SUPER_ADMIN));

// Get all users
router.get('/', getAllUsers);

// Get single user
router.get('/:id', getUserById);

// Update user role
router.put('/:id/role', updateUserRole);

// Deactivate/activate user
router.put('/:id/deactivate', deactivateUser);

export default router;
