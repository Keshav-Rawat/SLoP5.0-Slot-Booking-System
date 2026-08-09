import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  slot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Slot',
    required: [true, 'Slot is required']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  club: {
    type: String,
    required: [true, 'Club is required'],
    trim: true
  },
  eventName: {
    type: String,
    required: [true, 'Event name is required'],
    trim: true
  },
  eventDescription: {
    type: String,
    required: [true, 'Event description is required'],
    trim: true,
    maxlength: [1000, 'Event description cannot exceed 1000 characters']
  },
  expectedParticipants: {
    type: Number,
    required: [true, 'Expected participants is required'],
    min: [1, 'Expected participants must be at least 1']
  },
  requirements: [{
    type: String,
    trim: true
  }],
  contactPerson: {
    name: {
      type: String,
      required: [true, 'Contact person name is required'],
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Contact person phone is required'],
      match: [/^[0-9]{10}$/, 'Phone must be 10 digits']
    },
    email: {
      type: String,
      required: [true, 'Contact person email is required'],
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    }
  },
  specialInstructions: {
    type: String,
    trim: true,
    maxlength: [500, 'Special instructions cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  },
  rejectionReason: {
    type: String,
    trim: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approvalDate: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
bookingSchema.index({ user: 1, status: 1 });
bookingSchema.index({ slot: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ club: 1 });

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
