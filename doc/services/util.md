# Utility Service (`src/services/util.ts`)

## Purpose

The `util.ts` service is a collection of miscellaneous helper functions used across the Time Ruler plugin. These functions provide common functionalities related to date and time manipulation (using Luxon and Moment.js), string parsing (especially for file paths, headings, and task metadata), task data processing, DOM interactions, and application-specific logic for task hierarchies and queries.

## Key Categories and Functions

### Date and Time Utilities

*   **`roundMinutes(date: DateTime): DateTime`**: Rounds a Luxon `DateTime` object down to the nearest 15-minute interval.
*   **`isDateISO(isoString: string): boolean`**: Checks if an ISO string represents only a date (e.g., "YYYY-MM-DD") by checking its length.
*   **`toISO(date: DateTime, isDate?: boolean): string`**: Converts a Luxon `DateTime` object to an ISO string. If `isDate` is true, returns only the date part. Suppresses milliseconds, seconds, and timezone offset by default.
*   **`getToday(): string`**: Returns today's date as an ISO date string, adjusted by `getStartDate`.
*   **`getStartDate(time: DateTime): string`**: Calculates the "start date" for a given `DateTime`. If the `dayStartEnd[1]` setting (day's end hour) is early in the morning (e.g., before noon) and the given `time` is before that end hour, it considers the "start date" to be the previous day. Otherwise, it's the date of the given `time`.
*   **`useHourDisplay(hours: number): string | number`**: A React hook that returns the hour display format (12-hour or 24-hour) based on `settings.twentyFourHourFormat`.

### String Parsing and Manipulation

*   **`parseFolderFromPath(path: string): string`**: Extracts the immediate parent folder name from a file path.
*   **`parseFileFromPath(path: string): string`**: Cleans up a path string to get a canonical file path (removes #headings, >aliases, ::line numbers, ensures .md extension). Converts "Daily" to the actual daily note path.
*   **`parsePathFromDate(date: string, dailyNoteInfo?: [AppState](../../store.md#appstate-interface)['dailyNoteInfo']): string`**: Constructs a daily note file path for a given date string using format and folder settings.
*   **`parseDateFromPath(path: string, dailyNoteInfo: [AppState](../../store.md#appstate-interface)['dailyNoteInfo']): DateTime | false`**: Parses a date from a file path if it matches the daily note format; otherwise, returns `false`.
*   **`splitHeading(heading: string): [string, string]`**: Splits a string (typically a task path or group heading) into a container part and a title part, using '>', '#', or '/' as delimiters.
*   **`convertSearchToRegExp(search: string): RegExp`**: Converts a search string into a regular expression where each character in the search string is separated by `.*?` (matches any characters lazily), making it a loose sequence match.

### DOM Utilities

*   **`insertTextAtCaret(text: string)`**: Inserts text at the current cursor position in a content-editable element or input. (Note: Uses `window.getSelection()`, applicability might vary depending on context).
*   **`deleteTextAtCaret(chars: number)`**: Deletes a specified number of characters backward from the current cursor position. (Note: Uses `window.getSelection()`, applicability might vary).
*   **`useChildWidth(): { childWidth: number, childClass: string }`**: A React hook that determines the number of columns (`childWidth`) that can fit into the `#time-ruler` container and returns a corresponding Tailwind CSS class string (`childClass`) for grid layout. It re-calculates on window resize or view mode change.
*   **`scrollToSection(id: string): Promise<void>`**: Scrolls the view to an element with ID `time-ruler-${id}` smoothly.

### Task and Application-Specific Logic

*   **`getEndISO({ tasks, events, startISO, endISO }: [BlockProps](../../components/Block.md#props-blockcomponentprops)): string`**: Calculates the effective end time of a `Block` by adding durations of its tasks and events to its `startISO`. Returns the maximum of this calculated time and the block's original `endISO`.
*   **`getTodayNote(): string`**: Returns the full path to today's daily note.
*   **`getSubHeading(task: [TaskProps](../../types.md#taskprops), groupBy: [AppState](../../store.md#appstate-interface)['settings']['groupBy'], hidePaths: string[]): string | typeof [UNGROUPED](../../components/Block.md#constants)`**: Determines the subheading for a task within a group, based on `groupBy` settings (e.g., extracts heading from `task.path` if not hidden).
*   **`getHeading({ path, page, priority, tags }: ..., dailyNoteInfo: ..., groupBy: ..., hidePaths: ...): string`**: Calculates the primary grouping heading for a task based on `groupBy` setting (priority, tags, path, or hybrid). Handles daily notes specifically.
*   **`getTasksByHeading(tasks: ..., dailyNoteInfo: ..., fileOrder: ..., groupBy: ...): [string, [TaskProps[]](../../types.md#taskprops)][]`**: Groups tasks by headings (determined by `getHeading`) and sorts these groups according to `fileOrder`.
*   **`isLengthType(type?: [DragData](../../types.md#dragdata)['dragType']): boolean`**: Checks if a drag type is for 'task-length' or 'time'.
*   **`removeNestedChildren(id: string, taskList: [TaskProps[]](../../types.md#taskprops))`**: (Seems to have a bug, as it removes `child` from `taskList` but `child` is an iterator variable, not the actual element from the list directly. It should likely use an index or filter). Intended to remove children of a task from a list.
*   **`parseTaskDate(task: [TaskProps](../../types.md#taskprops), tasks: [AppState](../../store.md#appstate-interface)['tasks']): string | undefined`**: Determines the effective scheduled or completion date of a task, considering the scheduled dates of its parent tasks (parents with later dates "pull" children).
*   **`isGreater(firstScheduled?: string, lastScheduled?: string): boolean`**: Compares two optional scheduled date strings.
*   **`queryTasks(id: string, query: string, tasks: Record<string, [TaskProps](../../types.md#taskprops)>): [TaskProps[]](../../types.md#taskprops)`**: Filters a list of tasks based on a Dataview-like query string. Parses paths, tags, and field comparisons (e.g., `key > value`).
*   **`getChildren(task: [TaskProps](../../types.md#taskprops), tasks: [AppState](../../store.md#appstate-interface)['tasks']): string[]`**: Recursively gets all child IDs (including `queryChildren`) for a given task.
*   **`getParents(task: [TaskProps](../../types.md#taskprops), tasks: [AppState](../../store.md#appstate-interface)['tasks']): [TaskProps[]](../../types.md#taskprops)`**: Recursively gets all parent tasks for a given task.
*   **`getParentScheduled(task: [TaskProps](../../types.md#taskprops), tasks: [AppState](../../store.md#appstate-interface)['tasks']): string | undefined`**: Finds the effective scheduled date of a task by traversing up its parent chain until a scheduled date is found.
*   **`nestedScheduled(parentScheduled?: string, childScheduled?: string): boolean`**: Checks if a child's schedule is valid/allowed relative to its parent's schedule, considering "now" as a floor for future-dated items.
*   **`hasPriority(task: [TaskProps](../../types.md#taskprops)): boolean`**: Checks if a task has a non-default priority.

## Data Types and Interfaces

The file doesn't explicitly define many new types but uses and implies several from other parts of the application:
*   `[TaskProps](../../types.md#taskprops)` (from global types)
*   `[BlockProps](../../components/Block.md#props-blockcomponentprops)`, `[UNGROUPED](../../components/Block.md#constants)` (from `src/components/Block.tsx`)
*   `[AppState](../../store.md#appstate-interface)`, `[DragData](../../types.md#dragdata)` (from `src/app/store.ts`)
*   Types from `obsidian` (e.g., `Platform`)
*   Types from `luxon` (`DateTime`, `Duration`)

## Interactions

*   **Luxon & Moment.js**: Used for date/time parsing and manipulation.
*   **Obsidian API**: `Platform` is used.
*   **[`src/app/store.ts`](../../store.md) ([`getters`](../../store.md#getters), [`setters`](../../store.md#setters-actions), `useAppStore`, `useAppStoreRef`)**: Many functions interact with the global store, especially for settings and task data.
*   **[`src/components/Block.tsx`](../../components/Block.md)**: Imports `[BlockProps](../../components/Block.md#props-blockcomponentprops)` and `[UNGROUPED](../../components/Block.md#constants)`.
*   **[`src/types/enums.ts`](../../types.md#enums-and-mappings-from-srctypesenumsts)**: Uses `TaskPriorities` and priority mappings.
*   **DOM**: Some functions directly interact with `document` and `window` for caret manipulation and element queries.

This utility service is a dense collection of helpers that are critical for the plugin's diverse operations, from basic data transformations to complex application logic.
