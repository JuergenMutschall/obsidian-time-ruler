# TaskCheckbox Component (`src/components/TaskCheckbox.tsx`)

## Purpose

The `TaskCheckbox` component is a specialized UI element used to represent the status of a task (e.g., completed, pending, or other states). It provides a visual checkbox-like interface that users can interact with to change the task's completion status. It leverages the `Button` component for its underlying structure and interactivity.

## Props

The component accepts the following props:

*   **`completed`** (`boolean`): Indicates whether the task is marked as completed. This influences the component's appearance (e.g., background color).
*   **`status`** (`string`): A string representing the current status of the task. This is displayed inside the checkbox, unless the status is 'x' (which typically signifies completion and thus shows no text). It's also used for the `data-task` attribute.
*   **`isLink`** (`boolean`): A boolean flag that, if true, applies specific styling to make the checkbox smaller, suitable for use in link-like contexts.
*   **`isMobile`** (`boolean`): A boolean flag that, if true, applies styling to make the checkbox larger for better touch interaction on mobile devices. If `isLink` is true, `isMobile`'s effect on size might be overridden or combined.
*   **`onComplete`** (`() => void`): A callback function that is executed when the checkbox is clicked. This function is typically used to toggle the task's completion state.

## Functionality

*   **Rendering**:
    *   Renders a `Button` component as its root.
    *   The `Button` is styled with a base set of classes: `task-list-item-checkbox flex flex-none items-center justify-center rounded-checkbox border border-solid border-faint p-0 text-xs shadow-none hover:border-normal cursor-pointer`.
    *   Dynamically adjusts its size based on `isLink` and `isMobile` props:
        *   If `isLink` is true: `h-2 w-2`.
        *   Else if `isMobile` is true: `h-5 w-5`.
        *   Otherwise: `h-4 w-4`.
    *   Dynamically changes its background color based on the `completed` prop:
        *   If `completed` is true: `bg-faint`.
        *   Otherwise: `bg-transparent`.
    *   Sets a `data-task` attribute on the `Button`. The value is the `status` prop, unless `status` is a single space (" "), in which case the attribute value is an empty string.
    *   Displays the `status` string inside the button, but renders nothing (`<></>`) if `status` is 'x' (indicating a completed state where an icon or change in background is usually sufficient).
*   **Event Handling**:
    *   `onPointerDown`: The event handler is set to `() => false`. This is a specific interaction design choice to prevent drag initiation when a user clicks down on the checkbox, ensuring that a click is registered as a click and not a drag attempt.
    *   `onClick`: When the `Button` is clicked, the `onComplete` callback function (passed via props) is invoked.

## State

The `TaskCheckbox` component is a stateless functional component. Its visual appearance and behavior are entirely determined by the props passed to it. It does not manage any internal state.

## Interactions with Other Components and Services

*   **`Button` Component (`./Button.tsx`)**: The `TaskCheckbox` component uses the `Button` component as its core building block, delegating rendering and click handling to it.
*   It does not directly interact with other services or global state stores. Its primary interaction is with its parent component via the `onComplete` callback to signal user interaction.

## Usage Example

```tsx
import TaskCheckbox from './TaskCheckbox';

// Example of a pending task on a desktop view
<TaskCheckbox
  completed={false}
  status=" " // Typically an empty space for pending tasks
  isLink={false}
  isMobile={false}
  onComplete={() => console.log('Task toggled')}
/>

// Example of a completed task, styled as a link
<TaskCheckbox
  completed={true}
  status="x" // 'x' for completed, text will be hidden
  isLink={true}
  isMobile={false}
  onComplete={() => console.log('Task toggled')}
/>

// Example of a task with a custom status on a mobile view
<TaskCheckbox
  completed={false}
  status="P" // "P" for Pending, or any other status character
  isLink={false}
  isMobile={true}
  onComplete={() => console.log('Task toggled')}
/>
```
This component is designed to be a clear and interactive way to manage task states within the application.
