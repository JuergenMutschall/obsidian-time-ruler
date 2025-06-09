import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TaskContent, { TaskContentProps } from './TaskContent';
import { DEFAULT_SETTINGS } from '../main';
import { ITask, AppState, TaskProps as ActualTaskProps } from '../types'; // Renamed TaskProps from types to ActualTaskProps

// --- Mocks ---

jest.mock('obsidian', () => {
  const mockMarkdownRendererInstance = jest.fn();
  return {
    MarkdownRenderer: mockMarkdownRendererInstance,
    Component: class MockComponent {},
    ItemView: class MockItemView {},
    PluginSettingTab: class MockPluginSettingTab {},
    Plugin: class MockPlugin {},
    __testUtils: {
      getMockMarkdownRenderer: () => mockMarkdownRendererInstance,
    }
  };
});

// Mock '../app/store' - TaskContent itself doesn't seem to use useAppStore directly
// Settings are likely passed down through props via TaskDetails or TaskTitle if needed by them.
// So, a minimal store mock might suffice, or none if not imported by TaskContent.
// For now, keeping a minimal one in case of indirect usage or future changes.
let mockStoreSettings = { ...DEFAULT_SETTINGS };
jest.mock('../app/store', () => ({
  useAppStore: (selector: (state: Partial<AppState>) => any) => {
    const state = { settings: mockStoreSettings };
    return selector(state);
  },
  __testUtils: {
    setMockSettings: (newSettings: Partial<typeof DEFAULT_SETTINGS>) => {
      mockStoreSettings = { ...DEFAULT_SETTINGS, ...newSettings };
    },
    resetMockSettings: () => {
      mockStoreSettings = { ...DEFAULT_SETTINGS };
    }
  }
}));

// Mock child components
jest.mock('./TaskTitle', () => jest.fn(({ title }) => <div data-testid="task-title">{title}</div>));
// Add mock for TaskDetails
jest.mock('./TaskDetails', () => jest.fn(() => <div data-testid="task-details" />));


// --- Helper to create mock task data ---
// Using ActualTaskProps for the return type
const createMockTask = (overrides: Partial<ActualTaskProps> = {}): ActualTaskProps => ({
  id: 'task1',
  title: 'Default Task Title',
  description: '', // TaskContent doesn't directly use this
  completed: false,
  tags: [], // TaskContent doesn't directly use this
  file: { path: 'default/path.md', name: 'path.md', extension: 'md', stat: { ctime:0, mtime:0, size:0 } },
  subtasks: [], // TaskContent doesn't directly use this
  duration: 60,
  startISO: '2023-01-01T10:00:00Z',
  endISO: '2023-01-01T11:00:00Z',
  notes: '',
  priority: 0,
  rrule: '',
  sortOrder: 0,
  page: false,
  path: 'default/path.md',
  status: 'incomplete', // Added status
  ...overrides,
});

// --- Test Suite ---

describe('TaskContent Component', () => {
  let storeTestUtils: any;
  let mockTask: ActualTaskProps;
  let defaultProps: TaskContentProps;

  beforeEach(() => {
    jest.clearAllMocks();
    storeTestUtils = jest.requireMock('../app/store').__testUtils;
    storeTestUtils.resetMockSettings();

    mockTask = createMockTask();
    defaultProps = {
      task: mockTask,
      isLink: false,
      lineHeightNormal: '1.5',
      onOpenTask: jest.fn(),
      taskPath: mockTask.file!.path, // Using file.path for taskPath
      hasLengthDrag: false,
      dndAttributes: { id: 'dnd-attr-id', role: 'button', tabIndex: 0, 'aria-roledescription': 'draggable', 'aria-describedby': 'DndContext-0' }, // Basic DND attributes
      dndListeners: { onMouseDown: jest.fn(), onKeyDown: jest.fn() } as any, // Basic DND listeners
      // Optional DND props for length/deadline, can be undefined if not relevant to a specific test
      mainTaskDragging: false,
      setLengthNodeRef: jest.fn(),
      lengthAttributes: { id: 'len-attr-id', role: 'button', tabIndex: 0, 'aria-roledescription': 'draggable', 'aria-describedby': 'DndContext-0' },
      lengthListeners: { onMouseDown: jest.fn() } as any,
      setDeadlineNodeRef: jest.fn(),
      deadlineAttributes: { id: 'dead-attr-id', role: 'button', tabIndex: 0, 'aria-roledescription': 'draggable', 'aria-describedby': 'DndContext-0' },
      deadlineListeners: { onMouseDown: jest.fn() } as any,
    };
  });

  test('renders TaskTitle and TaskDetails', () => {
    render(<TaskContent {...defaultProps} />);
    expect(screen.getByTestId('task-title')).toBeInTheDocument();
    expect(screen.getByTestId('task-details')).toBeInTheDocument();
  });

  test('passes correct props to TaskTitle', () => {
    render(<TaskContent {...defaultProps} />);
    expect(require('./TaskTitle')).toHaveBeenCalledWith(
      expect.objectContaining({
        title: mockTask.title,
        priority: mockTask.priority,
        isLink: defaultProps.isLink,
        status: mockTask.status,
        lineHeightNormal: defaultProps.lineHeightNormal,
        onOpenTask: defaultProps.onOpenTask,
        taskPath: defaultProps.taskPath,
      }),
      {}
    );
  });

  test('passes correct props to TaskDetails', () => {
    const propsWithLengthDrag = { ...defaultProps, hasLengthDrag: true, mainTaskDragging: true, startISO: '2023-01-01T09:00:00Z' };
    render(<TaskContent {...propsWithLengthDrag} />);
    expect(require('./TaskDetails')).toHaveBeenCalledWith(
      expect.objectContaining({
        task: mockTask,
        startISO: propsWithLengthDrag.startISO,
        hasLengthDrag: propsWithLengthDrag.hasLengthDrag,
        dragging: propsWithLengthDrag.mainTaskDragging,
        setLengthNodeRef: propsWithLengthDrag.setLengthNodeRef,
        lengthAttributes: propsWithLengthDrag.lengthAttributes,
        lengthListeners: propsWithLengthDrag.lengthListeners,
        setDeadlineNodeRef: propsWithLengthDrag.setDeadlineNodeRef,
        deadlineAttributes: propsWithLengthDrag.deadlineAttributes,
        deadlineListeners: propsWithLengthDrag.deadlineListeners,
      }),
      {}
    );
  });

  // Tests for conditional rendering of tags, path, notes, subtasks, MarkdownRenderer
  // are NOT APPLICABLE to TaskContent.tsx directly.
  // These should be tested in the component responsible for them (e.g., TaskDetails.tsx).
  test.skip('conditional rendering tests are for child components', () => {});
});
