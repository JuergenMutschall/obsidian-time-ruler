// src/tests/unit/__mocks__/store.js

// Default dailyNoteInfo for tests, similar to what's in the actual store.ts
const mockDailyNoteInfo = {
  format: 'YYYY-MM-DD',
  folder: '', // Assuming root folder for daily notes in tests if not specified
  template: '',
};

// Mock for AppState settings if needed by any tested function through getters
const mockSettings = {
  dayStartEnd: [0, 24],
  groupBy: 'path',
  muted: false,
  timerEvent: 'notification',
  twentyFourHourFormat: false,
  showCompleted: false,
  extendBlocks: false,
  hideTimes: false,
  borders: false,
  viewMode: 'day',
  scheduledSubtasks: false,
};

export const useAppStore = jest.fn(); // Basic mock for zustand store hook

export const getters = {
  get: jest.fn((key) => {
    if (key === 'dailyNoteInfo') {
      return mockDailyNoteInfo;
    }
    if (key === 'settings') {
      return mockSettings;
    }
    // Add other specific key mocks as needed by tests
    return undefined;
  }),
  // Add other getters if textToTask or its callees use them.
  // For now, dailyNoteInfo is the primary one identified.
  getObsidianAPI: jest.fn(),
  getCalendarAPI: jest.fn(),
  getApp: jest.fn(),
  getEvent: jest.fn(),
  getTask: jest.fn(),
};

export const setters = {
  // Mock setters if needed
  set: jest.fn(),
  patchTasks: jest.fn(),
  patchCollapsed: jest.fn(),
  updateFileOrder: jest.fn(),
  patchTimer: jest.fn(),
};

// Mock AppState type if needed for type checking in other files importing from store
// export type AppState = { /* ... simplified AppState type for mocks ... */ };
// However, actual AppState type is better imported from the real store.ts for accuracy in test setup.
// This mock focuses on runtime behavior.
