import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { USER_ROLES } from '../utils/constants.js';
import {
  getAllSlots,
  getSlotById,
  createSlot,
  updateSlot,
  deleteSlot,
  bookSlot
} from '../controllers/slotController.js';

const router = express.Router();

// Public routes — no authentication required
// Visitors can browse available slots without an account (matches documentation)
router.get('/', getAllSlots);
router.get('/:id', getSlotById);

// All routes below require authentication
router.use(protect);

// Book a slot (club_admin, super_admin)
router.put('/:id/book', authorize(USER_ROLES.CLUB_ADMIN, USER_ROLES.SUPER_ADMIN), bookSlot);

// Super admin only routes
router.use(authorize(USER_ROLES.SUPER_ADMIN));

router.post('/', createSlot);
router.put('/:id', updateSlot);
router.delete('/:id', deleteSlot);

export default router;
