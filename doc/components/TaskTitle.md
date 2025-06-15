# TaskTitle Component (`src/components/TaskTitle.tsx`)

## Purpose

The `TaskTitle` component is responsible for rendering the title of a task. It intelligently parses `[[wikilinks]]` within the title string, converting them into clickable links that navigate within Obsidian. The component also applies conditional styling based on task properties (like priority, status, or if it's a link representation) and manages click interactions to either open the task itself or a clicked wikilink.

## Props

The component accepts the following props:

*   **`title: string | undefined | null`**: The text content of the task's title. Can be `null` or `undefined` if no title is present.
*   **`priority: [TaskPriorities](../../types.md#taskpriorities)`**: An enum value (`[TaskPriorities](../../types.md#taskpriorities)`) representing the priority of the task, which influences the title's color.
*   **`renderType?: 'deadline'`**: An optional string. If set to `'deadline'`, it might influence styling (though current implementation doesn't apply a specific class for it, it's considered in the color logic).
*   **`isLink: boolean`**: A boolean flag. If `true`, it indicates the task is being rendered in a compact/link format, which applies `text-faint` styling.
*   **`status: string`**: A string representing the task's status (e.g., 'x' for completed). If the status is 'x', `text-faint` styling is applied.
*   **`lineHeightNormal: string`**: A string representing the normal line height of text (e.g., "1.5"). This is used to calculate a `maxHeight` for the title, effectively limiting it to approximately two lines of text.
*   **`onOpenTask: () => void`**: A callback function that is invoked when the title area (excluding wikilinks) is clicked, typically to open a detailed view or editor for the task.
*   **`taskPath: string`**: The file path of the note containing the task. This is crucial for resolving wikilink navigation within Obsidian.

## Functionality

*   **Wikilink Parsing**:
    *   An internal function `parseTitleForLinks` processes the `title` string to find `[[wikilink]]` patterns using a regular expression.
    *   Text segments outside of wikilinks are rendered as plain text within `<span>` elements.
    *   Matched `[[wikilink]]` patterns are rendered as interactive `<span>` elements:
        *   These spans are styled with `text-accent hover:underline` for visual distinction and affordance.
        *   The displayed text within the link is the content of the wikilink (e.g., "My Note" from `[[My Note]]`).
        *   Clicking on one of these wikilink `<span>` elements triggers `getters.get('apis').obsidian!.app.workspace.openLinkText(linkText, taskPath)`, using the Obsidian API to navigate to the linked note or heading.
        *   The `onClick` event for a wikilink also calls `stopPropagation()` to prevent the `onOpenTask` callback from being triggered simultaneously.
*   **Styling**:
    *   The main container `div` has base CSS classes: `w-fit max-w-full cursor-pointer overflow-hidden text-ellipsis leading-line whitespace-normal`.
    *   **Word Break Strategy**: The component dynamically chooses a word break strategy:
        *   `break-all` is used if any word in the title is longer than 20 characters, allowing breaks within long words.
        *   `break-words` is used otherwise.
    *   **Text Color**: The title's text color is conditionally applied:
        *   `text-accent`: If `priority` is `[TaskPriorities](../../types.md#taskpriorities).HIGHEST`.
        *   `text-faint`: If `priority` is `[TaskPriorities](../../types.md#taskpriorities).LOW`, or if `isLink` is `true`, or if `status` is `'x'` (completed/cancelled), or if the `title` is empty/null.
        *   **Default text color**: If none of the above specific conditions are met, the title is styled with `text-[var(--text-accent)]` and `hover:underline`, making it appear as an interactive link.
    *   **Max Height**: The `maxHeight` style property is dynamically calculated as `calc(${lineHeightNormal}em * 2)`, effectively limiting the title's visible area to approximately two lines based on the provided normal line height. Overflowing text will be ellipsized due to `overflow-hidden text-ellipsis`.
*   **Event Handling**:
    *   `onMouseDown`:
        *   If the click target is not a wikilink `<span>` (identified by not being a `span` or not having the `text-accent` class), the `onOpenTask()` callback is invoked.
        *   Returns `false` to potentially prevent default browser actions or further event propagation.
    *   `onClick`:
        *   If a wikilink `<span>` was clicked, this event calls `stopPropagation()` and returns, ensuring the link's specific click handler (for navigation) takes precedence and `onOpenTask` is not called.
        *   Returns `false`.
    *   `onMouseUp`: Returns `false`.

## State

The `TaskTitle` component is a stateless functional component. Its rendering and behavior are entirely determined by the props passed to it.

## Interactions with Other Components and Services

*   **Obsidian API (`getters.get('apis').obsidian!.app.workspace.openLinkText`)**: Interacts with the Obsidian application's API (via a getter from `[../app/store](../../store.md)`) to open notes or links when a parsed wikilink within the title is clicked.
*   **`[TaskPriorities](../../types.md#taskpriorities)` Enum (`[../types/enums](../../types.md#enums-and-mappings-from-srctypesenumsts)`)**: Uses this enum to determine styling based on task priority.

## Usage Example

```tsx
import React from 'react';
import TaskTitle, { TaskTitleProps } from './TaskTitle';
import { TaskPriorities } from '../types/enums'; // Assuming TaskPriorities enum

// Scenario 1: Regular title with a wikilink
const Example1 = () => {
  const props: TaskTitleProps = {
    title: "Review the [[Project Plan]] document by EOD",
    priority: [TaskPriorities](../../types.md#taskpriorities).NORMAL,
    isLink: false,
    status: " ", // Incomplete
    lineHeightNormal: "1.5",
    onOpenTask: () => console.log("Task opened: Review project plan"),
    taskPath: "tasks/project_tasks.md"
  };
  return <TaskTitle {...props} />;
};

// Scenario 2: High priority title, no wikilinks
const Example2 = () => {
  const props: TaskTitleProps = {
    title: "URGENT: Fix deployment bug!",
    priority: [TaskPriorities](../../types.md#taskpriorities).HIGHEST,
    isLink: false,
    status: " ",
    lineHeightNormal: "1.5",
    onOpenTask: () => console.log("Task opened: Fix deployment bug"),
    taskPath: "dev/tasks.md"
  };
  return <TaskTitle {...props} />;
};

// Scenario 3: Completed task title (faint text)
const Example3 = () => {
  const props: TaskTitleProps = {
    title: "Archive old [[Client Emails]]",
    priority: [TaskPriorities](../../types.md#taskpriorities).LOW,
    isLink: false,
    status: "x", // Completed
    lineHeightNormal: "1.6",
    onOpenTask: () => console.log("Task opened: Archive client emails (already completed)"),
    taskPath: "archive/tasks.md"
  };
  return <TaskTitle {...props} />;
};

// Scenario 4: Title as a link (faint text)
const Example4 = () => {
  const props: TaskTitleProps = {
    title: "Quick link to [[Dashboard]]",
    priority: [TaskPriorities](../../types.md#taskpriorities).NORMAL,
    isLink: true, // Rendered as a link
    status: " ",
    lineHeightNormal: "1.4",
    onOpenTask: () => console.log("Task opened: Quick link to dashboard"),
    taskPath: "links.md"
  };
  return <TaskTitle {...props} />;
};

// To render one of these examples:
// <Example1 />
```
This component is central to how tasks are presented, providing rich interactivity for titles that include wikilinks and adapting its appearance to reflect task characteristics.
