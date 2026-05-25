/**
 * Parses the expiration time of a JWT without needing an external library.
 * Returns the expiration time in milliseconds, or null if invalid.
 */
export function getJwtExpirationMs(token: string): number | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    const payload = JSON.parse(jsonPayload);
    if (payload.exp) {
      return payload.exp * 1000;
    }
    return null;
  } catch (err) {
    return null;
  }
}
