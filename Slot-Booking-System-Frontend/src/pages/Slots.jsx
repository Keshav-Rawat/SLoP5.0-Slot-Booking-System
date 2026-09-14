import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Clock, MapPin, Users, Search, Loader2,
  Plus, Pencil, Trash2, X, CheckCircle, AlertTriangle
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Footer from '../components/ui/Footer';
import slotAPI from '../services/slotAPI';

// ─── Slot Form Modal ───────────────────────────────────────────────────────────
const EMPTY_FORM = { venue: '', date: '', startTime: '', endTime: '', capacity: '', location: '' };

const SlotModal = ({ mode, slot, onClose, onSaved }) => {
  const [form, setForm] = useState(
    mode === 'edit' && slot
      ? {
          venue: slot.venue || '',
          date: slot.date ? new Date(slot.date).toISOString().slice(0, 10) : '',
          startTime: slot.startTime || '',
          endTime: slot.endTime || '',
          capacity: String(slot.capacity || ''),
          location: slot.location || '',
        }
      : EMPTY_FORM
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setError('');
  };

  const validate = () => {
    if (!form.venue.trim())      return 'Venue is required.';
    if (!form.date)              return 'Date is required.';
    if (!form.startTime)         return 'Start time is required.';
    if (!form.endTime)           return 'End time is required.';
    if (form.startTime >= form.endTime) return 'End time must be after start time.';
    if (!form.capacity || isNaN(form.capacity) || Number(form.capacity) < 1)
      return 'Capacity must be a positive number.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }

    setLoading(true);
    try {
      const payload = {
        venue: form.venue.trim(),
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        capacity: Number(form.capacity),
        ...(form.location.trim() && { location: form.location.trim() }),
      };

      if (mode === 'edit') {
        await slotAPI.updateSlot(slot._id, payload);
      } else {
        await slotAPI.createSlot(payload);
      }
      onSaved();
    } catch (err) {
      setError(err.message || `Failed to ${mode} slot. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-900 to-black">
          <h2 className="text-lg font-bold text-white">
            {mode === 'edit' ? '✏️ Edit Slot' : '➕ Create New Slot'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border-l-4 border-red-500 rounded-lg text-red-700 text-sm font-medium animate-fadeIn">
              {error}
            </div>
          )}

          {/* Venue */}
          <Input
            label="Venue *"
            name="venue"
            id="slot-venue"
            placeholder="e.g. Seminar Hall A"
            value={form.venue}
            onChange={handleChange}
            required
          />

          {/* Date */}
          <div className="w-full">
            <label htmlFor="slot-date" className="block text-sm font-semibold text-gray-700 mb-2">
              Date *
            </label>
            <input
              id="slot-date"
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              min={new Date().toISOString().slice(0, 10)}
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-gray-900 focus:ring-4 focus:ring-gray-100 transition-all duration-200"
            />
          </div>

          {/* Start / End Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="slot-start" className="block text-sm font-semibold text-gray-700 mb-2">
                Start Time *
              </label>
              <input
                id="slot-start"
                type="time"
                name="startTime"
                value={form.startTime}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-gray-900 focus:ring-4 focus:ring-gray-100 transition-all duration-200"
              />
            </div>
            <div>
              <label htmlFor="slot-end" className="block text-sm font-semibold text-gray-700 mb-2">
                End Time *
              </label>
              <input
                id="slot-end"
                type="time"
                name="endTime"
                value={form.endTime}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-gray-900 focus:ring-4 focus:ring-gray-100 transition-all duration-200"
              />
            </div>
          </div>

          {/* Capacity */}
          <Input
            label="Capacity *"
            name="capacity"
            id="slot-capacity"
            type="number"
            min="1"
            placeholder="e.g. 100"
            value={form.capacity}
            onChange={handleChange}
            required
          />

          {/* Location (optional) */}
          <Input
            label="Location / Description (optional)"
            name="location"
            id="slot-location"
            placeholder="e.g. Block C, 2nd Floor"
            value={form.location}
            onChange={handleChange}
          />

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={loading}
              id="slot-modal-submit"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : mode === 'edit' ? 'Save Changes' : 'Create Slot'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Delete Confirmation Modal ─────────────────────────────────────────────────
const DeleteModal = ({ slot, onClose, onDeleted }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setLoading(true);
    try {
      await slotAPI.deleteSlot(slot._id);
      onDeleted();
    } catch (err) {
      setError(err.message || 'Failed to delete slot.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-fadeIn">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Delete Slot</h2>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-gray-600 text-sm">
            Are you sure you want to delete the slot at{' '}
            <strong>{slot.venue}</strong>
            {slot.date ? ` on ${new Date(slot.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}?
            This action cannot be undone.
          </p>

          {error && (
            <div className="p-3 bg-red-50 border-l-4 border-red-500 rounded-lg text-red-700 text-sm font-medium">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors duration-200 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Trash2 className="w-4 h-4" /> Delete
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Toast notification ────────────────────────────────────────────────────────
const Toast = ({ message, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 bg-gray-900 text-white rounded-xl shadow-2xl animate-fadeIn">
      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
};

// ─── Main Slots Page ───────────────────────────────────────────────────────────
const Slots = ({ user }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  // Modal state
  const [modal, setModal] = useState(null); // null | { type: 'create' | 'edit' | 'delete', slot?: {} }

  const isSuperAdmin = user?.role === 'super_admin';
  const canBook = user && (user.role === 'club_admin' || isSuperAdmin);

  const fetchSlots = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await slotAPI.getAllSlots({ limit: 200 });
      if (response.success && response.data) {
        setSlots(response.data.slots || response.data || []);
      } else {
        setError('Failed to load slots. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Failed to load slots. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSlots(); }, [fetchSlots]);

  const filteredSlots = slots.filter(slot => {
    const venue = slot.venue || '';
    const location = slot.location || '';
    const matchesSearch =
      venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || slot.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleSaved = async (msg) => {
    setModal(null);
    setToast(msg || 'Slot saved successfully.');
    await fetchSlots();
  };

  const handleDeleted = async () => {
    setModal(null);
    setToast('Slot deleted successfully.');
    await fetchSlots();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex flex-wrap items-center justify-center pt-20">
      <div className="max-w-7xl w-full mx-auto px-4 animate-fadeIn">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Available Slots</h1>
            <p className="text-gray-600 text-lg">
              Browse and {canBook ? 'book' : 'view'} available time slots for your events
            </p>
          </div>

          {/* Super-admin: Create Slot CTA */}
          {isSuperAdmin && (
            <Button
              variant="primary"
              icon={Plus}
              id="create-slot-btn"
              onClick={() => setModal({ type: 'create' })}
            >
              Create Slot
            </Button>
          )}
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
              className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-gray-900 focus:ring-4 focus:ring-gray-100 transition-all duration-200 font-medium"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="booked">Booked</option>
            </select>
          </div>
        </Card>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Count */}
        <p className="text-gray-700 font-semibold mb-6">
          {loading
            ? 'Loading slots...'
            : `Showing ${filteredSlots.length} slot${filteredSlots.length !== 1 ? 's' : ''}`}
        </p>

        {/* Slots Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : filteredSlots.length === 0 ? (
          <Card className="p-12 text-center">
            {isSuperAdmin ? (
              <div className="space-y-4">
                <p className="text-xl text-gray-500">No slots yet.</p>
                <Button
                  variant="primary"
                  icon={Plus}
                  onClick={() => setModal({ type: 'create' })}
                >
                  Create your first slot
                </Button>
              </div>
            ) : (
              <p className="text-xl text-gray-500">No slots found matching your criteria.</p>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSlots.map((slot, index) => {
              const slotId = slot._id || slot.id;
              const slotDate = slot.date
                ? new Date(slot.date).toLocaleDateString('en-US', {
                    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
                  })
                : 'N/A';
              const startTime = slot.startTime || 'N/A';
              const endTime = slot.endTime || 'N/A';
              const isAvailable = slot.status === 'available';

              return (
                <Card
                  key={slotId}
                  gradient={isAvailable}
                  className="p-6 animate-fadeIn"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900 flex-1 pr-2">
                      {slot.venue || 'Unknown Venue'}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold capitalize flex-shrink-0 ${
                        isAvailable
                          ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {slot.status || 'unknown'}
                    </span>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-gray-700">
                      <Calendar className="w-5 h-5 text-gray-900 flex-shrink-0" />
                      <span className="text-sm font-medium">{slotDate}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700">
                      <Clock className="w-5 h-5 text-gray-900 flex-shrink-0" />
                      <span className="text-sm font-medium">{startTime} – {endTime}</span>
                    </div>
                    {slot.location && (
                      <div className="flex items-center gap-3 text-gray-700">
                        <MapPin className="w-5 h-5 text-gray-900 flex-shrink-0" />
                        <span className="text-sm font-medium">{slot.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-gray-700">
                      <Users className="w-5 h-5 text-gray-900 flex-shrink-0" />
                      <span className="text-sm font-medium">Capacity: {slot.capacity || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Book button — club_admin / super_admin on available slots */}
                  {canBook && isAvailable && (
                    <Button
                      variant="primary"
                      className="w-full mb-3"
                      id={`book-slot-${slotId}`}
                      onClick={() => navigate(`/bookings/new?slot=${slotId}`)}
                    >
                      Book Now
                    </Button>
                  )}

                  {/* Admin controls */}
                  {isSuperAdmin && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        icon={Pencil}
                        id={`edit-slot-${slotId}`}
                        onClick={() => setModal({ type: 'edit', slot })}
                      >
                        Edit
                      </Button>
                      {!slot.bookedBy && isAvailable && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 text-red-600 hover:bg-red-50"
                          icon={Trash2}
                          id={`delete-slot-${slotId}`}
                          onClick={() => setModal({ type: 'delete', slot })}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <div className="w-full mt-8">
        <Footer />
      </div>

      {/* Modals */}
      {modal?.type === 'create' && (
        <SlotModal
          mode="create"
          onClose={() => setModal(null)}
          onSaved={() => handleSaved('Slot created successfully.')}
        />
      )}
      {modal?.type === 'edit' && (
        <SlotModal
          mode="edit"
          slot={modal.slot}
          onClose={() => setModal(null)}
          onSaved={() => handleSaved('Slot updated successfully.')}
        />
      )}
      {modal?.type === 'delete' && (
        <DeleteModal
          slot={modal.slot}
          onClose={() => setModal(null)}
          onDeleted={handleDeleted}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
};

export default Slots;
