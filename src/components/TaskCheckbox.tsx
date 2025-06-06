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
        rounded-checkbox border border-solid border-faint p-0 text-xs shadow-none
        hover:border-normal cursor-pointer
        ${isLink ? 'h-2 w-2' : isMobile ? 'h-5 w-5' : 'h-4 w-4'}
        ${completed ? 'bg-faint' : 'bg-transparent'}
      `}
      data-task={status === ' ' ? '' : status}
    >
      {status === 'x' ? <></> : status}
    </Button>
  );
};

export default TaskCheckbox;
