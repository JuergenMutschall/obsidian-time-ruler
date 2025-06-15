import { useDraggable } from '@dnd-kit/core';
import _ from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import invariant from 'tiny-invariant';
import { shallow } from 'zustand/shallow';

import { AppState, DragData, getters, setters, useAppStore } from '../app/store';
import { convertSearchToRegExp } from '../services/util';
import { TaskProps } from '../types';

interface UseNewTaskLogicProps {
  dragContainer: string; // New: for useDraggable
  modalFrameRef: React.RefObject<HTMLDivElement>;
  titleInputRef: React.RefObject<HTMLInputElement>;
  searchInputRef: React.RefObject<HTMLInputElement>;
}

export function useNewTaskLogic({
  dragContainer, // New
  modalFrameRef,
  titleInputRef,
  searchInputRef,
}: UseNewTaskLogicProps) {
  // --- Logic for the primary "add task" button and dragging state ---
  const draggableData: DragData = {
    dragType: 'new_button',
  };
  const {
    attributes: draggableAttributes,
    listeners: draggableListeners,
    setNodeRef: draggableSetNodeRef,
  } = useDraggable({
    id: `new_task_button::${dragContainer}`,
    data: draggableData,
  });

  const draggingTask = useAppStore((state) =>
    state.dragData &&
    ['task', 'group', 'block'].includes(state.dragData.dragType)
      ? state.dragData
      : undefined
  );

  const checkForClick = () => {
    // Moved from NewTask.tsx
    if (!getters.get('dragData') && !getters.get('newTask')) {
      setters.set({ newTask: { task: { scheduled: undefined }, type: 'new' } });
    }
    window.removeEventListener('mouseup', checkForClick);
  };

  const handlePrimaryButtonMouseDown = () => {
    // Moved from NewTask.tsx
    window.addEventListener('mouseup', checkForClick);
  };

  // --- Logic for the New Task Modal ---
  const newTaskData = useAppStore((state) => state.newTask); // Modal visibility depends on this
  const dailyNoteInfo = useAppStore((state) => state.dailyNoteInfo); // Used by modal actions

  const [search, setSearch] = useState('');
  const [titleFocus, setTitleFocus] = useState(false);

  // This logic for allHeadings was in NewTask.tsx, adjusted for hook context
  // It should only run/fetch if newTaskData is present
  const allHeadingsFromStore = useAppStore((state) => {
    if (!newTaskData) return []; // Only compute if modal is potentially active
    return _.uniq(
      _.flatMap(state.tasks, (task) => {
        if (task.completed || task.page) return [];
        return task.path.replace('.md', '');
      }).concat(['Daily'])
    ).sort();
  }, shallow);

  const currentTask = newTaskData?.task;
  const currentTaskMode = newTaskData?.type;

  useEffect(() => {
    if (currentTask) { // Only reset search if currentTask (i.e. modal) is active
      setSearch('');
    }
  }, [currentTask]);

  const searchExp = useMemo(() => convertSearchToRegExp(search), [search]);
  const filteredHeadings = useMemo(() => {
    if (!newTaskData) return []; // Only compute if modal is active
    return allHeadingsFromStore.filter((heading) => searchExp.test(heading));
  }, [allHeadingsFromStore, searchExp, newTaskData]);

  const handleTitleChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentTask) return;
    setters.set({
      newTask: {
        task: { ...currentTask, originalTitle: ev.target.value },
        type: currentTaskMode!,
      },
    });
  };

  const handleTitleKeyDown = (ev: React.KeyboardEvent<HTMLInputElement>) => {
    if (!currentTask) return;
    if (ev.key === 'Tab') {
      ev.preventDefault();
      searchInputRef.current?.focus();
    }
    if (ev.key === 'Enter') {
      getters.getObsidianAPI().createNewTask(currentTask, null, dailyNoteInfo);
      setters.set({ newTask: null });
    }
  };

  const handleSearchChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(ev.target.value);
  };

  const handleSearchKeyDown = (ev: React.KeyboardEvent<HTMLInputElement>) => {
    if (!currentTask) return;
    if (ev.key === 'Enter') {
      if (filteredHeadings.length > 0) {
        handleHeadingAction(filteredHeadings[0]);
      }
    }
    if (ev.key === 'Tab' && titleInputRef.current && !ev.shiftKey) {
      ev.preventDefault();
      titleInputRef.current.focus();
    }
  };

  const handleHeadingAction = async (headingPath: string) => {
    if (!currentTask) return;
    const api = getters.getObsidianAPI();
    if (currentTaskMode === 'move') {
      invariant(currentTask.id, "Task ID must exist for move operation");
      await api.moveTask(currentTask as TaskProps, headingPath);
    } else {
      api.createNewTask(currentTask, headingPath, dailyNoteInfo);
    }
    setters.set({ newTask: null });
  };

  useEffect(() => {
    const checkShowingModal = (ev: MouseEvent) => {
      if (modalFrameRef.current && !modalFrameRef.current.contains(ev.target as Node)) {
        setters.set({ newTask: null });
      }
    };

    if (newTaskData) { // Only if modal is active
      window.addEventListener('mousedown', checkShowingModal);
      setTimeout(() => titleInputRef.current?.focus(), 0);
      return () => window.removeEventListener('mousedown', checkShowingModal);
    }
  }, [newTaskData, modalFrameRef, titleInputRef]);

  // Group modal-related returns
  const modalLogic = newTaskData && currentTask ? {
    search,
    setSearch: handleSearchChange,
    titleFocus,
    setTitleFocus,
    filteredHeadings,
    handleTitleChange,
    handleTitleKeyDown,
    handleSearchKeyDown,
    handleHeadingAction,
    currentTask,
    currentTaskMode,
    // dailyNoteInfo is used by one of the modal buttons, can be passed out or used as is in NewTask.tsx
  } : null;

  return {
    // Draggable button props
    draggableAttributes,
    draggableListeners,
    draggableSetNodeRef,
    handlePrimaryButtonMouseDown,
    // Other states/data
    draggingTask,
    newTaskData, // Pass out newTaskData to determine if modal should render
    // Modal specific logic (conditionally available)
    modal: modalLogic,
  };
}
