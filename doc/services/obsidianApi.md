# ObsidianAPI Service (`src/services/obsidianApi.ts`)

## Purpose

The `obsidianApi.ts` service is a cornerstone of the Time Ruler plugin, providing a comprehensive class `ObsidianAPI` and several utility functions to interact with the Obsidian application, its vault, metadata, and the Dataview plugin. It encapsulates logic for task management (CRUD operations), file operations, settings access, and UI interactions like opening tasks or scrolling to them.

## `ObsidianAPI` Class

This class extends Obsidian's `Component` class.

### Constructor

*   **`constructor(settings: ObsidianAPI['settings'], setSetting: ObsidianAPI['setSetting'], app: App)`**:
    *   `settings`: The Time Ruler plugin's settings object.
    *   `setSetting`: A callback function to update parts of the plugin's settings.
    *   `app`: The Obsidian `App` instance.
    *   Initializes `dv` (Dataview API instance).

### Properties

*   **`loadedFiles: Record<string, [TaskProps](../../types.md#taskprops)[]>`**: Seems intended to cache tasks by file, though not explicitly used in the provided snippet for caching.
*   **`excludePaths?: RegExp`**: A RegExp compiled from Obsidian's global ignore filters to exclude certain paths.
*   **`dailyNotePath: RegExp`**: (Not explicitly initialized in constructor but expected for daily note logic).
*   **`settings: [TimeRulerPlugin['settings']](../../types.md#timerulersettings)`**: Reference to plugin settings.
*   **`app: App`**: Reference to Obsidian `App`.
*   **`setSetting: (settings: Partial<[TimeRulerPlugin['settings']](../../types.md#timerulersettings)>) => void`**: Function to save settings.

### Methods

#### Settings and Utilities

*   **`getSetting<T extends keyof [TimeRulerPlugin['settings']](../../types.md#timerulersettings)>(setting: T)`**: Retrieves a specific setting value.
*   **`playComplete()`**: Plays a "pop" sound if not muted.
*   **`reload()`**: Reloads `excludePaths` RegExp from Obsidian's config.

#### Task Loading and Searching

*   **`searchTasks(path: string, dailyNoteInfo: [AppState](../../store.md#appstate-interface)['dailyNoteInfo'], completed: boolean, dateBounds: [string, string]): [TaskProps[]](../../types.md#taskprops)`**:
    *   Performs a Dataview query (`dv.pages().file.tasks` and `dv.pages()`) based on the provided `path`, global plugin `settings.search`, completion status, custom status settings, date bounds, and exclusion paths.
    *   Applies an optional custom `settings.filterFunction` and `settings.taskSearch`.
    *   Converts Dataview `STask` objects and pages to `[TaskProps](../../types.md#taskprops)` using `textToTask` and `pageToTask`.
    *   Processes task children and parent relationships.
    *   Returns an array of `[TaskProps](../../types.md#taskprops)`.
*   **`forgetTasks(path: string)`**: Removes tasks associated with a given file path from the global store. Used during file renames.
*   **`loadTasks(path: string, completed: boolean)`**:
    *   Ensures Dataview index is initialized.
    *   Calculates `dateBounds` based on current view settings.
    *   Calls `searchTasks` and then `updateTasks` with the results.
