import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TaskDetails, { TaskDetailsProps } from './TaskDetails';
import { TaskProps as ActualTaskProps } from '../types'; // Corrected import
import { TaskPriorities } from '../types/enums'; // Corrected import
import { DateTime } from 'luxon';

// --- Mocks ---

jest.mock('obsidian', () => ({
  setIcon: jest.fn(),
  Component: class MockComponent {},
}));

jest.mock('./Logo', () => jest.fn(({src}) => <div data-testid={`mock-logo-${src}`} />));

// --- Helper to create mock task data ---
const createMockTask = (overrides: Partial<ActualTaskProps> = {}): ActualTaskProps => ({
  id: 'task1',
  title: 'Default Task Title',
  completed: false,
  priority: TaskPriorities.DEFAULT,
  reminder: undefined,
  duration: { hour: 1, minute: 30 },
  due: undefined,
  description: '', tags: [], file: { path: 'default/path.md', name:'f.md', stat:{ctime:0,mtime:0,size:0}, extension:'md' }, subtasks: [],
  project: undefined, startISO: '2023-01-01T10:00:00Z', endISO: '2023-01-01T11:00:00Z',
  notes: '', rrule: '', sortOrder: 0, page: false, path: 'default/path.md', status: 'incomplete',
  ...overrides,
});

// --- Test Suite ---

