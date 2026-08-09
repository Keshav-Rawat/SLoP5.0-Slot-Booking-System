import api from './api';

const bookingAPI = {
  /**
   * Get all bookings (with optional filters)
   * @param {Object} [filters] - Optional filters
   * @param {string} [filters.status] - Filter by status
   * @param {string} [filters.club] - Filter by club (Admin only)
   * @param {string} [filters.startDate] - Filter bookings from this date
   * @param {string} [filters.endDate] - Filter bookings until this date
   * @param {number} [filters.page] - Page number
   * @param {number} [filters.limit] - Items per page
   * @returns {Promise} Response with bookings array
   */
  getAllBookings: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });
    
    const queryString = params.toString();
    const url = `/bookings${queryString ? `?${queryString}` : ''}`;
    const response = await api.get(url);
    return response;
  },

  /**
   * Get current user's bookings
   * @param {Object} [filters] - Optional filters
   * @returns {Promise} Response with user's bookings
   */
  getMyBookings: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });
    
    const queryString = params.toString();
    const url = `/bookings/my-bookings${queryString ? `?${queryString}` : ''}`;
    const response = await api.get(url);
    return response;
  },

  /**
   * Get a specific booking by ID
   * @param {string} bookingId - Booking ID
   * @returns {Promise} Response with booking data
   */
  getBookingById: async (bookingId) => {
    const response = await api.get(`/bookings/${bookingId}`);
    return response;
  },

  /**
   * Create a new booking
   * @param {Object} bookingData - Booking data
   * @param {string} bookingData.slot - Slot ID
   * @param {string} bookingData.eventName - Event name
   * @param {string} bookingData.eventDescription - Event description
   * @param {number} bookingData.expectedParticipants - Expected number of participants
   * @param {Array<string>} [bookingData.requirements] - List of requirements
   * @param {Object} bookingData.contactPerson - Contact person details
   * @param {string} [bookingData.specialInstructions] - Special instructions
   * @returns {Promise} Response with created booking
   */
  createBooking: async (bookingData) => {
    const response = await api.post('/bookings', bookingData);
    return response;
  },

  /**
   * Update a booking
   * @param {string} bookingId - Booking ID
   * @param {Object} bookingData - Updated booking data
   * @returns {Promise} Response with updated booking
   */
  updateBooking: async (bookingId, bookingData) => {
    const response = await api.put(`/bookings/${bookingId}`, bookingData);
    return response;
  },

  /**
   * Update booking status (Super Admin only)
   * @param {string} bookingId - Booking ID
   * @param {Object} statusData - Status update data
   * @param {string} statusData.status - New status (pending, approved, rejected, cancelled)
   * @param {string} [statusData.rejectionReason] - Reason for rejection (if rejected)
   * @returns {Promise} Response with updated booking
   */
  updateBookingStatus: async (bookingId, statusData) => {
    const response = await api.put(`/bookings/${bookingId}/status`, statusData);
    return response;
  },

  /**
   * Delete/Cancel a booking
   * @param {string} bookingId - Booking ID
   * @returns {Promise} Response
   */
  deleteBooking: async (bookingId) => {
    const response = await api.delete(`/bookings/${bookingId}`);
    return response;
  },
};

export default bookingAPI;
