// "1.0.0+a1b2c3": the app version plus the first characters of the JavaScript
// update the app is currently running (see EAS Update). Sent with usage events
// and feedback so a report can be matched to exactly what the tester had.
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';

export function appVersionLabel(): string {
  const version = Constants.expoConfig?.version ?? '';
  const updateId = Updates.updateId;
  return updateId ? `${version}+${updateId.slice(0, 6)}` : version;
}

/** "Version 1.0.0+a1b2c3 · updated Oct 31" for the foot of Settings, so a tester
 * (or you) can see which JavaScript update a phone is running. The date is when
 * that update was published; it is missing in development builds. */
export function appVersionDisplay(): string {
  const created = Updates.createdAt;
  const date = created
    ? ` · updated ${created.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
    : '';
  return `Version ${appVersionLabel()}${date}`;
}
