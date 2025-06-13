import React from 'react';
import Button from './Button'; // Assuming Button is in the same directory

export interface TaskCheckboxProps {
  completed: boolean;
  status: string;
  isLink: boolean;
  isMobile: boolean;
  onComplete: () => void;
}

const TaskCheckbox: React.FC<TaskCheckboxProps> = (props) => {
  const { completed, status, isLink, isMobile, onComplete } = props;

  return (
    <Button
      onPointerDown={() => false} // Prevent drag initiation on checkbox click
      onClick={onComplete}
      className={`
        task-list-item-checkbox flex flex-none items-center justify-center
        rounded-checkbox p-0 text-xs shadow-none cursor-pointer
        ${isLink ? 'h-2 w-2' : isMobile ? 'h-5 w-5' : 'h-4 w-4'}
        border border-solid
        ${
          completed
            ? 'bg-[var(--interactive-accent)] border-[var(--interactive-accent)] text-[var(--text-on-accent)]'
            : 'bg-transparent border-[var(--background-modifier-border)] hover:border-[var(--background-modifier-border-hover)]'
        }
      `}
      data-task={status === ' ' ? '' : status}
    >
      {status === 'x' ? <></> : status}
    </Button>
  );
};

export default TaskCheckbox;
