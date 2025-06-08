const ActualObsidianAPIModule = jest.requireActual('./obsidianApi'); // Simplified
const ObsidianAPI = ActualObsidianAPIModule.default;
import { DEFAULT_SETTINGS } from '../main'; // Adjust path for settings
import { App } from 'obsidian'; // For type, will be mocked
// getAPI as getDataviewAPI -- not needed if we use jest.mock directly on the module path
// import { getAPI as getDataviewAPI } from 'obsidian-dataview';

// Mock the dataview API
// It's generally better to put jest.mock at the top level of the module.
// We will mock the 'obsidian-dataview' module.

const mockDvPagesWhere = jest.fn(function(this: any, predicate) {
  const actualData = (this as any)._actualData || [];
  const filtered = actualData.filter(predicate);
  // Make where chainable by returning the object with filtered data or a new mock
  return { ...this, _actualDataFiltered: filtered, length: filtered.length, map: (cb: any) => filtered.map(cb), filter: (cb: any) => filtered.filter(cb), where: mockDvPagesWhere, array: () => filtered };
});

const mockDvFileTasksWhere = jest.fn(function(this: any, predicate) {
  const actualData = (this as any)._actualData || [];
  const filtered = actualData.filter(predicate);
  return { ...this, _actualDataFiltered: filtered, length: filtered.length, map: (cb: any) => filtered.map(cb), filter: (cb: any) => filtered.filter(cb), where: mockDvFileTasksWhere, array: () => filtered };
});


const mockDvPages = jest.fn(); // This will be the function returned by getAPI().pages

jest.mock('obsidian-dataview', () => ({
  ...jest.requireActual('obsidian-dataview'), // Import and retain default exports, though we override getAPI
  getAPI: jest.fn(() => ({
    index: { initialized: true },
    pages: mockDvPages, // Use the mockDvPages function here
  })),
}));

jest.mock('obsidian', () => ({
  ...jest.requireActual('obsidian'),
  Notice: jest.fn(),
  Platform: { isMobile: false }, // Default mock
  // Add other parts of 'obsidian' module if needed by tested code
}));


