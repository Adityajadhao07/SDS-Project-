import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import SlotLegend from '../src/components/SlotLegend.jsx';

describe('SlotLegend', () => {
  it('renders legend with expected labels', () => {
    render(<SlotLegend />);
    expect(screen.getByText('Legend:')).toBeInTheDocument();
    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(screen.getByText('Mine')).toBeInTheDocument();
  });
});
