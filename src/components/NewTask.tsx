import { useRef } from 'react'; // Removed useEffect, useState, invariant, shallow, lodash
// import { shallow } from 'zustand/shallow'; // No longer needed here

import { AppState, getters, setters, useAppStore } from '../app/store'; // getters, setters, useAppStore might still be needed for dailyNoteInfo
import {
  splitHeading,
} from '../services/util';
import Button from './Button';
import Droppable from './Droppable';
import { useNewTaskLogic } from './NewTaskLogic';
import { TaskProps } from '../types';

export default function NewTask({ dragContainer }: { dragContainer: string }) {
  const modalFrameRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null!);
  const searchInputRef = useRef<HTMLInputElement>(null!);

  const {
    draggableAttributes,
    draggableListeners,
    draggableSetNodeRef,
    handlePrimaryButtonMouseDown,
    draggingTask,
    newTaskData, // This is the full newTask object from the store, via the hook
    modal, // This object contains all modal-specific logic and data
  } = useNewTaskLogic({
    dragContainer,
    modalFrameRef,
    titleInputRef,
    searchInputRef,
  });

  // dailyNoteInfo is used by the check button's onClick, get it from store directly
  // or pass from hook if it's also needed there (it is, for createNewTask).
  // For simplicity, if the hook already has it, it could return it too.
  // Let's assume useNewTaskLogic could return dailyNoteInfo if needed, or we fetch it here.
  const dailyNoteInfo = useAppStore((state) => state.dailyNoteInfo);

  const calendarMode = useAppStore(
    (state) => state.settings.viewMode === 'week'
  );

  return (
    <div className={`relative z-30 ${calendarMode ? '' : 'flex pl-2'}`}>
      {draggingTask ? (
        <>
          <Droppable id={`delete-task`} data={{ type: 'delete' }}>
            <Button
              src='x'
              className={`!rounded-full ${
                calendarMode ? 'h-8 w-8 mb-2' : 'h-10 w-10 mr-2'
              } bg-red-900 flex-none`}
            />
          </Droppable>
          {draggingTask.dragType === 'task' && (
            <Droppable id={`move-task`} data={{ type: 'move' }}>
              <Button
                src='move-right'
                className={`!rounded-full ${
                  calendarMode ? 'h-8 w-8' : 'h-10 w-10'
                } bg-blue-900 flex-none`}
              />
            </Droppable>
          )}
        </>
      ) : (
        <>
          <Button
            {...draggableAttributes}
            {...draggableListeners}
            onMouseDown={handlePrimaryButtonMouseDown}
            ref={draggableSetNodeRef}
            className={`relative flex-none cursor-grab !rounded-full bg-accent ${
              calendarMode ? 'h-8 w-8' : 'h-10 w-10'
            } theme-interactive-accent theme-interactive-accent-hover`}
            src='plus'
          />
        </>
      )}

      {newTaskData && modal && (
        <div className='fixed left-0 top-0 z-40 !mx-0 flex h-full w-full items-center justify-center p-8 space-y-2 '>
          <div
            className='flex h-full max-h-[50vh] w-full flex-col space-y-1 overflow-y-auto overflow-x-hidden rounded-icon border border-solid border-faint theme-bg-primary theme-text-normal p-2 max-w-2xl backdrop-blur'
            ref={modalFrameRef}
          >
            <div className='flex items-center'>
              <div className='pl-2 font-menu text-lg font-bold mr-2'>
                {modal.currentTaskMode === 'new' ? 'New Task' : 'Move Task'}
              </div>
              <div className='text-sm text-faint'>
                {modal.currentTask.scheduled ?? 'Unscheduled'}
              </div>
              <div className='grow' />
              <Button
                src='check'
                onClick={() => {
                    getters.getObsidianAPI().createNewTask(modal.currentTask, null, dailyNoteInfo);
                    setters.set({ newTask: null }); // Close modal
                  }
                }
              />
            </div>

            <input
              ref={titleInputRef}
              className='w-full rounded-icon border border-solid border-faint bg-transparent font-menu font-light backdrop-blur !text-base px-1 py-2'
              value={modal.currentTask.originalTitle ?? ''}
              placeholder='title...'
              onChange={modal.handleTitleChange}
              onFocus={() => modal.setTitleFocus(true)}
              onBlur={() => modal.setTitleFocus(false)}
              onKeyDown={modal.handleTitleKeyDown}
            ></input>

            <input
              ref={searchInputRef}
              placeholder='search files...'
              className='w-full rounded-icon border border-solid border-faint bg-transparent p-1 font-menu backdrop-blur'
              value={modal.search}
              onChange={modal.handleSearchChange}
              onKeyDown={modal.handleSearchKeyDown}
            ></input>
            <div className='h-0 w-full grow space-y-1 overflow-y-auto text-sm'>
              {modal.filteredHeadings.map((path) => (
                <NewTaskHeading
                  key={path}
                  headingPath={path}
                  newTaskData={newTaskData}
                  onHeadingClick={modal.handleHeadingAction}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NewTaskHeading({
  headingPath,
  newTaskData,
  onHeadingClick, // Receive the handler as a prop
}: {
  headingPath: string;
  newTaskData: NonNullable<AppState['newTask']>;
  onHeadingClick: (headingPath: string) => Promise<void>; // Define prop type
}) {
  // dailyNoteInfo is not directly used here anymore for the click, but kept if other parts need it
  // const dailyNoteInfo = useAppStore((state) => state.dailyNoteInfo);
  const [myContainer, title] = splitHeading(headingPath);
  // const newTask = newTaskData.task; // Not directly used for click
  // const newTaskType = newTaskData.type; // Not directly used for click

  return (
    <div
      key={headingPath}
      onMouseDown={() => onHeadingClick(headingPath)} // Call the passed handler
      className={`flex items-center w-full selectable cursor-pointer rounded-icon px-2 hover:underline theme-interactive-normal ${
        headingPath.includes('#') ? 'text-muted' : 'font-bold text-accent'
      }`}
    >
      <div className='grow mr-2 whitespace-nowrap'>
        {title.slice(0, 30) + (title.length > 30 ? '...' : '')}
      </div>
      <div className='text-faint text-xs whitespace-nowrap text-right'>
        {(myContainer.length > 30 ? '...' : '') +
          myContainer.slice(Math.max(0, myContainer.length - 30))}
      </div>
    </div>
  )
}
