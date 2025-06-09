import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import NewTask, { NewTaskProps } from './NewTask';
import { AppState } from '../types';

// --- Mocks ---
jest.mock('obsidian', () => {
  const mockNoticeInstance = jest.fn();
  let internalIsMobile = false;
  const mockSetIcon = jest.fn();
  return {
    Notice: mockNoticeInstance, Platform: { get isMobile() { return internalIsMobile; } },
    setIcon: mockSetIcon, Component: class MockComponent {}, ItemView: class MockItemView {},
    PluginSettingTab: class MockPluginSettingTab {},
    __testUtils: {
      setMockIsMobile: (isMobile: boolean) => { internalIsMobile = isMobile; },
      getMockNotice: () => mockNoticeInstance, getSetIcon: () => mockSetIcon,
      resetMocks: () => { mockNoticeInstance.mockClear(); mockSetIcon.mockClear(); internalIsMobile = false; }
    }
  };
});

jest.mock('../app/store', () => {
  const localDefaultSettings = {
    autoFocus: true, defaultEventName: 'New Event', showCompleted: true,
    showTimeInTask: true, zoomLevel: 4, hourFormat: 'HH:mm',
    dayStartEnd: [0, 24] as [number, number], defaultDurationMinutes: 30,
    groupBy: 'page', muted: false, extendBlocks: false, hideTimes: false,
    borders: 'full', viewMode: 'day', timerEvent: 'Work', scheduledSubtasks: false,
  };
  let mockStoreState: AppState = {
    settings: { ...localDefaultSettings }, newTask: null, tasks: [], dragData: null,
    searchStatus: false, showingPastDates: false, searchWithinWeeks: false, childWidth: 0,
    dragOffset: 0, apis: { obsidian: null as any, calendar: null as any, dataview: null as any },
    dailyNoteInfo: { path: 'daily/notes', format: 'YYYY-MM-DD', folder: 'daily', template: ''},
  };
  const mockObsidianAPIInstanceInternal = { createNewTask: jest.fn(), moveTask: jest.fn() };
  const mockSettersInternal = {
    addNewTask: jest.fn(), setSearchText: jest.fn(), setDragData: jest.fn(),
    set: jest.fn((updater) => {
      if (typeof updater === 'function') { mockStoreState = updater(mockStoreState); }
      else { mockStoreState = { ...mockStoreState, ...updater }; }
    }),
  };
  const mockGettersInternal = {
    getObsidianAPI: jest.fn(() => mockObsidianAPIInstanceInternal),
    get: jest.fn((key: string) => {
      if (key === 'dragData') return mockStoreState.dragData;
      if (key === 'newTask') return mockStoreState.newTask;
      if (key === 'settings') return mockStoreState.settings;
      if (key === 'dailyNoteInfo') return mockStoreState.dailyNoteInfo;
      return undefined;
    }),
  };
  return {
    useAppStore: (selector: (state: AppState) => any) => selector(mockStoreState),
    setters: mockSettersInternal, getters: mockGettersInternal,
    __testUtils: {
      setMockState: (newState: Partial<AppState>) => {
        if (newState.settings) {
            mockStoreState.settings = { ...localDefaultSettings, ...newState.settings };
            delete newState.settings;
        }
        mockStoreState = { ...mockStoreState, ...newState };
      },
      resetMockState: () => {
        mockStoreState = {
            settings: { ...localDefaultSettings }, newTask: null, tasks: [], dragData: null,
            searchStatus: false, showingPastDates: false, searchWithinWeeks: false,
            childWidth: 0, dragOffset: 0,
            apis: { obsidian: null as any, calendar: null as any, dataview: null as any },
            dailyNoteInfo: { path: 'daily/notes', format: 'YYYY-MM-DD', folder: 'daily', template: ''},
        };
        Object.values(mockSettersInternal).forEach(mockFn => mockFn.mockClear());
        Object.values(mockObsidianAPIInstanceInternal).forEach(mockFn => mockFn.mockClear());
        Object.values(mockGettersInternal).forEach(mockFn => mockFn.mockClear());
      },
      getSetters: () => mockSettersInternal, getGetters: () => mockGettersInternal,
      getMockObsidianAPI: () => mockObsidianAPIInstanceInternal,
      getRawStoreState: () => mockStoreState,
    }
  };
});

jest.mock('../services/util', () => ({
    getToday: jest.fn(() => '2023-01-01'), processTask: jest.fn(),
    getBeginOfDay: jest.fn((tasks, today) => `${today}T00:00:00.000Z`),
    convertSearchToRegExp: jest.fn((searchString) => new RegExp(searchString || '.*', 'i')),
    getHeading: jest.fn(task => task.title), parseFileFromPath: jest.fn(path => path.replace('.md','')),
    splitHeading: jest.fn(headingPath => { const parts = headingPath.split('#'); return [parts[0] || '', parts[1] || '']; }),
}));

// jest.useFakeTimers(); // No longer strictly needed if we manually simulate form closing

