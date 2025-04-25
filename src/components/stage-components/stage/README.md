# Stage Component Architecture

## Overview

The Stage component architecture uses a custom hook-based approach for managing complex state. This implementation separates the state logic from the component rendering, making the codebase more maintainable and easier to understand.

## Key Components

### `useStageState` Hook

Located at `src/components/stage-components/stage/hooks/useStageState.ts`, this hook encapsulates all state management logic for the stage, including:

- Selection state management (selecting items, multi-select with Shift key)
- Dragging operations (start, move, end)
- Constraint handling for dragging multiple items
- Item operations (delete, flip)

The hook returns a tuple with:

1. State object containing current state values
2. Actions object with methods to interact with the state

### `Stage` Component

The Stage component is a consumer of the `useStageState` hook. It handles:

- Rendering the stage, grid, and items
- Context menu operations
- Additional operations like adding and pasting items

## Workflow

1. The Stage component receives `showGrid` and `snapToGrid` props from its parent
2. It initializes the stage state using the `useStageState` hook
3. State and actions from the hook are used to render and handle interactions
4. When an item is dragged:
   - The hook provides real-time visual positions during drag
   - Constraints are applied to ensure items stay within stage bounds
   - When one item in a multi-selected group hits a boundary, all items stop moving in that direction

## Benefits

- **Separation of Concerns**: UI rendering is separated from state management
- **Reusability**: State logic can be reused in different components
- **Testability**: Hook logic can be tested independently of UI components
- **Maintainability**: Easier to understand and modify isolated pieces of logic
