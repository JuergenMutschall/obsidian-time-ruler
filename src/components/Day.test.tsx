import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Day from './Day';
import { TimeSpanTypes } from './Minutes'; // Import TimeSpanTypes

// 1. Mock ../services/util
jest.mock('../services/util', () => ({
  getStartDate: jest.fn((date) => date.toISODate()), // Simplified
  isDateISO: jest.fn((str) => /^\d{4}-\d{2}-\d{2}$/.test(str)),
  parsePathFromDate: jest.fn(() => 'mock/path/to/daily-note'),
  parseTaskDate: jest.fn((task, tasks) => task.scheduled), // Simple passthrough
  roundMinutes: jest.fn(dateTime => dateTime), // Passthrough
  toISO: jest.fn((dateTime, endOfDay) => dateTime?.toISO() || new Date().toISOString()),
}));

// 2. Mock ../services/obsidianApi
jest.mock('../services/obsidianApi', () => ({
  openTaskInRuler: jest.fn(),
}));

// 3. Mock child components
jest.mock('./Block', () => (props: any) => <div data-testid={`mock-block-${props.title || props.id || props.type}`} />);
jest.mock('./Button', () => (props: any) => <button data-testid="mock-button" onClick={props.onClick} />);
jest.mock('./Droppable', () => (props: any) => <div data-testid="mock-droppable">{props.children}</div>);
jest.mock('./Hours', () => (props: any) => <div data-testid="mock-hours" />);
jest.mock('./Timer', () => ({ Timer: () => <div data-testid="mock-timer" /> }));

// This object will be defined once globally and mutated by __setMockState for individual tests.
const mockAppStoreGlobalState = {
  tasks: {},
  events: {},
  dailyNoteInfo: { format: 'YYYY-MM-DD', folder: '', template: '' },
  settings: {
    showCompleted: false,
    groupBy: false,
    viewMode: 'day' as const,
    twentyFourHourFormat: false,
    hideTimes: false,
    borders: false,
  },
  fileOrder: [],
  collapsed: {},
  showingPastDates: false,
  findingTask: null,
  childWidth: 1,
};

// 4. Mock ../app/store
jest.mock('../app/store', () => {
  // These are defined inside the factory and use mockAppStoreGlobalState
  const mockGetters = {
    get: jest.fn((key) => mockAppStoreGlobalState[key as keyof typeof mockAppStoreGlobalState]),
    getApp: jest.fn(() => ({
      vault: { getAbstractFileByPath: jest.fn() },
      workspace: { openLinkText: jest.fn() },
    })),
    getObsidianAPI: jest.fn(() => ({
      createFileFromPath: jest.fn(() => Promise.resolve()),
    })),
  };

  const mockSetters = {
    patchCollapsed: jest.fn(),
    set: jest.fn(),
  };

  return {
    __setMockState: (newState: Partial<typeof mockAppStoreGlobalState>) => {
      Object.keys(mockAppStoreGlobalState).forEach(key => {
        delete (mockAppStoreGlobalState as any)[key];
      });
      Object.assign(mockAppStoreGlobalState, { // Base state
        tasks: {}, events: {}, dailyNoteInfo: { format: 'YYYY-MM-DD', folder: '', template: '' },
        settings: { showCompleted: false, groupBy: false, viewMode: 'day' as const, twentyFourHourFormat: false, hideTimes: false, borders: false },
        fileOrder: [], collapsed: {}, showingPastDates: false, findingTask: null, childWidth: 1,
      }, newState);
    },
    useAppStore: jest.fn((selector) => selector(mockAppStoreGlobalState)),
    getters: mockGetters,
    setters: mockSetters,
  };
});


