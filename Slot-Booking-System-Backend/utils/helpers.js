// Helper functions

export const formatDate = (date) => {
  return new Date(date).toISOString().split('T')[0];
};

export const formatTime = (time) => {
  return time;
};

export const paginate = (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  return { skip, limit: parseInt(limit) };
};
