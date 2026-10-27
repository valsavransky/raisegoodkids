import Constants from 'expo-constants';

// Points at the Railway-hosted server/ API. Set in app.json's extra.apiUrl.
export const API_BASE_URL: string = Constants.expoConfig?.extra?.apiUrl ?? '';

// Public legal pages served by the same server (see server/src/legal.ts).
export const PRIVACY_URL = `${API_BASE_URL}/privacy`;
export const TERMS_URL = `${API_BASE_URL}/terms`;
