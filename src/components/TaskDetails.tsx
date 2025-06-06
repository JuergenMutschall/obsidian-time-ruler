import React from 'react';
import { TaskProps, TaskPriorities, priorityNumberToSimplePriority } from '../types'; // Assuming types are in a 'types' folder at root or similar
import Logo from './Logo'; // Assuming Logo is in the same directory
import { DateTime } from 'luxon';
import { DraggableAttributes } from '@dnd-kit/core';
import { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';

export interface TaskDetailsProps {
  task: TaskProps;
  startISO?: string; // Used for calculating due date difference
  hasLengthDrag: boolean;
  dragging?: boolean;

  // Length Draggable Props
  setLengthNodeRef?: (node: HTMLElement | null) => void;
  lengthAttributes?: DraggableAttributes;
  lengthListeners?: SyntheticListenerMap;

  // Deadline Draggable Props
  setDeadlineNodeRef?: (node: HTMLElement | null) => void;
  deadlineAttributes?: DraggableAttributes;
  deadlineListeners?: SyntheticListenerMap;
}

const TaskDetails: React.FC<TaskDetailsProps> = (props) => {
  const {
    task,
    startISO,
    hasLengthDrag,
    dragging,
    setLengthNodeRef,
    lengthAttributes,
    lengthListeners,
    setDeadlineNodeRef,
    deadlineAttributes,
    deadlineListeners,
  } = props;

  if (dragging) {
    // Based on original Task.tsx, this section is not rendered when dragging
    return null;
  }

  return (
    <>
      {/* This first div for priority and reminder was part of the same flex container as TaskTitle in original */}
      {/* It's being separated here. The parent in Task.tsx will need to ensure correct flex layout. */}
      {/* For now, wrapping with a fragment, assuming Task.tsx will handle overall layout of TaskTitle, grow div, and TaskDetails */}

      {/* Section for Priority and Reminder */}
      <div className="h-line w-fit items-center space-x-1 font-menu child:my-1 justify-end flex">
        {task.priority !== TaskPriorities.DEFAULT && (
          <div className='task-priority whitespace-nowrap rounded-full px-1 font-menu text-xs font-bold text-accent'>
            {priorityNumberToSimplePriority[task.priority]}
          </div>
        )}
        {!task.completed && task.reminder && (
          <div className='task-reminder ml-2 flex items-center whitespace-nowrap font-menu text-xs text-normal'>
            <Logo src='alarm-clock' className='mr-1' />
            <span>{`${DateTime.fromISO(task.reminder.slice(0, 10)).toFormat('M/d')}${task.reminder.slice(10)}`}</span>
          </div>
        )}
      </div>

      {/* Section for Length and Due Date Draggables */}
      {/* This div was also part of the same flex container in original Task.tsx */}
      <div className="flex h-full"> {/* This div was immediate sibling to priority/reminder block in original */}
        {hasLengthDrag && (
          <div
            className={`mt-1 task-duration cursor-ns-resize whitespace-nowrap font-menu text-xs text-accent group-hover:bg-selection group-hover:rounded-full group-hover:px-2 ${
              !task.duration ? 'hidden group-hover:block' : ''
            }`}
            ref={setLengthNodeRef}
            {...lengthAttributes}
            {...lengthListeners}
          >
            {!task.duration
              ? 'length'
              : `${task.duration?.hour ? `${task.duration?.hour}h` : ''}${
                  task.duration?.minute ? `${task.duration?.minute}m` : ''
                }`}
          </div>
        )}

        {!task.completed && ( // This condition was around the due date draggable
          <div
            ref={setDeadlineNodeRef}
            {...deadlineAttributes}
            {...deadlineListeners}
            className={`mt-1 task-due ml-2 cursor-grab whitespace-nowrap font-menu text-xs text-accent hover:underline group-hover:bg-selection group-hover:rounded-full group-hover:px-2 ${
              !task.due ? 'hidden group-hover:block' : ''
            }`}
          >
            {!task.due
              ? 'due'
              : `${Math.ceil(
                  DateTime.fromISO(task.due)
                    .diff(
                      DateTime.fromISO(
                        (startISO ?? new Date().toISOString().slice(0, 10)) as string
                      )
                    )
                    .shiftTo('days').days
                )}d`}
          </div>
        )}
      </div>

      {/* Standalone reminder that was outside the !dragging block in Task.tsx, but seems contextually part of details */}
      {/* If this was truly meant to be outside !dragging, it should not be here. */}
      {/* Original: {!task.completed && task.reminder && !dragging && (...)} */}
      {/* The `!dragging` part is handled by the component's top-level return null. So this is fine. */}
      {!task.completed && task.reminder && (
         <div className='task-reminder ml-2 flex items-center whitespace-nowrap font-menu text-xs text-normal'>
           <Logo src='alarm-clock' className='mr-1' />
           <span>{`${DateTime.fromISO(task.reminder.slice(0, 10)).toFormat('M/d')}${task.reminder.slice(10)}`}</span>
         </div>
       )}
    </>
  );
};

export default TaskDetails;
