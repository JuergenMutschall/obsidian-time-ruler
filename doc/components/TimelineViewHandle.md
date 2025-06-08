# TimelineViewHandle Interface (`src/components/TimelineViewHandle.ts`)

## Purpose

The `TimelineViewHandle` interface defines the programmatic API for interacting imperatively with the `[TimelineView](./TimelineView.md)` component from a parent component. It allows parent components to call methods on a `[TimelineView](./TimelineView.md)` instance, such as instructing it to scroll to a specific section. This decouples the parent from the internal DOM structure of `[TimelineView](./TimelineView.md)` and provides a clear contract for controlled interactions.

## Definition

The interface is defined as follows in TypeScript:

```typescript
export interface TimelineViewHandle {
  scrollTo: (sectionId: string) => void;
}
```

## Methods

The `TimelineViewHandle` interface exposes the following method(s):

### `scrollTo(sectionId: string)`

*   **Description**: This method is used to programmatically scroll the `[TimelineView](./TimelineView.md)` component's content to make a specific section visible within the viewport.
*   **Parameters**:
    *   `sectionId: string`: The identifier of the section to scroll to. This ID typically corresponds to:
        *   An ISO date string (e.g., `"2023-11-25"`) for a specific day rendered by a `[Day](./Day.md)` component.
        *   The string `"unscheduled"` for the section rendered by the `[Unscheduled](./Unscheduled.md)` component.
*   **Returns**: `void` (this method does not return a value).

## Usage Context

The `TimelineViewHandle` is primarily used by parent components that render `[TimelineView](./TimelineView.md)` and need to control its scroll position based on user actions or other application logic.

To use the handle:
1.  A parent component creates a `ref` using `React.useRef<TimelineViewHandle>(null)`.
2.  This `ref` is passed to the `[TimelineView](./TimelineView.md)` component instance (which must be set up with `React.forwardRef`).
3.  The parent component can then access the `scrollTo` method (and any other methods defined on the handle) via `ref.current`.

### Conceptual Example:

```tsx
import React, { useRef } from 'react';
import TimelineView, { TimelineViewHandle, TimelineViewProps } from './TimelineView'; // Assuming path

const ParentComponent = () => {
  const timelineRef = useRef<TimelineViewHandle>(null);

  // Props for [TimelineView](./TimelineView.md) would be defined here
  // const timelineViewProps: TimelineViewProps = { ... };

  const handleGoToToday = () => {
    const todayISO = new Date().toISOString().slice(0, 10); // Example: "YYYY-MM-DD"
    if (timelineRef.current) {
      timelineRef.current.scrollTo(todayISO);
    }
  };

  const handleGoToUnscheduled = () => {
    if (timelineRef.current) {
      timelineRef.current.scrollTo('unscheduled');
    }
  };

  return (
    <div>
      <button onClick={handleGoToToday}>Scroll to Today</button>
      <button onClick={handleGoToUnscheduled}>Scroll to Unscheduled</button>
      {/* <[TimelineView](./TimelineView.md) ref={timelineRef} {...timelineViewProps} /> */}
    </div>
  );
};
```

This handle is particularly useful in components like `[TimeRulerHeader](./TimeRulerHeader.md)` which contains date navigation buttons that, when clicked, need to scroll the `[TimelineView](./TimelineView.md)` to the corresponding date section. The `[TimelineView](./TimelineView.md)` component uses `useImperativeHandle` in conjunction with `forwardRef` to expose this specific interface.
