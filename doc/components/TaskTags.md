# TaskTags Component (`src/components/TaskTags.tsx`)

## Purpose

The `TaskTags` component is responsible for displaying the list of tags associated with a task. It conditionally renders these tags, hiding them if the task has no tags or if the current application view is already grouping tasks by tags (to avoid redundancy).

## Props

The component accepts the following props:

*   **`tags: string[]`**: An array of strings, where each string is a tag associated with the task (e.g., `["#projectA", "#urgent"]`).
*   **`groupBy: string | false`**: A string indicating the current criteria by which tasks are grouped in the application (e.g., `'status'`, `'tags'`, `'path'`), or `false` if no grouping is active. This is typically derived from `[AppState](../../store.md#appstate-interface)['settings']['groupBy']`.

## Functionality

*   **Conditional Rendering**:
    *   The component renders `null` (nothing) if the `tags` array is empty.
    *   It also renders `null` if the `groupBy` prop is strictly equal to the string `'tags'`.
*   **Tags Display**:
    *   If tags are present and the `groupBy` condition is not met, the component renders a container `div`.
    *   This container `div` has the following CSS classes: `no-scrollbar flex space-x-2 overflow-x-auto pl-indent text-xs child:whitespace-nowrap`.
        *   `no-scrollbar`: Hides scrollbars even if content overflows.
        *   `flex space-x-2`: Arranges tags horizontally with spacing.
        *   `overflow-x-auto`: Allows horizontal scrolling if tags exceed available width.
        *   `pl-indent`: Adds left padding.
        *   `text-xs`: Sets a small text size for the tags.
        *   `child:whitespace-nowrap`: Ensures individual tags do not wrap.
    *   Inside the container, it maps over the `tags` array and renders a separate `div` for each tag.
    *   Each individual tag `div` is styled with Obsidian's standard CSS classes for tags: `cm-hashtag cm-hashtag-end cm-hashtag-begin !h-fit !text-xs`.
    *   The text displayed for each tag has the leading '#' character removed (e.g., `"#projectA"` becomes `"projectA"`).

## State

The `TaskTags` component is a stateless functional component. Its output is solely determined by the props it receives.

## Interactions with Other Components and Services

The `TaskTags` component does not have direct interactions with other custom JavaScript components or services visible within its own source code. It primarily consumes props (`tags` and `groupBy`) provided by its parent component to determine its rendering logic. It relies on global Obsidian CSS classes for tag styling.

## Usage Example

```tsx
import React from 'react';
import TaskTags, { TaskTagsProps } from './TaskTags';

// Scenario 1: Task with tags, not grouped by tags
const Example1 = () => {
  const tags = ["#work", "#meeting", "#priority1"];
  const groupBySetting = "status"; // or 'path', false, etc.
  return <TaskTags tags={tags} groupBy={groupBySetting} />;
};
// Expected: Renders a div containing "work", "meeting", and "priority1" styled as tags.

// Scenario 2: Task with tags, but tasks are grouped by tags
const Example2 = () => {
  const tags = ["#home", "#chores"];
  const groupBySetting = "tags";
  return <TaskTags tags={tags} groupBy={groupBySetting} />;
};
// Expected: Renders null.

// Scenario 3: Task with no tags
const Example3 = () => {
  const tags: string[] = [];
  const groupBySetting = "status";
  return <TaskTags tags={tags} groupBy={groupBySetting} />;
};
// Expected: Renders null.

// Scenario 4: Task with tags, no specific grouping (groupBy is false)
const Example4 = () => {
  const tags = ["#idea", "#research"];
  const groupBySetting = false;
  return <TaskTags tags={tags} groupBy={groupBySetting} />;
};
// Expected: Renders a div containing "idea" and "research" styled as tags.

// To render one of these examples:
// <Example1 />
```
This component provides a clean and conditional way to display task tags, integrating with application-level view settings.
