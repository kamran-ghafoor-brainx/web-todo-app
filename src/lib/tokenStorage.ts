import { ignoreErrors } from "@/lib/ignoreErrors";

export const TOKEN_STORAGE_KEY = "todo-app.accessToken";

let memoryToken: string | null = null;

function getLocalStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export const tokenStorage = {
  get(): string | null {
    try {
      return getLocalStorage()?.getItem(TOKEN_STORAGE_KEY) ?? memoryToken;
    } catch {
      return memoryToken;
    }
  },

  set(token: string): void {
    try {
      const storage = getLocalStorage();
      if (!storage) throw new Error("localStorage unavailable");
      storage.setItem(TOKEN_STORAGE_KEY, token);
      memoryToken = null;
    } catch {
      memoryToken = token;
    }
  },

  clear(): void {
    memoryToken = null;
    ignoreErrors(() => getLocalStorage()?.removeItem(TOKEN_STORAGE_KEY));
  },

  subscribe(listener: (token: string | null) => void): () => void {
    function handleStorage(event: StorageEvent) {
      if (event.storageArea !== getLocalStorage()) return;
      if (event.key !== TOKEN_STORAGE_KEY && event.key !== null) return;
      listener(event.key === null ? null : event.newValue);
    }

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  },
};
