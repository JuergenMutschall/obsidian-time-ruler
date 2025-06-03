# Parser Service (`src/services/parser.ts`)

## Purpose

The `parser.ts` service is responsible for the translation between different representations of tasks and their metadata. It handles:
1.  **Parsing from Text/Dataview to `TaskProps`**: Converting tasks read from Markdown files (via Dataview `STask` objects) or page metadata into the internal `TaskProps` object format used throughout the Time Ruler plugin.
2.  **Formatting `TaskProps` to Text**: Converting `TaskProps` objects back into a string representation suitable for writing into Markdown files.
3.  **Formatting `TaskProps` to Page Frontmatter**: Converting `TaskProps` into key-value pairs for YAML frontmatter when a task is represented by an entire page.
4.  **Field Format Detection**: Identifying which syntax or format (e.g., "Tasks" plugin emoji syntax, "Kanban" style, simple text patterns, Dataview inline fields, "Full Calendar" style) is used for task metadata within a task line.

This service allows Time Ruler to be compatible with various popular task management styles within Obsidian.

## Key Constants and Regular Expressions

The service defines several important regular expressions to detect and extract task metadata:

*   `ISO_MATCH`: Matches ISO 8601 date (and optional time) strings.
*   `TASKS_EMOJI_SEARCH`: Matches emojis used by the "Tasks" plugin (e.g., 📅, ✅, ⏳) followed by optional dates.
*   `TASKS_REPEAT_SEARCH`: Matches the "Tasks" plugin repeat emoji (🔁) followed by a recurrence rule.
*   `SIMPLE_SCHEDULED_DATE`, `SIMPLE_SCHEDULED_TIME`, `SIMPLE_PRIORITY`, `SIMPLE_DUE`: Match simple text patterns for dates, times, priorities (e.g., `!`, `!!`, `!!!`), and due dates (e.g., `> YYYY-MM-DD`).
*   `KANBAN_DATE`, `KANBAN_TIME`: Match date/time formats used in some Kanban setups (e.g., `@{YYYY-MM-DD}`, `@@{HH:MM}`).
*   Other regexes for inline fields (`INLINE_FIELD_SEARCH`), hashtags (`HASHTAG_SEARCH`), Markdown links (`MD_LINK_LINE_SEARCH`, `LINK_SEARCH`), reminders (`REMINDER_MATCH`), and block references (`BLOCK_REFERENCE`).

## Public API

### `textToTask(item: any, dailyNoteInfo: AppState['dailyNoteInfo'], defaultFormat: FieldFormat['main']): TaskProps`

*   **Purpose**: Converts a Dataview `STask` object (passed as `item`) into a `TaskProps` object.
*   **Functionality**:
    *   Detects the primary field format (`mainFormat`) of the task text using `detectFieldFormat`.
    *   Extracts the `originalTitle` by removing various metadata patterns (emojis, inline fields, dates, priorities based on `mainFormat`).
    *   Cleans the `title` by removing Markdown link syntax and trimming whitespace.
    *   Extracts `notes` (text on subsequent lines).
    *   Parses various properties:
        *   `id`: Generated from file path and line number.
        *   `scheduled` and `duration` (`length`): Complex logic to parse from Dataview's `item.scheduled`, `item.length`, inline Tasks/Kanban/Simple syntaxes, Day Planner times (`startTime`, `endTime`), or file path (for daily notes). Handles date-only vs. datetime.
        *   `due`, `created`, `start`, `completion`: Parses from `item[key]` or specific emoji/simple patterns.
        *   `reminder`: Parses from Tasks emoji or native `(@YYYY-MM-DD HH:MM)` syntax.
        *   `priority`: Parses from `item.priority` (if set by Dataview from frontmatter), Tasks emoji, or simple `!`, `!!`, `!!!` patterns.
        *   `repeat`: Parses from `item.repeat` or Tasks emoji pattern.
        *   `query`: Parses `item.query`, ensuring it's quoted if it doesn't look like a complex query.
    *   Filters `tags` to exclude those found within `[[wikilinks]]`.
    *   Populates other `TaskProps` fields like `page: false`, `children`, `status`, `path`, `position`, `completed`, `links`, etc.
*   **Returns**: A `TaskProps` object.

### `pageToTask(item: Record<string, Literal> & { file: PageMetadata }, defaultFieldFormat: FieldFormat['main']): TaskProps`

*   **Purpose**: Converts Dataview page metadata (for tasks represented by whole pages) into a `TaskProps` object.
*   **Functionality**:
    *   Extracts properties like `scheduled`, `length`/`duration`, `due`, `reminder`, `completed`, `completion`, `priority`, `repeat`, `start`, `created`, `query` directly from the page's frontmatter fields (using helper `testDateTime` and `testDuration`).
    *   Handles "Full Calendar" specific fields like `allDay`, `date`, `startTime`, `endTime` to derive `scheduled` and `length`.
    *   Sets `page: true`.
    *   `id` is the file path. `title` is the file name.
