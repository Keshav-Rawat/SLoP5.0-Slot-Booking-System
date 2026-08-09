import User from '../models/User.js';
import { paginate } from '../utils/helpers.js';
import { USER_ROLES } from '../utils/constants.js';

// @desc    Get all users (super_admin only)
// @route   GET /api/users
// @access  Private (super_admin)
export const getAllUsers = async (req, res, next) => {
  try {
    const { role, search, page, limit } = req.query;
    const { skip, limit: pageLimit } = paginate(page, limit);

    const filter = {};

    if (role && Object.values(USER_ROLES).includes(role)) {
      filter.role = role;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageLimit)
        .exec(),
      User.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        users,
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

// @desc    Get single user by ID (super_admin only)
// @route   GET /api/users/:id
// @access  Private (super_admin)
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        statusCode: 404
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user role (super_admin only)
// @route   PUT /api/users/:id/role
// @access  Private (super_admin)
export const updateUserRole = async (req, res, next) => {
  try {
    const { role, club } = req.body;

    if (!role || !Object.values(USER_ROLES).includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid role: user, club_admin, or super_admin',
        statusCode: 400
      });
    }

    // Require club for club_admin role
    if (role === USER_ROLES.CLUB_ADMIN && !club) {
      return res.status(400).json({
        success: false,
        error: 'Club name is required for club_admin role',
        statusCode: 400
      });
    }

    // Prevent changing own role
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        error: 'Cannot change your own role',
        statusCode: 400
      });
    }

    const updates = { role };
    if (role === USER_ROLES.CLUB_ADMIN && club) {
      updates.club = club;
    }
    if (role !== USER_ROLES.CLUB_ADMIN) {
      updates.club = undefined;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        statusCode: 404
      });
    }

    res.json({
      success: true,
      data: { user },
      message: `User role updated to ${role}`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Deactivate/activate a user (super_admin only)
// @route   PUT /api/users/:id/deactivate
// @access  Private (super_admin)
export const deactivateUser = async (req, res, next) => {
  try {
    // Prevent deactivating self
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        error: 'Cannot deactivate your own account',
        statusCode: 400
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        statusCode: 404
      });
    }

    // Toggle active status
    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      data: { user },
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    next(error);
  }
};
