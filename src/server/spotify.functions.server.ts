export async function getSpotifyClientId(): Promise<{ clientId: string }> {
  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID || process.env.SPOTIFY_CLIENT_ID;
  if (!clientId) {
    const isDev = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.DEV) || (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production');
    if (isDev) {
      console.warn('No SPOTIFY_CLIENT_ID found; using placeholder client id for local development. Spotify flows will not work.')
      return { clientId: 'DEMO_SPOTIFY_CLIENT_ID' };
    }
    throw new Error(
      "Missing SPOTIFY_CLIENT_ID. Set VITE_SPOTIFY_CLIENT_ID for local development or SPOTIFY_CLIENT_ID in production."
    );
  }
  return { clientId };
}
