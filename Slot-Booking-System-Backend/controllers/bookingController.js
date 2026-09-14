import Booking from '../models/Booking.js';
import Slot from '../models/Slot.js';
import { paginate } from '../utils/helpers.js';
import { BOOKING_STATUS, SLOT_STATUS } from '../utils/constants.js';

// @desc    Get all bookings (super_admin sees all, club_admin sees own club)
// @route   GET /api/bookings
// @access  Private (club_admin, super_admin)
export const getAllBookings = async (req, res, next) => {
  try {
    const { status, club, page, limit } = req.query;
    const { skip, limit: pageLimit } = paginate(page, limit);

    // Build filter
    const filter = {};

    // Club admins only see their own bookings
    if (req.user.role === 'club_admin') {
      filter.user = req.user._id;
    }

    if (status && Object.values(BOOKING_STATUS).includes(status)) {
      filter.status = status;
    }
    if (club) {
      filter.club = { $regex: club, $options: 'i' };
    }

    // Date range filter on the related slot
    const query = Booking.find(filter)
      .populate('slot', 'venue date startTime endTime capacity location status')
      .populate('user', 'name email role club')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageLimit);

    const [bookings, total] = await Promise.all([
      query.exec(),
      Booking.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          total,
          page: parseInt(page) || 1,
          limit: pageLimit,
          pages: Math.ceil(total / pageLimit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's bookings
// @route   GET /api/bookings/my-bookings
// @access  Private
export const getMyBookings = async (req, res, next) => {
  try {
    const { status, page, limit } = req.query;
    const { skip, limit: pageLimit } = paginate(page, limit);

    const filter = { user: req.user._id };

    if (status && Object.values(BOOKING_STATUS).includes(status)) {
      filter.status = status;
    }

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate('slot', 'venue date startTime endTime capacity location status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageLimit)
        .exec(),
      Booking.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          total,
          page: parseInt(page) || 1,
          limit: pageLimit,
          pages: Math.ceil(total / pageLimit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single booking by ID
// @route   GET /api/bookings/:id
// @access  Private
export const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('slot', 'venue date startTime endTime capacity location status')
      .populate('user', 'name email role club')
      .populate('approvedBy', 'name email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
        statusCode: 404
      });
    }

    // Only allow owner or super_admin to view
    const isOwner = booking.user._id.toString() === req.user._id.toString();
    const isSuperAdmin = req.user.role === 'super_admin';

    if (!isOwner && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this booking',
        statusCode: 403
      });
    }

    res.json({
      success: true,
      data: { booking }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private (club_admin, super_admin)
export const createBooking = async (req, res, next) => {
  try {
    const {
      slot: slotId,
      eventName,
      eventDescription,
      expectedParticipants,
      requirements,
      contactPerson,
      specialInstructions,
      club
    } = req.body;

    // Validate required fields
    if (!slotId || !eventName || !eventDescription || !expectedParticipants || !contactPerson) {
      return res.status(400).json({
        success: false,
        error: 'Please provide all required fields: slot, eventName, eventDescription, expectedParticipants, contactPerson',
        statusCode: 400
      });
    }

    // Validate contact person
    if (!contactPerson.name || !contactPerson.phone || !contactPerson.email) {
      return res.status(400).json({
        success: false,
        error: 'Contact person must include name, phone, and email',
        statusCode: 400
      });
    }

    // Atomically claim the slot — only succeeds if it is still 'available'.
    // This eliminates the TOCTOU race condition where two concurrent requests
    // both observe status === 'available' before either marks it booked.
    const slot = await Slot.findOneAndUpdate(
      { _id: slotId, status: SLOT_STATUS.AVAILABLE },
      { $set: { status: SLOT_STATUS.BOOKED, bookedBy: req.user._id } },
      { new: true }
    );

    if (!slot) {
      // Either the slot doesn't exist or it was claimed by a concurrent request
      const slotExists = await Slot.findById(slotId);
      if (!slotExists) {
        return res.status(404).json({
          success: false,
          error: 'Slot not found',
          statusCode: 404
        });
      }
      return res.status(409).json({
        success: false,
        error: 'This slot is no longer available for booking',
        statusCode: 409
      });
    }

    // Check capacity (now that we have the slot document)
    if (expectedParticipants > slot.capacity) {
      // Roll back the atomic claim — restore slot to available
      await Slot.findByIdAndUpdate(slotId, {
        $set: { status: SLOT_STATUS.AVAILABLE, bookedBy: null }
      });
      return res.status(400).json({
        success: false,
        error: `Expected participants (${expectedParticipants}) exceed slot capacity (${slot.capacity})`,
        statusCode: 400
      });
    }

    // Check for an existing active booking on this slot (defensive; slot status should
    // already prevent this, but guard against orphaned records)
    const existingBooking = await Booking.findOne({
      slot: slotId,
      status: { $in: [BOOKING_STATUS.PENDING, BOOKING_STATUS.APPROVED] }
    });

    if (existingBooking) {
      // Roll back
      await Slot.findByIdAndUpdate(slotId, {
        $set: { status: SLOT_STATUS.AVAILABLE, bookedBy: null }
      });
      return res.status(409).json({
        success: false,
        error: 'This slot already has an active booking',
        statusCode: 409
      });
    }

    // Create the booking record
    const newBookingData = {
      slot: slotId,
      user: req.user._id,
      club: club || req.user.club || 'General',
      eventName,
      eventDescription,
      expectedParticipants: parseInt(expectedParticipants),
      contactPerson,
      status: BOOKING_STATUS.PENDING
    };

    if (requirements && requirements.length > 0) {
      newBookingData.requirements = requirements;
    }
    if (specialInstructions) {
      newBookingData.specialInstructions = specialInstructions;
    }

    const booking = await Booking.create(newBookingData);

    // Populate and return
    const populatedBooking = await Booking.findById(booking._id)
      .populate('slot', 'venue date startTime endTime capacity location status')
      .populate('user', 'name email role club');

    res.status(201).json({
      success: true,
      data: { booking: populatedBooking },
      message: 'Booking created successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a booking (owner only, pending bookings only)
// @route   PUT /api/bookings/:id
// @access  Private
export const updateBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
        statusCode: 404
      });
    }

    // Check ownership
    const isOwner = booking.user.toString() === req.user._id.toString();
    const isSuperAdmin = req.user.role === 'super_admin';

    if (!isOwner && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this booking',
        statusCode: 403
      });
    }

    // Only pending bookings can be updated by non-admins
    if (!isSuperAdmin && booking.status !== BOOKING_STATUS.PENDING) {
      return res.status(400).json({
        success: false,
        error: 'Only pending bookings can be updated',
        statusCode: 400
      });
    }

    // Fields that can be updated
    const allowedUpdates = [
      'eventName', 'eventDescription', 'expectedParticipants',
      'requirements', 'contactPerson', 'specialInstructions'
    ];

    const updates = {};
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    )
      .populate('slot', 'venue date startTime endTime capacity location status')
      .populate('user', 'name email role club');

    res.json({
      success: true,
      data: { booking: updatedBooking },
      message: 'Booking updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update booking status (super_admin only)
// @route   PUT /api/bookings/:id/status
// @access  Private (super_admin)
export const updateBookingStatus = async (req, res, next) => {
  try {
    const { status, rejectionReason } = req.body;

    if (!status || !Object.values(BOOKING_STATUS).includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid status: pending, approved, rejected, cancelled',
        statusCode: 400
      });
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
        statusCode: 404
      });
    }

    // Update booking status
    booking.status = status;

    if (status === BOOKING_STATUS.APPROVED) {
      booking.approvedBy = req.user._id;
      booking.approvalDate = new Date();
    }

    if (status === BOOKING_STATUS.REJECTED && rejectionReason) {
      booking.rejectionReason = rejectionReason;
    }

    // If rejected or cancelled, free up the slot
    if (status === BOOKING_STATUS.REJECTED || status === BOOKING_STATUS.CANCELLED) {
      const slot = await Slot.findById(booking.slot);
      if (slot) {
        slot.status = SLOT_STATUS.AVAILABLE;
        slot.bookedBy = null;
        await slot.save();
      }
    }

    await booking.save();

    const updatedBooking = await Booking.findById(booking._id)
      .populate('slot', 'venue date startTime endTime capacity location status')
      .populate('user', 'name email role club')
      .populate('approvedBy', 'name email');

    res.json({
      success: true,
      data: { booking: updatedBooking },
      message: `Booking ${status} successfully`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete/cancel a booking
// @route   DELETE /api/bookings/:id
// @access  Private
export const deleteBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
        statusCode: 404
      });
    }

    // Check ownership
    const isOwner = booking.user.toString() === req.user._id.toString();
    const isSuperAdmin = req.user.role === 'super_admin';

    if (!isOwner && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this booking',
        statusCode: 403
      });
    }

    // Non-admins can only delete pending bookings
    if (!isSuperAdmin && booking.status !== BOOKING_STATUS.PENDING) {
      return res.status(400).json({
        success: false,
        error: 'Only pending bookings can be cancelled',
        statusCode: 400
      });
    }

    // Free up the slot
    const slot = await Slot.findById(booking.slot);
    if (slot && slot.status === SLOT_STATUS.BOOKED) {
      slot.status = SLOT_STATUS.AVAILABLE;
      slot.bookedBy = null;
      await slot.save();
    }

    await Booking.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Booking deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
