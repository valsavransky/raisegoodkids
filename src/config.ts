import Constants from 'expo-constants';

// Points at the Railway-hosted server/ API. Set in app.json's extra.apiUrl.
export const API_BASE_URL: string = Constants.expoConfig?.extra?.apiUrl ?? '';
