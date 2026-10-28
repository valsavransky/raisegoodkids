import React from 'react';
import { useAppData } from '../context/AppDataContext';
import { SettingsSubHeader } from './SettingsSubHeader';

/** SettingsSubHeader for a screen that belongs to one child: once there is more than one child, their first name shows as a small line under the title, so it is clear whose settings these are. */
export function ChildSettingsHeader({ title, onBack, action }: { title: string; onBack: () => void; action?: React.ReactNode }) {
  const { childProfile, childProfiles } = useAppData();
  const first = childProfile?.name.trim().split(' ')[0];
  return (
    <SettingsSubHeader
      title={title}
      subtitle={childProfiles.length > 1 && first ? first : undefined}
      onBack={onBack}
      action={action}
    />
  );
}
