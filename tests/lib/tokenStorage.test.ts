import { TOKEN_STORAGE_KEY, tokenStorage } from "@/lib/tokenStorage";

afterEach(() => {
  tokenStorage.clear();
  vi.restoreAllMocks();
});

function fireStorageEvent(init: StorageEventInit) {
  window.dispatchEvent(new StorageEvent("storage", { storageArea: localStorage, ...init }));
}

describe("tokenStorage", () => {
  it("returns null when no token was saved", () => {
    expect(tokenStorage.get()).toBeNull();
  });

  it("saves, reads and clears the token under its own key", () => {
    tokenStorage.set("abc123");
    expect(tokenStorage.get()).toBe("abc123");
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBe("abc123");

    tokenStorage.clear();
    expect(tokenStorage.get()).toBeNull();
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
  });

  describe("when localStorage is blocked or full (EC-31)", () => {
    it("keeps the token in memory when saving fails, without throwing", () => {
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new DOMException("Storage is full", "QuotaExceededError");
      });

      expect(() => tokenStorage.set("abc123")).not.toThrow();
      expect(tokenStorage.get()).toBe("abc123");

      tokenStorage.clear();
      expect(tokenStorage.get()).toBeNull();
    });

    it("never throws when reading or removing fails", () => {
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new DOMException("Access denied", "SecurityError");
      });
      vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
        throw new DOMException("Access denied", "SecurityError");
      });

      expect(tokenStorage.get()).toBeNull();
      expect(() => tokenStorage.clear()).not.toThrow();
    });

    it("prefers a freshly saved token over an old memory copy", () => {
      const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
        throw new DOMException("Storage is full", "QuotaExceededError");
      });
      tokenStorage.set("old-token");
      setItem.mockRestore();

      tokenStorage.set("new-token");
      localStorage.removeItem(TOKEN_STORAGE_KEY);

      expect(tokenStorage.get()).toBeNull();
    });
  });

  describe("subscribe (cross-tab sync)", () => {
    it("reports a login in another tab", () => {
      const listener = vi.fn();
      tokenStorage.subscribe(listener);

      fireStorageEvent({ key: TOKEN_STORAGE_KEY, newValue: "from-other-tab" });

      expect(listener).toHaveBeenCalledExactlyOnceWith("from-other-tab");
    });

    it("reports a logout in another tab, including localStorage.clear()", () => {
      const listener = vi.fn();
      tokenStorage.subscribe(listener);

      fireStorageEvent({ key: TOKEN_STORAGE_KEY, newValue: null });
      fireStorageEvent({ key: null });

      expect(listener).toHaveBeenNthCalledWith(1, null);
      expect(listener).toHaveBeenNthCalledWith(2, null);
    });

    it("ignores other keys and sessionStorage changes", () => {
      const listener = vi.fn();
      tokenStorage.subscribe(listener);

      fireStorageEvent({ key: "some-other-key", newValue: "x" });
      fireStorageEvent({ key: TOKEN_STORAGE_KEY, newValue: "x", storageArea: sessionStorage });

      expect(listener).not.toHaveBeenCalled();
    });

    it("stops listening after unsubscribe", () => {
      const listener = vi.fn();
      const unsubscribe = tokenStorage.subscribe(listener);

      unsubscribe();
      fireStorageEvent({ key: TOKEN_STORAGE_KEY, newValue: "x" });

      expect(listener).not.toHaveBeenCalled();
    });
  });
});
