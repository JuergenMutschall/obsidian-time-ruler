import React from 'react';
import { render, act } from '@testing-library/react';
import AppInitializer from './AppInitializer';
// import { DEFAULT_SETTINGS } from '../main'; // Avoid importing from main to prevent early loading of obsidianApi

// Minimal DEFAULT_SETTINGS structure needed for the mock store
const MOCK_DEFAULT_SETTINGS = {
  dayStartEnd: [0, 24],
  groupBy: 'path' as const, // Use 'as const' for literal type
  muted: false,
  timerEvent: 'notification' as const,
  twentyFourHourFormat: false,
  showCompleted: false,
  extendBlocks: false,
  hideTimes: false,
  borders: false,
  viewMode: 'day' as const,
  scheduledSubtasks: false,
};


// 1. Mock 'obsidian' module
jest.mock('obsidian', () => ({
  Notice: jest.fn(),
  Platform: { isMobile: false }, // Default assumption
  // Add other Obsidian exports if directly used by AppInitializer or its deps
}));

// 2. Mock '../services/util'
jest.mock('../services/util', () => ({
  getToday: jest.fn(() => '2023-10-26'), // Mock date for consistency
  // Add other util functions if used
}));

// 3. Mock 'src/assets/assets'
jest.mock('src/assets/assets', () => ({
  sounds: {
    timer: {
      play: jest.fn(),
    },
  },
}));

// 4. Mock '../app/store'
jest.mock('../app/store', () => {
  // Define these inside the factory to ensure they are available when jest.mock is hoisted
  const mockObsidianApiFunctions = {
    loadTasks: jest.fn(),
  };
  const mockGetters = {
    get: jest.fn((key) => {
      if (key === 'timer') return { playing: false, startISO: null, maxSeconds: null };
      if (key === 'settings') return MOCK_DEFAULT_SETTINGS; // Use local mock settings
      if (key === 'apis') return { obsidian: mockObsidianApiFunctions, calendar: {} };
      return undefined;
    }),
    getApp: jest.fn(() => ({
      isMobile: false,
    })),
    getObsidianAPI: jest.fn(() => mockObsidianApiFunctions),
  };
  const mockSetters = {
    patchTimer: jest.fn(),
    set: jest.fn(),
  };

  return {
    getters: mockGetters,
    setters: mockSetters,
    useAppStore: jest.fn(),
    useAppStoreRef: jest.fn(),
  };
});

// Mock global Notification
global.Notification = jest.fn() as any;


describe('AppInitializer', () => {
  let mockTimelineViewRef: React.RefObject<any>;

  // It's important to retrieve the mocked getters and setters *after* jest.mock has run.
  // We can import them or require them here if needed for setup, or reset them directly.
  let storeMocks: { getters: typeof mockGettersForStore; setters: typeof mockSettersForStore; obsidianApi: typeof mockObsidianApiFunctionsForStore };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Re-import or re-require the store to get the fresh mocks for manipulation in tests if needed
    // This is one way to get access to the hoisted mocks for manipulation in beforeEach/test cases
    const actualStoreMock = jest.requireMock('../app/store');
    storeMocks = {
        getters: actualStoreMock.getters,
        setters: actualStoreMock.setters,
        // We need to ensure mockObsidianApiFunctionsForStore is also correctly reset or re-accessed if it's from the factory scope
        // For simplicity, if we need to change its behavior per test, we might need a more elaborate setup
        // or reset its mocked functions directly.
        // For now, let's assume the default mock behavior is sufficient or reset specific methods on storeMocks.getters.
        obsidianApi: actualStoreMock.getters.getObsidianAPI() // This gets the one from the factory
    };


    mockTimelineViewRef = {
      current: {
        scrollTo: jest.fn(),
      },
    };

    // Setup default mock implementations for getters for each test
    storeMocks.getters.get.mockImplementation((key) => {
      if (key === 'timer') return { playing: false, startISO: null, maxSeconds: null };
      if (key === 'settings') return MOCK_DEFAULT_SETTINGS; // Use local mock settings
      if (key === 'apis') return { obsidian: storeMocks.obsidianApi, calendar: {} };
      return undefined;
    });
    // storeMocks.getters.getObsidianAPI.mockReturnValue(storeMocks.obsidianApi); // Already done by the factory
  });

  const defaultProps = {
    reload: jest.fn(() => Promise.resolve()),
    weeksShownState: 1,
    setWeeksShown: jest.fn(),
    showingPastDates: false,
    searchWithinWeeks: [-1, 1] as [number, number],
    calendarMode: false,
    timelineViewRef: mockTimelineViewRef,
  };

  it('renders without crashing and calls reload', async () => {
    await act(async () => {
      render(<AppInitializer {...defaultProps} />);
    });
    expect(defaultProps.reload).toHaveBeenCalled();
  });

  // More tests can be added here to check useEffect behaviors
});