*   **Returns**: A `TaskProps` object.

### `detectFieldFormat(text: string, defaultFormat: FieldFormat['main']): FieldFormat`

*   **Purpose**: Analyzes a task's text line to determine the primary metadata format used.
*   **Functionality**:
    *   `parseMain()`: Checks for patterns of "simple", "tasks" (emojis), "kanban", "full-calendar" (specific inline fields like `[allDay::]`), or "dataview" (`[scheduled::]`). Returns `defaultFormat` if none match.
    *   `parseReminder()`: Detects if reminder uses "tasks" emoji or "native" `(@...)` format.
    *   `parseScheduled()`: Detects if scheduled date uses "kanban" format.
*   **Returns**: A `FieldFormat` object: `{ main: FieldFormat['main'], reminder: FieldFormat['reminder'], scheduled: FieldFormat['scheduled'] }`.

### `taskToText(task: TaskProps, defaultFieldFormat: FieldFormat['main']): string`

*   **Purpose**: Converts a `TaskProps` object back into its textual Markdown representation.
*   **Functionality**:
    *   Starts with the basic task structure: `- [status] originalTitle tags`.
    *   Appends extra Dataview fields (`task.extraFields`).
    *   Uses `detectFieldFormat` on `task.originalText` to determine how to format metadata.
    *   Based on the detected `main` format, it appends metadata (scheduled, due, priority, duration, repeat, start, created, query, completion, reminder) using the specific syntax for that format (e.g., emojis for "tasks", `@{}` for "kanban", `[key:: value]` for "dataview", simple text patterns for "simple").
    *   Handles date vs. datetime formatting for scheduled dates.
    *   Appends `task.blockReference` if present.
*   **Returns**: A string representing the task line.

### `taskToPage(task: TaskProps, frontmatter: Record<string, any>)`

*   **Purpose**: Updates a frontmatter object with properties from a `TaskProps` object, for tasks represented by pages.
*   **Functionality**:
    *   If `task.fieldFormat === 'full-calendar'`, sets `allDay`, `date`, `startTime`, `endTime` based on `task.scheduled` and `task.duration`.
    *   Otherwise, sets `scheduled` and `length` directly.
    *   Uses `setProperty` to set other common fields like `due`, `reminder`, `completed`, `completion`, `query`, `priority`.

### `setProperty(page: Record<string, any>, property: keyof typeof propertyIndex, value: any)`

*   **Purpose**: Sets a property in a frontmatter-like object (`page`). It tries to use existing keys for a given property (e.g., "complete" or "Completed" for "completed") before using the canonical `property` name.
*   **`propertyIndex`**: A mapping from canonical property names to arrays of possible YAML key names.

### `getProperty(page: Record<string, any>, property: keyof typeof propertyIndex): any`

*   **Purpose**: Gets a property from a frontmatter-like object (`page`), trying various known key names for that property from `propertyIndex`.

## Data Types and Interfaces

*   **`TaskProps`**: The central internal data structure for tasks. While not defined in this file, it's heavily used and includes fields like `id`, `title`, `originalTitle`, `originalText`, `scheduled`, `due`, `priority`, `duration`, `completed`, `status`, `tags`, `notes`, `path`, `position`, `children`, `page`, `fieldFormat`, etc.
*   **`FieldFormat`**: An interface `{ main: 'simple' | 'tasks' | 'kanban' | 'dataview' | 'full-calendar', reminder: 'tasks' | 'native' | 'kanban', scheduled: 'kanban' | 'default' }` describing the detected metadata syntaxes.
*   Relies on Dataview types: `STask`, `Literal`, `PageMetadata`.
*   Relies on Luxon types: `DateTime`, `Duration`.

## Interactions

*   **`src/app/store.ts` (`getters`)**: Used by `taskToText` to get `dailyNoteInfo`.
*   **`src/types/enums.ts`**: Uses various enums and mappings like `RESERVED_FIELDS`, `TaskPriorities`, `TasksEmojiToKey`, `keyToTasksEmoji`, `priorityKeyToNumber`, `priorityNumberToKey`, `priorityNumberToSimplePriority`, `simplePriorityToNumber`.
*   **`src/services/util.ts`**: Uses utility functions like `hasPriority`, `isDateISO`, `parseDateFromPath`, `parseFileFromPath`, `toISO`.

This service is fundamental for interoperability, allowing Time Ruler to understand and modify task data written in different common Obsidian styles. Its accuracy in parsing and formatting is key to reliable plugin behavior.
