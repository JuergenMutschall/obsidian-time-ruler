# Toggle Component (`src/components/Toggle.tsx`)

## Purpose

The `Toggle` component serves as a React bridge to Obsidian's native UI components, specifically `Setting` and `ToggleComponent`. It allows developers to use a declarative React-style component to render and manage a standard Obsidian toggle switch, typically for plugin settings.

## Props

*   **`callback`** (`(state: boolean) => void`): A function that is called whenever the state of the toggle changes. It receives the new boolean state (true if on, false if off) as an argument.
*   **`title`** (`string`): The title or label for the setting that this toggle controls. This string is passed to `setName()` of the Obsidian `Setting` component, and is used to name the underlying Obsidian `Setting` instance.
*   **`value`** (`boolean`): The current value of the toggle (true for on, false for off). This prop controls the displayed state of the toggle.

## State (managed via props and internal refs to Obsidian components)

*   **Internal Obsidian Component State**: The actual state of the rendered toggle is managed by the Obsidian `ToggleComponent` instance. This React component synchronizes its `value` prop with this internal state.
*   **Refs**:
    *   `frame`: `useRef<HTMLDivElement>(null)` - A ref to the root `div` element that hosts the Obsidian `Setting`.
    *   `thisToggle`: `useRef<ToggleComponent | null>(null)` - A ref to the instance of Obsidian's `ToggleComponent`.
    *   `thisSetting`: `useRef<Setting | null>(null)` - A ref to the instance of Obsidian's `Setting`.

## Functionality

1.  **Initialization (`useEffect` on mount)**:
    *   Ensures `frame.current` (the host `div`) is available.
    *   If `thisSetting.current` (the Obsidian `Setting` instance) doesn't exist, it creates a new `Setting` attached to `frame.current`.
    *   It calls `thisSetting.current.setName(title)`.
    *   It then adds a toggle to this setting using `thisSetting.current.addToggle()`.
        *   The created `ToggleComponent` instance is stored in `thisToggle.current`.
        *   The toggle's initial value is set using `toggle.setValue(value)`.
        *   An `onChange` handler is registered on the toggle, which calls the `callback` prop with the new state.
    *   **Cleanup**: The `useEffect` returns a cleanup function (`thisSetting.current?.clear()`) that presumably removes the setting and toggle from the DOM when the React component unmounts. This is important for preventing memory leaks or orphaned UI elements if the component is dynamically added/removed.

2.  **Value Synchronization (`useEffect` on `value` change)**:
    *   Another `useEffect` hook listens for changes in the `value` prop.
    *   If `value` changes, it updates the displayed state of the Obsidian toggle using `thisToggle.current?.setValue(value)`. This ensures that if the `value` prop is changed from outside (e.g., by other logic resetting settings), the UI reflects this change.

3.  **Rendering**:
    *   Renders a simple `div` element with `ref={frame}`.
    *   The class `ml-2 child:pb-0` is applied for styling, suggesting it's intended to be used in a layout where some left margin is desirable and child elements (the setting controls) should not have bottom padding.
    *   All actual UI for the toggle switch and its label is created and managed by Obsidian's `Setting` and `ToggleComponent` APIs within this `div`.

## Interactions with Other Components and Services

*   **Obsidian API (`Setting`, `ToggleComponent`)**: This component is fundamentally an abstraction layer over these Obsidian UI classes. It directly instantiates and manipulates them.
*   **Parent Component**: The parent component controls the `Toggle`'s state via the `value` prop and receives updates via the `callback` prop. It's typically used in settings tabs of Obsidian plugins.

## Usage Example (Conceptual)

Assuming the `setName` part is corrected to use the `title` prop:

```tsx
const [mySettingValue, setMySettingValue] = useState(true);

const handleToggleChange = (newValue) => {
  setMySettingValue(newValue);
  // Potentially save the setting to Obsidian's data store
};

return (
  <Toggle
    title="Enable Feature X"
    value={mySettingValue}
    callback={handleToggleChange}
  />
);
```

This component provides a convenient way to integrate Obsidian's native UI elements into a React-based settings page, maintaining a consistent look and feel with the Obsidian application.
