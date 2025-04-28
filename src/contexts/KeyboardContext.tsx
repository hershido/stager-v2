import React, { createContext, useContext, useEffect, useState } from "react";

// Define types for our shortcuts
type ShortcutHandler = (e: KeyboardEvent) => void;
type Shortcut = {
  id: string;
  key: string;
  handler: ShortcutHandler;
  priority?: number;
};

// Create the context with initial values
type KeyboardContextType = {
  registerShortcut: (shortcut: Shortcut) => void;
  unregisterShortcut: (id: string) => void;
  pauseShortcuts: () => void;
  resumeShortcuts: () => void;
};

const KeyboardContext = createContext<KeyboardContextType>({
  registerShortcut: () => {},
  unregisterShortcut: () => {},
  pauseShortcuts: () => {},
  resumeShortcuts: () => {},
});

// Provider component
export function KeyboardProvider({ children }: { children: React.ReactNode }) {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [isPaused, setIsPaused] = useState(false);

  // Register a shortcut
  const registerShortcut = (shortcut: Shortcut) => {
    console.log(
      `Registering shortcut: ${shortcut.key} with id: ${shortcut.id}`
    );
    setShortcuts((prev) => {
      // Check if we already have this shortcut registered
      const exists = prev.some((s) => s.id === shortcut.id);
      if (exists) {
        console.log(
          `Shortcut with id ${shortcut.id} already registered, replacing`
        );
        return prev.map((s) => (s.id === shortcut.id ? shortcut : s));
      }

      const newShortcuts = [...prev, shortcut];
      console.log(
        `Updated shortcuts: ${newShortcuts.map((s) => s.key).join(", ")}`
      );
      return newShortcuts;
    });
  };

  // Remove a shortcut
  const unregisterShortcut = (id: string) => {
    console.log(`Unregistering shortcut with id: ${id}`);
    setShortcuts((prev) => {
      const shortcut = prev.find((s) => s.id === id);
      if (shortcut) {
        console.log(`Removed shortcut: ${shortcut.key}`);
      }
      return prev.filter((s) => s.id !== id);
    });
  };

  // Pause/resume shortcuts (useful for modals, etc.)
  const pauseShortcuts = () => setIsPaused(true);
  const resumeShortcuts = () => setIsPaused(false);

  // Global event listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      console.log(
        `KeyboardContext: key pressed: ${e.key}, code=${e.code}, ctrlKey: ${e.ctrlKey}, metaKey: ${e.metaKey}, altKey: ${e.altKey}`
      );

      if (isPaused) {
        console.log("KeyboardContext: shortcuts paused, ignoring");
        return;
      }

      // Skip if we're in an input element
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        console.log("KeyboardContext: in input element, ignoring");
        return;
      }

      // Get key combination string (e.g., "ctrl+s")
      const key = getKeyString(e);
      console.log(`KeyboardContext: mapped to shortcut key: "${key}"`);

      // Log all registered shortcuts
      if (shortcuts.length > 0) {
        console.log(
          `KeyboardContext: registered shortcuts: ${shortcuts
            .map((s) => `"${s.key}"`)
            .join(", ")}`
        );
      } else {
        console.log("KeyboardContext: No shortcuts registered!");
      }

      // Find matching shortcuts
      const matchingShortcuts = shortcuts.filter((s) => s.key === key);
      console.log(
        `KeyboardContext: found ${matchingShortcuts.length} matching shortcuts for "${key}"`
      );

      // Sort by priority if needed and execute
      if (matchingShortcuts.length > 0) {
        // Sort by priority (higher is more important)
        matchingShortcuts.sort((a, b) => (b.priority || 0) - (a.priority || 0));

        // Execute the highest priority handler
        const topShortcut = matchingShortcuts[0];
        console.log(
          `KeyboardContext: executing shortcut handler for "${topShortcut.key}"`
        );

        try {
          topShortcut.handler(e);
          console.log(
            `KeyboardContext: shortcut handler executed successfully for "${topShortcut.key}"`
          );
        } catch (error) {
          console.error(
            `Error executing shortcut handler for "${topShortcut.key}":`,
            error
          );
        }

        // Prevent default browser behavior
        e.preventDefault();
      }
    };

    console.log("KeyboardContext: setting up global keyboard event listener");

    // Attach the event listener to document with capture phase to ensure we get it first
    document.addEventListener("keydown", handleKeyDown, true);

    console.log("KeyboardContext: global keyboard event listener attached");

    // Log currently registered shortcuts
    console.log(
      `Current shortcuts: ${shortcuts.map((s) => `"${s.key}"`).join(", ")}`
    );

    // Cleanup
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      console.log("KeyboardContext: global keyboard event listener removed");
    };
  }, [shortcuts, isPaused]);

  // Helper to convert keyboard event to string like "ctrl+s"
  const getKeyString = (e: KeyboardEvent): string => {
    const parts = [];

    // Add debug log to see raw event details
    console.log(
      `Raw key event: key=${e.key}, code=${e.code}, altKey=${e.altKey}, ctrlKey=${e.ctrlKey}, metaKey=${e.metaKey}, shiftKey=${e.shiftKey}`
    );

    // Check if we have modifier keys
    const hasModifiers = e.ctrlKey || e.metaKey || e.altKey || e.shiftKey;

    // Handle Control and Meta (Command) keys as equivalent
    // This allows both Ctrl+C on Windows and Cmd+C on Mac to be the same shortcut
    if (e.ctrlKey || e.metaKey) parts.push("ctrl");

    // Make sure we detect the alt key (Option on Mac)
    if (e.altKey) parts.push("alt");
    if (e.shiftKey) parts.push("shift");

    // Handle special keys
    let key = e.key.toLowerCase();

    // Handle special case for keys with alt pressed on Mac
    // On macOS, pressing Option+key often produces special characters
    if (e.altKey && e.key.length === 1) {
      // If the key with alt is a single character, get the original key from e.code
      // e.g., Alt+A might produce å, but we want "alt+a"
      const match = e.code.match(/^Key([A-Z])$/);
      if (match) {
        key = match[1].toLowerCase();
        console.log(
          `Alt key detected: mapping ${e.key} to ${key} based on keyCode ${e.code}`
        );
      }
    }

    // Map special keys to consistent names
    const keyMap: Record<string, string> = {
      " ": "space",
      escape: "esc",
      delete: "delete",
      backspace: "backspace",
      arrowup: "up",
      arrowdown: "down",
      arrowleft: "left",
      arrowright: "right",
    };

    // Use the mapping if available
    if (keyMap[key]) {
      key = keyMap[key];
    } else if (key.length === 1) {
      // For single character keys, use lowercase
      key = key.toLowerCase();
    }

    // Only add the key to parts if it's not already a modifier key
    // This is important for shortcuts like "g" or "s" that are single keys
    if (hasModifiers) {
      parts.push(key);
      const result = parts.join("+");
      console.log(`Mapped shortcut: "${result}"`);
      return result;
    } else {
      // For single-key shortcuts (no modifiers), just return the key
      console.log(`Single key shortcut: "${key}"`);
      return key;
    }
  };

  // Create the context value
  const value = {
    registerShortcut,
    unregisterShortcut,
    pauseShortcuts,
    resumeShortcuts,
  };

  return (
    <KeyboardContext.Provider value={value}>
      {children}
    </KeyboardContext.Provider>
  );
}

