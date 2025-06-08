# TaskDetails Component (`src/components/TaskDetails.tsx`)

## Purpose

The `TaskDetails` component is responsible for displaying secondary, often actionable, details of a task. This includes information like task priority, reminders, and provides draggable handles for adjusting the task's duration (length) and due date. It is designed to be used within a larger task component, such as `TaskContent`.

## Props

The component accepts the following props:

*   **`task: TaskProps`**: An object containing all properties of the task, such as `priority`, `reminder`, `completed`, `duration`, and `due`.
*   **`startISO?: string`**: An optional ISO date string, typically representing the current view's start date. This is used for calculating and displaying the relative due date (e.g., "in 3 days"). Defaults to the current date if not provided.
*   **`hasLengthDrag: boolean`**: A boolean flag that controls the visibility of the draggable handle for the task's duration (length).
*   **`dragging?: boolean`**: An optional boolean. If `true`, the component renders `null`, effectively hiding task details during a drag operation of the parent task.
*   **`setLengthNodeRef?: (node: HTMLElement | null) => void`**: An optional function from `@dnd-kit/core` to set the ref for the draggable length element.
*   **`lengthAttributes?: DraggableAttributes`**: Optional DND attributes from `@dnd-kit/core` for the task's length draggable handle.
*   **`lengthListeners?: SyntheticListenerMap`**: Optional DND event listeners from `@dnd-kit/core` for the task's length draggable handle.
*   **`setDeadlineNodeRef?: (node: HTMLElement | null) => void`**: An optional function from `@dnd-kit/core` to set the ref for the draggable due date element.
*   **`deadlineAttributes?: DraggableAttributes`**: Optional DND attributes from `@dnd-kit/core` for the task's due date draggable handle.
*   **`deadlineListeners?: SyntheticListenerMap`**: Optional DND event listeners from `@dnd-kit/core` for the task's due date draggable handle.

## Functionality

*   **Conditional Rendering**: If the `dragging` prop is `true`, the component renders `null`.
*   **Priority Display**:
    *   Renders the task's priority (e.g., "High", "Medium") if it's not the default priority. The display is styled with `task-priority` classes.
*   **Reminder Display**:
    *   If the task is not completed (`!task.completed`) and a `task.reminder` exists, it displays a reminder.
    *   This includes an alarm clock icon (using the `Logo` component with `src='alarm-clock'`) and the formatted reminder date and time (e.g., "9/15 10:00 AM"). The date is formatted as 'M/d' and appended with the time part of the ISO string.
    *   (Note: The source code contains two blocks for rendering reminders with the same conditions; functionally, this results in a reminder being displayed if the conditions are met.)
*   **Task Duration (Length) Draggable**:
    *   Rendered if `hasLengthDrag` is `true`.
    *   Provides a draggable area (using `setLengthNodeRef`, `lengthAttributes`, `lengthListeners`) for adjusting the task's duration.
    *   Displays the text "length" if `task.duration` is not set. Otherwise, it shows the formatted duration (e.g., "1h30m").
    *   This element has `cursor-ns-resize` and is styled with `task-duration`. It's hidden by default if no duration is set and becomes visible on parent group hover (`group-hover:block`).
*   **Due Date Draggable**:
    *   Rendered if the task is not completed (`!task.completed`).
    *   Provides a draggable area (using `setDeadlineNodeRef`, `deadlineAttributes`, `deadlineListeners`) for adjusting the task's due date.
    *   Displays the text "due" if `task.due` is not set. Otherwise, it shows the relative due date (e.g., "3d") calculated against `startISO` (or today's date).
    *   This element has `cursor-grab` and is styled with `task-due`. It's hidden by default if no due date is set and becomes visible on parent group hover (`group-hover:block`).
*   **Styling**: Utilizes various CSS classes for styling, including responsive visibility on hover (e.g., `group-hover:block`).

## State

The `TaskDetails` component is a stateless functional component. Its appearance and behavior are entirely determined by the props passed to it.

## Interactions with Other Components and Services

*   **`Logo` Component (`./Logo.tsx`)**: Used to display the alarm clock icon for reminders.
*   **`@dnd-kit/core`**: Consumes `DraggableAttributes` and `SyntheticListenerMap` props to enable drag-and-drop functionality for the length and deadline handles.
*   **`TaskProps` Type (`../types`)**: The structure of the `task` prop is defined by the `TaskProps` type.
*   **Luxon `DateTime` library**: Used for:
    *   Formatting the reminder date and time (`DateTime.fromISO(...).toFormat('M/d')`).
    *   Calculating the difference in days for the due date display (`DateTime.fromISO(...).diff(...).shiftTo('days').days`).

## Usage Example

```tsx
import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import TaskDetails, { TaskDetailsProps } from './TaskDetails';
import { TaskProps } from '../types'; // Assuming TaskProps type definition
import { TaskPriorities, TaskStatuses } from '../types/enums'; // Assuming enums

// Conceptual parent component (like TaskContent or a specific Task item)
const MyTaskItem = ({ task, isParentDragging }: { task: TaskProps, isParentDragging?: boolean }) => {
  const { attributes: lengthAttributes, listeners: lengthListeners, setNodeRef: setLengthNodeRef } = useDraggable({
    id: `task-${task.id}-length`,
    data: { type: 'length', taskId: task.id },
  });

  const { attributes: deadlineAttributes, listeners: deadlineListeners, setNodeRef: setDeadlineNodeRef } = useDraggable({
    id: `task-${task.id}-deadline`,
    data: { type: 'deadline', taskId: task.id },
  });

  const taskDetailsProps: TaskDetailsProps = {
    task: task,
    startISO: new Date().toISOString().slice(0, 10), // Example startISO
    hasLengthDrag: true,
    dragging: isParentDragging,
    setLengthNodeRef,
    lengthAttributes,
    lengthListeners,
    setDeadlineNodeRef,
    deadlineAttributes,
    deadlineListeners,
  };

  return (
    <div className="group"> {/* `group` class for hover effects in TaskDetails */}
      {/* ... other task elements like TaskTitle ... */}
      <TaskDetails {...taskDetailsProps} />
    </div>
  );
};

// Example Task Data
const exampleTask: TaskProps = {
  id: '2',
  title: 'Review documentation',
  priority: TaskPriorities.Medium,
  status: TaskStatuses.Todo,
  reminder: '2024-09-20T09:00:00Z',
  due: '2024-09-22T23:59:59Z',
  duration: { hour: 2, minute: 0 },
  completed: false,
  // ... other task properties
};

// To render: <MyTaskItem task={exampleTask} isParentDragging={false} />
```
This component enhances task items by providing at-a-glance details and interactive elements for modifying time-related aspects of a task.
