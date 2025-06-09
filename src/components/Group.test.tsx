import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Group, { GroupComponentProps } from './Group';
import { BlockType } from './Block';

const UNGROUPED = '__ungrouped';

// 1. Mock @dnd-kit/core
const mockUseDraggableDefault = {
  setNodeRef: jest.fn(),
  attributes: {},
  listeners: {},
  setActivatorNodeRef: jest.fn(),
};
jest.mock('@dnd-kit/core', () => ({
  useDraggable: jest.fn(() => mockUseDraggableDefault),
}));

// 2. Mock ../services/util
jest.mock('src/services/util', () => {
  const original = jest.requireActual('src/services/util');
  return {
    ...original,
    getHeading: jest.fn(),
    getParents: jest.fn(() => []),
    getSubHeading: jest.fn(() => UNGROUPED),
    parseFileFromPath: jest.fn((path) => (path ? path.split('/')[0] : '')),
    splitHeading: jest.fn((path) => {
      if (typeof path !== 'string' || path === UNGROUPED) return ['', ''];
      const parts = path.split('/');
      return [parts[0] || 'mockFile', parts.slice(1).join('/') || 'mockHeading'];
    }),
  };
});

// 3. Mock ../app/store
// This object's reference will be used by the mock. Tests can modify its properties via __testUtils.
const mockStoreStateForGroupTest = {
  collapsed: {} as Record<string, boolean>,
  dragData: null as DragData | null,
  settings: { groupBy: false as false | 'priority' | 'path' | 'hybrid' | 'tags' },
  dailyNoteInfo: { format: 'YYYY-MM-DD', folder: '', template: '' },
  fileOrder: [] as string[],
};

jest.mock('../app/store', () => {
  const mockSettersInFactory = {
    patchCollapsed: jest.fn((ids: string[], collapsed: boolean) => {
      ids.forEach((id) => mockStoreStateForGroupTest.collapsed[id] = collapsed);
    }),
  };

  return {
    useAppStore: jest.fn((selector) => selector(mockStoreStateForGroupTest)),
    setters: mockSettersInFactory,
    __testUtils: { // Expose for test setup
        setCollapsedState: (newState: Record<string, boolean>) => mockStoreStateForGroupTest.collapsed = newState,
        getCollapsedState: () => mockStoreStateForGroupTest.collapsed, // If needed for assertions
        setDragData: (newDragData: DragData | null) => mockStoreStateForGroupTest.dragData = newDragData,
        setGroupBySetting: (newGroupBy: false | 'priority' | 'path' | 'hybrid' | 'tags') => mockStoreStateForGroupTest.settings.groupBy = newGroupBy,
        setDailyNoteInfo: (newInfo: any) => mockStoreStateForGroupTest.dailyNoteInfo = newInfo,
        setFileOrder: (newOrder: string[]) => mockStoreStateForGroupTest.fileOrder = newOrder,
    }
  };
});

// 4. Mock child components
jest.mock('./Button', () => (props: any) => <button data-testid="mock-button" onClick={props.onClick} data-src={props.src} />);
jest.mock('./Droppable', () => (props: any) => <div data-testid="mock-droppable">{props.children}</div>);
jest.mock('./Task', () => (props: any) => <div data-testid={`mock-task-${props.id}`}>{props.content}</div>);


