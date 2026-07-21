import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "wildmagic-discovered";
const EXPORT_FILENAME = "wildmagic-spells.json";

function loadFromStorage(): Set<number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter((id): id is number => typeof id === "number" && id >= 1 && id <= 100));
  } catch {
    return new Set();
  }
}

function saveToStorage(discovered: Set<number>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...discovered].sort((a, b) => a - b)));
}

export function useDiscoveredSpells() {
  const [discovered, setDiscovered] = useState<Set<number>>(loadFromStorage);

  // Sync to localStorage whenever discovered changes
  useEffect(() => {
    saveToStorage(discovered);
  }, [discovered]);

  const isDiscovered = useCallback((id: number) => discovered.has(id), [discovered]);

  const discover = useCallback((id: number) => {
    setDiscovered((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const resetAll = useCallback(() => {
    setDiscovered(new Set());
  }, []);

  const exportToFile = useCallback(() => {
    const arr = [...discovered].sort((a, b) => a - b);
    const blob = new Blob([JSON.stringify(arr, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = EXPORT_FILENAME;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [discovered]);

  const importFromFile = useCallback((file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const arr = JSON.parse(reader.result as string);
          if (!Array.isArray(arr)) {
            reject(new Error("File must contain a JSON array of spell IDs."));
            return;
          }
          const valid = arr.filter((id): id is number => typeof id === "number" && id >= 1 && id <= 100);
          let added = 0;
          setDiscovered((prev) => {
            const next = new Set(prev);
            for (const id of valid) {
              if (!next.has(id)) {
                next.add(id);
                added++;
              }
            }
            return next;
          });
          resolve(added);
        } catch {
          reject(new Error("Invalid JSON file."));
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file."));
      reader.readAsText(file);
    });
  }, []);

  return {
    discovered,
    isDiscovered,
    discover,
    resetAll,
    exportToFile,
    importFromFile,
    discoveredCount: discovered.size,
  };
}
