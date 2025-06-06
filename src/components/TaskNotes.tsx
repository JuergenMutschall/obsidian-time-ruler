import React from 'react';

export interface TaskNotesProps {
  notes: string | undefined | null;
  isLink: boolean; // To determine if the task is a link representation
}

const TaskNotes: React.FC<TaskNotesProps> = (props) => {
  const { notes, isLink } = props;

  if (isLink || !notes) {
    return null;
  }

  return (
    <div className='task-description break-words pl-indent pr-2 text-xs text-faint'>
      {notes}
    </div>
  );
};

export default TaskNotes;
