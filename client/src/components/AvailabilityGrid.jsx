export default function AvailabilityGrid({ slots = [], onSlotSelect }) {
  if (!slots || slots.length === 0) {
    return (
      <div className="text-center py-8 text-neutral-700">
        <p>No slots available.</p>
      </div>
    );
  }

  const now = new Date();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
      {slots.map((slot, idx) => {
        const start = slot.startTime ? new Date(slot.startTime) : null;
        const end = slot.endTime ? new Date(slot.endTime) : null;
        const timeLabel =
          start && end
            ? `${start.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Asia/Kolkata',
              })} - ${end.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Asia/Kolkata',
              })}`
            : `${slot.startTime || ''} - ${slot.endTime || ''}`;

        const isPast = start ? start < now : false;
        const isFree = slot.status === 'free' && !isPast;
        const isMine = slot.isMine || slot.status === 'mine';
        const isDisabled = !isFree || isPast || slot.status === 'pending' || slot.status === 'approved';

        const baseClass = 'p-3 rounded-lg border text-left text-sm transition-colors';
        let statusClass = '';
        if (isPast) {
          statusClass = 'border-neutral-300 bg-neutral-100 text-neutral-500 cursor-not-allowed opacity-60';
        } else if (isFree) {
          statusClass = 'border-[#B7E2CE] bg-[#E6F2EC] text-[#2F7D5B] cursor-pointer hover:bg-[#D7EDE2]';
        } else if (slot.status === 'pending' || slot.status === 'approved') {
          statusClass = 'border-[#F0B9B9] bg-[#F8E6E6] text-[#A33B3B] cursor-not-allowed';
        } else if (isMine) {
          statusClass = 'border-neutral-300 bg-neutral-100 text-neutral-700 cursor-not-allowed';
        } else {
          statusClass = 'border-neutral-300 bg-neutral-100 text-neutral-500 cursor-not-allowed';
        }

        const handleClick = () => {
          if (isFree && !isPast && onSlotSelect) {
            onSlotSelect(slot);
          }
        };

        return (
          <button
            key={idx}
            type="button"
            className={`${baseClass} ${statusClass} relative pl-4`}
            disabled={isDisabled && !isFree}
            onClick={handleClick}
            aria-label={`Slot ${timeLabel} ${isPast ? 'unavailable' : slot.status}`}
          >
            <span
              className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${
                isPast
                  ? 'bg-neutral-400'
                  : isFree
                    ? 'bg-[#2F7D5B]'
                    : slot.status === 'pending' || slot.status === 'approved'
                      ? 'bg-[#A33B3B]'
                      : 'bg-neutral-400'
              }`}
            />
            <div className="font-medium">{timeLabel}</div>
            <div className="text-xs capitalize">{isPast ? 'unavailable' : slot.status}</div>
          </button>
        );
      })}
    </div>
  );
}
