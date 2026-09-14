// Not cryptographically secure — fine here, since this only generates a
// throwaway placeholder email/password for the account AuthContext
// auto-creates on first launch. The real secret from then on is the signed
// session token SecureStore holds; this string is never shown to anyone
// and is discarded the moment "Secure your account" replaces it with a
// password the parent actually chose.
export function randomToken(length: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}
