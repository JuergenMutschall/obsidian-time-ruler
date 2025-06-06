import { textToTask, pageToTask, taskToText, taskToPage } from '../../services/parser';
import { TaskPriorities, priorityKeyToNumber, priorityNumberToKey, keyToTasksEmoji, priorityNumberToSimplePriority } from '../../types/enums';
import { AppState } from '../../app/store';
import { STask, Literal, PageMetadata }from 'obsidian-dataview';
import { DateTime, Duration } from 'luxon';

const mockDailyNoteInfoData: AppState['dailyNoteInfo'] = {
  format: 'YYYY-MM-DD',
  folder: '',
  template: '',
};

const createMockSTaskItem = (text: string, partialItem: Partial<STask> = {}): any => {
  return {
    text, path: partialItem.path || 'mock/path.md', tags: partialItem.tags || [], outlinks: partialItem.outlinks || [],
    section: partialItem.section || { path: 'mock/path.md', subpath: undefined, line: partialItem.line || 0, type: 'list', blockTag: undefined, position: { start: { line:0, col:0, offset:0}, end: {line:0,col:0,offset:0}}},
    line: partialItem.line || 0, children: partialItem.children || [], status: partialItem.status || ' ',
    position: partialItem.position || { start: { line: 0, col: 0, offset: 0 }, end: { line: 0, col: 0, offset: 0 } },
    completed: partialItem.completed || false, scheduled: partialItem.scheduled || undefined, due: partialItem.due || undefined,
    created: partialItem.created || undefined, completion: partialItem.completion || undefined, start: partialItem.start || undefined,
    priority: partialItem.priority || undefined, repeat: partialItem.repeat || undefined, length: partialItem.length || undefined,
    duration: partialItem.duration || undefined, parent: partialItem.parent || undefined, subtasks: partialItem.subtasks || [],
    real: partialItem.real || true, symbol: partialItem.symbol || '-',
    header: partialItem.header || { path: 'mock/path.md', subpath: undefined, line: 0, type: 'list', blockTag: undefined, position: { start: { line:0, col:0, offset:0}, end: {line:0,col:0,offset:0}}},
    query: partialItem.query || undefined, ...partialItem,
  };
};

const createMockFileMetadata = (overrides: Partial<PageMetadata> = {}): PageMetadata => {
  return {
    path: 'mock/page.md', name: 'Mock Page', tags: new Set<string>(), aliases: new Set<string>(), outlinks: [], inlinks: [],
    mtime: DateTime.now(), ctime: DateTime.now(), size: 100, frontmatter: {}, ...overrides,
  };
};

const createMockPageItem = (
  fileData: Partial<PageMetadata>,
  itemData: Record<string, Literal> = {}
): Record<string, Literal> & { file: PageMetadata } => {
  return { file: createMockFileMetadata(fileData), ...itemData };
};

const createBaseTaskProps = (overrides: Partial<TaskProps> = {}): TaskProps => {
  return {
    id: 'mock/path::1', type: 'task', title: 'Default Title', originalTitle: 'Default Title',
    originalText: '- [ ] Default Title', status: ' ', completed: false, priority: TaskPriorities.DEFAULT,
    path: 'mock/path.md', fieldFormat: 'simple', page: false, children: [], tags: [], links: [],
    position: { start: { line: 0, col: 0, offset: 0 }, end: { line: 0, col: 0, offset: 0 } },
    ...overrides,
  };
};

