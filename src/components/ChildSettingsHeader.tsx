import React from 'react';
import { useAppData } from '../context/AppDataContext';
import { SettingsSubHeader } from './SettingsSubHeader';

/** SettingsSubHeader for a screen that belongs to one child: once there is more than one child, the title gets their first name, so it's clear whose settings these are. */
export function ChildSettingsHeader({ title, onBack }: { title: string; onBack: () => void }) {
  const { childProfile, childProfiles } = useAppData();
  const first = childProfile?.name.trim().split(' ')[0];
  return <SettingsSubHeader title={childProfiles.length > 1 && first ? `${title} · ${first}` : title} onBack={onBack} />;
}
