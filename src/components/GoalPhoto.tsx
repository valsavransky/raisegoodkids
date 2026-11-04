// A goal's photo, from this device's own file or the server's copy. If it can't load, it falls back
// to the placeholder (or nothing) instead of leaving a blank box.
import React, { useState } from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';
import { useAppData } from '../context/AppDataContext';
import { Goal } from '../types/models';

export function GoalPhoto({
  goal,
  style,
  placeholder = null,
}: {
  goal: Goal;
  style: StyleProp<ImageStyle>;
  placeholder?: React.ReactNode;
}) {
  const { photoSource } = useAppData();
  const [failed, setFailed] = useState(false);
  const source = photoSource(goal);
  if (!source || failed) return <>{placeholder}</>;
  return (
    <Image
      source={source}
      style={style}
      onError={(e) => {
        console.warn('[goal-photo] could not load', source.uri, e.nativeEvent?.error);
        setFailed(true);
      }}
    />
  );
}
