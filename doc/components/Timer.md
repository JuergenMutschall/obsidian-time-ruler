# Timer Component (`src/components/Timer.tsx`)

## Purpose

The `Timer` component provides an interactive timer and stopwatch functionality within the Time Ruler plugin. It allows users to:
*   Start a countdown timer for a specified duration (in minutes or HH:MM format).
*   Start a stopwatch that counts up from zero.
*   Play/Pause the active timer or stopwatch.
*   Reset the timer/stopwatch.
*   Add or subtract 5 minutes from the currently running timer/stopwatch.
*   Visually indicates progress with a colored bar and displays time in HH:MM:SS format.
*   Changes background color if the timer runs into negative (overtime).

## Props

The `Timer` component does not accept any direct props. Its behavior and initial state are primarily controlled by global state via `useAppStore`.

## State (managed via `useAppStore` and local state/refs)

### Global State (from `useAppStore`):

*   **`timer.negative`** (`boolean`): True if the timer has expired and is now counting up in "overtime."
*   **`timer.startISO`** (`string | null`): The ISO string representing the expiry timestamp for a countdown timer, or the starting point for a stopwatch.
*   **`timer.maxSeconds`** (`number | null`): The total duration in seconds for a countdown timer. If `null`, it's in stopwatch mode.
*   **`timer.playing`** (`boolean`): True if the timer or stopwatch is currently running.
*   **`settings.muted`** (`boolean`): If true, sounds for start/pause are disabled.
*   **`settings.borders`** (`boolean`): If true, applies border styling to the timer container.

### Local State and Refs:

*   **`pauseExpiration`**: `useRef(true)`. A flag to prevent the `onExpire` callback from `useTimer` from running prematurely during initial setup or resets.
*   **`timer`** (from `useTimer` hook): An object from `react-timer-hook` managing the countdown timer. Includes:
    *   `seconds`, `minutes`, `hours`, `totalSeconds`
    *   `start()`, `pause()`, `resume()`, `restart()`
    *   `isRunning`
*   **`stopwatch`** (from `useStopwatch` hook): An object from `react-timer-hook` managing the stopwatch. Includes:
    *   `seconds`, `minutes`, `hours`, `totalSeconds`
    *   `start()`, `pause()`, `reset()`
    *   `isRunning`
*   **`input`**: `useState('')`. Stores the user's input for setting a new countdown timer duration (e.g., "10" for 10 minutes, or "1:30" for 1 hour 30 minutes).
*   **`width`**: Local number, calculated percentage for the progress bar width.

## Functionality

1.  **Initialization (`useEffect` hooks)**:
    *   Sets `pauseExpiration.current = false` after initial mount.
    *   If `startISO` exists in global state:
        *   If it's a timer (`playing && maxSeconds`), restarts the `timer` hook with the `startISO` (expiry).
        *   If it's a stopwatch (`playing`), calculates the offset from `startISO` and resets the `stopwatch` hook to that offset and starts it.
    *   Another `useEffect` syncs the `playing` state from the hooks (`timer.isRunning` or `stopwatch.isRunning`) back to the global store (`setters.patchTimer({ playing: newPlaying })`).

2.  **Starting the Timer/Stopwatch (`start` function)**:
    *   Sets global `timer.negative` to `false`.
    *   If `input` is empty:
        *   Sets global `timer.maxSeconds = null` (stopwatch mode).
        *   Sets global `timer.startISO` to current time.
        *   Starts the `stopwatch` hook.
    *   If `input` has a value:
        *   Parses `input` (either as minutes or HH:MM).
        *   Calculates the `endDate` based on parsed hours/minutes.
        *   Restarts the `timer` hook with this `endDate`.
        *   Sets global `timer.maxSeconds` and `timer.startISO` accordingly.
    *   Calls `playSound()`.

3.  **Resetting (`reset` function)**:
    *   Sets global `timer.negative` to `false`.
    *   If it was a timer (`maxSeconds`), sets global `timer.maxSeconds = null` and restarts the `timer` hook (effectively clearing it).
    *   If it was a stopwatch, resets the `stopwatch` hook.
    *   Clears the `input` field.

4.  **Adding/Subtracting Time (`addTime` function)**:
    *   Takes `minutes` (e.g., 5 or -5) as an argument.
    *   If it's a timer (`maxSeconds`):
        *   Calculates new expiry time by adding/subtracting `minutes` from current timer's effective end.
        *   Restarts `timer` hook with the new expiry.
        *   Updates global `timer.maxSeconds` and `timer.startISO`.
    *   If it's a stopwatch:
        *   Calculates new offset time by adding/subtracting `minutes` from current stopwatch's effective start.
        *   Resets `stopwatch` hook with the new offset.
        *   Updates global `timer.startISO`.

5.  **Toggling Play/Pause (`togglePlaying` function)**:
    *   If `currentTime <= 0` (timer/stopwatch is at zero or not set), calls `start()`.
    *   Otherwise, toggles play/pause state of the appropriate hook (`timer` or `stopwatch`).
    *   Calls `playSound()`.

6.  **Sound (`playSound` function)**:
    *   If not currently `playing` (i.e., about to start) and not `muted`, plays `sounds.start`.

7.  **Input Handling (`change` function for input field)**:
    *   Allows only numbers and optionally a single colon (for HH:MM format) in the input field.

8.  **Rendering**:
    *   **Container**: A `div` whose background changes to reddish if `negative` is true (timer overtime). Applies borders if `settings.borders` is true.
    *   **Progress Bar**: An absolutely positioned `div` whose `width` is animated based on `currentTime` relative to `maxSeconds` (for timer) or `currentTime % 60` (for stopwatch, cycling every minute). Color changes if `negative`.
    *   **Input/Display Area**:
        *   If not `playing` and `currentTime <= 0`: Shows an `input` field for setting timer duration. Pressing 'Enter' calls `start()`.
        *   Otherwise: Displays the time in `H:MM:SS` format (hours shown if > 0). Prepends "-" if `negative`.
    *   **Buttons**:
        *   Play/Pause `[Button](./Button.md)`.
        *   If `playing`: "+5" and "-5" `[Button](./Button.md)`s to call `addTime(5)` and `addTime(-5)`.
        *   If not `playing` and `currentTime > 0`: Reset `[Button](./Button.md)`.

## Interactions with Other Components and Services

*   **[`src/app/store.ts`](../../store.md) (`setters`, `useAppStore`)**:
    *   Reads `timer` state (`negative`, `startISO`, `maxSeconds`, `playing`).
    *   Reads `settings.muted` and `settings.borders`.
    *   Uses `setters.patchTimer` to update the global timer state.
*   **`src/assets/assets.ts` (`sounds`)**:
    *   Uses `sounds.start.play()` for audio feedback.
*   **`react-timer-hook` (`useTimer`, `useStopwatch`)**:
    *   Core dependency for the underlying timer and stopwatch logic. The component acts as a UI and state synchronizer for these hooks.
*   **Child Components**:
    *   `[Button](./Button.md)`: Used for all interactive buttons (play/pause, +/-5 mins, reset).
*   **Parent Components**:
    *   Likely rendered in a persistent part of the UI, such as `[Day.tsx](./Day.md)` when `isNow` is true, or a global application header/sidebar.

The `Timer` component provides a feature-rich and well-integrated timing utility for users, leveraging `react-timer-hook` for robust core logic and `useAppStore` for persistent state across the plugin.
