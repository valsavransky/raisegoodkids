// A goal's photo, from this device's own file or the server's copy. If it can't load, it falls back
// to the placeholder (or nothing) instead of leaving a blank box.
//
// The server's copy needs this device's login. The image widget doesn't reliably send custom headers
// on Android, so those photos are fetched with the ordinary network call and shown from the bytes.
import React, { useEffect, useState } from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';
import { useAppData } from '../context/AppDataContext';
import { Goal } from '../types/models';

// Already-downloaded photos (the url includes a version, so a changed photo is a new entry).
const downloaded = new Map<string, string>();

async function download(uri: string, headers: Record<string, string>): Promise<string> {
  const res = await fetch(uri, { headers });
  if (!res.ok) throw new Error(`Photo request failed (${res.status})`);
  const blob = await res.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Could not read the photo'));
    reader.readAsDataURL(blob);
  });
}

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
  const source = photoSource(goal);
  const needsLogin = !!source?.headers;
  const [fetched, setFetched] = useState<string | null>(source ? downloaded.get(source.uri) ?? null : null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
    if (!source || !source.headers) return;
    const cached = downloaded.get(source.uri);
    if (cached) {
      setFetched(cached);
      return;
    }
    setFetched(null);
    let cancelled = false;
    download(source.uri, source.headers)
      .then((dataUrl) => {
        downloaded.set(source.uri, dataUrl);
        if (!cancelled) setFetched(dataUrl);
      })
      .catch((e) => {
        console.warn('[goal-photo] could not load', source.uri, String(e));
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source?.uri]);

  if (!source || failed) return <>{placeholder}</>;
  if (needsLogin) {
    // Placeholder until the bytes arrive.
    if (!fetched) return <>{placeholder}</>;
    return <Image source={{ uri: fetched }} style={style} onError={() => setFailed(true)} />;
  }
  return (
    <Image
      source={{ uri: source.uri }}
      style={style}
      onError={(e) => {
        console.warn('[goal-photo] could not load', source.uri, e.nativeEvent?.error);
        setFailed(true);
      }}
    />
  );
}
