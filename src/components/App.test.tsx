import { render } from "@testing-library/react";
import App from "./App";
import { DEFAULT_SETTINGS } from "../main"; // Import DEFAULT_SETTINGS

import { render, act } from "@testing-library/react";
import App from "./App";
import { DEFAULT_SETTINGS } from "../main";

// Mock jQuery globally for tests
const mockScrollIntoView = jest.fn();
global.$ = jest.fn(() => ({
  // Mock other jQuery methods if needed by TimeRulerHeader or other components
  scrollIntoView: mockScrollIntoView,
  eq: jest.fn().mockReturnThis(), // For .eq(0)
  get: jest.fn(() => ({ scrollIntoView: mockScrollIntoView })), // for [0]
  on: jest.fn(), // if any event handlers are attached
  off: jest.fn(),
  // Add other common jQuery functions if they are used, e.g., css, attr
  css: jest.fn().mockReturnThis(),
  attr: jest.fn().mockReturnThis(),
})) as any;

// 1. Mock 'obsidian' module
jest.mock('obsidian', () => ({
  Component: class MockComponent {
    constructor() { /* no-op */ }
    load() { /* no-op */ }
    unload() { /* no-op */ }
  },
  Platform: { isMobile: false },
  Notice: jest.fn(),
  // Add other necessary Obsidian exports if they are directly used by modules under test
  // Minimal set for now:
  setIcon: jest.fn(),
  MarkdownView: class MockMarkdownView {}, // If ObsidianAPI or others import this
  TFile: class MockTFile {},             // If ObsidianAPI or others import this
  ItemView: class MockItemView { constructor() { this.leaf = { view: this, on: jest.fn(), open: jest.fn() }; this.app = { workspace: { on: jest.fn() } }; } getViewType() { return ''; } onOpen() { return Promise.resolve(); } onClose() { return Promise.resolve(); } }, // From manual mock
  Plugin: class MockPlugin {},             // For ObsidianAPI constructor
  PluginSettingTab: class MockPluginSettingTab {}, // For ObsidianAPI constructor
  App: jest.fn(() => ({ // From manual mock
    workspace: {
      getActiveViewOfType: jest.fn(),
      on: jest.fn(),
      openLinkText: jest.fn(),
    },
    metadataCache: {
      on: jest.fn(),
      getCache: jest.fn(),
    },
    vault: {
      read: jest.fn(),
      modify: jest.fn(),
      delete: jest.fn(),
      create: jest.fn(),
      getAbstractFileByPath: jest.fn(),
      getConfig: jest.fn().mockReturnValue({}),
      readConfigJson: jest.fn().mockResolvedValue({}),
      process: jest.fn(),
    },
    fileManager: {
      processFrontMatter: jest.fn(),
    },
  })),
}));

// 2. Mock '../services/obsidianApi' for getDailyNoteInfo
jest.mock('../services/obsidianApi', () => {
  const originalModule = jest.requireActual('../services/obsidianApi');
  return {
    __esModule: true,
    ...originalModule, // Keep other exports from the original module if not mocked
    getDailyNoteInfo: jest.fn(async () => ({
      format: "YYYY-MM-DD",
      folder: "mockFolder/AppTest", // Make it specific
      template: "mockTemplate",
    })),
    // ObsidianAPI class will be imported as is from original, but its methods are called on an *instance*
    // which we provide via props. So, we don't need to mock the class implementation here for the App test.
  };
});

// 3. Prepare mock instances for the `apis` prop
const mockObsidianApiInstance = {
  reload: jest.fn(),
  getSetting: jest.fn((key) => DEFAULT_SETTINGS[key as keyof typeof DEFAULT_SETTINGS]),
  loadTasks: jest.fn(),
  saveTask: jest.fn(),
  updateFileOrder: jest.fn(),
  playComplete: jest.fn(),
  app: { // A basic mock for the app object within ObsidianAPI instance
    workspace: {
      getActiveViewOfType: jest.fn(),
      on: jest.fn(),
      openLinkText: jest.fn(),
      // other app.workspace methods if needed by App.tsx execution paths
    },
    metadataCache: {
      on: jest.fn(), // Specifically for 'dataview:index-ready' if dv.index.initialized is false
      getCache: jest.fn(),
    },
    // other app methods/properties if needed
  } as any, // Cast to any for simplicity, or create a more detailed mock App type
  plugin: {} as any, // Mock plugin object
  settings: DEFAULT_SETTINGS, // Provide settings directly if used
};

const mockCalendarApiInstance = {
  loadEvents: jest.fn(),
};

const mockFullApisProp = {
  obsidian: mockObsidianApiInstance as any, // Cast to any for prop type matching
  calendar: mockCalendarApiInstance as any,
};

import { screen } from "@testing-library/react"; // Import screen

describe("App", () => {
  it("renders without crashing and shows the main container", async () => {
    // Use act to handle potential async operations during initial render (useEffect in AppInitializer)
    await act(async () => {
      render(<App apis={mockFullApisProp} />);
    });
    // Check if the main container with data-testid 'time-ruler-container' is rendered
    expect(screen.getByTestId('time-ruler-container')).toBeInTheDocument();
  });
});
