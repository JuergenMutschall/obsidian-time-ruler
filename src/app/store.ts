import { useRef } from 'react';
import { createReducerContext } from 'immer-reducer';
import { AppImmerReducers } from './reducers';
import CalendarAPI from '../services/calendarApi';
import ObsidianAPI from '../services/obsidianApi';
import { TaskActions } from '../types/enums';
import TimeRulerPlugin from '../main'; // Removed DEFAULT_SETTINGS as it's not used here directly now
// Luxon, lodash, parseFileFromPath might be used by async actions or getters, keep for now.
import { DateTime } from 'luxon';
import _ from 'lodash';
import { parseFileFromPath } from '../services/util';

// ViewMode is used in AppState, ensure it's defined or imported.
// Assuming it's globally available or should be moved to src/types/index.d.ts
// For now, let's define it here if not global, or ensure reducers.ts can access it.
export type ViewMode =
  | 'all'
  | 'scheduled'
  | 'due'
  | 'unscheduled'
  | 'priority'
  | 'completed';

export type AppState = {
  tasks: Record<string, TaskProps>;
  events: Record<string, EventProps>;
  apis: {
    obsidian?: ObsidianAPI;
    calendar?: CalendarAPI;
  };
  dragData: DragData | null;
  dragMode: 'ripple' | 'normal';
  findingTask: string | null;
  inScroll: number;
  searchStatus: boolean;
  dailyNoteInfo: {
    format: string;
    folder: string;
    template: string;
  };
  fileOrder: string[];
  newTask: null | { task: Partial<TaskProps>; type: 'new' | 'move' };
  settings: Pick<
    TimeRulerPlugin['settings'],
    | 'dayStartEnd'
    | 'groupBy'
    | 'muted'
    | 'twentyFourHourFormat'
    | 'showCompleted'
    | 'extendBlocks'
    | 'hideTimes'
    | 'borders'
    | 'viewMode' // This should be `ViewMode` type if we define it above or import
    | 'timerEvent'
    | 'scheduledSubtasks'
  >;
  collapsed: Record<string, boolean>;
  showingPastDates: boolean;
  searchWithinWeeks: [number, number];
  childWidth: number;
  timer: {
    negative: boolean;
    maxSeconds: number | null;
    startISO?: string;
    playing: boolean;
  };
  recreateWindow: number;
  dragOffset: number;
  // viewMode: ViewMode; // Added this based on initial state setup, ensure it's part of AppState
};

const initialState: AppState = {
  tasks: {},
  events: {},
  apis: {},
  dragData: null,
  findingTask: null,
  inScroll: 0,
  searchStatus: false,
  // viewMode: 'hour', // Original initial value, ensure AppState has viewMode
  dragMode: 'normal',
  fileOrder: [],
  dailyNoteInfo: {
    format: 'YYYY-MM-DD',
    folder: '',
    template: '',
  },
  newTask: null,
  collapsed: {},
  settings: { // These settings should match the Pick from TimeRulerPlugin['settings']
    dayStartEnd: [0, 24],
    groupBy: 'path',
    muted: false,
    timerEvent: 'notification',
    twentyFourHourFormat: false,
    showCompleted: false,
    extendBlocks: false,
    hideTimes: false,
    borders: false,
    viewMode: 'day', // This is the initial value for settings.viewMode
    scheduledSubtasks: false,
  },
  showingPastDates: false,
  searchWithinWeeks: [-1, 1],
  childWidth: 1,
  timer: {
    negative: false,
    maxSeconds: null,
    startISO: undefined,
    playing: false,
  },
  recreateWindow: 0,
  dragOffset: 0,
};

// Create the context, hook, and actions
const [AppStoreProvider, useAppStore, appActions] = createReducerContext(
  AppImmerReducers,
  initialState,
);

export { AppStoreProvider, useAppStore, appActions };

// Refactored getters to use the new store's getState method
export const getters = {
  getEvent: (id: string) => useAppStore.getState().events[id],
  getTask: (id: string) => useAppStore.getState().tasks[id],
  getObsidianAPI: () => useAppStore.getState().apis.obsidian as ObsidianAPI,
  getCalendarAPI: () => useAppStore.getState().apis.calendar as CalendarAPI,
  get: <T extends keyof AppState>(key: T) => useAppStore.getState()[key],
  getApp: () => useAppStore.getState().apis.obsidian!.app,
};

// Async actions - formerly part of setters
export const patchTasks = async (ids: string[], taskUpdates: Partial<TaskProps>) => {
  const obsidianAPI = getters.getObsidianAPI();
  // Potentially dispatch a "loading" or "optimistic update" action here
  // appActions.setTaskLoading(ids, true);

  for (const id of ids) {
    const currentTask = getters.getTask(id); // Get current task state
    if (!currentTask) {
      console.warn(`Task with id ${id} not found for patching.`);
      continue;
    }
    const savedTask = { ...currentTask, ...taskUpdates };
    if (taskUpdates.scheduled === TaskActions.DELETE) delete savedTask.scheduled;

    await obsidianAPI.saveTask(savedTask);
    // After successful save, the store should be updated by whatever mechanism
    // obsidianAPI.saveTask triggers (e.g., file watcher, manual refresh).
    // If not, we might need to dispatch an action here to update the store:
    // appActions.patchTask(id, savedTask); // Assuming savedTask contains the full updated task
  }

  if (taskUpdates.completion) {
    obsidianAPI.playComplete();
  }
  // Potentially dispatch a "loaded" or "clear optimistic update" action here
  // appActions.setTaskLoading(ids, false);
};

export const updateFileOrder = (file: string, beforeFile: string) => {
  const obsidianAPI = getters.getObsidianAPI();
  obsidianAPI.updateFileOrder(file, beforeFile);
  // Similar to patchTasks, the state update for fileOrder is likely
  // handled by Obsidian events. If not, an action would be needed:
  // const newFileOrder = ...;
  // appActions.setFileOrder(newFileOrder);
};


// useAppStoreRef might still be useful for specific scenarios where a stable ref to a slice of state is needed.
// Or it can be removed if direct usage of useAppStore with selectors is preferred.
export const useAppStoreRef = <T>(callback: (state: AppState) => T) => {
  const storeValue = useAppStore(callback); // useAppStore is now the hook from createReducerContext
  const storeValueRef = useRef<T>(storeValue);
  storeValueRef.current = storeValue;
  return [storeValue, storeValueRef] as [
    typeof storeValue,
    typeof storeValueRef
  ];
};
