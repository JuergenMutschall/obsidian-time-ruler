# App Component (`src/components/App.tsx`)

## Purpose

The `App` component serves as the primary root UI component for the Time Ruler plugin after the initial view setup in `src/index.tsx`. It orchestrates the main layout, sets up the drag-and-drop context, and renders the core visual elements of the Time Ruler interface, such as the header, the timeline, and search functionality. It also manages the initial loading of data and settings by delegating to the `AppInitializer` component.

## Props

*   **`apis: Required<AppState['apis']>`**:
    *   An object containing initialized instances of `ObsidianAPI` and `CalendarAPI`.
    *   These APIs are crucial for all data interactions (reading/writing tasks, fetching calendar events, accessing plugin settings).
    *   The `App` component receives these from `TimeRulerView` and immediately passes them to the Zustand store via the `reload` function (which is then called by `AppInitializer`).

## State Management

The `App` component itself manages minimal local state, primarily related to UI presentation that isn't global or derived from global state.

*   **`weeksShownState: number` (via `useState(1)`)**:
    *   Represents the number of weeks the `TimelineView` should display.
    *   Managed by `AppInitializer` and `TimeRulerHeader` through the `setWeeksShown` callback. `App` itself doesn't directly modify this but uses its value for calculations.

It heavily relies on the global Zustand store (`useAppStore`, `getters`, `setters`) for most of its data and UI logic. Key store states utilized include:

*   **`settings`**: Various plugin settings that affect rendering and behavior (e.g., `viewMode`, `dayStartEnd`, `showCompleted`, `borders`).
*   **`showingPastDates`**: Boolean to control if past dates are displayed.
*   **`dragData` (via `useAppStoreRef`)**: Data for the currently dragged item, used by `DragOverlay`.
*   **`searchStatus`**: Boolean to control the visibility of the `Search` component.
*   **`childWidth`**: True width of child columns, used by `DragOverlay` for correct sizing.
*   **`dragOffset`**: Offset for positioning the task drag overlay.

## Core Functionalities

### 1. Initialization and Data Loading (`reload` function)

*   The `reload` async function is defined within `App` and is responsible for the primary data and settings hydration sequence.
*   **Passed to `AppInitializer`**: `AppInitializer` calls `reload` on its first mount.
*   **Dataview Check**: Ensures the Dataview plugin is available and its index is ready before proceeding.
*   **Settings Hydration**:
    *   Calls `apis.obsidian.reload()` to ensure the `ObsidianAPI` service has the latest plugin settings.
    *   Fetches `dailyNoteInfo` using `getDailyNoteInfo()`.
    *   Constructs a `settings` object for the store by calling `apis.obsidian.getSetting()` for each relevant setting.
    *   Updates the Zustand store with `apis`, `dailyNoteInfo`, and `settings` using `setters.set()`.
*   **Data Fetching**:
    *   Triggers `apis.calendar.loadEvents()` to load calendar events into the store.
    *   Triggers `apis.obsidian.loadTasks('', getters.get('showingPastDates'))` to load tasks from the vault into the store.

### 2. Main UI Structure and Layout

*   The component returns a main `div` with `id='time-ruler'`. This `div` acts as the container for the entire Time Ruler UI and is styled for flex layout and background color.
*   It renders the following key child components in order:
    *   **`AppInitializer`**: Handles initial setup, data loading via `reload`, and manages `weeksShownState`.
    *   **`DragOverlay`**: Provided by `@dnd-kit/core`, renders a preview of the item being dragged. Its content is determined by `getDragElement()`.
    *   **`TimeRulerHeader`**: The header section of the Time Ruler, containing navigation controls, view mode toggles, and other actions. It receives props like `times` (simplified), `datesShown`, `weeksShownState`, `setWeeksShown`, `setupStore` (the `reload` function), `showingPastDates`, and `timelineViewRef`.
    *   **`TimelineView`**: The core component that renders the actual timeline of days, tasks, and events. It receives `times` (the calculated time segments), `calendarMode`, `childWidth`, `childClass`, `showingPastDates`, and `borders`.
    *   **`Search`**: Conditionally rendered when `searchStatus` from the store is `true`.

### 3. Drag and Drop Context (`@dnd-kit/core`)

*   `App` wraps its main content with `DndContext` to enable drag-and-drop interactions.
*   **Configuration**:
    *   `onDragStart`: Set to `onDragStart` (imported from `src/services/dragging.ts`).
    *   `onDragEnd`: Set to a callback that calls `onDragEnd(event, activeDragRef)` (from `src/services/dragging.ts`), where `activeDragRef` is a ref to the current `dragData` from the store.
    *   `onDragCancel`: Clears `dragData` in the store.
    *   `collisionDetection`: Uses `pointerWithin`.
    *   `measuring`: Configured with custom `measure` functions for `draggable` and `dragOverlay` that account for the `timeRulerContainerRef`'s bounding box. This ensures items are measured relative to the TimeRuler container.
    *   `sensors`: Configures `PointerSensor`, `MouseSensor` (for desktop), and `TouchSensor` (for mobile) with specific activation constraints (delay, tolerance).
    *   `autoScroll`: Explicitly set to `false` for the `DndContext` itself, as auto-scrolling is handled by the `useAutoScroll` hook internally or within `TimelineView`.
