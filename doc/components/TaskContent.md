# TaskContent Component (`src/components/TaskContent.tsx`)

## Purpose

The `TaskContent` component serves as a draggable container for displaying the main content of a task item. It is responsible for structuring the visual presentation of a task by separating its title and detailed information (like priority, due date, duration) and integrating with drag-and-drop (DND) functionalities provided by `@dnd-kit/core`.

## Props

The component accepts the following props:

*   **`task: TaskProps`**: An object containing all properties of the task, such as title, priority, status, reminder, due date, etc. This is passed to child components `TaskTitle` and `TaskDetails`.
*   **`renderType?: 'deadline'`**: An optional string that can alter the rendering behavior, particularly for `TaskTitle`. For example, 'deadline' might imply a specific layout or information display.
*   **`isLink: boolean`**: A boolean flag indicating if the task is being rendered in a context where it should behave or look like a link. Passed to `TaskTitle`.
*   **`lineHeightNormal: string`**: Specifies the normal line height, passed to `TaskTitle` for consistent text rendering.
*   **`onOpenTask: () => void`**: A callback function that is invoked when the task title is interacted with, typically to open a more detailed view of the task. Passed to `TaskTitle`.
*   **`taskPath: string`**: The path or identifier for the task, used by `TaskTitle`, potentially for navigation or identification.
*   **`startISO?: string`**: An optional ISO date string representing the start date/time of the task. Passed to `TaskDetails`.
*   **`hasLengthDrag: boolean`**: A boolean indicating if the task's duration (length) is draggable/adjustable. Passed to `TaskDetails`.
*   **`mainTaskDragging?: boolean`**: An optional boolean indicating if the main task item is currently being dragged. Passed to `TaskDetails` as the `dragging` prop.
*   **`dndAttributes: DraggableAttributes`**: Attributes required by `@dnd-kit/core` to make the main task content container draggable. Applied to the root `div`.
*   **`dndListeners: SyntheticListenerMap`**: Event listeners required by `@dnd-kit/core` for handling drag interactions on the main task content container. Applied to the root `div`.
*   **`setLengthNodeRef?: (node: HTMLElement | null) => void`**: An optional function to set the ref for the draggable length element. Passed to `TaskDetails`.
*   **`lengthAttributes?: DraggableAttributes`**: Optional DND attributes for the task's length element. Passed to `TaskDetails`.
*   **`lengthListeners?: SyntheticListenerMap`**: Optional DND event listeners for the task's length element. Passed to `TaskDetails`.
*   **`setDeadlineNodeRef?: (node: HTMLElement | null) => void`**: An optional function to set the ref for the draggable deadline element. Passed to `TaskDetails`.
*   **`deadlineAttributes?: DraggableAttributes`**: Optional DND attributes for the task's deadline element. Passed to `TaskDetails`.
*   **`deadlineListeners?: SyntheticListenerMap`**: Optional DND event listeners for the task's deadline element. Passed to `TaskDetails`.

## Functionality

*   **Draggable Container**: The root `div` of the component is made draggable using the `dndAttributes` and `dndListeners` props provided by `@dnd-kit/core`. It has `cursor-grab` styling.
*   **Layout Structure**:
    *   The component organizes its children into a primary flex container.
    *   The first part of this container holds the `TaskTitle` component and a flexible `div` (`className='h-full w-0 grow'`) that allows the title section to expand and fill available space. This section is wrapped in a `div` with `className='flex w-full mr-4'`.
    *   The second part of the main container is the `TaskDetails` component, which displays further information about the task.
*   **Props Delegation**:
    *   Passes `task.title`, `task.priority`, `renderType`, `isLink`, `task.status`, `lineHeightNormal`, `onOpenTask`, and `taskPath` to the `TaskTitle` component.
    *   Passes `task`, `startISO`, `hasLengthDrag`, `mainTaskDragging` (as `dragging`), `setLengthNodeRef`, `lengthAttributes`, `lengthListeners`, `setDeadlineNodeRef`, `deadlineAttributes`, and `deadlineListeners` to the `TaskDetails` component.

## State

The `TaskContent` component is a stateless functional component. Its rendering and behavior are entirely controlled by the props passed to it. It does not manage any internal state.

## Interactions with Other Components and Services

*   **`TaskTitle` Component (`./TaskTitle.tsx`)**: `TaskContent` renders the `TaskTitle` component to display the task's title and priority, and handle interactions like opening the task.
*   **`TaskDetails` Component (`./TaskDetails.tsx`)**: `TaskContent` renders the `TaskDetails` component to display other task information such as reminder, due date, and duration. It also passes down DND-related props if parts of the details (like length or deadline) are themselves draggable.
*   **`@dnd-kit/core`**: The component consumes `DraggableAttributes` and `SyntheticListenerMap` from `@dnd-kit/core` to enable drag-and-drop functionality for the entire task content area. It also passes through DND props for sub-elements like task length or deadline to `TaskDetails`.
*   **`TaskProps` Type (`../types`)**: The structure of the `task` prop is defined by the `TaskProps` type.

## Usage Example

```tsx
import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import TaskContent, { TaskContentProps } from './TaskContent';
import { TaskProps } from '../types'; // Assuming TaskProps type definition
import { TaskPriorities, TaskStatuses } from '../types/enums'; // Assuming enums

const MyTaskComponent = ({ task }: { task: TaskProps }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `task-${task.id}`,
    data: { task }, // Optional: pass task data for DND event handlers
  });

  const taskContentProps: Omit<TaskContentProps, 'dndAttributes' | 'dndListeners'> = {
    task: task,
    isLink: false,
    lineHeightNormal: "1.5",
    onOpenTask: () => console.log('Open task:', task.id),
    taskPath: `/tasks/${task.id}`,
    hasLengthDrag: true,
    // Assume other DND props for length/deadline are handled similarly if needed
  };

  return (
    <div ref={setNodeRef} style={transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : {}}>
      <TaskContent
        {...taskContentProps}
        dndAttributes={attributes}
        dndListeners={listeners}
      />
    </div>
  );
};

// Example Task Data
const exampleTask: TaskProps = {
  id: '1',
  title: 'Finalize project report',
  priority: TaskPriorities.High,
  status: TaskStatuses.InProgress,
  // ... other task properties like reminder, dueDate, etc.
};

// To render: <MyTaskComponent task={exampleTask} />
```
This component acts as the primary interactive surface for a task within a list or board, allowing users to drag it and view its core information at a glance.
