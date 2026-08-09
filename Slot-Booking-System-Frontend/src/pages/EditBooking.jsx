import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, Users, ArrowLeft, Shield, Loader2 } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Footer from '../components/ui/Footer';
import bookingAPI from '../services/bookingAPI';

const EditBooking = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [bookingData, setBookingData] = useState(null);

  // Fetch booking data on mount
  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setLoadingData(true);
        const response = await bookingAPI.getBookingById(id);
        
        if (response.success && response.data) {
          const booking = response.data.booking || response.data;
          setBookingData(booking);
          
          // Initialize form data
          setFormData({
            eventName: booking.eventName || '',
            eventDescription: booking.eventDescription || '',
            expectedParticipants: booking.expectedParticipants || '',
            contactPerson: booking.contactPerson || {
              name: '',
              phone: '',
              email: ''
            },
            requirements: booking.requirements || [],
            specialInstructions: booking.specialInstructions || '',
            status: booking.status || 'pending'
          });
        } else {
          setError('Failed to load booking. Please try again.');
        }
      } catch (err) {
        console.error('Error fetching booking:', err);
        setError(err.message || 'Failed to load booking. Please try again.');
      } finally {
        setLoadingData(false);
      }
    };

    if (id) {
      fetchBooking();
    }
  }, [id]);

  const [formData, setFormData] = useState({
    eventName: '',
    eventDescription: '',
    expectedParticipants: '',
    contactPerson: {
      name: '',
      phone: '',
      email: ''
    },
    requirements: [],
    specialInstructions: '',
    status: 'pending'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('contactPerson.')) {
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        contactPerson: {
          ...formData.contactPerson,
          [field]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
    
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Prepare update data
      const updateData = {
        eventName: formData.eventName.trim(),
        eventDescription: formData.eventDescription.trim(),
        expectedParticipants: parseInt(formData.expectedParticipants),
        contactPerson: formData.contactPerson
      };

      // Add optional fields
      if (formData.requirements && formData.requirements.length > 0) {
        updateData.requirements = formData.requirements;
      }
      if (formData.specialInstructions && formData.specialInstructions.trim()) {
        updateData.specialInstructions = formData.specialInstructions.trim();
      }

      // If super admin, allow status update
      if (user?.role === 'super_admin' && formData.status) {
        const response = await bookingAPI.updateBookingStatus(id, {
          status: formData.status
        });
        
        if (response.success) {
          navigate('/bookings', {
            state: { message: 'Booking updated successfully!' }
          });
          return;
        }
      }

      // Regular update
      const response = await bookingAPI.updateBooking(id, updateData);

      if (response.success) {
        navigate('/bookings', {
          state: { message: 'Booking updated successfully!' }
        });
      } else {
        setError(response.error || response.message || 'Failed to update booking. Please try again.');
      }
    } catch (err) {
      console.error('Error updating booking:', err);
      setError(err.message || 'Failed to update booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex flex-wrap items-center justify-center pt-20">
      <div className="max-w-2xl mx-auto w-full animate-fadeIn">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            icon={ArrowLeft}
            onClick={() => navigate('/bookings')}
            className="p-2"
          >
            Back
          </Button>
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Edit Booking
            </h1>
            <p className="text-gray-600">
              Update your booking details
            </p>
          </div>
        </div>


        {/* Edit Form */}
        <Card className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}

          {loadingData ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Event Name"
              type="text"
              name="eventName"
              placeholder="Enter event name"
              value={formData.eventName}
              onChange={handleChange}
              required
            />

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Event Description *
              </label>
              <textarea
                name="eventDescription"
                value={formData.eventDescription}
                onChange={handleChange}
                rows="4"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-200 resize-none"
                placeholder="Describe your event..."
                required
                maxLength={1000}
              />
              <p className="text-xs text-gray-500 mt-1">{formData.eventDescription.length}/1000 characters</p>
            </div>

            <Input
              label="Expected Participants"
              type="number"
              name="expectedParticipants"
              placeholder="Enter number of participants"
              icon={Users}
              value={formData.expectedParticipants}
              onChange={handleChange}
              min="1"
              required
            />

            {/* Contact Person Section */}
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Person Details *</h3>
              
              <div className="space-y-4">
                <Input
                  label="Name *"
                  type="text"
                  name="contactPerson.name"
                  placeholder="Contact person name"
                  value={formData.contactPerson.name}
                  onChange={handleChange}
                  required
                />

                <Input
                  label="Phone *"
                  type="tel"
                  name="contactPerson.phone"
                  placeholder="10-digit phone number"
                  value={formData.contactPerson.phone}
                  onChange={handleChange}
                  required
                  maxLength="10"
                />

                <Input
                  label="Email *"
                  type="email"
                  name="contactPerson.email"
                  placeholder="contact@example.com"
                  value={formData.contactPerson.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Status Field - Only for super_admin */}
            {user?.role === 'super_admin' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Status
                </label>
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-gray-400" />
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-200"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Only super admins can change booking status
                </p>
              </div>
            )}

            {/* Status Display for non-super_admins */}
            {user?.role !== 'super_admin' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Status
                </label>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <span className={`px-3 py-1.5 rounded-full text-sm font-bold capitalize ${getStatusColor(formData.status)}`}>
                    {formData.status}
                  </span>
                  <p className="text-sm text-gray-500 mt-1">
                    Status can only be changed by super admins
                  </p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Special Instructions (Optional)
              </label>
              <textarea
                name="specialInstructions"
                value={formData.specialInstructions}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-200 resize-none"
                placeholder="Any special instructions or notes..."
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">{formData.specialInstructions.length}/500 characters</p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => navigate('/bookings')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
                disabled={loading}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Update Booking'
                )}
              </Button>
            </div>
          </form>
          )}
        </Card>
      </div>
      <div className='w-full mt-4'>
        <Footer />
      </div>
    </div>
  );
};

export default EditBooking;