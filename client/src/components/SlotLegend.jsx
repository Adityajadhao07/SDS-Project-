export default function SlotLegend() {
  const items = [
    { label: 'Free', color: 'bg-emerald-500' },
    { label: 'Pending', color: 'bg-amber-500' },
    { label: 'Approved', color: 'bg-red-500' },
    { label: 'Mine', color: 'bg-blue-500' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-4 bg-white rounded-xl p-3 shadow-card border border-neutral-200">
      <span className="text-sm font-medium text-neutral-900">Legend:</span>
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <span className={`w-4 h-4 rounded-full ${item.color}`} />
          <span className="text-sm text-neutral-700">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
