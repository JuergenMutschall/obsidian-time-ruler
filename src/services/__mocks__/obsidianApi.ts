// src/services/__mocks__/obsidianApi.ts

// This will be used for `import { getDailyNoteInfo } from '../services/obsidianApi'`
export const getDailyNoteInfo = jest.fn(async () => {
  return {
    format: "YYYY-MM-DD",
    folder: "mockFolderFrom__mocks__",
    template: "mockTemplateFrom__mocks__",
  };
});

// If the App.tsx was importing and using `new ObsidianAPI()` directly, we'd need to mock it here.
// However, App.tsx receives an *instance* of ObsidianAPI via props.
// The methods of that *instance* are mocked in App.test.tsx (mockObsidianAPI).
// The class 'ObsidianAPI' itself might be imported by other modules (like Search.tsx),
// so we provide a basic mock class structure here to allow it to be imported and extended
// without error, relying on the actual 'obsidian' mock for 'Component'.
class MockObsidianAPI {
  constructor(...args: any[]) {
    // console.log('MockObsidianAPI constructor called');
  }
  // Add any static methods if needed, or instance methods if this class is instantiated
  // and used beyond just being extended or type-checked.
  // For Search.tsx, it seems it's mostly type-checking or static usage.
}

export { MockObsidianAPI as ObsidianAPI };

// If other functions from the real obsidianApi.ts were directly imported, mock them here.
// e.g. export const openTaskInRuler = jest.fn();
