// Holds in-progress state across the 3-step parent setup wizard (screens
// 4-7 in docs/screens-and-flows.md). Nothing here is persisted yet — there's
// no backend/storage layer in this build. On "Finish setup" a consumer can
// read this state and assign real ids once persistence exists.
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ScheduleEventCategory, GigEffortTier } from '../types/models';

let localIdCounter = 0;
export function makeLocalId(prefix: string): string {
  localIdCounter += 1;
  return `${prefix}-${localIdCounter}`;
}

export interface DraftChildProfile {
  name: string;
  avatarId: string;
  birthday: string;
  grade?: string;
}

export interface DraftScheduleEvent {
  localId: string;
  title: string;
  category: ScheduleEventCategory;
  recurring: boolean;
  daysOfWeek?: number[];
  date?: string;
  startTime?: string;
  endTime?: string;
}

export interface DraftExpectedItem {
  localId: string;
  name: string;
  frequency: 'daily' | 'weekly';
  active: boolean;
}

export interface DraftGig {
  localId: string;
  name: string;
  effortTier: GigEffortTier;
  active: boolean;
}

interface SetupContextValue {
  childProfile: DraftChildProfile;
  setChildProfile: (fields: Partial<DraftChildProfile>) => void;

  scheduleEvents: DraftScheduleEvent[];
  setScheduleEvents: (events: DraftScheduleEvent[]) => void;

  expectedItems: DraftExpectedItem[];
  setExpectedItems: (items: DraftExpectedItem[]) => void;

  gigs: DraftGig[];
  setGigs: (gigs: DraftGig[]) => void;
}

const SetupContext = createContext<SetupContextValue | undefined>(undefined);

const initialChildProfile: DraftChildProfile = {
  name: '',
  avatarId: 'avatar-1',
  birthday: '',
  grade: undefined,
};

export function SetupProvider({ children }: { children: ReactNode }) {
  const [childProfile, setChildProfileState] = useState<DraftChildProfile>(initialChildProfile);
  const [scheduleEvents, setScheduleEvents] = useState<DraftScheduleEvent[]>([]);
  const [expectedItems, setExpectedItems] = useState<DraftExpectedItem[]>([]);
  const [gigs, setGigs] = useState<DraftGig[]>([]);

  const setChildProfile = (fields: Partial<DraftChildProfile>) => {
    setChildProfileState((prev) => ({ ...prev, ...fields }));
  };

  return (
    <SetupContext.Provider
      value={{
        childProfile,
        setChildProfile,
        scheduleEvents,
        setScheduleEvents,
        expectedItems,
        setExpectedItems,
        gigs,
        setGigs,
      }}
    >
      {children}
    </SetupContext.Provider>
  );
}

export function useSetup(): SetupContextValue {
  const ctx = useContext(SetupContext);
  if (!ctx) throw new Error('useSetup must be used within a SetupProvider');
  return ctx;
}
