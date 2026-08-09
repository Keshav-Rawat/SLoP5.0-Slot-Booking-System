import mongoose from 'mongoose';

const slotSchema = new mongoose.Schema({
  venue: {
    type: String,
    required: [true, 'Venue is required'],
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'Date is required']
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    match: [/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:mm format']
  },
  endTime: {
    type: String,
    required: [true, 'End time is required'],
    match: [/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:mm format']
  },
  capacity: {
    type: Number,
    required: [true, 'Capacity is required'],
    min: [1, 'Capacity must be at least 1']
  },
  location: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['available', 'booked', 'cancelled'],
    default: 'available'
  },
  bookedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient queries
slotSchema.index({ date: 1, startTime: 1, venue: 1 });
slotSchema.index({ status: 1 });

const Slot = mongoose.model('Slot', slotSchema);

export default Slot;
