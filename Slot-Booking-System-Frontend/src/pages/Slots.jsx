import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, Users, Search, Loader2 } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Footer from '../components/ui/Footer';
import slotAPI from '../services/slotAPI';

const Slots = ({ user }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSlots = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await slotAPI.getAllSlots({ limit: 100 });
        
        if (response.success && response.data) {
          const slotsData = response.data.slots || response.data || [];
          setSlots(slotsData);
        } else {
          setError('Failed to load slots. Please try again.');
        }
      } catch (err) {
        console.error('Error fetching slots:', err);
        setError(err.message || 'Failed to load slots. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, []);

  const filteredSlots = slots.filter(slot => {
    const venue = slot.venue || '';
    const location = slot.location || '';
    const matchesSearch = venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || slot.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const canBook = user && (user.role === 'club_admin' || user.role === 'super_admin');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex flex-wrap items-center justify-center pt-20">
      <div className="max-w-7xl mx-auto animate-fadeIn">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Available Slots
          </h1>
          <p className="text-gray-600 text-lg">
            Browse and {canBook ? 'book' : 'view'} available time slots for your events
          </p>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Input
                placeholder="Search by venue or location..."
                icon={Search}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-200 font-medium"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="booked">Booked</option>
            </select>
          </div>
        </Card>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Results Count */}
        <p className="text-gray-700 font-semibold mb-6">
          {loading ? 'Loading slots...' : `Showing ${filteredSlots.length} slot${filteredSlots.length !== 1 ? 's' : ''}`}
        </p>

        {/* Slots Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : filteredSlots.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-xl text-gray-500">
              No slots found matching your criteria
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSlots.map((slot, index) => {
              const slotId = slot._id || slot.id;
              const slotDate = slot.date ? new Date(slot.date).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              }) : 'N/A';
              const startTime = slot.startTime || 'N/A';
              const endTime = slot.endTime || 'N/A';
              
              return (
                <Card
                  key={slotId}
                  gradient={slot.status === 'available'}
                  className="p-6 animate-fadeIn"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900">
                      {slot.venue || 'Unknown Venue'}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                        slot.status === 'available'
                          ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {slot.status || 'unknown'}
                    </span>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-gray-700">
                      <Calendar className="w-5 h-5 text-gray-900" />
                      <span className="text-sm font-medium">
                        {slotDate}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-gray-700">
                      <Clock className="w-5 h-5 text-gray-900" />
                      <span className="text-sm font-medium">
                        {startTime} - {endTime}
                      </span>
                    </div>

                    {slot.location && (
                      <div className="flex items-center gap-3 text-gray-700">
                        <MapPin className="w-5 h-5 text-gray-900" />
                        <span className="text-sm font-medium">
                          {slot.location}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-gray-700">
                      <Users className="w-5 h-5 text-gray-900" />
                      <span className="text-sm font-medium">
                        Capacity: {slot.capacity || 'N/A'}
                      </span>
                    </div>
                  </div>

                  {canBook && slot.status === 'available' && (
                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={() => {
                        // Navigate to new booking page with slot pre-selected
                        navigate(`/bookings/new?slot=${slotId}`);
                      }}
                    >
                      Book Now
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
      <div className='w-full mt-4'>
        <Footer />
      </div>
    </div>
  );
};

export default Slots;

