import React from 'react';
import { render, act } from '@testing-library/react';
import Block, { BlockComponentProps, UNGROUPED } from './Block'; // Import UNGROUPED as well
import { TaskPriorities } from 'src/types/enums';

// 1. Mock @dnd-kit/core
jest.mock('@dnd-kit/core', () => ({
  useDraggable: jest.fn(() => ({
    setNodeRef: jest.fn(),
    attributes: {},
    listeners: {},
    setActivatorNodeRef: jest.fn(),
  })),
}));

// 2. Mock ../services/util
jest.mock('../services/util', () => ({
  getChildren: jest.fn((task, tasks) => []), // Default to no children
  getHeading: jest.fn(() => UNGROUPED), // Default to ungrouped
  isDateISO: jest.fn(() => false),
  parseFileFromPath: jest.fn(() => ''),
  roundMinutes: jest.fn((dateTime) => dateTime), // Passthrough for simplicity
  splitHeading: jest.fn((path) => ({ file: path, heading: '' })),
  toISO: jest.fn((dateTime, endOfDay) => dateTime?.toISO() || new Date().toISOString()),
}));

// 3. Mock ../app/store
jest.mock('../app/store', () => {
  // Define these inside the factory for correct hoisting
  const mockUseAppStoreImplementation = (selector: (state: any) => any) => {
    const mockState = {
      tasks: {},
      dailyNoteInfo: { format: 'YYYY-MM-DD', folder: '', template: '' },
      settings: {
        groupBy: false,
        twentyFourHourFormat: false,
        hideTimes: false,
        viewMode: 'day',
        borders: false,
      },
      fileOrder: [],
      collapsed: {},
      showingPastDates: false,
    };
    return selector(mockState);
  };
  const mockSetters = {
    patchCollapsed: jest.fn(),
  };

  return {
    useAppStore: jest.fn((selector) => mockUseAppStoreImplementation(selector)),
    setters: mockSetters,
    getters: {
      // Mock specific getters if an error points to them
    }
  };
});

// Mock child components to simplify rendering if they cause issues
// Using an object to ensure jest.fn() is only called once for Button due to portal re-render
const Mocks = {
    Button: jest.fn((props: any) => <button data-testid="mock-button" {...props} />)
};
jest.mock('./Button', () => (props: any) => Mocks.Button(props));
jest.mock('./Droppable', () => (props: any) => <div data-testid="mock-droppable" {...props} />);
jest.mock('./Group', () => (props: any) => <div data-testid="mock-group" {...props} />);
jest.mock('./Hours', () => (props: any) => <div data-testid="mock-hours" {...props} />);
jest.mock('./Minutes', () => (props: any) => <div data-testid="mock-minutes" {...props} />);


describe('Block Component', () => {
  const defaultProps: BlockComponentProps = {
    type: 'unscheduled', // A valid BlockType
    tasks: [],
    events: [],
    blocks: [],
    dragContainer: 'test-container',
    id: 'test-block-id',
    // Optional props can be added if needed for specific tests
    // startISO, endISO, title, parentId, dragging, hidePaths
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset useAppStore mock for each test by re-assigning its implementation from the factory scope
    // This is a bit complex due to the factory pattern. A simpler way would be to get the mock directly:
    const store = require('../app/store'); // This will get the mocked version
    // Example: if you needed to change the mockState for a specific test:
    // store.useAppStore.mockImplementation(customSelectorImpl);
    // For now, the default mockUseAppStoreImplementation from the factory is used.
    // We need to ensure that the mockUseAppStoreImplementation itself is fresh or its internal mocks are cleared.
    // The simplest for now is to rely on jest.clearAllMocks() to clear call counts on mockSetters.patchCollapsed, etc.
    // and ensure mockUseAppStoreImplementation is defined fresh in the factory for each test run (Jest caches the factory).
    // A more robust way for useAppStore is to mock its return value directly in beforeEach if state needs to change per test.
    // For this basic render test, the default factory mock is likely okay.
    store.useAppStore.mockImplementation((selector: any) => {
        const mockState = {
            tasks: {},
            dailyNoteInfo: { format: 'YYYY-MM-DD', folder: '', template: '' },
            settings: {
              groupBy: false,
              twentyFourHourFormat: false,
              hideTimes: false,
              viewMode: 'day',
              borders: false,
            },
            fileOrder: [],
            collapsed: {},
            showingPastDates: false,
          };
          return selector(mockState);
    });
  });

  it('renders without crashing for "unscheduled" type', () => {
    render(<Block {...defaultProps} />);
    // Basic check, e.g., for the main div
    expect(document.querySelector('[data-role="block"]')).toBeInTheDocument();
  });

  it('renders without crashing for "event" type', () => {
    render(<Block {...defaultProps} type="event" startISO="2023-10-26T10:00:00" endISO="2023-10-26T11:00:00" />);
    expect(document.querySelector('[data-role="block"]')).toBeInTheDocument();
  });

  it('renders without crashing for "child" type', () => {
    render(<Block {...defaultProps} type="child" />);
    expect(document.querySelector('[data-role="block"]')).toBeInTheDocument();
  });

  it('renders without crashing for "all-day" type', () => {
    render(<Block {...defaultProps} type="all-day" startISO="2023-10-26" />);
    expect(document.querySelector('[data-role="block"]')).toBeInTheDocument();
  });

  it('renders without crashing for "upcoming" type', () => {
    render(<Block {...defaultProps} type="upcoming" />);
    expect(document.querySelector('[data-role="block"]')).toBeInTheDocument();
  });

});
