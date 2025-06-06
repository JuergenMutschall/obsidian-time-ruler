import React from 'react';
import { TaskPriorities } from '../types/enums';
import { getters } from '../app/store'; // For obsidian API access

export interface TaskTitleProps {
  title: string | undefined | null;
  priority: TaskPriorities;
  renderType?: 'deadline'; // Optional, as in Task.tsx
  isLink: boolean;
  status: string; // Assuming status is relevant for styling as per original Task.tsx logic
  lineHeightNormal: string;
  onOpenTask: () => void; // Callback to open the task
  taskPath: string; // Needed for resolving wiki-links
}

const TaskTitle: React.FC<TaskTitleProps> = (props) => {
  const {
    title,
    priority,
    renderType,
    isLink,
    status,
    lineHeightNormal,
    onOpenTask,
    taskPath,
  } = props;

  const parseTitleForLinks = (text: string | undefined | null): React.ReactNode => {
    if (!text) return '';

    const regex = /\[\[(.*?)\]\]/g;
    if (!regex.test(text)) {
      return <>{text}</>;
    }

    regex.lastIndex = 0; // Reset regex state
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpMatchArray | null;
    let keyCounter = 0; // For unique keys

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(<span key={`text-${keyCounter++}`}>{text.substring(lastIndex, match.index)}</span>);
      }

      const linkText = match[1];
      parts.push(
        <span
          key={`link-${keyCounter++}`}
          className='text-accent hover:underline' // Added hover:underline for better affordance
          onClick={(ev) => {
            ev.stopPropagation(); // Prevent onOpenTask from firing
            getters.get('apis').obsidian!.app.workspace.openLinkText(linkText, taskPath);
          }}
        >
          {linkText}
        </span>
      );
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(<span key={`text-${keyCounter++}`}>{text.substring(lastIndex)}</span>);
    }
    return <>{parts}</>;
  };

  const titleContent = parseTitleForLinks(title);

  // Conditional class logic from Task.tsx
  const titleClasses = [
    'w-fit max-w-full cursor-pointer overflow-hidden text-ellipsis leading-line whitespace-normal',
    title?.split(' ').find((x) => x.length > 20) ? 'break-all' : 'break-words',
  ];

  if (priority === TaskPriorities.HIGHEST) {
    titleClasses.push('text-accent');
  } else if (renderType === 'deadline') {
    // No specific class for deadline renderType in original logic, implies default
  } else if (
    priority === TaskPriorities.LOW ||
    isLink ||
    status === 'x' || // Assuming 'x' means completed or cancelled
    !title
  ) {
    titleClasses.push('text-faint');
  } else {
    // Default text color if no other condition met (e.g. normal priority)
    // titleClasses.push('text-normal'); // Or whatever the default was, often inherited
  }

  return (
    <div
      style={{ maxHeight: `calc(${lineHeightNormal}em * 2)` }}
      className={titleClasses.join(' ')}
      onMouseDown={(e) => {
        // Only trigger onOpenTask if not clicking on a link
        if ((e.target as HTMLElement).tagName?.toLowerCase() !== 'span' || !(e.target as HTMLElement).classList.contains('text-accent')) {
          onOpenTask();
        }
        return false; // Consistent with original
      }}
      onClick={(e) => {
         // Prevent click if a link was clicked, as link has its own onClick
        if ((e.target as HTMLElement).tagName?.toLowerCase() === 'span' && (e.target as HTMLElement).classList.contains('text-accent')) {
            e.stopPropagation();
            return;
        }
        return false;
      }} // To prevent interference
      onMouseUp={() => false} // Consistent with original
    >
      {titleContent}
    </div>
  );
};

export default TaskTitle;