*   **`getDragElement()`**: A helper function that returns the appropriate React element to render in the `DragOverlay` based on `activeDrag.dragType` (e.g., `<Task>`, `<Group>`, `<Block>`).

### 4. Timeline Data Calculation (`times` array)

*   The `App` component calculates the `times` array (`ActualTimesType`), which defines the segments to be rendered by `TimelineView`.
*   This array includes:
    *   An initial `{ type: 'unscheduled' }` segment.
    *   A "current" segment representing today (or the past leading up to "now" if `showingPastDates` is true). Its `startISO` and `endISO` are dynamically calculated based on `nowForTimes` (current moment), `today` (start of today), `dayStart` (from settings), and `showingPastDates`.
    *   A series of subsequent (or preceding, if `showingPastDates`) day segments, generated using `_.range()` and `today.plus({ days: i, hours: dayStart })`.
*   The `times` array is reversed if `showingPastDates` is true.

### 5. Child Component Width Calculation

*   Uses the `useChildWidth()` custom hook (from `src/services/util.ts`) to determine `childWidth` (number of logical columns, e.g., 1 for day view, 7 for week view) and `childClass` (CSS class for column width). This is passed to `TimelineView`.
*   The `trueChildWidth` from the store (which is set by `useChildWidth` via a `useEffect` calling `setters.set`) is used for sizing the `DragOverlay`.

## Component Interactions

*   **`AppInitializer`**:
    *   Receives the `reload` function, `weeksShownState`, `setWeeksShown`, `showingPastDates`, `searchWithinWeeks`, `calendarMode`, and `timelineViewRef`.
    *   Responsible for triggering the initial `reload` and managing effects related to `weeksShownState` changes (which might trigger further data loads).
*   **`TimeRulerHeader`**:
    *   Receives a simplified `times` array, `datesShown`, `weeksShownState`, `setWeeksShown`, the `reload` function (as `setupStore`), `showingPastDates`, and `timelineViewRef`.
    *   Handles user interactions for navigation and view adjustments.
*   **`TimelineView`**:
    *   Receives the fully calculated `times` array, `calendarMode`, `childWidth`, `childClass`, `showingPastDates`, and `borders`.
    *   Responsible for rendering the main scrollable timeline.
    *   Manages its own internal scrolling logic and virtualization (previously, some of this might have been in `App.tsx`).
*   **`Search`**:
    *   Rendered conditionally based on `searchStatus` from the store.
*   **Zustand Store (`src/app/store.ts`)**:
    *   `App` reads various state slices (settings, UI flags, drag data).
    *   The `reload` function (called by `AppInitializer`) is a primary mechanism for populating the store with `apis`, `settings`, and initial `tasks` and `events`.
    *   Drag event handlers (`onDragStart`, `onDragEnd` from `dragging.ts`) interact heavily with the store to update `dragData` and task data (`setters.patchTasks`).
*   **Services**:
    *   `src/services/dragging.ts`: Provides `onDragStart` and `onDragEnd` handlers for `DndContext`.
    *   `src/services/obsidianApi.ts` & `src/services/calendarApi.ts`: Instances are passed via props and set into the store by `reload`. Their methods are then called by `reload` itself or by other actions (like those in `dragging.ts`).
    *   `src/services/util.ts`: Uses `getToday`, `toISO`, `useChildWidth`.
    *   `src/services/autoScroll.ts`: The `useAutoScroll()` hook is called to enable auto-scrolling during drag operations within relevant containers.

## Key `useRef` Hooks

*   **`timeRulerContainerRef = useRef<HTMLDivElement>(null)`**:
    *   Attached to the main `div#time-ruler`.
    *   Used by the `measuringConfig` for `@dnd-kit/core` to calculate drag item dimensions relative to this container.
*   **`timelineViewRef = useRef<TimelineViewHandle>(null)`**:
    *   A ref to the `TimelineView` component instance.
    *   Allows parent components (`App`, `AppInitializer`, `TimeRulerHeader`) to call imperative methods on `TimelineView` (e.g., for scrolling to specific sections via `timelineViewRef.current.scrollToSection()`).

The `App.tsx` component has been refactored to delegate many of its previous responsibilities to child components like `AppInitializer` and `TimelineView`, making it more focused on overall structure, DND context, and initial setup coordination.