describe('TaskDetails Component', () => {
  let baseMockTask: ActualTaskProps;
  let defaultProps: TaskDetailsProps;

  beforeEach(() => {
    jest.clearAllMocks();
    baseMockTask = createMockTask();
    defaultProps = {
      task: baseMockTask,
      hasLengthDrag: false,
      dragging: false,
      setLengthNodeRef: jest.fn(),
      lengthAttributes: { id:'len-dnd', role:'button', tabIndex:0, 'aria-roledescription':'draggable', 'aria-describedby':'ctx' },
      lengthListeners: {} as any,
      setDeadlineNodeRef: jest.fn(),
      deadlineAttributes: { id:'dead-dnd', role:'button', tabIndex:0, 'aria-roledescription':'draggable', 'aria-describedby':'ctx' },
      deadlineListeners: {} as any,
    };
  });

  test('renders null if dragging is true', () => {
    const { container } = render(<TaskDetails {...defaultProps} dragging={true} />);
    expect(container.firstChild).toBeNull();
  });

  describe('Priority Display', () => {
    test('renders priority if HIGH', () => {
      const taskWithPriority = createMockTask({ priority: TaskPriorities.HIGH });
      render(<TaskDetails {...defaultProps} task={taskWithPriority} />);
      expect(screen.getByText('!!')).toBeInTheDocument();
    });

    test('renders priority if HIGHEST', () => {
      const taskWithPriority = createMockTask({ priority: TaskPriorities.HIGHEST });
      render(<TaskDetails {...defaultProps} task={taskWithPriority} />);
      expect(screen.getByText('!!!')).toBeInTheDocument();
    });

    test('does not render priority if DEFAULT', () => {
      render(<TaskDetails {...defaultProps} task={createMockTask({ priority: TaskPriorities.DEFAULT })} />);
      expect(screen.queryByText('!!!')).not.toBeInTheDocument();
      expect(screen.queryByText('!!')).not.toBeInTheDocument();
      expect(screen.queryByText('!')).not.toBeInTheDocument();
    });
  });

  describe('Reminder Display', () => {
    const reminderTime = '2023-10-26T10:30:00';
    const reminderDateOnly = '2023-10-26';

    test('renders reminder with time if task.reminder exists and task not completed', () => {
      const taskWithReminder = createMockTask({ reminder: reminderTime, completed: false });
      render(<TaskDetails {...defaultProps} task={taskWithReminder} />);
      expect(screen.getAllByTestId('mock-logo-alarm-clock').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(`10/26${reminderTime.slice(10)}`).length).toBeGreaterThanOrEqual(1);
    });

    test('renders reminder with date only if task.reminder has no time part and task not completed', () => {
        const taskWithReminder = createMockTask({ reminder: reminderDateOnly, completed: false });
        render(<TaskDetails {...defaultProps} task={taskWithReminder} />);
        expect(screen.getAllByTestId('mock-logo-alarm-clock').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText(`10/26`).length).toBeGreaterThanOrEqual(1);
      });

    test('does not render reminder if task.reminder does not exist', () => {
      render(<TaskDetails {...defaultProps} task={createMockTask({ reminder: undefined })} />);
      expect(screen.queryByTestId('mock-logo-alarm-clock')).not.toBeInTheDocument();
    });

    test('does not render reminder if task is completed', () => {
      const taskWithReminderCompleted = createMockTask({ reminder: reminderTime, completed: true });
      render(<TaskDetails {...defaultProps} task={taskWithReminderCompleted} />);
      expect(screen.queryByTestId('mock-logo-alarm-clock')).not.toBeInTheDocument();
    });
  });

  describe('Duration Display (Length Drag)', () => {
    test('renders duration if hasLengthDrag is true and task.duration exists', () => {
      const taskWithDuration = createMockTask({ duration: { hour: 2, minute: 15 } });
      render(<TaskDetails {...defaultProps} task={taskWithDuration} hasLengthDrag={true} />);
      expect(screen.getByText('2h15m')).toBeInTheDocument();
    });

    test('renders empty content for zero duration if hasLengthDrag is true (current behavior)', () => {
      const taskWithZeroDuration = createMockTask({ duration: {hour: 0, minute: 0} });
      render(<TaskDetails {...defaultProps} task={taskWithZeroDuration} hasLengthDrag={true} />);
      const durationDiv = screen.getByText((content, element) => {
        return element?.classList.contains('task-duration') === true && content === '';
      });
      expect(durationDiv).toBeInTheDocument();
      expect(durationDiv).toBeEmptyDOMElement();
    });

    test('does not render duration section if hasLengthDrag is false', () => {
      const taskWithDuration = createMockTask({ duration: { hour: 1, minute: 0 } });
      render(<TaskDetails {...defaultProps} task={taskWithDuration} hasLengthDrag={false} />);
      expect(screen.queryByText('1h')).not.toBeInTheDocument();
      expect(screen.queryByText('length')).not.toBeInTheDocument();
    });
  });

  describe('Due Date Display', () => {
    const todayISO = DateTime.now().startOf('day').toISO();
    const dueDateISO = DateTime.now().plus({ days: 5 }).startOf('day').toISO();

    test('renders due date difference if task.due exists and task not completed', () => {
      const taskWithDue = createMockTask({ due: dueDateISO, completed: false });
      render(<TaskDetails {...defaultProps} task={taskWithDue} startISO={todayISO} />);
      expect(screen.getByText('5d')).toBeInTheDocument();
    });

    test('renders "due" placeholder if task.due is null and task not completed', () => {
      render(<TaskDetails {...defaultProps} task={createMockTask({ due: undefined, completed: false })} />);
      expect(screen.getByText('due')).toBeInTheDocument();
    });

    test('does not render due date section if task is completed', () => {
      const taskWithDueCompleted = createMockTask({ due: dueDateISO, completed: true });
      render(<TaskDetails {...defaultProps} task={taskWithDueCompleted} startISO={todayISO} />);
      expect(screen.queryByText('5d')).not.toBeInTheDocument();
      expect(screen.queryByText('due')).not.toBeInTheDocument();
    });
  });

  test.skip('Tags conditional rendering (moved to other component tests)', () => {});
  test.skip('File Path conditional rendering (moved to other component tests)', () => {});
  test.skip('Project conditional rendering (moved to other component tests)', () => {});
  test.skip('Description/Notes and MarkdownRenderer (moved to other component tests)', () => {});
  test.skip('Subtasks conditional rendering (moved to other component tests)', () => {});

});
