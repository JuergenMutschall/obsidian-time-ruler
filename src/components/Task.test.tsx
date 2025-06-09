import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Task from './Task'; // Adjust path as necessary
import { useAppStore, setters } from '../app/store'; // These are the mocked versions
import { openTask } from '../services/obsidianApi'; // Mocked

// Mock necessary dependencies here later
// import { useAppStore, getters, setters } from '../app/store'; // Original import

jest.mock('@dnd-kit/core', () => ({
  ...jest.requireActual('@dnd-kit/core'), // Preserve other exports if any are used and not mocked
  useDraggable: jest.fn(() => ({
    setNodeRef: jest.fn(),
    attributes: {},
    listeners: {},
    transform: null,
    isDragging: false,
    node: { // Mock the node object with getBoundingClientRect
      getBoundingClientRect: jest.fn(() => ({
        right: 0, // Default values, can be overridden in tests
        // Add other properties if accessed by the component
      })),
    },
    activatorEvent: null, // Or a mock event object if needed
  })),
}));

jest.mock('../services/obsidianApi', () => ({
  openTask: jest.fn(),
  // If other functions from obsidianApi are directly called by Task.tsx, mock them here.
}));

jest.mock('../services/util', () => {
  const originalUtil = jest.requireActual('../services/util');
  return {
    ...originalUtil, // Keep actual implementations for non-problematic utils
    getToday: jest.fn(() => '2023-10-27'), // Example: return a fixed date
    isDateISO: jest.fn((str) => typeof str === 'string' && /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(.\d{3})?Z?/.test(str)), // Basic ISO check, allows optional ms and Z
    nestedScheduled: jest.fn(() => true), // Default to true
    parseTaskDate: jest.fn((task, _tasks) => task.scheduled || task.due || ''), // Simplified mock
    roundMinutes: jest.fn((dateTime) => dateTime), // Passthrough for now
    toISO: jest.fn((dateTime, _includeOffset = false) => { // Handle both DateTime and string/Date
      if (!dateTime) return '';
      if (dateTime.toISO) return dateTime.toISO(); // Luxon DateTime
      return new Date(dateTime).toISOString();    // string or Date
    }),
    // Mock other functions from util if they are found to be problematic during testing
  };
});

// Mocking child components
jest.mock('./TaskCheckbox', () => {
    return jest.fn((props) => (
        <div data-testid="mock-task-checkbox" onClick={props.onComplete}>
            TaskCheckbox Mock
        </div>
    ));
});
jest.mock('./TaskContent', () => {
    return jest.fn((props) => (
        <div data-testid="mock-task-content" onClick={props.onOpenTask}>
            TaskContent Mock
        </div>
    ));
});
jest.mock('./TaskTags', () => jest.fn(() => <div data-testid="mock-task-tags">TaskTags</div>));
jest.mock('./TaskNotes', () => jest.fn(() => <div data-testid="mock-task-notes">TaskNotes</div>));
jest.mock('./TaskSubtaskList', () => {
    return jest.fn((props) => (
        <div data-testid="mock-task-subtask-list" onClick={props.onToggleCollapse}>
            TaskSubtaskList Mock
            {/* We could even render props.subtasks.length here if needed for debugging */}
        </div>
    ));
});


jest.mock('../app/store', () => {
  // const actualStore = jest.requireActual('../app/store'); // Get actual store for other potential uses
  return {
    useAppStore: jest.fn(),
    getters: {
      // Keep specific mocks if they are directly called and need specific mock behavior
      getObsidianAPI: jest.fn(() => ({
        app: {
          isMobile: false,
          // Add other Obsidian API mocks if needed by Task or its direct children
        },
        // Add other parts of getObsidianAPI if necessary
      })),
      // Add the generic 'get' mock
      get: jest.fn((key) => mockDefaultStoreState[key as keyof typeof mockDefaultStoreState]),
      // Mock other specific getters if Task or its children use them directly
    },
    setters: {
      patchTasks: jest.fn(),
      patchCollapsed: jest.fn(),
      set: jest.fn(), // Mock the 'set' function used for dragOffset
      // Mock other setter functions if Task directly uses them
    },
    // If other exports from store are used, mock them as well
  };
});

// Default mock state for useAppStore for most tests
// Ensure this state is comprehensive enough for the component's needs
const mockDefaultStoreState = {
  tasks: {},
  settings: {
    viewMode: 'list', // or 'week'
    scheduledSubtasks: false,
    groupBy: '',
    dayStartEnd: [0, 24], // Added for getStartDate -> getters.get('settings').dayStartEnd
    // other settings...
  },
  collapsed: {},
  showingPastDates: false,
  dailyNoteInfo: {
    format: 'YYYY-MM-DD', // Basic dailyNoteInfo
    folder: '',
    template: '',
  },
  childWidth: 1, // example value
  dragOffset: 0, // example value
  apis: { // Mock for apis if get() is used for it.
    obsidian: {
      app: {
        isMobile: false,
      }
      // other obsidian api methods if necessary
    }
  }
  // other state slices...
};

