import Slot from '../models/Slot.js';
import Booking from '../models/Booking.js';
import { paginate } from '../utils/helpers.js';
import { SLOT_STATUS, BOOKING_STATUS } from '../utils/constants.js';

// @desc    Get all slots (filterable)
// @route   GET /api/slots
// @access  Public (authenticated)
export const getAllSlots = async (req, res, next) => {
  try {
    const { date, venue, status, startTime, endTime, page, limit } = req.query;
    const { skip, limit: pageLimit } = paginate(page, limit);

    // Build filter
    const filter = {};

    if (status && Object.values(SLOT_STATUS).includes(status)) {
      filter.status = status;
    }
    if (venue) {
      filter.venue = { $regex: venue, $options: 'i' };
    }
    if (date) {
      // Match the entire day
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      filter.date = { $gte: startOfDay, $lte: endOfDay };
    }
    if (startTime) {
      filter.startTime = { $gte: startTime };
    }
    if (endTime) {
      filter.endTime = { $lte: endTime };
    }

    const [slots, total] = await Promise.all([
      Slot.find(filter)
        .populate('bookedBy', 'name email club')
        .sort({ date: 1, startTime: 1 })
        .skip(skip)
        .limit(pageLimit)
        .exec(),
      Slot.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        slots,
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

// @desc    Get single slot by ID
// @route   GET /api/slots/:id
// @access  Public (authenticated)
export const getSlotById = async (req, res, next) => {
  try {
    const slot = await Slot.findById(req.params.id)
      .populate('bookedBy', 'name email club');

    if (!slot) {
      return res.status(404).json({
        success: false,
        error: 'Slot not found',
        statusCode: 404
      });
    }

    res.json({
      success: true,
      data: { slot }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new slot
// @route   POST /api/slots
// @access  Private (super_admin)
export const createSlot = async (req, res, next) => {
  try {
    const { venue, date, startTime, endTime, capacity, location } = req.body;

    // Validate required fields
    if (!venue || !date || !startTime || !endTime || !capacity) {
      return res.status(400).json({
        success: false,
        error: 'Please provide venue, date, startTime, endTime, and capacity',
        statusCode: 400
      });
    }

    // Validate time order
    if (startTime >= endTime) {
      return res.status(400).json({
        success: false,
        error: 'End time must be after start time',
        statusCode: 400
      });
    }

    // Check for overlapping slots at the same venue
    const slotDate = new Date(date);
    const startOfDay = new Date(slotDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(slotDate);
    endOfDay.setHours(23, 59, 59, 999);

    const overlapping = await Slot.findOne({
      venue: { $regex: `^${venue}$`, $options: 'i' },
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: SLOT_STATUS.CANCELLED },
      $or: [
        { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
      ]
    });

    if (overlapping) {
      return res.status(400).json({
        success: false,
        error: `Time slot overlaps with an existing slot at ${venue} (${overlapping.startTime} - ${overlapping.endTime})`,
        statusCode: 400
      });
    }

    const slotData = {
      venue,
      date: slotDate,
      startTime,
      endTime,
      capacity: parseInt(capacity),
      status: SLOT_STATUS.AVAILABLE
    };

    if (location) {
      slotData.location = location;
    }

    const slot = await Slot.create(slotData);

    res.status(201).json({
      success: true,
      data: { slot },
      message: 'Slot created successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a slot
// @route   PUT /api/slots/:id
// @access  Private (super_admin)
export const updateSlot = async (req, res, next) => {
  try {
    const slot = await Slot.findById(req.params.id);

    if (!slot) {
      return res.status(404).json({
        success: false,
        error: 'Slot not found',
        statusCode: 404
      });
    }

    // Don't allow updating booked slots (except status/cancellation)
    if (slot.status === SLOT_STATUS.BOOKED && req.body.status !== SLOT_STATUS.CANCELLED) {
      return res.status(400).json({
        success: false,
        error: 'Cannot modify a booked slot. Cancel it first.',
        statusCode: 400
      });
    }

    const allowedUpdates = ['venue', 'date', 'startTime', 'endTime', 'capacity', 'location', 'status'];
    const updates = {};
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const updatedSlot = await Slot.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: { slot: updatedSlot },
      message: 'Slot updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a slot
// @route   DELETE /api/slots/:id
// @access  Private (super_admin)
export const deleteSlot = async (req, res, next) => {
  try {
    const slot = await Slot.findById(req.params.id);

    if (!slot) {
      return res.status(404).json({
        success: false,
        error: 'Slot not found',
        statusCode: 404
      });
    }

    // Don't allow deleting booked slots
    if (slot.status === SLOT_STATUS.BOOKED) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete a booked slot. Cancel the booking first.',
        statusCode: 400
      });
    }

    // Delete associated bookings (cancelled/rejected ones)
    await Booking.deleteMany({
      slot: slot._id,
      status: { $in: [BOOKING_STATUS.CANCELLED, BOOKING_STATUS.REJECTED] }
    });

    await Slot.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Slot deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Book a slot (creates booking + marks slot as booked)
// @route   PUT /api/slots/:id/book
// @access  Private (club_admin, super_admin)
export const bookSlot = async (req, res, next) => {
  try {
    const slot = await Slot.findById(req.params.id);

    if (!slot) {
      return res.status(404).json({
        success: false,
        error: 'Slot not found',
        statusCode: 404
      });
    }

    if (slot.status !== SLOT_STATUS.AVAILABLE) {
      return res.status(400).json({
        success: false,
        error: 'This slot is not available for booking',
        statusCode: 400
      });
    }

    const {
      eventName,
      eventDescription,
      expectedParticipants,
      requirements,
      contactPerson,
      specialInstructions
    } = req.body;

    // Validate required fields
    if (!eventName || !eventDescription || !expectedParticipants || !contactPerson) {
      return res.status(400).json({
        success: false,
        error: 'Please provide eventName, eventDescription, expectedParticipants, and contactPerson',
        statusCode: 400
      });
    }

    // Check capacity
    if (expectedParticipants > slot.capacity) {
      return res.status(400).json({
        success: false,
        error: `Expected participants (${expectedParticipants}) exceed slot capacity (${slot.capacity})`,
        statusCode: 400
      });
    }

    // Create the booking
    const bookingData = {
      slot: slot._id,
      user: req.user._id,
      club: req.user.club || 'General',
      eventName,
      eventDescription,
      expectedParticipants: parseInt(expectedParticipants),
      contactPerson,
      status: BOOKING_STATUS.PENDING
    };

    if (requirements && requirements.length > 0) {
      bookingData.requirements = requirements;
    }
    if (specialInstructions) {
      bookingData.specialInstructions = specialInstructions;
    }

    const booking = await Booking.create(bookingData);

    // Mark slot as booked
    slot.status = SLOT_STATUS.BOOKED;
    slot.bookedBy = req.user._id;
    await slot.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate('slot', 'venue date startTime endTime capacity location status')
      .populate('user', 'name email role club');

    res.status(201).json({
      success: true,
      data: {
        booking: populatedBooking,
        slot
      },
      message: 'Slot booked successfully'
    });
  } catch (error) {
    next(error);
  }
};
