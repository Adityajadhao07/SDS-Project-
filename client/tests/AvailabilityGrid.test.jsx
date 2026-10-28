import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AvailabilityGrid from '../src/components/AvailabilityGrid.jsx';

describe('AvailabilityGrid', () => {
  it('clicking a free slot opens booking flow with correct start and end', () => {
    const onSlotSelect = vi.fn();
    const slots = [
      {
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
        status: 'free',
      },
    ];

    render(<AvailabilityGrid slots={slots} onSlotSelect={onSlotSelect} />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(onSlotSelect).toHaveBeenCalledWith(slots[0]);
  });

  it('past slots are disabled and cannot be clicked', () => {
    const onSlotSelect = vi.fn();
    const slots = [
      {
        startTime: new Date(Date.now() - 7200000).toISOString(),
        endTime: new Date(Date.now() - 3600000).toISOString(),
        status: 'free',
      },
    ];

    render(<AvailabilityGrid slots={slots} onSlotSelect={onSlotSelect} />);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onSlotSelect).not.toHaveBeenCalled();
  });
});
