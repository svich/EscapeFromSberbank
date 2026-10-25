// localStorage can throw (private mode, disabled storage); never let it break the game.
export const storage = {
  get(key, fallback = null) {
    try {
      const value = window.localStorage.getItem(key);
      return value === null ? fallback : value;
    } catch {
      return fallback;
    }
  },

  set(key, value) {
    try {
      window.localStorage.setItem(key, String(value));
    } catch {
      // Storage unavailable: settings just won't persist.
    }
  },

  getNumber(key, fallback = 0) {
    const n = Number(this.get(key));
    return this.get(key) !== null && Number.isFinite(n) ? n : fallback;
  },
};
