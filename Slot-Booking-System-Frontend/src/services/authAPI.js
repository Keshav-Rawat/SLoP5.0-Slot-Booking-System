import api from './api';

const authAPI = {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @param {string} userData.name - User's full name
   * @param {string} userData.email - User's email
   * @param {string} userData.password - User's password
   * @param {string} userData.role - User's role (user, club_admin, super_admin)
   * @param {string} [userData.club] - Club name (required for club_admin)
   * @returns {Promise} Response with user data
   */
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response;
  },

  /**
   * Login user
   * @param {Object} credentials - Login credentials
   * @param {string} credentials.email - User's email
   * @param {string} credentials.password - User's password
   * @returns {Promise} Response with user data and token
   */
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    
    // Store token and user data
    if (response.data?.token) {
      localStorage.setItem('token', response.data.token);
    }
    if (response.data?.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response;
  },

  /**
   * Logout user
   * @returns {Promise} Response
   */
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage regardless of API response
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  /**
   * Get current user profile
   * @returns {Promise} Response with user data
   */
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response;
  },

  /**
   * Update user profile
   * @param {Object} userData - Updated user data
   * @returns {Promise} Response with updated user data
   */
  updateProfile: async (userData) => {
    const response = await api.put('/auth/profile', userData);
    
    // Update stored user data if available
    if (response.data?.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response;
  },

  /**
   * Request password reset
   * @param {string} email - User's email
   * @returns {Promise} Response
   */
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response;
  },

  /**
   * Reset password with token
   * @param {Object} data - Reset password data
   * @param {string} data.token - Reset token
   * @param {string} data.password - New password
   * @returns {Promise} Response
   */
  resetPassword: async (data) => {
    const response = await api.post('/auth/reset-password', data);
    return response;
  },
};

export default authAPI;
