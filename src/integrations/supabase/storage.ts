/**
 * Custom Storage Adapter for Supabase Auth
 *
 * This adapter wraps localStorage and checks the logout flag BEFORE
 * returning any stored auth data to the Supabase client. This prevents
 * automatic session restoration after explicit logout in PWA mode.
 */

const LOGOUT_FLAG_KEY = 'bloom_user_logged_out';
const SUPABASE_AUTH_KEY_PREFIX = 'supabase.auth';

export class LogoutAwareStorage implements Storage {
  private storage: Storage;

  constructor(storage: Storage = localStorage) {
    this.storage = storage;
  }

  get length(): number {
    return this.storage.length;
  }

  clear(): void {
    this.storage.clear();
  }

  getItem(key: string): string | null {
    // Check if this is an auth-related key
    if (key.includes(SUPABASE_AUTH_KEY_PREFIX)) {
      // Check logout flag BEFORE returning any auth data
      const hasLoggedOut = this.storage.getItem(LOGOUT_FLAG_KEY) === 'true';

      if (hasLoggedOut) {
        console.log(`[Storage] Blocking getItem for ${key} due to logout flag`);
        // Return null to prevent session restoration
        return null;
      }
    }

    const value = this.storage.getItem(key);

    // Additional logging for debugging
    if (key.includes(SUPABASE_AUTH_KEY_PREFIX)) {
      console.log(`[Storage] getItem for ${key}:`, value ? 'found' : 'not found');
    }

    return value;
  }

  key(index: number): string | null {
    return this.storage.key(index);
  }

  removeItem(key: string): void {
    console.log(`[Storage] removeItem: ${key}`);
    this.storage.removeItem(key);
  }

  setItem(key: string, value: string): void {
    // Clear logout flag when setting new auth session
    if (key.includes(SUPABASE_AUTH_KEY_PREFIX)) {
      console.log(`[Storage] setItem for ${key}, clearing logout flag`);
      this.storage.removeItem(LOGOUT_FLAG_KEY);
    }

    this.storage.setItem(key, value);
  }

  /**
   * Helper method to set the logout flag
   * This should be called during logout process
   */
  markLoggedOut(): void {
    console.log('[Storage] Setting logout flag');
    this.storage.setItem(LOGOUT_FLAG_KEY, 'true');
  }

  /**
   * Helper method to clear the logout flag
   * This should be called during successful login
   */
  clearLogoutFlag(): void {
    console.log('[Storage] Clearing logout flag');
    this.storage.removeItem(LOGOUT_FLAG_KEY);
  }

  /**
   * Check if user has explicitly logged out
   */
  hasLoggedOut(): boolean {
    return this.storage.getItem(LOGOUT_FLAG_KEY) === 'true';
  }

  /**
   * Force clear all Supabase auth keys
   */
  clearAllAuthData(): void {
    console.log('[Storage] Clearing all auth data');
    const keysToRemove: string[] = [];

    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key && key.includes(SUPABASE_AUTH_KEY_PREFIX)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => this.storage.removeItem(key));
    console.log(`[Storage] Cleared ${keysToRemove.length} auth keys`);
  }
}

// Create singleton instance
export const logoutAwareStorage = new LogoutAwareStorage(localStorage);