describe('Group Component', () => {
  const task1: TaskProps = { id: 'task-1', content: 'Task 1', path: 'file1.md', position: { start: { line: 1, col: 0, offset: 0 }, end: { line: 1, col: 0, offset: 0 }, indent: '', list: '-' } };
  const task2: TaskProps = { id: 'task-2', content: 'Task 2', path: 'file1.md', position: { start: { line: 2, col: 0, offset: 0 }, end: { line: 2, col: 0, offset: 0 }, indent: '', list: '-' } };

  const defaultProps: GroupComponentProps = {
    headingPath: 'file1.md/Mock Heading',
    tasks: [task1, task2],
    type: 'day' as BlockType,
    hidePaths: [],
    dragContainer: 'test-drag-container',
    startISO: '2023-10-27T10:00:00Z',
  };

  let storeTestUtils: any;
  let utilMocks: any;

  beforeEach(() => {
    jest.clearAllMocks();

    storeTestUtils = jest.requireMock('../app/store').__testUtils;
    storeTestUtils.setCollapsedState({});
    storeTestUtils.setDragData(null);
    storeTestUtils.setGroupBySetting(false);
    storeTestUtils.setDailyNoteInfo({ format: 'YYYY-MM-DD', folder: '', template: '' });
    storeTestUtils.setFileOrder([]);

    utilMocks = jest.requireMock('src/services/util');
    utilMocks.getSubHeading.mockReturnValue(UNGROUPED);
    utilMocks.splitHeading.mockImplementation((path: string): [string, string] => {
        if (path === UNGROUPED || typeof path !== 'string') return ['', ''];
        const parts = path.split('/');
        return [parts[0] || 'fileFromSplit', parts.slice(1).join('/') || 'headingFromSplit'];
    });
    utilMocks.parseFileFromPath.mockImplementation((path: string) => path ? path.split('/')[0] : '');
  });

  it('renders heading and tasks when not collapsed', () => {
    utilMocks.splitHeading.mockReturnValue(['file1.md', 'Mock Heading']);
    render(<Group {...defaultProps} />);

    expect(screen.getByText('Mock Heading')).toBeInTheDocument();
    expect(screen.getByText('file1')).toBeInTheDocument();
    expect(screen.getByTestId('mock-task-task-1')).toHaveTextContent('Task 1');
    expect(screen.getByTestId('mock-task-task-2')).toHaveTextContent('Task 2');
  });

  it('does not render tasks when collapsed', () => {
    storeTestUtils.setCollapsedState({ [defaultProps.headingPath]: true }); // Set initial state
    utilMocks.splitHeading.mockReturnValue(['file1.md', 'Mock Heading']);
    render(<Group {...defaultProps} />);

    expect(screen.getByText('Mock Heading')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-task-task-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mock-task-task-2')).not.toBeInTheDocument();
  });

  it('calls patchCollapsed on button click (expanded to collapsed)', () => {
    storeTestUtils.setCollapsedState({ [defaultProps.headingPath]: false }); // Ensure starts expanded
    utilMocks.splitHeading.mockReturnValue(['file1.md', 'Mock Heading']);
    render(<Group {...defaultProps} />);

    const collapseButton = screen.getAllByTestId('mock-button').find(button => button.getAttribute('data-src')?.includes('chevron'))!;
    expect(collapseButton).toBeInTheDocument();
    fireEvent.click(collapseButton);
    expect(jest.requireMock('../app/store').setters.patchCollapsed).toHaveBeenCalledWith([defaultProps.headingPath], true);
  });

  it('calls patchCollapsed on button click (collapsed to expanded)', () => {
    storeTestUtils.setCollapsedState({ [defaultProps.headingPath]: true }); // Ensure starts collapsed
    utilMocks.splitHeading.mockReturnValue(['file1.md', 'Mock Heading']);
    // Using a key to ensure React treats this as a new instance with fresh state from the store mock
    render(<Group {...defaultProps} key="collapsed-instance" />);

    const collapseButton = screen.getAllByTestId('mock-button').find(button => button.getAttribute('data-src')?.includes('chevron'))!;
    expect(collapseButton).toBeInTheDocument();
    fireEvent.click(collapseButton);
    expect(jest.requireMock('../app/store').setters.patchCollapsed).toHaveBeenCalledWith([defaultProps.headingPath], false);
  });

  it('renders UNGROUPED tasks directly without header if headingPath is UNGROUPED', () => {
    utilMocks.splitHeading.mockReturnValue(['', '']);
    render(<Group {...defaultProps} headingPath={UNGROUPED} tasks={[task1]} />);
    expect(screen.queryByText('Mock Heading from split')).not.toBeInTheDocument();
    expect(screen.queryByText('file1.md')).not.toBeInTheDocument();
    expect(screen.getByTestId('mock-task-task-1')).toBeInTheDocument();
  });

  it('renders subgroups if getSubHeading returns different paths', () => {
    const subGroupTask: TaskProps = { ...task1, id: 'subtask-1', content: 'Sub Task 1' };
    const tasksForThisTest = [task1, subGroupTask];

    utilMocks.getSubHeading
      .mockImplementationOnce(() => 'file1.md/SubGroup1')
      .mockImplementationOnce(() => UNGROUPED)
      .mockReturnValue(UNGROUPED);

    utilMocks.splitHeading
        .mockImplementation((path: string): [string, string] => {
            if (path === defaultProps.headingPath) return ['file1.md', 'Main Group'];
            if (path === 'file1.md/SubGroup1') return ['file1.md', 'SubGroup1'];
            if (path === UNGROUPED) return ['', ''];
            return [path, 'Default Heading'];
        });

    render(<Group {...defaultProps} tasks={tasksForThisTest} />);
    expect(screen.getByText('Main Group')).toBeInTheDocument();
    expect(screen.getByText('SubGroup1')).toBeInTheDocument();
    expect(screen.getByTestId('mock-task-subtask-1')).toHaveTextContent('Sub Task 1');
    expect(screen.getByTestId('mock-task-task-1')).toBeInTheDocument();
  });
});