describe('textToTask', () => {
  describe('Simple Format Parsing', () => {
    it('should parse a simple task title correctly', () => {
      const itemText = '- [ ] A simple task title';
      const mockItem = createMockSTaskItem(itemText, { line: 5 });
      const defaultFormat = 'simple';
      const expectedOutput: Partial<TaskProps> = {
        id: 'mock/path::5', title: 'A simple task title', originalTitle: 'A simple task title', originalText: itemText, status: ' ', completed: false, priority: TaskPriorities.DEFAULT, path: 'mock/path.md', fieldFormat: 'simple', type: 'task', page: false, children: [], tags: [], links: [],
      };
      const result = textToTask(mockItem, mockDailyNoteInfoData, defaultFormat);
      expect(result.id).toBe(expectedOutput.id); expect(result.title).toBe(expectedOutput.title); expect(result.originalTitle).toBe(expectedOutput.originalTitle); expect(result.originalText).toBe(expectedOutput.originalText); expect(result.status).toBe(expectedOutput.status); expect(result.completed).toBe(expectedOutput.completed); expect(result.priority).toBe(expectedOutput.priority); expect(result.path).toBe(expectedOutput.path); expect(result.fieldFormat).toBe(expectedOutput.fieldFormat); expect(result.type).toBe(expectedOutput.type); expect(result.page).toBe(expectedOutput.page); expect(result.children).toEqual(expectedOutput.children); expect(result.tags).toEqual(expectedOutput.tags); expect(result.links).toEqual(expectedOutput.links); expect(result.due).toBeUndefined(); expect(result.scheduled).toBeUndefined(); expect(result.duration).toBeUndefined(); expect(result.notes).toBeUndefined();
    });
    it('should parse a simple task with a due date', () => {
      const itemText = '- [ ] Task with due date > 2023-12-31';
      const mockItem = createMockSTaskItem(itemText, { line: 6 });
      const defaultFormat = 'simple';
      const expectedOutput: Partial<TaskProps> = { id: 'mock/path::6', title: 'Task with due date', originalTitle: 'Task with due date', due: '2023-12-31', fieldFormat: 'simple' };
      const result = textToTask(mockItem, mockDailyNoteInfoData, defaultFormat);
      expect(result.title).toBe(expectedOutput.title); expect(result.originalTitle.trim()).toBe(expectedOutput.originalTitle?.trim()); expect(result.due).toBe(expectedOutput.due); expect(result.fieldFormat).toBe(expectedOutput.fieldFormat);
    });
    it('should parse a simple task with a priority', () => {
      const itemText = '- [ ] Task with high priority !';
      const mockItem = createMockSTaskItem(itemText, { line: 7 });
      const defaultFormat = 'simple';
      const expectedOutput: Partial<TaskProps> = { id: 'mock/path::7', title: 'Task with high priority', originalTitle: 'Task with high priority', priority: TaskPriorities.MEDIUM, fieldFormat: 'simple' };
      const result = textToTask(mockItem, mockDailyNoteInfoData, defaultFormat);
      expect(result.title).toBe(expectedOutput.title); expect(result.originalTitle.trim()).toBe(expectedOutput.originalTitle?.trim()); expect(result.priority).toBe(expectedOutput.priority); expect(result.fieldFormat).toBe(expectedOutput.fieldFormat);
    });
    it('should parse a simple task with a scheduled date and time', () => {
      const itemText = '- [ ] 2023-12-25 10:30 Task with scheduled date and time';
      const mockItem = createMockSTaskItem(itemText, { line: 8 });
      const defaultFormat = 'simple';
      const expectedOutput: Partial<TaskProps> = { id: 'mock/path::8', title: 'Task with scheduled date and time', originalTitle: 'Task with scheduled date and time', scheduled: '2023-12-25T10:30', fieldFormat: 'simple' };
      const result = textToTask(mockItem, mockDailyNoteInfoData, defaultFormat);
      expect(result.title).toBe(expectedOutput.title); expect(result.originalTitle.trim()).toBe(expectedOutput.originalTitle?.trim()); expect(result.scheduled).toBe(expectedOutput.scheduled); expect(result.fieldFormat).toBe(expectedOutput.fieldFormat);
    });
    it('should parse a simple task with scheduled time, due date, and priority', () => {
      const itemText = '- [ ] 2024-01-15 09:00 Combined simple task > 2024-01-20 !';
      const mockItem = createMockSTaskItem(itemText, { line: 9 });
      const defaultFormat = 'simple';
      const expectedOutput: Partial<TaskProps> = { id: 'mock/path::9', title: 'Combined simple task', originalTitle: 'Combined simple task', scheduled: '2024-01-15T09:00', due: '2024-01-20', priority: TaskPriorities.MEDIUM, fieldFormat: 'simple' };
      const result = textToTask(mockItem, mockDailyNoteInfoData, defaultFormat);
      expect(result.title).toBe(expectedOutput.title); expect(result.originalTitle.trim()).toBe(expectedOutput.originalTitle?.trim()); expect(result.scheduled).toBe(expectedOutput.scheduled); expect(result.due).toBe(expectedOutput.due); expect(result.priority).toBe(expectedOutput.priority); expect(result.fieldFormat).toBe(expectedOutput.fieldFormat);
    });
    it('should parse a task with recurrence (using tasks emoji)', () => {
      const itemText = '- [ ] Task with recurrence 🔁 weekly';
      const mockItem = createMockSTaskItem(itemText, { line: 10 });
      const defaultFormat = 'simple';
      const expectedOutput: Partial<TaskProps> = { id: 'mock/path::10', title: 'Task with recurrence', originalTitle: 'Task with recurrence', fieldFormat: 'tasks', repeat: 'weekly'};
      const result = textToTask(mockItem, mockDailyNoteInfoData, defaultFormat);
      expect(result.title).toBe(expectedOutput.title); expect(result.originalTitle.trim()).toBe(expectedOutput.originalTitle); expect(result.fieldFormat).toBe(expectedOutput.fieldFormat); expect(result.repeat).toBe(expectedOutput.repeat);
    });
  });
  describe('Tasks Format Parsing', () => {
    it('should parse a basic tasks format task title', () => {
      const itemText = '- [ ] Tasks format basic title';
      const mockItem = createMockSTaskItem(itemText, { line: 11 });
      const defaultFormatInTest = 'tasks';
      const expectedOutput: Partial<TaskProps> = { title: 'Tasks format basic title', originalTitle: 'Tasks format basic title', fieldFormat: 'tasks' };
      const result = textToTask(mockItem, mockDailyNoteInfoData, defaultFormatInTest);
      expect(result.title).toBe(expectedOutput.title); expect(result.originalTitle).toBe(expectedOutput.originalTitle); expect(result.fieldFormat).toBe(expectedOutput.fieldFormat);
    });
    it('should parse tasks format with due date 📅', () => {
      const itemText = '- [ ] Task with due date 📅 2024-03-10';
      const mockItem = createMockSTaskItem(itemText, { line: 12 });
      const defaultFormatInTest = 'tasks';
      const expectedOutput: Partial<TaskProps> = { title: 'Task with due date', originalTitle: 'Task with due date', fieldFormat: 'tasks', due: '2024-03-10'};
      const result = textToTask(mockItem, mockDailyNoteInfoData, defaultFormatInTest);
      expect(result.title).toBe(expectedOutput.title); expect(result.originalTitle.trim()).toBe(expectedOutput.originalTitle); expect(result.due).toBe(expectedOutput.due); expect(result.fieldFormat).toBe(expectedOutput.fieldFormat);
    });
    it('should parse tasks format with high priority ⏫', () => {
      const itemText = '- [ ] Task with high priority ⏫';
      const mockItem = createMockSTaskItem(itemText, { line: 13 });
      const defaultFormatInTest = 'tasks';
      const expectedOutput: Partial<TaskProps> = { title: 'Task with high priority', originalTitle: 'Task with high priority', fieldFormat: 'tasks', priority: TaskPriorities.HIGH};
      const result = textToTask(mockItem, mockDailyNoteInfoData, defaultFormatInTest);
      expect(result.title).toBe(expectedOutput.title); expect(result.originalTitle.trim()).toBe(expectedOutput.originalTitle); expect(result.priority).toBe(expectedOutput.priority); expect(result.fieldFormat).toBe(expectedOutput.fieldFormat);
    });
    it('should parse tasks format with scheduled date ⏳', () => {
      const itemText = '- [ ] Task with scheduled date ⏳ 2024-02-20';
      const mockItem = createMockSTaskItem(itemText, { line: 14 });
      const defaultFormatInTest = 'tasks';
      const expectedOutput: Partial<TaskProps> = { title: 'Task with scheduled date', originalTitle: 'Task with scheduled date', fieldFormat: 'tasks', scheduled: '2024-02-20'};
      const result = textToTask(mockItem, mockDailyNoteInfoData, defaultFormatInTest);
      expect(result.title).toBe(expectedOutput.title); expect(result.originalTitle.trim()).toBe(expectedOutput.originalTitle); expect(result.scheduled).toBe(expectedOutput.scheduled); expect(result.fieldFormat).toBe(expectedOutput.fieldFormat);
    });
    it('should parse tasks format with start date 🛫', () => {
      const itemText = '- [ ] Task with start date 🛫 2024-01-15';
      const mockItem = createMockSTaskItem(itemText, { line: 15 });
      const defaultFormatInTest = 'tasks';
      const expectedOutput: Partial<TaskProps> = { title: 'Task with start date', originalTitle: 'Task with start date', fieldFormat: 'tasks', start: '2024-01-15'};
      const result = textToTask(mockItem, mockDailyNoteInfoData, defaultFormatInTest);
      expect(result.title).toBe(expectedOutput.title); expect(result.originalTitle.trim()).toBe(expectedOutput.originalTitle); expect(result.start).toBe(expectedOutput.start); expect(result.fieldFormat).toBe(expectedOutput.fieldFormat);
    });
    it('should parse a complex tasks format task', () => {
      const itemText = '- [ ] Complex task ⏫ 📅 2024-03-10 ⏳ 2024-02-20 🛫 2024-01-15 🔁 daily';
      const mockItem = createMockSTaskItem(itemText, { line: 16 });
      const defaultFormatInTest = 'tasks';
      const expectedOutput: Partial<TaskProps> = { title: 'Complex task', originalTitle: 'Complex task', fieldFormat: 'tasks', priority: TaskPriorities.HIGH, due: '2024-03-10', scheduled: '2024-02-20', start: '2024-01-15', repeat: 'daily'};
      const result = textToTask(mockItem, mockDailyNoteInfoData, defaultFormatInTest);
      expect(result.title).toBe(expectedOutput.title); expect(result.originalTitle.trim()).toBe(expectedOutput.originalTitle); expect(result.priority).toBe(expectedOutput.priority); expect(result.due).toBe(expectedOutput.due); expect(result.scheduled).toBe(expectedOutput.scheduled); expect(result.start).toBe(expectedOutput.start); expect(result.repeat).toBe(expectedOutput.repeat); expect(result.fieldFormat).toBe(expectedOutput.fieldFormat);
    });
  });
  describe('Kanban Format Parsing', () => {
    it('should parse a basic kanban task with date', () => {
      const itemText = '- [ ] Kanban task @{2024-07-01}';
      const mockItem = createMockSTaskItem(itemText, { line: 17 });
      const defaultFormatInTest = 'simple';
      const expectedOutput: Partial<TaskProps> = { title: 'Kanban task', originalTitle: 'Kanban task', fieldFormat: 'kanban', scheduled: '2024-07-01'};
      const result = textToTask(mockItem, mockDailyNoteInfoData, defaultFormatInTest);
      expect(result.title).toBe(expectedOutput.title); expect(result.originalTitle.trim()).toBe(expectedOutput.originalTitle); expect(result.fieldFormat).toBe(expectedOutput.fieldFormat); expect(result.scheduled).toBe(expectedOutput.scheduled);
    });
    it('should parse a kanban task with date and time', () => {
      const itemText = '- [ ] Kanban task with time @{2024-07-01} @@{14:30}';
      const mockItem = createMockSTaskItem(itemText, { line: 18 });
      const defaultFormatInTest = 'simple';
      const expectedOutput: Partial<TaskProps> = { title: 'Kanban task with time', originalTitle: 'Kanban task with time', fieldFormat: 'kanban', scheduled: '2024-07-01T14:30'};
      const result = textToTask(mockItem, mockDailyNoteInfoData, defaultFormatInTest);
      expect(result.title).toBe(expectedOutput.title); expect(result.originalTitle.trim()).toBe(expectedOutput.originalTitle); expect(result.fieldFormat).toBe(expectedOutput.fieldFormat); expect(result.scheduled).toBe(expectedOutput.scheduled);
    });
  });
  describe('Edge Case Handling', () => {
    it('should handle an empty string input', () => {
      const itemText = '';
      const mockItem = createMockSTaskItem(itemText, { line: 19 });
      const defaultFormat = 'simple';
      const result = textToTask(mockItem, mockDailyNoteInfoData, defaultFormat);
      expect(result.title).toBe(''); expect(result.originalTitle).toBe(''); expect(result.priority).toBe(TaskPriorities.DEFAULT); expect(result.fieldFormat).toBe(defaultFormat);
    });
    it('should handle string with no specific task information', () => {
      const itemText = '- [ ] Just some random text';
      const mockItem = createMockSTaskItem(itemText, { line: 20 });
      const defaultFormat = 'simple';
      const result = textToTask(mockItem, mockDailyNoteInfoData, defaultFormat);
      expect(result.title).toBe('Just some random text'); expect(result.originalTitle).toBe('Just some random text'); expect(result.priority).toBe(TaskPriorities.DEFAULT); expect(result.due).toBeUndefined(); expect(result.scheduled).toBeUndefined();
    });
    it('should handle completely garbled input gracefully', () => {
      const itemText = '- [ ] @#$ This is !> very messy < dates? 2023-12-35';
      const mockItem = createMockSTaskItem(itemText, { line: 21 });
      const defaultFormat = 'simple';
      const result = textToTask(mockItem, mockDailyNoteInfoData, defaultFormat);
      expect(result.id).toBe('mock/path::21'); expect(result.title).toContain('This is !>'); expect(result.originalTitle).toContain('This is !>'); expect(result.originalText).toBe(itemText); expect(result.status).toBe(' '); expect(result.completed).toBe(false); expect(result.priority).toBe(TaskPriorities.DEFAULT); expect(result.due).toBeUndefined(); expect(result.scheduled).toBeUndefined(); expect(result.tags).toEqual([]); expect(result.links).toEqual([]); expect(['dataview', 'full-calendar', 'tasks', 'simple', 'kanban']).toContain(result.fieldFormat);
    });
  });
});