describe('Task Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Setup default return value for useAppStore for each test
    (jest.requireMock('../app/store').useAppStore as jest.Mock).mockImplementation((callback: (state: any) => any) => callback(mockDefaultStoreState));

    // Explicitly mock getters.get to return parts of mockDefaultStoreState
    // This ensures that if a component calls useAppStore and then its internals call getters.get(), both work from the same mock state.
    (jest.requireMock('../app/store').getters.get as jest.Mock).mockImplementation(
      (key: keyof typeof mockDefaultStoreState) => mockDefaultStoreState[key]
    );
    // If getObsidianAPI is used by the component, ensure it's also reset or set up correctly for each test
    (jest.requireMock('../app/store').getters.getObsidianAPI as jest.Mock).mockReturnValue({
      app: { isMobile: false },
      // any other specific methods from ObsidianAPI that Task.tsx might call
    });
  });

  it('should render TaskContent and other child mocks', () => {
    // Basic props for the task, will be expanded later
    const mockTaskProps = {
      id: 'test-task-1',
      title: 'Test Task Title',
      completed: false,
      priority: 0,
      due: null,
      duration: null,
      tags: [], // TaskTags might check length
      notes: [], // TaskNotes might check length
      children: [], // TaskSubtaskList might check length
      queryChildren: [],
      scheduled: null,
      reminder: null,
      status: ' ',
      path: '/test/path.md',
      page: 'test-page',
      dragContainer: 'test-container',
      // Ensure all required props for Task are provided
    };
    // Ensure useAppStore mock provides necessary state for this render
    // No need to call useAppStore.mockImplementation here if the global mock + beforeEach is sufficient.
    // The beforeEach already sets up useAppStore to return mockDefaultStoreState.

    render(<Task {...mockTaskProps} />);
    expect(screen.getByTestId('mock-task-content')).toBeInTheDocument();
    expect(screen.getByTestId('mock-task-checkbox')).toBeInTheDocument();
    // Add expects for other child component mocks if they are always rendered
    // For now, let's assume TaskTags, TaskNotes, TaskSubtaskList might be conditionally rendered
    // based on props (e.g. if tags/notes/children arrays are empty).
    // We can add more assertions here as we build out more specific tests.
  });

  it('should call setters.patchTasks with completion data when TaskCheckbox is clicked', () => {
    const mockNow = new Date('2023-10-27T10:00:55.123Z'); // Time with non-zero seconds/ms
    jest.useFakeTimers();
    jest.setSystemTime(mockNow);

    const taskToComplete = {
      id: 'task-complete-1',
      title: 'Task to complete',
      completed: false,
      priority: 0,
      due: null,
      duration: null,
      tags: [],
      notes: [],
      children: [],
      queryChildren: [],
      scheduled: null,
      reminder: null,
      status: ' ',
      path: '/test/path.md',
      page: 'test-page',
      dragContainer: 'test-container', // Required prop
      // Add any other minimal required props for Task.tsx
    };

    // Ensure the store provides the task if the component tries to re-fetch it by id,
    // and other necessary states like settings.
    (useAppStore as jest.Mock).mockImplementation((callback) => callback({
      ...mockDefaultStoreState, // Defined in your store mock setup
      tasks: { [taskToComplete.id]: taskToComplete },
      settings: {
        ...mockDefaultStoreState.settings,
        // Ensure any settings used by subtask completion logic are here if needed
      },
    }));

    // The actual roundMinutes and toISO from '../services/util' will be used here,
    // operating on the fake system time. This relies on jest.requireActual in the util mock.
    // The component internally uses DateTime.now().toISO() for the completion field,
    // which, with faked timers, will use the mockNow value.
    // Luxon's toISO() by default includes milliseconds and the offset.
    // For a Z-suffixed input, it often produces +00:00.
    const expectedIsoCompletion = '2023-10-27T10:00:55.123+00:00';

    render(<Task {...taskToComplete} />);

    const checkboxMockElement = screen.getByTestId('mock-task-checkbox');
    fireEvent.click(checkboxMockElement);

    expect(setters.patchTasks).toHaveBeenCalledTimes(1);
    expect(setters.patchTasks).toHaveBeenCalledWith(
      [taskToComplete.id],
      {
        completion: expectedIsoCompletion,
        completed: true,
      }
    );

    jest.useRealTimers(); // Restore real timers
  });

  it('should call openTask with the task data when TaskContent is clicked', () => {
    const taskToOpen = {
      id: 'task-open-1',
      title: 'Task to open',
      completed: false,
      priority: 0,
      due: null,
      duration: null,
      tags: [],
      notes: [],
      children: [],
      queryChildren: [],
      scheduled: null,
      reminder: null,
      status: ' ',
      path: '/test/path-open.md',
      page: 'test-page-open',
      dragContainer: 'test-container-open', // Required prop
      // Add any other minimal required props
    };

    (useAppStore as jest.Mock).mockImplementation((callback) => callback({
      ...mockDefaultStoreState,
      tasks: { [taskToOpen.id]: taskToOpen },
      // Ensure settings used by TaskContent/Task are present
    }));

    render(<Task {...taskToOpen} />);

    const contentMockElement = screen.getByTestId('mock-task-content');
    fireEvent.click(contentMockElement); // This will call the onOpenTask prop

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { dragContainer, ...expectedTaskData } = taskToOpen; // Omit dragContainer for the expectation

    expect(openTask).toHaveBeenCalledTimes(1);
    expect(openTask).toHaveBeenCalledWith(expectedTaskData);
  });

  it('should render TaskSubtaskList if the task has subtasks and they are processed', () => {
    const parentTask = {
      id: 'parent-1',
      title: 'Parent Task with Subtasks',
      children: ['child-1'], // ID of the subtask
      priority: 0, due: null, duration: null, tags: [], notes: [], queryChildren: [], scheduled: null, reminder: null, status: ' ', path: '/test/parent.md', page: 'parent-page', dragContainer: 'parent-container', completed: false,
    };
    const childTask = {
      id: 'child-1',
      title: 'Child Subtask',
      scheduled: '2023-10-27T11:00:00.000Z', // Ensure it meets criteria for display
      priority: 0, due: null, duration: null, tags: [], notes: [], children: [], queryChildren: [], reminder: null, status: ' ', path: '/test/child.md', page: 'child-page', dragContainer: 'child-container', completed: false, // dragContainer is not strictly TaskProps but often part of test objects
    };

    (useAppStore as jest.Mock).mockImplementation((callback) => callback({
      ...mockDefaultStoreState,
      tasks: { // Tasks available in the store
        [parentTask.id]: parentTask,
        [childTask.id]: childTask,
      },
      settings: { // Ensure settings allow subtask display
        ...mockDefaultStoreState.settings,
        scheduledSubtasks: true,
      },
      showingPastDates: false,
      collapsed: {}, // Default collapsed state
    }));

    const utils = jest.requireMock('../services/util');
    utils.parseTaskDate.mockImplementation((taskInput: { scheduled?: string | null }) => {
      return taskInput.scheduled || '';
    });
    utils.nestedScheduled.mockReturnValue(true);

    render(<Task {...parentTask} />);

    expect(screen.getByTestId('mock-task-subtask-list')).toBeInTheDocument();
  });

  it('should call setters.patchCollapsed when TaskSubtaskList toggle is triggered', () => {
    const parentTaskId = 'parent-collapse-1';
    const parentTask = {
      id: parentTaskId,
      title: 'Parent Task for Collapse Test',
      children: ['child-collapse-1'],
      priority: 0, due: null, duration: null, tags: [], notes: [], queryChildren: [], scheduled: null, reminder: null, status: ' ', path: '/test/parent-c.md', page: 'parent-c-page', dragContainer: 'parent-c-container', completed: false,
    };
    const childTask = {
      id: 'child-collapse-1',
      title: 'Child Subtask for Collapse',
      scheduled: '2023-10-27T12:00:00.000Z',
      priority: 0, due: null, duration: null, tags: [], notes: [], children: [], queryChildren: [], reminder: null, status: ' ', path: '/test/child-c.md', page: 'child-c-page', dragContainer: 'child-c-container', completed: false,
    };

    // Initial collapsed state: false
    (useAppStore as jest.Mock).mockImplementation((callback) => callback({
      ...mockDefaultStoreState,
      tasks: {
        [parentTask.id]: parentTask,
        [childTask.id]: childTask,
      },
      settings: {
        ...mockDefaultStoreState.settings,
        scheduledSubtasks: true,
      },
      showingPastDates: false,
      collapsed: { [parentTaskId]: false }, // Explicitly not collapsed
    }));

    const utils = jest.requireMock('../services/util');
    utils.parseTaskDate.mockImplementation((taskInput: { scheduled?: string | null }) => taskInput.scheduled || '');
    utils.nestedScheduled.mockReturnValue(true);

    render(<Task {...parentTask} />);

    const subtaskListMockElement = screen.getByTestId('mock-task-subtask-list');
    fireEvent.click(subtaskListMockElement); // Simulate click to toggle

    expect(setters.patchCollapsed).toHaveBeenCalledTimes(1);
    // Task.tsx calls: setters.patchCollapsed([task.id], !collapsed)
    // Initial `collapsed` for parentTaskId is false, so `!collapsed` is true.
    expect(setters.patchCollapsed).toHaveBeenCalledWith([parentTaskId], true);
  });
});
