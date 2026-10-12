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
