import api from './api';

const slotAPI = {
  /**
   * Get all slots with optional filtering
   * @param {Object} [filters] - Optional filters
   * @param {string} [filters.date] - Filter by date (YYYY-MM-DD)
   * @param {string} [filters.venue] - Filter by venue
   * @param {string} [filters.status] - Filter by status (available, booked, cancelled)
   * @param {string} [filters.startTime] - Filter slots starting after this time
   * @param {string} [filters.endTime] - Filter slots ending before this time
   * @param {number} [filters.page] - Page number
   * @param {number} [filters.limit] - Items per page
   * @returns {Promise} Response with slots array
   */
  getAllSlots: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });
    
    const queryString = params.toString();
    const url = `/slots${queryString ? `?${queryString}` : ''}`;
    const response = await api.get(url);
    return response;
  },

  /**
   * Get a specific slot by ID
   * @param {string} slotId - Slot ID
   * @returns {Promise} Response with slot data
   */
  getSlotById: async (slotId) => {
    const response = await api.get(`/slots/${slotId}`);
    return response;
  },

  /**
   * Create a new slot (Super Admin only)
   * @param {Object} slotData - Slot data
   * @param {string} slotData.venue - Venue name
   * @param {string} slotData.date - Date (YYYY-MM-DD)
   * @param {string} slotData.startTime - Start time (HH:mm)
   * @param {string} slotData.endTime - End time (HH:mm)
   * @param {number} slotData.capacity - Maximum capacity
   * @param {string} [slotData.location] - Location description
   * @returns {Promise} Response with created slot
   */
  createSlot: async (slotData) => {
    const response = await api.post('/slots', slotData);
    return response;
  },

  /**
   * Update a slot (Super Admin only)
   * @param {string} slotId - Slot ID
   * @param {Object} slotData - Updated slot data
   * @returns {Promise} Response with updated slot
   */
  updateSlot: async (slotId, slotData) => {
    const response = await api.put(`/slots/${slotId}`, slotData);
    return response;
  },

  /**
   * Delete a slot (Super Admin only)
   * @param {string} slotId - Slot ID
   * @returns {Promise} Response
   */
  deleteSlot: async (slotId) => {
    const response = await api.delete(`/slots/${slotId}`);
    return response;
  },

  /**
   * Book a specific slot (Club Admin only)
   * @param {string} slotId - Slot ID
   * @param {Object} bookingData - Booking data
   * @param {string} bookingData.eventName - Event name
   * @param {string} bookingData.eventDescription - Event description
   * @param {number} bookingData.expectedParticipants - Expected participants
   * @param {Array<string>} [bookingData.requirements] - Requirements list
   * @param {Object} bookingData.contactPerson - Contact person details
   * @returns {Promise} Response with booking and updated slot
   */
  bookSlot: async (slotId, bookingData) => {
    const response = await api.put(`/slots/${slotId}/book`, bookingData);
    return response;
  },
};

export default slotAPI;
