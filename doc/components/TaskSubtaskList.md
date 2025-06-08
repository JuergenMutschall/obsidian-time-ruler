# TaskSubtaskList Component (`src/components/TaskSubtaskList.tsx`)

## Purpose

The `TaskSubtaskList` component is responsible for rendering the list of subtasks associated with a parent task. It provides a visual control to collapse or expand this list and utilizes the `Block` component to display the actual subtasks when expanded.

## Props

The component accepts the following props:

*   **`taskId: string`**: The unique identifier of the parent task.
*   **`task: TaskProps`**: The parent task object itself. This is used by the `getHeading` utility function to determine path information for hiding redundant parent paths in subtask rendering.
*   **`subtasks: TaskProps[] | undefined`**: An array of `TaskProps` objects representing the subtasks. This list is expected to be already filtered and processed by the parent component.
*   **`collapsed: boolean`**: A boolean state indicating whether the subtask list is currently collapsed (`true`) or expanded (`false`).
*   **`onToggleCollapse: () => void`**: A callback function that is invoked when the user clicks the collapse/expand control.
*   **`dragContainer: string`**: A string identifier for the drag container context, passed down to the child `Block` component and further qualified with the `taskId`.
*   **`startISO?: string`**: An optional ISO date string, typically representing the current view's start date, passed to the child `Block` component.
*   **`dailyNoteInfo: AppState['dailyNoteInfo']`**: Information related to daily notes, used by the `getHeading` utility function.
*   **`groupBy: AppState['settings']['groupBy']`**: The current grouping setting from application state, used by the `getHeading` utility function.

## Functionality

*   **Conditional Rendering**: If the `subtasks` prop is `undefined` or an empty array, the component renders `null` (nothing).
*   **Collapse/Expand Control**:
    *   Renders a `div` element that serves as the interactive control for collapsing and expanding the subtask list.
    *   The visual appearance of this control changes based on the `collapsed` prop:
        *   When `collapsed` is `true`, it displays a horizontal line.
        *   When `collapsed` is `false` (expanded), it displays a vertical line, visually connecting to the subtask list.
    *   This control has styling that changes its padding based on the `collapsed` state (`pl-indent pr-2` when collapsed, `pl-[8px] py-2` when expanded).
    *   Clicking this control triggers the `onToggleCollapse` callback function.
*   **Subtask Display**:
    *   If `collapsed` is `false` and `subtasks` exist and are not empty, the component renders a `Block` component to display the list of subtasks.
    *   The `Block` component is configured with the following specific props:
        *   `type='child'`: Indicates that this block represents child tasks.
        *   `dragContainer`: Set to `${dragContainer}::${taskId}`, creating a unique drag context for the subtasks of this parent.
        *   `hidePaths`: An array of strings, `[getHeading(task, dailyNoteInfo, groupBy), task.path]`. This is used to prevent the redundant display of the parent task's own heading or path within the subtask entries.
        *   `tasks`: The `subtasks` array is passed to this prop.
        *   `parentId`: Set to `taskId`, linking the subtasks to their parent.
        *   `startISO`: The `startISO` prop is passed through.
        *   `events`: Passed as an empty array `[]`.
        *   `blocks`: Passed as an empty array `[]`.

## State

The `TaskSubtaskList` component itself is a stateless functional component. However, its visual presentation (expanded or collapsed) is controlled by the `collapsed` prop, which is managed by a parent component.

## Interactions with Other Components and Services

*   **`Block` Component (`./Block.tsx`)**: This is a crucial interaction. `TaskSubtaskList` uses the `Block` component to render the actual list of subtasks when the list is expanded.
*   **`getHeading` Utility Function (`../services/util`)**: This function is used to determine the heading or path of the parent task, which is then used in the `hidePaths` prop of the `Block` component to avoid redundancy.
*   **`TaskProps` Type (`../types`)**: Defines the structure for `task` objects and elements within the `subtasks` array.
*   **`AppState` Type (`../app/store`)**: Parts of the `AppState` (specifically `dailyNoteInfo` and `settings.groupBy`) are consumed via props to be used by `getHeading`.

## Usage Example

```tsx
import React, { useState } from 'react';
import TaskSubtaskList, { TaskSubtaskListProps } from './TaskSubtaskList';
import { TaskProps } from '../types'; // Assuming TaskProps type definition
import { AppState } from '../app/store'; // Assuming AppState type
import { GroupByOption } from '../types/enums'; // For groupBy

// Conceptual parent component (e.g., a TaskItem)
const MyParentTask = ({ task, allSubtasks, initialCollapsed = true, appState }: { task: TaskProps, allSubtasks: TaskProps[], initialCollapsed?: boolean, appState: AppState }) => {
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  const relevantSubtasks = allSubtasks.filter(sub => sub.parentId === task.id); // Example filtering

  const handleToggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  if (!relevantSubtasks || relevantSubtasks.length === 0) {
    // No subtasks to display for this parent
    // return <p>Parent Task: {task.title} (No subtasks)</p>;
  }

  const subtaskListProps: Omit<TaskSubtaskListProps, 'subtasks'> = { // subtasks will be added if relevantSubtasks exist
    taskId: task.id,
    task: task,
    // subtasks: relevantSubtasks, // This will be passed if relevantSubtasks exist
    collapsed: collapsed,
    onToggleCollapse: handleToggleCollapse,
    dragContainer: "myMainView", // Example drag container
    startISO: new Date().toISOString().slice(0,10), // Example startISO
    dailyNoteInfo: appState.dailyNoteInfo,
    groupBy: appState.settings.groupBy,
  };

  return (
    <div>
      <p>Parent Task: {task.title}</p>
      {/* ... other parent task details ... */}
      {relevantSubtasks && relevantSubtasks.length > 0 && (
        <TaskSubtaskList {...subtaskListProps} subtasks={relevantSubtasks} />
      )}
    </div>
  );
};

// Example Data
const parentTaskData: TaskProps = { id: 'parent1', title: 'Main Project Task', path: 'project/main', /* ...other props */ };
const subtaskData: TaskProps[] = [
  { id: 'sub1', parentId: 'parent1', title: 'Subtask A', path: 'project/main/subA', /* ...other props */ },
  { id: 'sub2', parentId: 'parent1', title: 'Subtask B', path: 'project/main/subB', /* ...other props */ },
];
const exampleAppState: AppState = { // Simplified AppState for example
  dailyNoteInfo: { /* ... */ },
  settings: { groupBy: GroupByOption.Default, /* ...other settings */ },
  // ... other app state parts
};

// To render:
// <MyParentTask task={parentTaskData} allSubtasks={subtaskData} appState={exampleAppState} />
```
This component is key for hierarchically displaying tasks and managing the visibility of their nested sub-items.