describe('ObsidianAPI', () => {
  let mockApp: any;
  let mockSetSetting: jest.Mock;
  let obsidianApi: InstanceType<typeof ObsidianAPI>;
  let mockSettings: typeof DEFAULT_SETTINGS;

  beforeEach(() => {
    mockApp = {
      vault: {
        getConfig: jest.fn().mockReturnValue([]), // Default for userIgnoreFilters
        read: jest.fn().mockResolvedValue(''),
        process: jest.fn(async (file, cb) => cb('')), // Make it async to match real usage
        create: jest.fn().mockResolvedValue({} as any), // Mock TFile creation
        getAbstractFileByPath: jest.fn().mockReturnValue(null), // Default to file not found
        modify: jest.fn().mockResolvedValue(undefined), // Mock file modification
      },
      metadataCache: {
        on: jest.fn(),
        // Add other metadataCache mocks if used by tested methods
      },
      workspace: {
        on: jest.fn(),
        // Add other workspace mocks
      },
      fileManager: {
        processFrontMatter: jest.fn(async (file, cb) => cb({})), // Mock frontmatter processing
      }
    };
    mockSetSetting = jest.fn();
    // Deep clone DEFAULT_SETTINGS to ensure each test gets a fresh copy
    mockSettings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));

    console.log("ActualObsidianAPIModule:", ActualObsidianAPIModule);
    console.log("ObsidianAPI (ActualObsidianAPIModule.default):", ObsidianAPI);
    obsidianApi = new ObsidianAPI(mockSettings as any, mockSetSetting, mockApp as App);

    // Reset and configure mockDvPages for each test
    // This structure simulates Dataview's DataArray more closely
    const pagesDataArrayMock = {
        where: mockDvPagesWhere,
        map: jest.fn(function(this:any, cb) { return (this._actualDataFiltered || this._actualData || []).map(cb); }),
        filter: jest.fn(function(this:any, cb) { return (this._actualDataFiltered || this._actualData || []).filter(cb); }),
        array: jest.fn(function(this:any) { return (this._actualDataFiltered || this._actualData || []); }),
        length: 0,
        values: [],
        file: { // This 'file' property should exist on the items *within* pages, not on DataArray itself.
                // The structure `basicSearch['file']['tasks']` implies basicSearch is a DataArray of page-like objects.
                // So, items returned by basicSearch.where(...) should have a .file.tasks structure.
                // This part of the mock needs careful alignment with how dv.pages().file.tasks works.
                // For now, we'll assume `pages` returns items that might have a `file.tasks` structure.
                // The mock below for `file.tasks` is more for the `DataArray<STask>` part.
        },
        _actualData: [], // For setting mock data for pages() result
        _actualDataFiltered: [],
    };

    const fileTasksDataArrayMock = {
        where: mockDvFileTasksWhere,
        map: jest.fn(function(this:any, cb) { return (this._actualDataFiltered || this._actualData || []).map(cb); }),
        filter: jest.fn(function(this:any, cb) { return (this._actualDataFiltered || this. _actualData || []).filter(cb); }),
        array: jest.fn(function(this:any) { return (this._actualDataFiltered || this._actualData || []); }),
        length: 0,
        values: [],
        _actualData: [],
        _actualDataFiltered: [],
    };

    // When dv.pages() is called, it returns an object that has a .where method,
    // and also simulates being an array-like object for .map, .filter, .array
    // Crucially, the items *within* this array-like object (representing pages)
    // must have a `file.tasks` structure, where `tasks` is another DataArray.
    mockDvPages.mockImplementation((query: string) => {
        // The data set in _actualData should be an array of page-like objects.
        // Each page-like object needs a `file.tasks` that is a DataArray mock.
        const pageData = (pagesDataArrayMock as any)._actualData.map((page: any) => ({
            ...page,
            file: {
                ...(page.file || {}),
                tasks: { // Each page's file.tasks is a new DataArray mock
                    ...fileTasksDataArrayMock,
                    _actualData: page.file?.tasks?._actualData || [] // Populate with specific task data for this page
                }
            }
        }));

        return {
            ...pagesDataArrayMock,
            _actualData: pageData, // Pages data
             // Simulate direct iteration if dv.pages() result is directly iterated
            [Symbol.iterator]: function*() {
                for (let item of this._actualData) yield item;
            },
            // Ensure map, filter, etc. operate on the pageData
            map: jest.fn(function(this:any, cb) { return (this._actualDataFiltered || this._actualData || []).map(cb); }),
            filter: jest.fn(function(this:any, cb) { return (this._actualDataFiltered || this._actualData || []).filter(cb); }),
            array: jest.fn(function(this:any) { return (this._actualDataFiltered || this._actualData || []); }),
            length: (pagesDataArrayMock as any)._actualData.length,
            values: (pagesDataArrayMock as any)._actualData,
        };
    });

    // Clear mocks on where functions
    mockDvPagesWhere.mockClear();
    mockDvFileTasksWhere.mockClear();
    (pagesDataArrayMock as any)._actualData = [];
    (fileTasksDataArrayMock as any)._actualData = [];

  });

  describe('searchTasks', () => {
    test('should return empty array if dataview returns no pages or tasks', () => {
      // dv.pages() will be called, and by default, its _actualData is []
      // and its items' file.tasks._actualData is also []
      const dailyNoteInfo = { folder: '/', format: 'YYYY-MM-DD', template: '' };
      const tasks = obsidianApi.searchTasks('', dailyNoteInfo, false, ['2023-01-01', '2023-01-31']);
      expect(tasks).toEqual([]);
      expect(mockDvPages).toHaveBeenCalled();
    });

    test('should filter tasks based on completion status (show incomplete)', () => {
      const dailyNoteInfo = { folder: '/', format: 'YYYY-MM-DD', template: '' };
      const mockFileTasks = [
        { text: 'Incomplete Task', completed: false, path: 'file1.md', status: ' ', position: {start:{line:0,col:0,offset:0}, end:{line:0,col:0,offset:0}}, children: [], id: 't1' },
        { text: 'Completed Task', completed: true, path: 'file1.md', status: 'x', position: {start:{line:1,col:0,offset:0}, end:{line:1,col:0,offset:0}}, children: [], id: 't2' },
      ];

      // Simulate dv.pages() returning one page, and that page's tasks are mockFileTasks
      (mockDvPages() as any)._actualData = [{
        file: {
          path: 'file1.md',
          tasks: { _actualData: mockFileTasks } // This structure is key
        }
      }];
      // Ensure the .where on file.tasks uses the _actualData set above
      // This part is tricky because `basicSearch['file']['tasks']` assumes basicSearch is a single page object,
      // but it's a DataArray. The iteration or selection of a single page from basicSearch needs to be considered.
      // The original code: `taskSearch = (basicSearch['file']['tasks'] as DataArray<STask>).where(...)`
      // This line is problematic if basicSearch is a DataArray. It should be something like:
      // taskSearch = basicSearch.flatMap(page => page.file.tasks).where(...)
      // For the test, we'll assume the mock setup correctly leads to mockFileTasks being the input to the STask filter.
      // The current mock for dv.pages() will return an object where each item has `file.tasks` configured.
      // The line `(basicSearch['file']['tasks'] as DataArray<STask>)` is a direct access, which might
      // not work as intended if basicSearch has multiple pages.
      // However, if basicSearch is treated as a single page for `['file']['tasks']` access,
      // then the mock needs `mockDvPages().file.tasks._actualData = mockFileTasks;`
      // Let's refine the mock for `dv.pages()` return to better suit this structure for the test.

      const singlePageWithTasks = {
          file: {
              path: 'file1.md',
              tasks: { // This object should behave like a DataArray
                  where: mockDvFileTasksWhere,
                  _actualData: mockFileTasks,
                  map: jest.fn(function(this:any, cb) { return (this._actualDataFiltered || this._actualData || []).map(cb); }),
                  filter: jest.fn(function(this:any, cb) { return (this._actualDataFiltered || this._actualData || []).filter(cb); }),
                  array: jest.fn(function(this:any) { return (this._actualDataFiltered || this._actualData || []); }),
                  [Symbol.iterator]: function*() { for (let item of this._actualData) yield item; },
                  length: mockFileTasks.length,
                  values: mockFileTasks,

              }
          },
          // Add other page properties if _filterPage uses them
      };
      // Mock dv.pages to return a DataArray containing this single page
      (mockDvPages() as any)._actualData = [singlePageWithTasks];
      // Also, for the problematic line: `(basicSearch['file']['tasks']`, if basicSearch is the DataArray itself
      // this implies basicSearch itself needs a `file.tasks` property. This is unlikely for Dataview.
      // The structure `(basicSearch['file']['tasks'] as DataArray<STask>)` is what the original code uses.
      // This implies `basicSearch` is NOT a DataArray itself but the result of `dv.pages(...)` which *then* has `file.tasks`.
      // This is confusing. Let's assume `dv.pages()` returns something that then has `.file.tasks`.
      // The current mock for `getAPI().pages` returns `mockDvPages`. So `mockDvPages` should return the object with `.file.tasks`.

      mockDvPages.mockReturnValue({ // This is `basicSearch`
          where: mockDvPagesWhere, // for pages
          file: { // This makes `basicSearch['file']` work
              tasks: { // This makes `basicSearch['file']['tasks']` work
                  where: mockDvFileTasksWhere, // for tasks
                  _actualData: mockFileTasks, // Populate tasks here
                  map: jest.fn(function(this:any, cb) { return (this._actualDataFiltered || this._actualData || []).map(cb); }),
                  array: jest.fn(function(this:any) { return (this._actualDataFiltered || this._actualData || []); }),
                   [Symbol.iterator]: function*() { for (let item of this._actualData) yield item; },
              }
          },
          _actualData: [singlePageWithTasks], // for pages.where filter
          map: jest.fn(function(this:any, cb) { return (this._actualDataFiltered || this._actualData || []).map(cb); }),
          array: jest.fn(function(this:any) { return (this._actualDataFiltered || this._actualData || []); }),
           [Symbol.iterator]: function*() { for (let item of this._actualData) yield item; },
      });


      const tasks = obsidianApi.searchTasks('', dailyNoteInfo, false, ['2023-01-01', '2023-01-31']);
      expect(tasks.length).toBe(1);
      expect(tasks[0].title).toBe('Incomplete Task');
    });

    test('should filter tasks based on completion status (show completed)', () => {
      mockSettings.showCompleted = true;
      obsidianApi = new ObsidianAPI(mockSettings as any, mockSetSetting, mockApp as App);

      const dailyNoteInfo = { folder: '/', format: 'YYYY-MM-DD', template: '' };
      const mockFileTasks = [
        { text: 'Incomplete Task', completed: false, path: 'file1.md', status: ' ', position: {start:{line:0,col:0,offset:0}, end:{line:0,col:0,offset:0}}, children: [], id: 't1' },
        { text: 'Completed Task', completed: true, path: 'file1.md', status: 'x', position: {start:{line:1,col:0,offset:0}, end:{line:1,col:0,offset:0}}, children: [], id: 't2' },
      ];

      mockDvPages.mockReturnValue({
          where: mockDvPagesWhere,
          file: {
              tasks: {
                  where: mockDvFileTasksWhere,
                  _actualData: mockFileTasks,
                  map: jest.fn(function(this:any, cb) { return (this._actualDataFiltered || this._actualData || []).map(cb); }),
                  array: jest.fn(function(this:any) { return (this._actualDataFiltered || this._actualData || []); }),
                   [Symbol.iterator]: function*() { for (let item of this._actualData) yield item; },
              }
          },
          _actualData: [{ file: { path: 'file1.md', tasks: { _actualData: mockFileTasks } } }], // For page search
          map: jest.fn(function(this:any, cb) { return (this._actualDataFiltered || this._actualData || []).map(cb); }),
          array: jest.fn(function(this:any) { return (this._actualDataFiltered || this._actualData || []); }),
           [Symbol.iterator]: function*() { for (let item of this._actualData) yield item; },
      });
      (mockDvPages() as any)._actualData = [{ file: { path: 'file1.md', tasks: { _actualData: mockFileTasks } } }];


      const tasks = obsidianApi.searchTasks('', dailyNoteInfo, true, ['2023-01-01', '2023-01-31']);
      expect(tasks.length).toBe(1);
      expect(tasks[0].title).toBe('Completed Task');
    });

    // Add more tests for other filters: dateBounds, customStatus, excludePaths, etc.

            test('filters by dateBounds for incomplete tasks (scheduled on or before dateBounds[1])', () => {
              mockSettings.showCompleted = false;
              obsidianApi = new ObsidianAPI(mockSettings as any, mockSetSetting, mockApp as App);
              const dailyNoteInfo = { folder: '/', format: 'YYYY-MM-DD', template: '' };
              const dateBounds: [string, string] = ['2023-01-10', '2023-01-20'];

              const mockFileTasks = [
                { text: 'Task before bounds', completed: false, path: 'file.md', status: ' ', scheduled: '2023-01-05', position: {start:{line:0,col:0,offset:0}, end:{line:0,col:0,offset:0}}, children: [], id: 't1' },
                { text: 'Task within bounds (start)', completed: false, path: 'file.md', status: ' ', scheduled: '2023-01-10', position: {start:{line:0,col:0,offset:0}, end:{line:0,col:0,offset:0}}, children: [], id: 't2' },
                { text: 'Task within bounds (end)', completed: false, path: 'file.md', status: ' ', scheduled: '2023-01-20', position: {start:{line:0,col:0,offset:0}, end:{line:0,col:0,offset:0}}, children: [], id: 't3' },
                { text: 'Task after bounds', completed: false, path: 'file.md', status: ' ', scheduled: '2023-01-25', position: {start:{line:0,col:0,offset:0}, end:{line:0,col:0,offset:0}}, children: [], id: 't4' },
              ];

              mockDvPages.mockReturnValue({
                where: mockDvPagesWhere,
                file: { tasks: { where: mockDvFileTasksWhere, _actualData: mockFileTasks, map: jest.fn(function(this:any, cb) { return (this._actualDataFiltered || this._actualData || []).map(cb); }), array: jest.fn(function(this:any) { return (this._actualDataFiltered || this._actualData || []); }), [Symbol.iterator]: function*() { for (let item of this._actualData) yield item; }}},
                _actualData: [{ file: { path: 'file.md', tasks: { _actualData: mockFileTasks } } }],
                map: jest.fn(function(this:any, cb) { return (this._actualDataFiltered || this._actualData || []).map(cb); }),
                array: jest.fn(function(this:any) { return (this._actualDataFiltered || this._actualData || []); }),
                [Symbol.iterator]: function*() { for (let item of this._actualData) yield item; },
              });

              const tasks = obsidianApi.searchTasks('', dailyNoteInfo, false, dateBounds);
              expect(tasks.length).toBe(3); // t1, t2, t3 (scheduled <= dateBounds[1])
              expect(tasks.map(t => t.title)).toEqual(expect.arrayContaining(['Task before bounds', 'Task within bounds (start)', 'Task within bounds (end)']));
            });

            test('filters by dateBounds for completed tasks (completion on or after dateBounds[0])', () => {
              mockSettings.showCompleted = true;
              obsidianApi = new ObsidianAPI(mockSettings as any, mockSetSetting, mockApp as App);
              const dailyNoteInfo = { folder: '/', format: 'YYYY-MM-DD', template: '' };
              const dateBounds: [string, string] = ['2023-01-10', '2023-01-20'];

              const mockFileTasks = [
                { text: 'Task completed before bounds', completed: true, path: 'file.md', status: 'x', completion: '2023-01-05', position: {start:{line:0,col:0,offset:0}, end:{line:0,col:0,offset:0}}, children: [], id: 't1' },
                { text: 'Task completed within bounds (start)', completed: true, path: 'file.md', status: 'x', completion: '2023-01-10', position: {start:{line:0,col:0,offset:0}, end:{line:0,col:0,offset:0}}, children: [], id: 't2' },
                { text: 'Task completed within bounds (end)', completed: true, path: 'file.md', status: 'x', completion: '2023-01-20', position: {start:{line:0,col:0,offset:0}, end:{line:0,col:0,offset:0}}, children: [], id: 't3' },
                { text: 'Task completed after bounds', completed: true, path: 'file.md', status: 'x', completion: '2023-01-25', position: {start:{line:0,col:0,offset:0}, end:{line:0,col:0,offset:0}}, children: [], id: 't4' },
              ];

              mockDvPages.mockReturnValue({
                where: mockDvPagesWhere,
                file: { tasks: { where: mockDvFileTasksWhere, _actualData: mockFileTasks, map: jest.fn(function(this:any, cb) { return (this._actualDataFiltered || this._actualData || []).map(cb); }), array: jest.fn(function(this:any) { return (this._actualDataFiltered || this._actualData || []); }), [Symbol.iterator]: function*() { for (let item of this._actualData) yield item; }}},
                _actualData: [{ file: { path: 'file.md', tasks: { _actualData: mockFileTasks } } }],
                 map: jest.fn(function(this:any, cb) { return (this._actualDataFiltered || this._actualData || []).map(cb); }),
                array: jest.fn(function(this:any) { return (this._actualDataFiltered || this._actualData || []); }),
                [Symbol.iterator]: function*() { for (let item of this._actualData) yield item; },
              });

              const tasks = obsidianApi.searchTasks('', dailyNoteInfo, true, dateBounds);
              expect(tasks.length).toBe(3); // t2, t3, t4 (completion >= dateBounds[0])
              expect(tasks.map(t => t.title)).toEqual(expect.arrayContaining(['Task completed within bounds (start)', 'Task completed within bounds (end)', 'Task completed after bounds']));
            });

            test('filters by customStatus (include)', () => {
              mockSettings.customStatus = { include: true, statuses: '-' };
              obsidianApi = new ObsidianAPI(mockSettings as any, mockSetSetting, mockApp as App);
              const dailyNoteInfo = { folder: '/', format: 'YYYY-MM-DD', template: '' };

              const mockFileTasks = [
                { text: 'Custom status task', completed: false, path: 'file.md', status: '-', position: {start:{line:0,col:0,offset:0}, end:{line:0,col:0,offset:0}}, children: [], id: 't1' },
                { text: 'Normal task', completed: false, path: 'file.md', status: ' ', position: {start:{line:0,col:0,offset:0}, end:{line:0,col:0,offset:0}}, children: [], id: 't2' },
                { text: 'Completed task', completed: true, path: 'file.md', status: 'x', position: {start:{line:0,col:0,offset:0}, end:{line:0,col:0,offset:0}}, children: [], id: 't3' },
              ];
              mockDvPages.mockReturnValue({
                where: mockDvPagesWhere,
                file: { tasks: { where: mockDvFileTasksWhere, _actualData: mockFileTasks, map: jest.fn(function(this:any, cb) { return (this._actualDataFiltered || this._actualData || []).map(cb); }), array: jest.fn(function(this:any) { return (this._actualDataFiltered || this._actualData || []); }), [Symbol.iterator]: function*() { for (let item of this._actualData) yield item; }}},
                _actualData: [{ file: { path: 'file.md', tasks: { _actualData: mockFileTasks } } }],
                 map: jest.fn(function(this:any, cb) { return (this._actualDataFiltered || this._actualData || []).map(cb); }),
                array: jest.fn(function(this:any) { return (this._actualDataFiltered || this._actualData || []); }),
                [Symbol.iterator]: function*() { for (let item of this._actualData) yield item; },
              });

              const tasks = obsidianApi.searchTasks('', dailyNoteInfo, false, ['2023-01-01', '2023-01-31']);
              expect(tasks.length).toBe(1);
              expect(tasks[0].title).toBe('Custom status task');
            });

            test('filters by customStatus (exclude)', () => {
              mockSettings.customStatus = { include: false, statuses: '/' };
              obsidianApi = new ObsidianAPI(mockSettings as any, mockSetSetting, mockApp as App);
              const dailyNoteInfo = { folder: '/', format: 'YYYY-MM-DD', template: '' };

              const mockFileTasks = [
                { text: 'Excluded status task', completed: false, path: 'file.md', status: '/', position: {start:{line:0,col:0,offset:0}, end:{line:0,col:0,offset:0}}, children: [], id: 't1' },
                { text: 'Normal task', completed: false, path: 'file.md', status: ' ', position: {start:{line:0,col:0,offset:0}, end:{line:0,col:0,offset:0}}, children: [], id: 't2' },
              ];
               mockDvPages.mockReturnValue({
                where: mockDvPagesWhere,
                file: { tasks: { where: mockDvFileTasksWhere, _actualData: mockFileTasks, map: jest.fn(function(this:any, cb) { return (this._actualDataFiltered || this._actualData || []).map(cb); }), array: jest.fn(function(this:any) { return (this._actualDataFiltered || this._actualData || []); }), [Symbol.iterator]: function*() { for (let item of this._actualData) yield item; }}},
                _actualData: [{ file: { path: 'file.md', tasks: { _actualData: mockFileTasks } } }],
                 map: jest.fn(function(this:any, cb) { return (this._actualDataFiltered || this._actualData || []).map(cb); }),
                array: jest.fn(function(this:any) { return (this._actualDataFiltered || this._actualData || []); }),
                [Symbol.iterator]: function*() { for (let item of this._actualData) yield item; },
              });

              const tasks = obsidianApi.searchTasks('', dailyNoteInfo, false, ['2023-01-01', '2023-01-31']);
              expect(tasks.length).toBe(1);
              expect(tasks[0].title).toBe('Normal task');
            });

            test('filters by taskSearch setting', () => {
              mockSettings.taskSearch = "keyword";
              obsidianApi = new ObsidianAPI(mockSettings as any, mockSetSetting, mockApp as App);
              const dailyNoteInfo = { folder: '/', format: 'YYYY-MM-DD', template: '' };

              const mockFileTasks = [
                { text: 'Task with keyword here', completed: false, path: 'file.md', status: ' ', position: {start:{line:0,col:0,offset:0}, end:{line:0,col:0,offset:0}}, children: [], id: 't1' },
                { text: 'Another task', completed: false, path: 'file.md', status: ' ', position: {start:{line:0,col:0,offset:0}, end:{line:0,col:0,offset:0}}, children: [], id: 't2' },
              ];
              mockDvPages.mockReturnValue({
                where: mockDvPagesWhere,
                file: { tasks: { where: mockDvFileTasksWhere, _actualData: mockFileTasks, map: jest.fn(function(this:any, cb) { return (this._actualDataFiltered || this._actualData || []).map(cb); }), array: jest.fn(function(this:any) { return (this._actualDataFiltered || this._actualData || []); }), [Symbol.iterator]: function*() { for (let item of this._actualData) yield item; }}},
                _actualData: [{ file: { path: 'file.md', tasks: { _actualData: mockFileTasks } } }],
                 map: jest.fn(function(this:any, cb) { return (this._actualDataFiltered || this._actualData || []).map(cb); }),
                array: jest.fn(function(this:any) { return (this._actualDataFiltered || this._actualData || []); }),
                [Symbol.iterator]: function*() { for (let item of this._actualData) yield item; },
              });

              const tasks = obsidianApi.searchTasks('', dailyNoteInfo, false, ['2023-01-01', '2023-01-31']);
              expect(tasks.length).toBe(1);
              expect(tasks[0].title).toBe('Task with keyword here');
            });

            test('processes page-based tasks correctly', () => {
              const dailyNoteInfo = { folder: '/', format: 'YYYY-MM-DD', template: '' };
              const mockPages = [
                { file: { path: 'page1.md', name: 'Page Task 1', tasks: { where: jest.fn().mockReturnValue([]), _actualData: [], map: jest.fn().mockReturnValue([]), array: jest.fn().mockReturnValue([])} }, title: 'Page Task 1', scheduled: '2023-01-15', tags: ['#pageTag'] }
              ];
              // Mock that dv.pages().where() returns these pages
              (mockDvPages() as any)._actualData = mockPages;
              // Mock that file.tasks.where() for these pages returns empty
              // This is handled by the structure of mockPages items

              const tasks = obsidianApi.searchTasks('', dailyNoteInfo, false, ['2023-01-01', '2023-01-31']);
              expect(tasks.length).toBe(1);
              expect(tasks[0].title).toBe('Page Task 1');
              expect(tasks[0].page).toBe(true);
              expect(tasks[0].tags).toContain('#pageTag');
            });

  });
});
