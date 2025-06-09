import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Hours from './Hours';
import { BlockProps } from './Block'; // Assuming BlockProps is exported from Block.tsx

// 1. Mock ../services/util
jest.mock('../services/util', () => ({
  getEndISO: jest.fn((block) => block.endISO || block.startISO), // Define directly or use a variable from factory scope
}));

// 2. Mock ../app/store
let mockExtendBlocks = false;
let mockHideTimes = false;
let mockViewMode = 'day';

const mockUseAppStoreImplementation = (selector: (state: any) => any) => {
  const mockState = {
    settings: {
      extendBlocks: mockExtendBlocks,
      hideTimes: mockHideTimes,
      viewMode: mockViewMode,
    },
  };
  return selector(mockState);
};
jest.mock('../app/store', () => ({
  useAppStore: jest.fn((selector) => mockUseAppStoreImplementation(selector)),
}));

// 3. Mock child components
jest.mock('./Block', () => (props: any) => (
  <div data-testid="mock-block" data-startiso={props.startISO} data-endiso={props.endISO}>
    {props.events?.[0]?.title || props.tasks?.[0]?.content || 'Block'}
  </div>
));
jest.mock('./Minutes', () => (props: any) => (
  <div data-testid="mock-minutes" data-startiso={props.startISO} data-endiso={props.endISO} />
));


describe('Hours Component', () => {
  const baseDefaultProps = {
    startISO: '2023-10-27T10:00:00Z',
    endISO: '2023-10-27T12:00:00Z',
    blocks: [] as BlockProps[],
    dragContainer: 'test-hours-container',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock settings states
    mockExtendBlocks = false;
    mockHideTimes = false;
    mockViewMode = 'day';
    // Re-apply the mock implementation for useAppStore to pick up reset states
    (require('../app/store').useAppStore as jest.Mock).mockImplementation(mockUseAppStoreImplementation);
    // Reset getEndISO mock if its behavior needs to change per test, or rely on the factory's default
    const utilMock = jest.requireMock('../services/util');
    utilMock.getEndISO.mockImplementation((block: BlockProps) => block.endISO || block.startISO);
  });

  it('renders without crashing with no blocks', () => {
    render(<Hours {...baseDefaultProps} />);
    // Should render one Minutes component initially if !hideTimes
    expect(screen.getByTestId('mock-minutes')).toBeInTheDocument();
  });

  it('renders a single block correctly', () => {
    const block1: BlockProps = { startISO: '2023-10-27T10:00:00Z', endISO: '2023-10-27T10:30:00Z', tasks: [{id: 't1', content: 'Task 1'} as TaskProps], events: [], blocks: [] };
    render(<Hours {...baseDefaultProps} blocks={[block1]} />);

    expect(screen.getAllByTestId('mock-block')).toHaveLength(1);
    expect(screen.getByText('Task 1')).toBeInTheDocument();
    // Expect 2 Minutes components: one before block1, one after block1
    expect(screen.getAllByTestId('mock-minutes')).toHaveLength(2);
  });

  it('renders multiple blocks correctly', () => {
    const block1: BlockProps = { startISO: '2023-10-27T10:00:00Z', endISO: '2023-10-27T10:30:00Z', tasks: [{id: 't1', content: 'Task 1'} as TaskProps], events: [], blocks: [] };
    const block2: BlockProps = { startISO: '2023-10-27T11:00:00Z', endISO: '2023-10-27T11:30:00Z', events: [{id: 'e1', title: 'Event 1'} as EventProps], tasks: [], blocks: [] };
    render(<Hours {...baseDefaultProps} blocks={[block1, block2]} />);

    expect(screen.getAllByTestId('mock-block')).toHaveLength(2);
    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('Event 1')).toBeInTheDocument();
    // Expect 3 Minutes components: before b1, between b1-b2, after b2
    expect(screen.getAllByTestId('mock-minutes')).toHaveLength(3);
  });

  it('hides Minutes components when hideTimes is true', () => {
    mockHideTimes = true;
    (require('../app/store').useAppStore as jest.Mock).mockImplementation(mockUseAppStoreImplementation);
    const block1: BlockProps = { startISO: '2023-10-27T10:00:00Z', endISO: '2023-10-27T10:30:00Z', tasks: [{id: 't1', content: 'Task 1'} as TaskProps], events: [], blocks: [] };
    render(<Hours {...baseDefaultProps} blocks={[block1]} />);

    expect(screen.queryByTestId('mock-minutes')).not.toBeInTheDocument();
  });

  it('extends block endISO when extendBlocks is true and block is point event', () => {
    mockExtendBlocks = true;
    (require('../app/store').useAppStore as jest.Mock).mockImplementation(mockUseAppStoreImplementation);

    // Point event (startISO === endISO)
    const block1: BlockProps = { startISO: '2023-10-27T10:00:00Z', endISO: '2023-10-27T10:00:00Z', tasks: [{id: 't1', content: 'Point Task'} as TaskProps], events: [], blocks: [] };
    // Next block, to extend to
    const block2: BlockProps = { startISO: '2023-10-27T11:00:00Z', endISO: '2023-10-27T11:30:00Z', tasks: [], events: [], blocks: [] };

    // const utilMock = jest.requireMock('../services/util'); // Already available from beforeEach if needed for specific override
    // utilMock.getEndISO.mockImplementation((b) => b.endISO || b.startISO); // Default behavior from factory is likely fine

    render(<Hours {...baseDefaultProps} startISO='2023-10-27T09:00:00Z' endISO='2023-10-27T12:00:00Z' blocks={[block1, block2]} />);

    const renderedBlock1 = screen.getByText('Point Task').closest('[data-testid="mock-block"]');
    expect(renderedBlock1).toHaveAttribute('data-endiso', '2023-10-27T11:00:00Z'); // Extended to start of block2
  });

  it('extends block endISO to parent endISO if extendBlocks is true and no next block', () => {
    mockExtendBlocks = true;
    (require('../app/store').useAppStore as jest.Mock).mockImplementation(mockUseAppStoreImplementation);

    const block1: BlockProps = { startISO: '2023-10-27T10:00:00Z', endISO: '2023-10-27T10:00:00Z', tasks: [{id: 't1', content: 'Only Point Task'} as TaskProps], events: [], blocks: [] };

    render(<Hours {...baseDefaultProps} endISO='2023-10-27T12:00:00Z' blocks={[block1]} />);

    const renderedBlock1 = screen.getByText('Only Point Task').closest('[data-testid="mock-block"]');
    expect(renderedBlock1).toHaveAttribute('data-endiso', '2023-10-27T12:00:00Z'); // Extended to parent endISO
  });

});