describe('pageToTask', () => {
  const defaultSettingsFormat = 'dataview';
  it('should parse a basic page item', () => {
    const mockPage = createMockPageItem({ name: 'My Page Task', path: 'notes/My Page Task.md' });
    const result = pageToTask(mockPage, defaultSettingsFormat);
    expect(result.id).toBe('notes/My Page Task.md'); expect(result.title).toBe('My Page Task'); expect(result.priority).toBe(TaskPriorities.DEFAULT); expect(result.fieldFormat).toBe('dataview');
  });
  it('should parse page with dataview fields (scheduled, due, priority, repeat)', () => {
    const mockPage = createMockPageItem( { name: 'Dataview Page', path: 'pages/dv.md', tags: new Set(['#project']) }, { scheduled: DateTime.fromISO('2024-08-15'), due: DateTime.fromISO('2024-08-20'), priority: 'high', repeat: 'every week'});
    const result = pageToTask(mockPage, defaultSettingsFormat);
    expect(result.scheduled).toBe('2024-08-15'); expect(result.due).toBe('2024-08-20'); expect(result.priority).toBe(priorityKeyToNumber['high']); expect(result.repeat).toBe('every week'); expect(result.tags).toEqual(['#project']); expect(result.fieldFormat).toBe('dataview');
  });
  it('should parse page with full-calendar fields (date, allDay)', () => {
    const mockPage = createMockPageItem( { name: 'All Day Event Page' }, { date: DateTime.fromISO('2024-09-10'), allDay: true });
    const result = pageToTask(mockPage, defaultSettingsFormat);
    expect(result.scheduled).toBe('2024-09-10'); expect(result.fieldFormat).toBe('full-calendar');
  });
  it('should parse page with full-calendar fields (date, startTime, endTime) and calculate duration', () => {
    const pageDate = DateTime.fromISO('2024-09-11');
    const mockPage = createMockPageItem( { name: 'Timed Event Page' }, { date: pageDate, startTime: '10:00', endTime: '11:30'});
    const result = pageToTask(mockPage, defaultSettingsFormat);
    expect(result.scheduled).toBe(pageDate.toISODate() + 'T10:00'); expect(result.fieldFormat).toBe('full-calendar'); expect(result.duration).toEqual({ hour: 1, minute: 30 });
  });
  it('should handle completed page task with completion date', () => {
    const mtime = DateTime.fromISO('2024-01-20T12:00:00');
    const mockPage = createMockPageItem( { name: 'Completed Page', path: 'archive/done.md', mtime }, { completed: true, completion: DateTime.fromISO('2024-01-19')});
    const result = pageToTask(mockPage, defaultSettingsFormat);
    expect(result.completed).toBe(true); expect(result.completion).toBe('2024-01-19');
  });
  it('should use file mtime for completion if completed=true and no completion date', () => {
    const mtime = DateTime.fromISO('2024-01-20T12:00:00');
    const mockPage = createMockPageItem( { name: 'Completed Page No Date', path: 'archive/done2.md', mtime }, { completed: true });
    const result = pageToTask(mockPage, defaultSettingsFormat);
    expect(result.completed).toBe(true); expect(result.completion).toBe(mtime.toISODate());
  });
  it('should parse page with reminder, created, and start dates', () => {
    const reminderTime = DateTime.fromISO('2024-10-01T10:00:00'); const createdTime = DateTime.fromISO('2024-09-01T12:00:00'); const startTime = DateTime.fromISO('2024-09-15T09:00:00');
    const mockPage = createMockPageItem( { name: 'Page With More Dates' }, { reminder: reminderTime, created: createdTime, start: startTime });
    const result = pageToTask(mockPage, defaultSettingsFormat);
    expect(result.reminder).toBe('2024-10-01T10:00'); expect(result.created).toBe('2024-09-01T12:00'); expect(result.start).toBe('2024-09-15T09:00');
  });
  it('should parse page with length or duration object', () => {
    const mockPageWithLength = createMockPageItem( { name: 'Page With Length' }, { length: Duration.fromObject({ hours: 2, minutes: 30 }) });
    let resultL = pageToTask(mockPageWithLength, defaultSettingsFormat); expect(resultL.duration).toEqual({ hour: 2, minute: 30 });
    const mockPageWithDuration = createMockPageItem( { name: 'Page With Duration' }, { duration: Duration.fromObject({ hours: 1, minutes: 15 }) });
    let resultD = pageToTask(mockPageWithDuration, defaultSettingsFormat); expect(resultD.duration).toEqual({ hour: 1, minute: 15 });
  });
});