describe('Day Component', () => {
  let storeMocks: {
    getters: { get: jest.Mock, getApp: jest.Mock, getObsidianAPI: jest.Mock },
    setters: { patchCollapsed: jest.Mock, set: jest.Mock },
    __setMockState: (newState: Partial<typeof mockAppStoreGlobalState>) => void,
    useAppStore: jest.Mock,
  };

  const defaultProps = {
    startISO: '2023-10-26T00:00:00.000Z',
    endISO: '2023-10-27T00:00:00.000Z',
    type: 'day' as TimeSpanTypes,
    dragContainer: 'test-day-container',
    isNow: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    const actualStoreMock = jest.requireMock('../app/store');
    storeMocks = {
      getters: actualStoreMock.getters,
      setters: actualStoreMock.setters,
      __setMockState: actualStoreMock.__setMockState,
      useAppStore: actualStoreMock.useAppStore,
    };

    storeMocks.__setMockState({ // Reset to a default clean state for most tests
      tasks: {}, events: {},
      dailyNoteInfo: { format: 'YYYY-MM-DD', folder: '', template: '' },
      settings: {
        showCompleted: false, groupBy: false, viewMode: 'day' as const,
        twentyFourHourFormat: false, hideTimes: false, borders: false
      },
      fileOrder: [], collapsed: {}, showingPastDates: false, findingTask: null, childWidth: 1,
    });

    storeMocks.getters.getApp.mockReturnValue({
      vault: { getAbstractFileByPath: jest.fn(() => null) },
      workspace: { openLinkText: jest.fn() },
    } as any);
    storeMocks.getters.getObsidianAPI.mockReturnValue({
      createFileFromPath: jest.fn(() => Promise.resolve()),
    } as any);
  });

  it('renders without crashing for a typical day', () => {
    render(<Day {...defaultProps} />);
    expect(screen.getByText(/Oct 26/i)).toBeInTheDocument();
    expect(screen.getByTestId('mock-hours')).toBeInTheDocument();
  });

  it('renders "Now" indicator and Timer when isNow is true', () => {
    render(<Day {...defaultProps} isNow={true} />);
    expect(screen.getByText('Now')).toBeInTheDocument();
    expect(screen.getByTestId('mock-timer')).toBeInTheDocument();
  });

  it('handles clicking the day title to open/create daily note', async () => {
    const mockOpenLinkText = jest.fn();
    const mockGetAbstractFileByPath = jest.fn(() => null);
    const mockCreateFileFromPath = jest.fn(() => Promise.resolve());

    storeMocks.getters.getApp.mockReturnValue({
      vault: { getAbstractFileByPath: mockGetAbstractFileByPath },
      workspace: { openLinkText: mockOpenLinkText },
    } as any);
    storeMocks.getters.getObsidianAPI.mockReturnValue({
      createFileFromPath: mockCreateFileFromPath,
    } as any);

    render(<Day {...defaultProps} />);
    const titleElement = screen.getByText(/Oct 26/i);

    await act(async () => {
      fireEvent.click(titleElement);
    });

    expect(mockGetAbstractFileByPath).toHaveBeenCalledWith('mock/path/to/daily-note');
    expect(mockCreateFileFromPath).toHaveBeenCalledWith('mock/path/to/daily-note');
    expect(mockOpenLinkText).toHaveBeenCalledWith('mock/path/to/daily-note', '');
  });

  it('renders all-day, past, and specific event blocks if tasks/events exist and conditions met', () => {
    const tasksData = {
      'task1': { id: 'task1', content: 'Task for Past Block', completed: true, scheduled: '2023-10-27T10:00:00Z' },
      'task2': { id: 'task2', content: 'All Day Task Today', completed: true, scheduled: '2023-10-26' },
    };
    const eventsData = [
      { id: 'event1', title: 'All Day Event', startISO: '2023-10-26', endISO: '2023-10-27' }
    ];

    storeMocks.__setMockState({
      tasks: tasksData,
      events: eventsData,
      dailyNoteInfo: { format: 'YYYY-MM-DD', folder: '', template: '' },
      settings: {
        showCompleted: false,
        groupBy: false,
        viewMode: 'day' as const,
        twentyFourHourFormat: false,
        hideTimes: false,
        borders: false,
      },
      fileOrder: [],
      collapsed: {},
      showingPastDates: true,
      findingTask: null,
      childWidth: 1,
    });

    render(<Day {...defaultProps} isNow={true} startISO="2023-10-26T00:00:00Z" endISO="2023-10-27T00:00:00Z" />);

    expect(screen.getByTestId('mock-block-past')).toBeInTheDocument(); // Title is "past"
    expect(screen.getByTestId('mock-block-event1')).toBeInTheDocument(); // Block for event1
    expect(screen.getByTestId('mock-block-today')).toBeInTheDocument(); // Title is "today"
    expect(screen.queryByTestId('mock-block-upcoming')).not.toBeInTheDocument();
  });

});
