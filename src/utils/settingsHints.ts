// Shared with AppDataContext (clears these on reset) and ChildHomeScreen's
// SettingsHintBadge (reads/writes them) — kept in one place so the two
// never drift out of sync on the key string itself.
//
// AsyncStorage is device-local, not account-scoped: "Reset all data" used
// to leave these untouched, so a parent who reset and started a brand-new
// child profile still wouldn't see the hints again, since the device had
// already marked them seen under a previous profile. Reset now clears
// these too (see AppDataContext.resetAllData) so a reset is actually a
// fresh start for the hints as well, not just the app data.
export const SETTINGS_HINT_SEEN_KEY = 'merit.settingsHintSeen.v4';
export const MONEY_HINT_SEEN_KEY = 'merit.moneySettingsHintSeen.v4';