describe('taskToText', () => {
  const defaultPluginFormat: FieldFormat['main'] = 'simple';
  it('should convert a basic simple task to text', () => {
    const taskProps = createBaseTaskProps({ originalTitle: 'Simple task', title: 'Simple task', originalText: '- [ ] Simple task', fieldFormat: 'simple', tags: ['#tag1']});
    const expectedText = '- [ ] Simple task #tag1 ';
    const result = taskToText(taskProps, defaultPluginFormat); expect(result.trim()).toBe(expectedText.trim());
  });
  it('should convert a simple task with due date and priority to text', () => {
    const taskProps = createBaseTaskProps({ originalTitle: 'Due and prio task', title: 'Due and prio task', originalText: '- [ ] Due and prio task > 2024-10-15 !', fieldFormat: 'simple', due: '2024-10-15', priority: TaskPriorities.MEDIUM });
    const expectedText = `- [ ] Due and prio task   > ${taskProps.due} ${priorityNumberToSimplePriority[taskProps.priority]}`;
    const result = taskToText(taskProps, defaultPluginFormat); expect(result.trim()).toBe(expectedText.trim());
  });
  it('should convert a simple task with scheduled date and time to text', () => {
    const taskProps = createBaseTaskProps({ originalTitle: 'Scheduled task', title: 'Scheduled task', originalText: '- [ ] 2024-10-16 14:30 Scheduled task', fieldFormat: 'simple', scheduled: '2024-10-16T14:30', path: 'some/other/file.md'});
    const expectedText = `- [ ] 2024-10-16 14:30 Scheduled task`;
    const result = taskToText(taskProps, defaultPluginFormat); expect(result.trim()).toBe(expectedText.trim());
  });
  it('should convert a simple task with duration to text', () => {
    const taskProps = createBaseTaskProps({ originalTitle: 'Task with duration', title: 'Task with duration', originalText: '- [ ] Task with duration', fieldFormat: 'simple', duration: { hour: 1, minute: 30 }});
    const expectedText = `- [ ] Task with duration   [duration:: 1h30m]`;
    const result = taskToText(taskProps, defaultPluginFormat); expect(result.trim()).toBe(expectedText.trim());
  });
  describe('Tasks Format Output', () => {
    it('should convert a basic task to tasks format text', () => {
      const taskProps = createBaseTaskProps({ originalTitle: 'Basic tasks task', title: 'Basic tasks task', originalText: '- [ ] Basic tasks task ⏳ 2023-01-01', fieldFormat: 'tasks'});
      const expectedText = '- [ ] Basic tasks task';
      const result = taskToText(taskProps, 'tasks'); expect(result.trim()).toBe(expectedText.trim());
    });
    it('should convert task with due, scheduled, start, priority, repeat to tasks format', () => {
      const taskProps = createBaseTaskProps({ originalTitle: 'Full tasks task', title: 'Full tasks task', originalText: '- [ ] Full tasks task 🔁 daily 🛫 2024-01-15 ⏳ 2024-02-20 📅 2024-03-10 ⏫', fieldFormat: 'tasks', priority: TaskPriorities.HIGH, due: '2024-03-10', scheduled: '2024-02-20', start: '2024-01-15', repeat: 'daily'});
      let expectedText = '- [ ] Full tasks task '; expectedText += ` ${keyToTasksEmoji[priorityNumberToKey[TaskPriorities.HIGH]]}`; expectedText += ` ${keyToTasksEmoji.repeat} daily`; expectedText += ` ${keyToTasksEmoji.start} 2024-01-15`; expectedText += ` ${keyToTasksEmoji.scheduled} 2024-02-20`; expectedText += ` ${keyToTasksEmoji.due} 2024-03-10`;
      const result = taskToText(taskProps, 'tasks'); expect(result.trim()).toBe(expectedText.trim());
    });
    it('should include time for scheduled if present (tasks format)', () => {
      const taskProps = createBaseTaskProps({ originalTitle: 'Scheduled with time', title: 'Scheduled with time', originalText: '- [ ] Scheduled with time ⏳ 2024-02-20T11:00', fieldFormat: 'tasks', scheduled: '2024-02-20T11:00'});
      let expectedText = '- [ ] Scheduled with time '; expectedText += `  [startTime:: 11:00]`; expectedText += ` ${keyToTasksEmoji.scheduled} 2024-02-20`;
      const result = taskToText(taskProps, 'tasks'); expect(result.trim()).toBe(expectedText.trim());
    });
  });
  describe('Kanban Format Output', () => {
    it('should convert a task with scheduled date to kanban format', () => {
      const taskProps = createBaseTaskProps({ originalTitle: 'Kanban date task', title: 'Kanban date task', originalText: '- [ ] Kanban date task @{2024-07-01}', fieldFormat: 'kanban', scheduled: '2024-07-01'});
      const expectedText = '- [ ] Kanban date task  @{2024-07-01}';
      const result = taskToText(taskProps, 'kanban'); expect(result.trim()).toBe(expectedText.trim());
    });
    it('should convert a task with scheduled date and time to kanban format', () => {
      const taskProps = createBaseTaskProps({ originalTitle: 'Kanban datetime task', title: 'Kanban datetime task', originalText: '- [ ] Kanban datetime task @{2024-07-01} @@{14:30}', fieldFormat: 'kanban', scheduled: '2024-07-01T14:30'});
      const expectedText = '- [ ] Kanban datetime task  @{2024-07-01} @@{14:30}';
      const result = taskToText(taskProps, 'kanban'); expect(result.trim()).toBe(expectedText.trim());
    });
    it('should convert other fields like due, priority to [key:: value] in kanban', () => {
      const taskProps = createBaseTaskProps({ originalTitle: 'Kanban with extras', title: 'Kanban with extras', originalText: '- [ ] Kanban with extras @{2024-07-01}', fieldFormat: 'kanban', scheduled: '2024-07-01', due: '2024-07-10', priority: TaskPriorities.LOW});
      let expectedText = '- [ ] Kanban with extras  @{2024-07-01}'; expectedText += `  [due:: 2024-07-10]`; expectedText += `  [priority:: ${priorityNumberToKey[TaskPriorities.LOW]}]`;
      const result = taskToText(taskProps, 'kanban'); expect(result.trim()).toBe(expectedText.trim());
    });
  });
  describe('Reminder and Block Reference Output', () => {
    it('should format reminder - tasks style', () => {
      const taskProps = createBaseTaskProps({ originalTitle: 'Task with reminder', title: 'Task with reminder', originalText: '- [ ] Task with reminder ⏰ 2024-11-01 10:00', fieldFormat: 'tasks', reminder: '2024-11-01T10:00'});
      const expectedText = `- [ ] Task with reminder  ${keyToTasksEmoji.reminder} 2024-11-01T10:00`;
      const result = taskToText(taskProps, 'tasks'); expect(result.trim()).toBe(expectedText.trim());
    });
    it('should format reminder - native style', () => {
      const taskProps = createBaseTaskProps({ originalTitle: 'Native reminder', title: 'Native reminder', originalText: '- [ ] Native reminder (@2024-11-02 11:00)', fieldFormat: 'simple', reminder: '2024-11-02T11:00'});
      const expectedText = `- [ ] Native reminder`; // Simple format does NOT output reminders
      const result = taskToText(taskProps, 'simple'); expect(result.trim()).toBe(expectedText.trim());
    });
    it('should format reminder - kanban style', () => {
      const taskProps = createBaseTaskProps({ originalTitle: 'Kanban reminder', title: 'Kanban reminder', originalText: '- [ ] Kanban reminder @{2024-11-03 12:00}', fieldFormat: 'kanban', reminder: '2024-11-03T12:00', scheduled: '2024-11-03'});
      const expectedText = `- [ ] Kanban reminder  @{2024-11-03} @{2024-11-03T12:00}`;
      const result = taskToText(taskProps, 'kanban'); expect(result.trim()).toBe(expectedText.trim());
    });
    it('should append block reference', () => {
      const taskProps = createBaseTaskProps({ originalTitle: 'Task with blockref', title: 'Task with blockref', originalText: '- [ ] Task with blockref ^myblock', fieldFormat: 'simple', blockReference: '^myblock'});
      const expectedText = `- [ ] Task with blockref  ^myblock`;
      const result = taskToText(taskProps, 'simple'); expect(result.trim()).toBe(expectedText.trim());
    });
  });
});

