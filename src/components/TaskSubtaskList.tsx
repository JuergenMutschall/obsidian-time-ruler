import React from 'react';
import { AppState, getters, setters } from '../app/store'; // Assuming paths are correct relative to this new file
import { TaskProps } from '../types'; // Or possibly '../types/index'
import { getHeading } from '../services/util';
import Block from './Block';

export interface TaskSubtaskListProps {
  taskId: string;
  task: TaskProps; // Parent task to be used by getHeading
  subtasks: TaskProps[] | undefined; // Already filtered and processed by Task.tsx
  collapsed: boolean;
  onToggleCollapse: () => void;
  dragContainer: string;
  startISO?: string;
  dailyNoteInfo: AppState['dailyNoteInfo'];
  groupBy: AppState['settings']['groupBy'];
}

const TaskSubtaskList: React.FC<TaskSubtaskListProps> = (props) => {
  const {
    taskId,
    task,
    subtasks,
    collapsed,
    onToggleCollapse,
    dragContainer,
    startISO,
    dailyNoteInfo,
    groupBy,
  } = props;

  if (!subtasks || subtasks.length === 0) {
    return null;
  }

  return (
    <div className='flex w-full overflow-hidden'>
      <div
        className={`min-w-[20px] grow min-h-[12px] flex items-center justify-end ${
          collapsed ? 'pl-indent pr-2' : 'pl-[8px] py-2'
        }`}
      >
        <div
          className='h-full w-full transition-colors duration-200 hover:bg-selection rounded-icon flex items-center justify-center cursor-pointer'
          onClick={onToggleCollapse}
        >
          <div
            className={`${
              collapsed ? 'h-0 w-full border-t' : 'w-0 h-full border-l'
            } border-0 border-solid border-faint opacity-50`}
          />
        </div>
      </div>

      {!collapsed && subtasks && subtasks.length > 0 && (
        <Block
          dragContainer={`${dragContainer}::${taskId}`}
          hidePaths={[getHeading(task, dailyNoteInfo, groupBy), task.path]}
          startISO={startISO}
          tasks={subtasks}
          events={[]}
          type='child'
          parentId={taskId}
          blocks={[]}
        />
      )}
    </div>
  );
};

export default TaskSubtaskList;