*   **`updateTasks(processedTasks: [TaskProps[]](../../types.md#taskprops), path: string, completed: boolean)`**:
    *   Updates the global task list ([`getters.get('tasks')`](../../store.md#getters)) with `processedTasks`.
    *   Adds newly found file paths to `settings.fileOrder` in sorted order.
    *   Removes tasks from the store that were in the given `path` but are no longer present in `processedTasks` (handles deletions).
    *   Updates existing tasks if they have changed.
    *   Re-evaluates task queries (`task.query`) and updates `queryChildren` and `queryParent` relationships.
    *   Updates the global store via [`setters.set({ tasks: updatedTasks, fileOrder: this.settings.fileOrder })`](../../store.md#setters-actions).

#### File and Task Manipulation

*   **`updateFileOrder(file: string, before: string)`**: Reorders `file` before `before` in `settings.fileOrder` and updates global state.
*   **`async moveTask(task: [TaskProps](../../types.md#taskprops), selectedHeading: string)`**:
    *   Moves a task (and its subtasks from the file) from its original path/position to a new `selectedHeading` (which can be a file or file#heading).
    *   Reads the source file, removes the task lines.
    *   Finds the target position in the destination file (creating it if necessary) using `findPosition`.
    *   Inserts the task lines into the destination file.
    *   Calls `openTask` to navigate to the moved task.
*   **`createNewTask(newTask: Partial<[TaskProps](../../types.md#taskprops)>, selectedHeading: string | null, dailyNoteInfo: [AppState](../../store.md#appstate-interface)['dailyNoteInfo'])`**:
    *   Determines the target path: if `selectedHeading` is "Daily" or null, uses the daily note path based on `newTask.scheduled` or today. Otherwise, uses `selectedHeading`.
    *   Calls `createTaskInPath`.
*   **`async createFileFromPath(path: string): Promise<TFile>`**:
    *   Ensures a file exists at the given path (fileName part of `path`). If not, creates it.
    *   If it's a daily note and a template is configured, uses the template content.
    *   Returns the `TFile` object.
*   **`private async findPosition(path: string): Promise<{ position: IPosition; filePath: string }>`**:
    *   Determines the correct line number within a file (specified by `path`, which can include a #heading) to insert a new task.
    *   Considers `settings.addTaskToEnd` to place tasks at the end of a heading section or file.
    *   Handles frontmatter to place tasks after it.
    *   Returns the `position` (start and end line/col) and the actual `filePath`.
*   **`private async createTaskInPath(path: string, dropData: Partial<[TaskProps](../../types.md#taskprops)>, completed: boolean = false)`**:
    *   Uses `findPosition` to get the insertion point.
    *   Creates a default `[TaskProps](../../types.md#taskprops)` object, merging in `dropData`.
    *   Calls `saveTask` to write it to the file.
    *   Opens the new task using `openTask`.
    *   Clears `newTask` data from the store.
*   **`private async getFile(path: string): Promise<TFile | undefined>`**: Retrieves a `TFile` object, creating the file if it doesn't exist.
*   **`async deleteTasks(ids: string[])`**:
    *   Deletes tasks specified by `ids` from their respective files.
    *   Groups tasks by file path for efficient modification.
    *   Removes task lines from file content.
    *   Handles unsetting `queryParent` for tasks that were children of a deleted query task.
    *   Updates the global store.
*   **`async saveTask(task: [TaskProps](../../types.md#taskprops), newTask?: boolean)`**:
    *   Saves a single task to its file.
    *   If `task.page` is true, updates frontmatter using `app.fileManager.processFrontMatter` and `taskToPage`.
    *   Otherwise, reads the file, and either inserts a new line (if `newTask`) or replaces the existing line for the task using `taskToText`.
    *   Modifies the file via `app.vault.modify`.

#### Event Handling and Lifecycle

*   **`async onload()`**:
    *   Registers event listeners for:
        *   `app.workspace.on('layout-change')` and `app.workspace.on('resize')`: Triggers a global state update (`recreateWindow`) which might be used by UI components to re-render/re-measure.
        *   `app.metadataCache.on('dataview:metadata-change')`:
            *   On 'update', calls `loadTasks` for the changed file.
            *   On 'rename', calls `forgetTasks` for the old path and `loadTasks` for the new path.

## Standalone Utility Functions

*   **`async getDailyNoteInfo(): Promise<[AppState](../../store.md#appstate-interface)['dailyNoteInfo'] | undefined>`**:
    *   Reads Obsidian's daily notes configuration (`daily-notes` config file).
    *   Returns an object with `format`, `folder`, and `template` for daily notes. Provides defaults if config is missing.
*   **`async openTask(task: [TaskProps](../../types.md#taskprops))`**:
    *   Opens the task's file using `app.workspace.openLinkText`.
    *   Sets the cursor position to the end of the task in the editor.
    *   Focuses the editor.
    *   On mobile, ensures the mobile navbar is shown.
*   **`openTaskInRuler(id: string)`**:
    *   Finds the task by `id` in the global store.
    *   If the task has a scheduled date that's outside the currently displayed range, it adjusts `showingPastDates` and `searchWithinWeeks` in the store to make it visible.
    *   Calls `scrollToSection` to scroll the timeline view to the task's date section (or 'unscheduled' or 'now').
    *   Uses a retry mechanism (`findTask` with `setTimeout`) to find the task's DOM element (`[data-id="${id}"]`) as it might not be immediately available after view changes.
    *   Scrolls the task element into view and briefly highlights it.

## Data Types and Interfaces

The service makes extensive use of `[TaskProps](../../types.md#taskprops)` (properties of a task) and interacts with Dataview's `STask` and page objects. It also uses an internal `IPosition` like interface for text positions. Many settings types from `[TimeRulerPlugin['settings']](../../types.md#timerulersettings)` and state types from `[AppState](../../store.md#appstate-interface)` are also referenced.

## Interactions

*   **Obsidian App**: Core interactions for file reading/writing (`app.vault`, `app.fileManager`), opening links, editor manipulation, settings.
*   **Dataview Plugin**: Essential for `searchTasks` via the `dv` API object.
*   **Global Store ([`getters`](../../store.md#getters), [`setters`](../../store.md#setters-actions))**: Central to its operation for reading current state and dispatching updates (tasks, file order, UI flags).
*   **[`parser.ts`](./parser.md)**: Uses `pageToTask`, `taskToPage`, `taskToText`, `textToTask`, `getProperty`.
*   **[`util.ts`](./util.md)**: Uses many utility functions like `getHeading`, `getParentScheduled`, `getParents`, `parseDateFromPath`, `parseFileFromPath`, `parsePathFromDate`, `parseTaskDate`, `queryTasks`, `scrollToSection`, `toISO`, `splitHeading`.
*   **`sounds` (from `assets.ts`)**: For playing completion sounds.

This service is the main bridge between the plugin's logic/UI and the Obsidian environment, handling most data persistence and retrieval related to tasks.