describe('detectFieldFormat (via textToTask results)', () => {
  const defaultFormatForTest: FieldFormat['main'] = 'simple';
  it('should detect "simple" for SIMPLE_SCHEDULED_DATE', () => {
    const itemText = '2023-10-10 Task with simple scheduled date '; // Must start with date for this rule
    const mockItem = createMockSTaskItem(itemText);
    const result = textToTask(mockItem, mockDailyNoteInfoData, defaultFormatForTest);
    expect(result.fieldFormat).toBe('simple');
  });
  it('should detect "simple" for SIMPLE_DUE', () => {
    const itemText = '- [ ] Task with simple due date > 2023-10-11';
    const mockItem = createMockSTaskItem(itemText);
    const result = textToTask(mockItem, mockDailyNoteInfoData, defaultFormatForTest);
    expect(result.fieldFormat).toBe('simple');
  });
  it('should detect "tasks" for tasks emoji (e.g., ⏳)', () => {
    const itemText = '- [ ] Task with task emoji ⏳';
    const mockItem = createMockSTaskItem(itemText);
    const result = textToTask(mockItem, mockDailyNoteInfoData, defaultFormatForTest);
    expect(result.fieldFormat).toBe('tasks');
  });
  it('should detect "tasks" for other tasks emoji (e.g., 📅)', () => {
    const itemText = '- [ ] Task with other task emoji 📅';
    const mockItem = createMockSTaskItem(itemText);
    const result = textToTask(mockItem, mockDailyNoteInfoData, defaultFormatForTest);
    expect(result.fieldFormat).toBe('tasks');
  });
  it('should detect "kanban" for KANBAN_DATE', () => {
    const itemText = '- [ ] Task with kanban date @{2023-10-12}';
    const mockItem = createMockSTaskItem(itemText);
    const result = textToTask(mockItem, mockDailyNoteInfoData, defaultFormatForTest);
    expect(result.fieldFormat).toBe('kanban');
  });
  it('should detect "full-calendar" for [allDay:: true]', () => {
    const itemText = '- [ ] Task with [allDay:: true]';
    const mockItem = createMockSTaskItem(itemText);
    const result = textToTask(mockItem, mockDailyNoteInfoData, defaultFormatForTest);
    expect(result.fieldFormat).toBe('full-calendar');
  });
  it('should detect "full-calendar" for [date:: YYYY-MM-DD]', () => {
    const itemText = '- [ ] Task with [date:: 2023-10-13]';
    const mockItem = createMockSTaskItem(itemText);
    const result = textToTask(mockItem, mockDailyNoteInfoData, defaultFormatForTest);
    expect(result.fieldFormat).toBe('full-calendar');
  });
  it('should detect "full-calendar" for [startTime:: HH:mm]', () => {
    const itemText = '- [ ] Task with [startTime:: 10:00]';
    const mockItem = createMockSTaskItem(itemText);
    const result = textToTask(mockItem, mockDailyNoteInfoData, defaultFormatForTest);
    expect(result.fieldFormat).toBe('full-calendar');
  });
  it('should detect "full-calendar" for [endTime:: HH:mm]', () => {
    const itemText = '- [ ] Task with [endTime:: 11:00]';
    const mockItem = createMockSTaskItem(itemText);
    const result = textToTask(mockItem, mockDailyNoteInfoData, defaultFormatForTest);
    expect(result.fieldFormat).toBe('full-calendar');
  });
  it('should detect "dataview" for [scheduled:: YYYY-MM-DD]', () => {
    const itemText = '- [ ] Task with [scheduled:: 2023-10-14]';
    const mockItem = createMockSTaskItem(itemText);
    const result = textToTask(mockItem, mockDailyNoteInfoData, defaultFormatForTest);
    expect(result.fieldFormat).toBe('dataview');
  });
  it('should detect "dataview" for [due:: YYYY-MM-DD]', () => {
    const itemText = '- [ ] Task with [due:: 2023-10-15]';
    const mockItem = createMockSTaskItem(itemText);
    const result = textToTask(mockItem, mockDailyNoteInfoData, defaultFormatForTest);
    expect(result.fieldFormat).toBe('dataview');
  });
  it('should fallback to defaultFormat if no specific format cues are present', () => {
    const itemText = '- [ ] Task with no specific format cues';
    const mockItem = createMockSTaskItem(itemText);
    const specificDefaultFormat = 'kanban';
    const result = textToTask(mockItem, mockDailyNoteInfoData, specificDefaultFormat);
    expect(result.fieldFormat).toBe(specificDefaultFormat);
  });
  it('should prioritize "simple" if simple date and other formats are present', () => {
    const itemText = '2023-10-10 Task with simple date and [due:: 2023-10-15] and ⏳';
    const mockItem = createMockSTaskItem(itemText);
    const result = textToTask(mockItem, mockDailyNoteInfoData, defaultFormatForTest);
    expect(result.fieldFormat).toBe('simple');
  });
  it('should prioritize "tasks" if task emoji and other lower formats are present', () => {
    const itemText = '- [ ] Task with emoji ⏳ and [due:: 2023-10-15] and @{2023-10-12}';
    const mockItem = createMockSTaskItem(itemText);
    const result = textToTask(mockItem, mockDailyNoteInfoData, defaultFormatForTest);
    expect(result.fieldFormat).toBe('tasks');
  });
  it('should prioritize "kanban" if kanban date and dv/fc formats are present', () => {
    const itemText = '- [ ] Task with kanban @{2023-10-12} and [due:: 2023-10-15]';
    const mockItem = createMockSTaskItem(itemText);
    const result = textToTask(mockItem, mockDailyNoteInfoData, defaultFormatForTest);
    expect(result.fieldFormat).toBe('kanban');
  });
  it('should prioritize "full-calendar" if FC field and dataview field are present', () => {
    const itemText = '- [ ] Task with [date:: 2023-10-13] and [due:: 2023-10-15]';
    const mockItem = createMockSTaskItem(itemText);
    const result = textToTask(mockItem, mockDailyNoteInfoData, defaultFormatForTest);
    expect(result.fieldFormat).toBe('full-calendar');
  });
});
