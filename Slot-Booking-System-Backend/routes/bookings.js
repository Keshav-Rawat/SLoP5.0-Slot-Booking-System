import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { USER_ROLES } from '../utils/constants.js';
import {
  getAllBookings,
  getMyBookings,
  getBookingById,
  createBooking,
  updateBooking,
  updateBookingStatus,
  deleteBooking
} from '../controllers/bookingController.js';

const router = express.Router();

// All booking routes require authentication
router.use(protect);

// Get my bookings (any authenticated user)
router.get('/my-bookings', getMyBookings);

// Get all bookings (super_admin only)
router.get('/', authorize(USER_ROLES.SUPER_ADMIN), getAllBookings);

// Create a booking (club_admin, super_admin)
router.post('/', authorize(USER_ROLES.CLUB_ADMIN, USER_ROLES.SUPER_ADMIN), createBooking);

// Get single booking
router.get('/:id', getBookingById);

// Update a booking (owner or super_admin)
router.put('/:id', updateBooking);

// Update booking status (super_admin only)
router.put('/:id/status', authorize(USER_ROLES.SUPER_ADMIN), updateBookingStatus);

// Delete/cancel a booking
router.delete('/:id', deleteBooking);

export default router;
