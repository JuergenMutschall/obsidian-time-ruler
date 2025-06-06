import React from 'react';
import { DraggableAttributes } from '@dnd-kit/core';
import { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';

import { TaskProps, TaskPriorities } from '../types'; // Assuming common types are here
import TaskTitle from './TaskTitle';
import TaskDetails from './TaskDetails';
// Logo and DateTime might be needed if TaskDetails props are more granular in future, but for now, they are encapsulated in TaskDetails

export interface TaskContentProps {
  task: TaskProps;
  renderType?: 'deadline';
  isLink: boolean;
  // status: string; // status is part of task object, used by TaskTitle and TaskDetails internally
  lineHeightNormal: string; // For TaskTitle
  onOpenTask: () => void;    // For TaskTitle
  taskPath: string;         // For TaskTitle

  startISO?: string;         // For TaskDetails
  hasLengthDrag: boolean;   // For TaskDetails
  mainTaskDragging?: boolean; // To pass to TaskDetails as 'dragging'

  // Draggable props for the TaskContent itself (the main grab area)
  dndAttributes: DraggableAttributes;
  dndListeners: SyntheticListenerMap;

  // Draggable props for "length" to pass to TaskDetails
  setLengthNodeRef?: (node: HTMLElement | null) => void;
  lengthAttributes?: DraggableAttributes;
  lengthListeners?: SyntheticListenerMap;

  // Draggable props for "deadline" to pass to TaskDetails
  setDeadlineNodeRef?: (node: HTMLElement | null) => void;
  deadlineAttributes?: DraggableAttributes;
  deadlineListeners?: SyntheticListenerMap;
}

const TaskContent: React.FC<TaskContentProps> = (props) => {
  const {
    task,
    renderType,
    isLink,
    lineHeightNormal,
    onOpenTask,
    taskPath,
    startISO,
    hasLengthDrag,
    mainTaskDragging,
    dndAttributes,
    dndListeners,
    setLengthNodeRef,
    lengthAttributes,
    lengthListeners,
    setDeadlineNodeRef,
    deadlineAttributes,
    deadlineListeners,
  } = props;

  return (
    <div
      className='flex w-full h-full cursor-grab'
      {...dndAttributes}
      {...dndListeners}
    >
      {/* This inner div represents the original structure within the draggable area */}
      <div className={`flex w-full h-full`}> {/* Corresponds to original inner flex container (A) */}
        <div className='flex w-full mr-4'> {/* Corresponds to (B) */}
          <TaskTitle
            title={task.title}
            priority={task.priority}
            renderType={renderType}
            isLink={isLink}
            status={task.status} // Pass status from task object
            lineHeightNormal={lineHeightNormal}
            onOpenTask={onOpenTask}
            taskPath={taskPath}
          />
          {/* The grow div - if it needs its own dnd listeners, it would be separate.
              Here, assuming the parent (TaskContent div) handles the main drag interaction.
              The original had attributes and listeners on this grow div AND on the priority/reminder div.
              This simplification assumes the main TaskContent drag is sufficient.
              If fine-grained dragging of empty space is needed, this might need its own listeners.
          */}
          <div className='h-full w-0 grow'></div> {/* Corresponds to (D) */}
        </div>

        {/* TaskDetails now encapsulates priority, reminder, length, and due date sections.
            It's placed here to be a sibling to the title's wrapper, within the main flex flow.
            The original structure had these as direct children of the current div with dndAttributes/Listeners.
        */}
        <TaskDetails
          task={task}
          startISO={startISO}
          hasLengthDrag={hasLengthDrag}
          dragging={mainTaskDragging} // Pass the main task's dragging state
          setLengthNodeRef={setLengthNodeRef}
          lengthAttributes={lengthAttributes}
          lengthListeners={lengthListeners}
          setDeadlineNodeRef={setDeadlineNodeRef}
          deadlineAttributes={deadlineAttributes}
          deadlineListeners={deadlineListeners}
        />
      </div>
    </div>
  );
};

export default TaskContent;