// Custom hook for using the keyboard context
export function useKeyboard() {
  return useContext(KeyboardContext);
}

// Convenience hook for registering shortcuts
export function useShortcut(
  key: string,
  handler: ShortcutHandler,
  deps: React.DependencyList = [],
  options: { priority?: number; disabled?: boolean } = {}
) {
  const { registerShortcut, unregisterShortcut } = useKeyboard();

  useEffect(() => {
    if (options.disabled) {
      console.log(
        `useShortcut: shortcut '${key}' is disabled, not registering`
      );
      return;
    }

    // Generate a more stable ID based on the key and a hash of the dependency array values
    // This ensures the same shortcut doesn't get registered multiple times
    const generateStableId = () => {
      // Create a simple hash from the key
      const keyHash = key
        .split("")
        .reduce((acc, char) => acc + char.charCodeAt(0), 0);
      // Add a random suffix to avoid collisions but keep it stable within this effect
      return `${key.replace(/[^a-z0-9]/gi, "_")}_${keyHash}_${Math.random()
        .toString(36)
        .substring(2, 6)}`;
    };

    const id = generateStableId();
    console.log(`useShortcut: registering shortcut '${key}' with id ${id}`);

    registerShortcut({
      id,
      key,
      handler,
      priority: options.priority,
    });

    // Cleanup on unmount or dependencies change
    return () => {
      console.log(`useShortcut: unregistering shortcut '${key}' with id ${id}`);
      unregisterShortcut(id);
    };
  }, [...deps, options.disabled, key]); // Also depend on the key itself
}
