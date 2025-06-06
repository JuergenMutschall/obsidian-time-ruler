import React from 'react';

export interface TaskTagsProps {
  tags: string[];
  groupBy: string | false; // As per AppState['settings']['groupBy']
}

const TaskTags: React.FC<TaskTagsProps> = (props) => {
  const { tags, groupBy } = props;

  if (tags.length === 0 || groupBy === 'tags') {
    return null;
  }

  return (
    <div className='no-scrollbar flex space-x-2 overflow-x-auto pl-indent text-xs child:whitespace-nowrap'>
      {tags.map((tag) => (
        <div
          // Classes from Task.tsx for individual tag elements:
          // 'cm-hashtag cm-hashtag-end cm-hashtag-begin !h-fit !text-xs'
          // These are standard Obsidian classes for tags.
          className='cm-hashtag cm-hashtag-end cm-hashtag-begin !h-fit !text-xs'
          key={tag}
        >
          {tag.replace('#', '')}
        </div>
      ))}
    </div>
  );
};

export default TaskTags;