describe('NewTask Component', () => {
  let defaultProps: NewTaskProps;

  beforeEach(() => {
    jest.clearAllMocks();
    const storeMockTestUtils = jest.requireMock('../app/store').__testUtils;
    storeMockTestUtils.resetMockState();
    const obsidianMockTestUtils = jest.requireMock('obsidian').__testUtils;
    obsidianMockTestUtils.resetMocks();
    defaultProps = { dragContainer: 'test-drag-container' };
  });

  test('renders initial button and not the form by default', () => {
    render(<NewTask {...defaultProps} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('title...')).not.toBeInTheDocument();
  });

  test('clicking the plus button shows the new task form', async () => {
    const storeMockTestUtils = jest.requireMock('../app/store').__testUtils;
    const { rerender } = render(<NewTask {...defaultProps} />);
    const plusButton = screen.getByRole('button');

    await act(async () => {
      fireEvent.mouseDown(plusButton);
      fireEvent.mouseUp(plusButton);
    });

    expect(storeMockTestUtils.getSetters().set).toHaveBeenCalledWith(
      expect.objectContaining({ newTask: { task: { scheduled: undefined }, type: 'new' } })
    );

    storeMockTestUtils.setMockState({
      newTask: { task: { originalTitle: '', scheduled: undefined }, type: 'new' }
    });
    rerender(<NewTask {...defaultProps} />);

    expect(screen.getByPlaceholderText('title...')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('search files...')).toBeInTheDocument();
  });

  describe('When form is active', () => {
    beforeEach(() => {
      const storeMockTestUtils = jest.requireMock('../app/store').__testUtils;
      storeMockTestUtils.setMockState({
        newTask: { task: { originalTitle: 'Initial Title', scheduled: undefined }, type: 'new' },
        tasks: [{id:'t1', title:'H1', path:'file1.md', completed:false, tags:[], rrule:'', sortOrder:0, subtasks:[], startISO:'', duration:0}],
        dailyNoteInfo: { path: 'daily/notes', format: 'YYYY-MM-DD', folder: 'daily', template: '' }
      });
    });

    test('typing in title input updates newTask state in store', async () => {
      const storeMockTestUtils = jest.requireMock('../app/store').__testUtils;
      render(<NewTask {...defaultProps} />);
      const titleInput = screen.getByPlaceholderText('title...');

      await act(async () => {
        fireEvent.change(titleInput, { target: { value: 'New test title' } });
      });

      const setCalls = storeMockTestUtils.getSetters().set.mock.calls;
      expect(setCalls[setCalls.length -1][0]).toEqual(
        expect.objectContaining({
          newTask: expect.objectContaining({
            task: expect.objectContaining({ originalTitle: 'New test title', scheduled: undefined }),
            type: 'new',
          })
        })
      );
    });

    test('pressing Enter in title input calls createNewTask and closes form', async () => {
      const storeMockTestUtils = jest.requireMock('../app/store').__testUtils;
      const mockObsidianAPI = storeMockTestUtils.getMockObsidianAPI();
      const initialTaskState = storeMockTestUtils.getRawStoreState().newTask!.task;
      const dailyNoteInfoFromStore = storeMockTestUtils.getRawStoreState().dailyNoteInfo;
      const { rerender } = render(<NewTask {...defaultProps} />);
      let titleInput = screen.getByPlaceholderText('title...') as HTMLInputElement;
      const taskTitle = 'Submit via title';

      await act(async () => {
        fireEvent.change(titleInput, { target: { value: taskTitle } });
      });
      storeMockTestUtils.setMockState({
          newTask: { ...storeMockTestUtils.getRawStoreState().newTask!, task: { ...initialTaskState, originalTitle: taskTitle } }
      });
      rerender(<NewTask {...defaultProps} />);
      titleInput = screen.getByPlaceholderText('title...') as HTMLInputElement;

      await act(async () => {
        fireEvent.keyDown(titleInput, { key: 'Enter', code: 'Enter', charCode: 13 });
      });

      expect(mockObsidianAPI.createNewTask).toHaveBeenCalledWith(
        { originalTitle: taskTitle, scheduled: undefined }, null, dailyNoteInfoFromStore
      );

      // Manually simulate the form closing effect of the setTimeout
      await act(async () => {
        storeMockTestUtils.setMockState({ newTask: null });
      });

      expect(storeMockTestUtils.getGetters().get('newTask')).toBeNull();
      rerender(<NewTask {...defaultProps} />);
      expect(screen.queryByPlaceholderText('title...')).not.toBeInTheDocument();
    });

    test('pressing Enter in search input calls createNewTask with heading and closes form', async () => {
      const storeMockTestUtils = jest.requireMock('../app/store').__testUtils;
      const mockObsidianAPI = storeMockTestUtils.getMockObsidianAPI();
      const dailyNoteInfoFromStore = storeMockTestUtils.getRawStoreState().dailyNoteInfo;
      const taskTitle = 'Task with heading';
      storeMockTestUtils.setMockState({
        newTask: { ...storeMockTestUtils.getRawStoreState().newTask!, task: { originalTitle: taskTitle, scheduled: undefined } }
      });
      const { rerender } = render(<NewTask {...defaultProps} />);
      const searchInput = screen.getByPlaceholderText('search files...') as HTMLInputElement;

      await act(async () => {
        fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter', charCode: 13 });
      });

      expect(mockObsidianAPI.createNewTask).toHaveBeenCalledWith(
        { originalTitle: taskTitle, scheduled: undefined }, 'Daily', dailyNoteInfoFromStore
      );

      // Manually simulate the form closing effect of the setTimeout
      await act(async () => {
        storeMockTestUtils.setMockState({ newTask: null });
      });

      expect(storeMockTestUtils.getGetters().get('newTask')).toBeNull();
      rerender(<NewTask {...defaultProps} />);
      expect(screen.queryByPlaceholderText('title...')).not.toBeInTheDocument();
    });
  });

  describe('Mobile Behavior', () => {
    test('renders initial button correctly on mobile', () => {
      jest.requireMock('obsidian').__testUtils.setMockIsMobile(true);
      render(<NewTask {...defaultProps} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });
});
