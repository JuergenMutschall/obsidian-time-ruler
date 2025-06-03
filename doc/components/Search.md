# Search Component (`src/components/Search.tsx`)

## Purpose

The `Search` component provides a modal-based search interface for finding tasks within the Time Ruler plugin. Users can type search queries to filter tasks based on their title, path (or folder for page-tasks), tags, notes, priority, and status. Selecting a search result will typically close the search modal and focus the selected task in the main Time Ruler view.

## Props

The `Search` component does not accept any direct props. Its behavior is controlled by global state.

## State (managed via `useAppStore` and local `useState`)

*   **`tasks`**: Global state from `useAppStore(state => state.tasks)`. The main collection of all tasks.
*   **`showingPastDates`**: Global state from `useAppStore(state => state.showingPastDates)`. Used to filter tasks based on completion status relative to whether past dates are shown.
*   **`showCompleted`**: Global state from `useAppStore(state => state.settings.showCompleted)`. If true, completed tasks are included in the search regardless of `showingPastDates`.
*   **`allTasks`**: Local state, memoized using `useMemo`. This is a processed list derived from `tasks`.
    *   It filters tasks based on `showCompleted` and `showingPastDates` settings.
    *   Each item in `allTasks` is a tuple: `[string[], TaskProps]`.
        *   The `string[]` contains various text fields associated with the task (title, path/folder, tags, notes, priority, status) that are used for matching against the search query.
        *   `TaskProps` is the original task object.
    *   This list is sorted by task `id`.
*   **`search`**: Local string state, holds the current text entered by the user in the search input.
*   **`searchExp`**: Local `RegExp` object, derived from `search` state using `convertSearchToRegExp`. This is the regular expression used for matching.
*   **`splitSearch`**: Local array of characters, `search.split('')`. Used for a custom sorting algorithm.
*   **`foundTasks`**: Local array, derived from `allTasks`.
    *   Filters `allTasks` where at least one of the `string[]` matches the `searchExp`.
    *   Sorts the filtered results using a custom algorithm that prioritizes tasks where search characters appear earlier and in sequence in the task's title. The sort score is `notFoundInTitle * 25 + totalCharacterIndexInTitle`.
*   **`input`**: `useRef` for the search `input` element, used to focus it on component mount.

## Functionality

1.  **Modal Rendering**:
    *   Uses `createPortal` to render the search interface directly into the `.app-container` element of the Obsidian app. This allows it to overlay the entire UI.
    *   The modal has a dimming background (`modal-bg`). Clicking this background closes the search modal by setting `searchStatus: false` in the global store.
2.  **Search Input**:
    *   An `input` element for users to type their search query.
    *   `value` is bound to the `search` state.
    *   `onChange` updates the `search` state.
    *   `onKeyDown`:
        *   'Escape': Closes the search modal (`setters.set({ searchStatus: false })`).
        *   'Enter': If `foundTasks` has results, it calls `openTaskInRuler` with the ID of the first found task (`foundTasks[0][1].id`) and then closes the modal.
    *   The input field is automatically focused when the component mounts (`useEffect` with `input.current?.focus()`).
3.  **Task Filtering and Sorting**:
    *   `allTasks` is prepared by filtering and mapping global `tasks` based on visibility settings (`showCompleted`, `showingPastDates`).
    *   `foundTasks` are derived by filtering `allTasks` against `searchExp`.
    *   A custom sorting logic is applied to `foundTasks` to rank results. It calculates a score based on how many characters of the search query are found in the task's title and their position. Tasks with more matched characters appearing earlier in the title get a lower (better) score.
4.  **Displaying Results**:
    *   Maps over `foundTasks` to display each result.
    *   Each result is a `div` with class `clickable-icon suggestion-item mod-complex`.
    *   Clicking a result calls `openTaskInRuler(task.id)` and closes the search modal.
    *   Displays the task `title`.
    *   Displays the task's path (or folder for page-tasks) in a `suggestion-aux` element, formatted to remove ".md".

## Interactions with Other Components and Services

*   **`src/app/store.ts` (`setters`, `useAppStore`)**:
    *   Reads `tasks`, `showingPastDates`, and `settings.showCompleted` to get and filter the data to be searched.
    *   Uses `setters.set({ searchStatus: false })` to close the search modal (which is presumably opened by setting `searchStatus: true` elsewhere in the application, likely in `App.tsx` or a button handler).
*   **`src/services/obsidianApi.ts` (`openTaskInRuler`)**:
    *   Called when a search result is selected (either by click or Enter key) to navigate to and highlight the task in the main Time Ruler view.
*   **`src/services/util.ts`**:
    *   `convertSearchToRegExp`: To convert the user's search string into a regular expression for matching.
    *   `parseFolderFromPath`: Used to get the folder path for tasks that are pages (`task.page` is true).
*   **`src/types/enums.ts` (`priorityNumberToKey`)**:
    *   Used to convert numeric task priority to its string representation for inclusion in the searchable strings.
*   **DOM (via `createPortal`)**:
    *   Renders itself into `document.querySelector('.app-container')`, which is a standard Obsidian DOM element. This is typical for modal implementations in Obsidian plugins.

The `Search` component provides a powerful and quick way for users to locate specific tasks within a potentially large dataset, integrating smoothly with the main application flow by highlighting selected tasks in the Time Ruler.
