import { useEffect, useState, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { getVenueCalendar, getVenueAvailability } from '../api/venues.js';
import { useAuth } from '../context/useAuth.js';
import SlotLegend from './SlotLegend.jsx';
import BookingDialog from './BookingDialog.jsx';

const getStatusColor = (status) => {
  if (status === 'free') return '#10b981';
  if (status === 'pending') return '#f59e0b';
  if (status === 'approved') return '#ef4444';
  if (status === 'mine') return '#3b82f6';
  return '#6b7280';
};

export default function CalendarView({ venueId, venueName }) {
  const { devUserId } = useAuth();
  const calendarRef = useRef(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState(null);
  const [availabilityData, setAvailabilityData] = useState(null);
  const [selectedView, setSelectedView] = useState('dayGridMonth');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const monthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

  useEffect(() => {
    const fetchCalendar = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await getVenueCalendar(venueId, monthStr);
        setCalendarData(data);
      } catch (err) {
        setError(err.message || 'Failed to load calendar');
      } finally {
        setLoading(false);
      }
    };
    if (venueId && monthStr) {
      fetchCalendar();
    }
  }, [venueId, monthStr]);

  const fetchDayAvailability = async (dateStr) => {
    try {
      setLoading(true);
      setError('');
      const data = await getVenueAvailability(venueId, dateStr);
      setAvailabilityData(data);
    } catch (err) {
      setError(err.message || 'Failed to load availability');
    } finally {
      setLoading(false);
    }
  };

  const handleDatesSet = (info) => {
    setCurrentDate(info.start);
    if (info.view.type === 'dayGridMonth') {
      setSelectedView('dayGridMonth');
      setAvailabilityData(null);
    } else if (info.view.type === 'timeGridDay') {
      setSelectedView('timeGridDay');
      const dateStr = info.start.toISOString().slice(0, 10);
      fetchDayAvailability(dateStr);
    }
  };

  const handleDateClick = (info) => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.changeView('timeGridDay', info.date);
      const dateStr = info.dateStr;
      fetchDayAvailability(dateStr);
    }
  };

  const handleSelect = (info) => {
    if (!availabilityData) {
      const calendarApi = calendarRef.current?.getApi();
      calendarApi?.unselect();
      return;
    }

    const startTime = info.start.toISOString();
    const endTime = info.end.toISOString();
    const dateStr = info.start.toISOString().slice(0, 10);

    setSelectedRange({
      venueId,
      venueName,
      date: dateStr,
      startTime,
      endTime,
    });
    setDialogOpen(true);
    const calendarApi = calendarRef.current?.getApi();
    calendarApi?.unselect();
  };

  const handleBookingSuccess = () => {
    if (selectedView === 'timeGridDay' && availabilityData) {
      fetchDayAvailability(availabilityData.date);
    }
    const currentMonth = currentDate;
    setCurrentDate(new Date(currentMonth.getTime()));
  };

  const dayCellContent = (arg) => {
    if (!calendarData || !calendarData.days) {
      return <div className="p-1 text-xs">{arg.dayNumberText}</div>;
    }
    const dateStr = arg.date.toISOString().slice(0, 10);
    const dayInfo = calendarData.days[dateStr];
    if (!dayInfo) {
      return <div className="p-1 text-xs">{arg.dayNumberText}</div>;
    }
    return (
      <div className="p-1">
        <div className="text-xs mb-1">{arg.dayNumberText}</div>
        <div className="text-[10px] text-neutral-600">
          {dayInfo.freeSlots !== undefined ? `${dayInfo.freeSlots} free` : ''}
          {dayInfo.isFull ? ' (Full)' : ''}
        </div>
      </div>
    );
  };

  const dayEvents = [];
  if (availabilityData && availabilityData.slots) {
    for (const slot of availabilityData.slots) {
      const status = slot.isMine && devUserId ? 'mine' : slot.status;
      dayEvents.push({
        id: slot.startTime,
        title: status === 'free' ? 'Free' : status.charAt(0).toUpperCase() + status.slice(1),
        start: slot.startTime,
        end: slot.endTime,
        backgroundColor: getStatusColor(status),
        borderColor: getStatusColor(status),
        editable: status === 'free',
        display: 'block',
      });
    }
  }

  return (
    <div className="space-y-4">
      <SlotLegend />

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl" role="alert">
          {error}
        </div>
      )}

      {loading && (
        <div className="bg-white rounded-xl shadow-card p-4 border border-neutral-200">
          <p className="text-neutral-700">Loading calendar...</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-card p-4 border border-neutral-200">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridDay',
          }}
          height="auto"
          datesSet={handleDatesSet}
          dateClick={handleDateClick}
          selectable={true}
          selectMirror={true}
          select={handleSelect}
          selectAllow={() => {
            if (!availabilityData) return false;
            return true;
          }}
          events={selectedView === 'timeGridDay' ? dayEvents : []}
          dayCellContent={dayCellContent}
          slotDuration="00:30:00"
          slotLabelInterval="00:30:00"
          allDaySlot={false}
          slotMinTime="08:00:00"
          slotMaxTime="20:00:00"
        />
      </div>

      <BookingDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        venueId={selectedRange?.venueId}
        venueName={selectedRange?.venueName || venueName}
        date={selectedRange?.date}
        startTime={selectedRange?.startTime}
        endTime={selectedRange?.endTime}
        onSuccess={handleBookingSuccess}
      />
    </div>
  );
}
