import * as React from 'react';
import { useState } from 'react';
import { Calendar } from '@rogueoak/canopy/branches';

/** A minimal range shape, matching react-day-picker's `{ from, to }` selection value. */
type DateRange = { from: Date | undefined; to?: Date | undefined };

/* A fixed month so the catalog renders the same grid regardless of the current date. */
const DEFAULT_MONTH = new Date(2024, 5, 1);

/**
 * Storybook frames every Calendar story with `parameters.layout: 'centered'`, which
 * shrink-wraps the grid to its content width and centers it. Previews don't inherit
 * story parameters, so without this wrapper the Calendar root fills the full page
 * width and its `justify-between` month header pushes the nav buttons to the edges.
 * Center + shrink-wrap here to mirror the storybook framing.
 */
function Center({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ width: 'fit-content' }}>{children}</div>
    </div>
  );
}

export function Playground() {
  return (
    <Center>
      <Calendar mode="single" />
    </Center>
  );
}

export function Single() {
  const [selected, setSelected] = useState<Date | undefined>(new Date(2024, 5, 12));
  return (
    <Center>
      <Calendar
        mode="single"
        defaultMonth={DEFAULT_MONTH}
        selected={selected}
        onSelect={setSelected}
      />
    </Center>
  );
}

export function Range() {
  const [range, setRange] = useState<DateRange | undefined>({
    from: new Date(2024, 5, 9),
    to: new Date(2024, 5, 14),
  });
  return (
    <Center>
      <Calendar mode="range" defaultMonth={DEFAULT_MONTH} selected={range} onSelect={setRange} />
    </Center>
  );
}

export function Multiple() {
  const [days, setDays] = useState<Date[] | undefined>([
    new Date(2024, 5, 4),
    new Date(2024, 5, 11),
    new Date(2024, 5, 18),
  ]);
  return (
    <Center>
      <Calendar mode="multiple" defaultMonth={DEFAULT_MONTH} selected={days} onSelect={setDays} />
    </Center>
  );
}

export function DisabledDates() {
  const [selected, setSelected] = useState<Date>();
  return (
    <Center>
      <Calendar
        mode="single"
        defaultMonth={DEFAULT_MONTH}
        selected={selected}
        onSelect={setSelected}
        disabled={[{ dayOfWeek: [0, 6] }, new Date(2024, 5, 12)]}
      />
    </Center>
  );
}
