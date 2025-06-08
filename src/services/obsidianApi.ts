import $ from 'jquery'
import _, { escapeRegExp } from 'lodash'
import { DateTime } from 'luxon'
import { App, Component, MarkdownView, Notice, Platform, TFile } from 'obsidian'
import {
  DataArray,
  DataviewApi,
  Literal,
  PageMetadata,
  STask,
  getAPI,
} from 'obsidian-dataview'
import { AppState, getters, setters } from '../app/store'
import { sounds } from '../assets/assets'
import TimeRulerPlugin from '../main'
import { TaskPriorities } from '../types/enums'
import {
  getProperty,
  pageToTask,
  taskToPage,
  taskToText,
  textToTask,
} from './parser'
import {
  getHeading,
  getParentScheduled,
  getParents,
  parseDateFromPath,
  parseFileFromPath,
  parsePathFromDate,
  parseTaskDate,
  queryTasks,
  scrollToSection,
  toISO,
} from './util'
import invariant from 'tiny-invariant'
import { splitHeading } from './util'

let dv: DataviewApi

export default class ObsidianAPI extends Component {
  loadedFiles: Record<string, TaskProps[]>
  excludePaths?: RegExp
  dailyNotePath: RegExp
  private settings: TimeRulerPlugin['settings']
  app: App
  setSetting: (settings: Partial<TimeRulerPlugin['settings']>) => void

  constructor(
    settings: ObsidianAPI['settings'],
    setSetting: ObsidianAPI['setSetting'],
    app: App
  ) {
    super()
    dv = getAPI() as DataviewApi
    this.settings = settings
    this.setSetting = setSetting
    this.app = app
  }

  getSetting = <T extends keyof TimeRulerPlugin['settings']>(setting: T) =>
    this.settings[setting] as TimeRulerPlugin['settings'][T]

  playComplete() {
    if (this.settings.muted) return
    sounds.pop.currentTime = 0
    sounds.pop.play()
  }

  reload() {
    const excludePaths = this.app.vault.getConfig('userIgnoreFilters') as
      | string[]
      | undefined
    if (!excludePaths) return

    this.excludePaths = new RegExp(
      excludePaths.map((x) => `^${_.escapeRegExp(x)}`).join('|')
    )
  }

  searchTasks(
    path: string,
    dailyNoteInfo: AppState['dailyNoteInfo'],
    completed = false,
    dateBounds: [string, string]
  ) {
    const now = DateTime.now()
    const customStatuses = new RegExp(
      `[${escapeRegExp(this.settings.customStatus.statuses)}]`
    )
    let taskSearch: DataArray<STask>
    let pageSearch: DataArray<Record<string, Literal> & { file: PageMetadata }>

    try {
      let basicSearch = dv.pages(
        `"${path.replace(/"/g, '\\"')}" and (${this.settings.search || '""'})`
      ) as DataArray<Record<string, Literal> & { file: PageMetadata }>

      taskSearch = (basicSearch['file']['tasks'] as DataArray<STask>).where(
        (task) => this._filterSTask(task, now, customStatuses, completed, dateBounds)
      )

      pageSearch = basicSearch.where((page) =>
        this._filterPage(page, now, completed, dateBounds)
      )
    } catch (e) {
      new Notice(
        'Invalid Dataview query: ' + this.settings.search + '. Please fix.'
      )
      throw e
    }

    if (this.settings.filterFunction) {
      try {
        const filter = eval(this.settings.filterFunction)
        taskSearch = filter(taskSearch)
      } catch (err) {
        console.error(err)
        new Notice(
          'Time Ruler: Error in custom search filter function (check console); fix in settings.'
        )
        throw err
      }
    }

    if (this.settings.taskSearch) {
      taskSearch = taskSearch.filter((item) =>
        item.text.contains(this.settings.taskSearch)
      )
    }

    const processedTasks: TaskProps[] = pageSearch
      .map((page) => pageToTask(page, this.settings.fieldFormat))
      .concat(
        taskSearch.map((task) =>
          textToTask(task, dailyNoteInfo, this.settings.fieldFormat)
        )
      )
      .array()

    this._processTaskHierarchy(processedTasks);

    return processedTasks
  }

  private _testDateBounds(taskDateValue: Literal | undefined, completed: boolean, dateBounds: [string, string]): boolean {
    const taskDate = taskDateValue
    if (!DateTime.isDateTime(taskDate)) return true; // No date to test, so it passes
    const dateString = toISO(taskDate);
    // Incomplete looks at preceding tasks, complete looks at following tasks
    return completed
      ? dateString >= dateBounds[0]
      : dateString <= dateBounds[1];
  }

  private _filterSTask(task: STask, now: DateTime, customStatuses: RegExp, completed: boolean, dateBounds: [string, string]): boolean {
    const tested =
      (this.settings.showCompleted ||
        (completed && task.completed) ||
        (!completed && !task.completed)) &&
      customStatuses.test(task.status) ===
        this.settings.customStatus.include &&
      !(this.excludePaths && this.excludePaths.test(task.path)) &&
      !(
        task.start &&
        DateTime.isDateTime(task.start) &&
        now < task.start
      ) &&
      this._testDateBounds(task.scheduled ?? task.completion, completed, dateBounds); // Use generalized _testDateBounds

    return tested;
  }

  private _filterPage(page: Record<string, Literal> & { file: PageMetadata }, now: DateTime, completed: boolean, dateBounds: [string, string]): boolean {
    const pageCompleted = getProperty(page, 'completed');
    return (
      (pageCompleted === false ||
        pageCompleted === null ||
        ((completed || this.settings.showCompleted) &&
          pageCompleted === true)) &&
      !(this.excludePaths && this.excludePaths.test(page.file.path)) &&
      !(
        page.start &&
        DateTime.isDateTime(page.start) &&
        now < page.start
      ) &&
      this._testDateBounds(page.scheduled ?? page.completion, completed, dateBounds) // Use generalized _testDateBounds
    );
  }

  private _processTaskHierarchy(processedTasks: TaskProps[]): void {
    const tasksDict = _.fromPairs(processedTasks.map((task) => [task.id, task]));

    for (let task of processedTasks) {
      if (task.page) continue;
      // assign children where required
      if (!task.children) continue;
      for (let childId of task.children) { // Iterate over child IDs
        const childTask = tasksDict[childId];
        if (childTask) {
          childTask.parent = task.id;
        }
      }
    }

    for (let task of processedTasks) {
      if (!task.page) continue;
      task.children = []; // Initialize children array for page tasks
      for (let child of processedTasks.filter(
        (childCandidate) =>
          childCandidate.id !== task.id &&
          parseFileFromPath(task.path) === parseFileFromPath(childCandidate.path) &&
          !childCandidate.parent // Only assign if not already a child of a text-based task
      )) {
        child.parent = task.id;
        if (task.children && !task.children.includes(child.id)) { // Ensure children is defined and no duplicates
             task.children.push(child.id);
        }
      }
    }
  }

  forgetTasks(path: string) {
    const newTasks = { ...getters.get('tasks') }
    for (let [title, task] of Object.entries(newTasks).filter(([title, task]) =>
      task.path.includes(path)
    )) {
      delete newTasks[title]
    }
    setters.set({ tasks: newTasks })
  }

  loadTasks(path: string, completed: boolean) {
    if (!dv.index.initialized) {
      return
    }

    const dailyNoteInfo = getters.get('dailyNoteInfo')
    const searchWithinWeeks = getters.get('searchWithinWeeks')

    const showingPastDates = getters.get('showingPastDates')
    const dateBounds: [string, string] = showingPastDates
      ? [
          DateTime.now().minus({ weeks: searchWithinWeeks[1] }).toISODate(),
          DateTime.now().plus({ days: 1 }).toISODate(),
        ]
      : [
          DateTime.now().minus({ days: 1 }).toISODate(),
          DateTime.now().plus({ weeks: searchWithinWeeks[1] }).toISODate(),
        ]
    const tasks = this.searchTasks(path, dailyNoteInfo, completed, dateBounds)
    this.updateTasks([...tasks], path, completed)
  }

  updateTasks(processedTasks: TaskProps[], path: string, completed: boolean) {
    const fileOrderChanged = this._updateFileOrderIfNeeded(processedTasks);

    const updatedTasks = { ...getters.get('tasks') };
    const processedTaskIds = processedTasks.map(t => t.id);

    const tasksRemoved = this._removeObsoleteTasks(updatedTasks, processedTaskIds, path, completed);
    const tasksSynchronized = this._synchronizeTaskData(updatedTasks, processedTasks);

    if (!fileOrderChanged && !tasksRemoved && !tasksSynchronized) {
      // Check if query processing is still needed even if primary tasks didn't change.
      // Query results can change based on other tasks not in processedTasks.
      // For simplicity now, we'll proceed. A more complex check could see if any query-related fields changed.
      // The original code proceeded if 'updated' was true. 'updated' was set by removal or sync.
      // So, if neither of those happened, we can potentially return.
      // However, fileOrder changes also trigger a settings save.
      // Let's ensure query processing and settings save happen if anything changed.
      // The original `if (!updated) return` would cover tasksRemoved or tasksSynchronized.
      // If only fileOrderChanged, the original code would still run query processing and then save settings.
      // This seems fine.
    }

    this._processTaskQueries(updatedTasks);

    // Only call setters.set if there's a change to tasks or fileOrder (implicit from fileOrderChanged)
    // The original `if(!updated) return` meant that if tasks weren't removed or synchronized,
    // it would return. However, query processing could still change tasks.
    // The final setters.set always ran if `updated` was true.
    // Let's assume if fileOrderChanged, tasksRemoved, or tasksSynchronized is true, or if _processTaskQueries modified something (harder to check directly without deep compare), we save.
    // For now, always call setters.set as query processing might change things.
    // A more robust solution would be for _processTaskQueries to return a boolean if it made changes.
    setters.set({ tasks: updatedTasks, fileOrder: this.settings.fileOrder });
  }

  private _updateFileOrderIfNeeded(processedTasks: TaskProps[]): boolean {
    const newFiles = _.uniq(
      processedTasks.map((task) => parseFileFromPath(task.path))
    )
      .filter((heading) => !this.settings.fileOrder.includes(heading))
      .sort();

    if (newFiles.length > 0) {
      const newHeadingOrder = [...this.settings.fileOrder];
      for (let heading of newFiles) {
        const afterFile = newHeadingOrder.findIndex(
          (otherHeading) => otherHeading > heading
        );
        if (afterFile === -1) newHeadingOrder.push(heading);
        else newHeadingOrder.splice(afterFile, 0, heading);
      }
      this.setSetting({
        fileOrder: newHeadingOrder,
      });
      return true; // Indicates that the file order was changed
    }
    return false; // No change to file order
  }

  private _removeObsoleteTasks(currentTasks: Record<string, TaskProps>, processedTaskIds: string[], path: string, completed: boolean): boolean {
    let removed = false;
    const pathName = path.replace('.md', '');
    const showCompleted = getters.get('settings').showCompleted;

    for (let { id } of Object.values(currentTasks).filter(
      (task) =>
        task.id.startsWith(pathName) && // Ensure we only check tasks relevant to the current path context
        (showCompleted || task.completed === completed) && // Respect completion status filter
        !processedTaskIds.includes(task.id)
    )) {
      delete currentTasks[id];
      removed = true;
    }
    return removed;
  }

  private _synchronizeTaskData(currentTasks: Record<string, TaskProps>, processedTasks: TaskProps[]): boolean {
    let synchronized = false;
    for (let task of processedTasks) {
      if (!_.isEqual(task, currentTasks[task.id])) {
        currentTasks[task.id] = task;
        synchronized = true;
      }
    }
    return synchronized;
  }

  private _processTaskQueries(tasksToUpdate: Record<string, TaskProps>): void {
    const queries = _.sortBy(
      _.filter(
        tasksToUpdate,
        (task) => !task.completed && !!(task.query || task.links.length > 0)
      ),
      (task) => getParentScheduled(task, tasksToUpdate) ?? '99999'
    );

    const queriedIds = _.groupBy(
      _.keys(tasksToUpdate),
      (id) => tasksToUpdate[id].queryParent
    );

    const alreadyQueried: Set<string> = new Set();
    for (const task of queries) {
      const queriedTasks = task.query
        ? queryTasks(task.id, task.query, tasksToUpdate)
        : [];

      const queryChildren: string[] = [];
      for (let queriedTask of queriedTasks) {
        if (alreadyQueried.has(queriedTask.id) && queriedTask.queryParent !== task.id) {
          // If already queried by another task, skip, unless this task is its current queryParent (allowing re-query by same parent)
          continue;
        }

        // If it was previously queried by another task, but now this task (current query) is taking precedence
        if (queriedTask.queryParent && queriedTask.queryParent !== task.id) {
            // Potentially remove from old parent's queryChildren if that level of detail is needed,
            // but simply overwriting queryParent should be okay.
        }

        alreadyQueried.add(queriedTask.id);
        queryChildren.push(queriedTask.id);

        if (tasksToUpdate[queriedTask.id].queryParent !== task.id) {
             tasksToUpdate[queriedTask.id] = {
                ...tasksToUpdate[queriedTask.id],
                queryParent: task.id,
             };
        }
      }

      // Remove children that are no longer part of this query's results
      if (queriedIds[task.id]) {
        const unQueriedIds = _.difference(
          queriedIds[task.id],
          queryChildren // Use the newly formed queryChildren
        );
        for (let unQueriedId of unQueriedIds) {
          if(tasksToUpdate[unQueriedId] && tasksToUpdate[unQueriedId].queryParent === task.id) { // Ensure it was parented by current task
            tasksToUpdate[unQueriedId] = {
              ...tasksToUpdate[unQueriedId],
              queryParent: undefined,
            };
          }
        }
      }

      tasksToUpdate[task.id] = {
        ...tasksToUpdate[task.id],
        queryChildren,
      };
    }
  }

  updateFileOrder(file: string, before: string) {
    const beforeIndex = this.settings.fileOrder.indexOf(before)

    if (beforeIndex === -1) throw new Error('file not in headings list')
    const newFileOrder = [...this.settings.fileOrder]
    _.pull(newFileOrder, file)
    newFileOrder.splice(beforeIndex, 0, file)
    this.setSetting({ fileOrder: newFileOrder })
    setters.set({ fileOrder: newFileOrder })
  }

  async moveTask(task: TaskProps, selectedHeading: string) {
    if (task.page) {
      alert("Moving pages isn't supported.");
      return;
    }

    const extractionResult = await this._extractTaskLinesFromFile(task.path, task.position.start.line);
    if (!extractionResult) {
      new Notice(`Time Ruler: Failed to read source file ${task.path}`);
      return;
    }
    const { sourceFile, originalFileLines, extractedTaskLines } = extractionResult;

    // Save the source file with the task removed
    await this.app.vault.modify(sourceFile, originalFileLines.join('\n'));

    // Find position in destination
    const { filePath: destinationFilePath, position: destinationPosition } = await this._findPosition(selectedHeading);

    // Prepare the main task text for the new location
    const copyTask = { ...task, path: destinationFilePath }; // Update path for the moved task
    const mainTaskText = taskToText(copyTask, this.settings.fieldFormat);

    // Get subsequent lines (subtasks, notes, etc.)
    const subtaskLines = extractedTaskLines.slice(1);

    // Insert the task and its sub-lines into the destination file
    const movedFile = await this._insertTaskLinesIntoFile(destinationFilePath, destinationPosition.start.line, mainTaskText, subtaskLines);
    if (!movedFile) {
        new Notice(`Time Ruler: Failed to write to destination file ${destinationFilePath}`);
        // Potentially add logic here to revert the deletion from the source file if critical
        return;
    }

    openTask({ ...task, path: destinationFilePath, position: destinationPosition });
  }

  private async _extractTaskLinesFromFile(filePath: string, taskPositionStartLine: number): Promise<{ sourceFile: TFile, originalFileLines: string[], extractedTaskLines: string[] } | null> {
    const file = await this.getFile(filePath);
    if (!file) return null;

    const fileText = await this.app.vault.read(file);
    const lines = fileText.split('\n');

    const followingLines = lines.slice(taskPositionStartLine + 1);
    const nextTaskOrSectionStart = followingLines.findIndex((line) => !line.startsWith(' ') && line.trim() !== ''); // Find next non-indented, non-empty line

    const linesToCopyCount = (nextTaskOrSectionStart === -1 ? followingLines.length : nextTaskOrSectionStart) + 1;

    const extractedTaskLines = lines.slice(taskPositionStartLine, taskPositionStartLine + linesToCopyCount);
    const remainingLines = [...lines.slice(0, taskPositionStartLine), ...lines.slice(taskPositionStartLine + linesToCopyCount)];

    return { sourceFile: file, originalFileLines: remainingLines, extractedTaskLines };
  }

  private async _insertTaskLinesIntoFile(destinationFilePath: string, targetLine: number, mainTaskText: string, additionalLines: string[]): Promise<TFile | null> {
    const moveFile = await this.getFile(destinationFilePath); // this.getFile also creates if not exists
    if (!moveFile) return null;

    const pasteLines = [mainTaskText, ...additionalLines];

    await this.app.vault.process(moveFile, (text) => {
      const lines = text.split('\n');
      lines.splice(targetLine, 0, ...pasteLines);
      return lines.join('\n');
    });
    return moveFile;
  }

  createNewTask = (
    newTask: Partial<TaskProps>,
    selectedHeading: string | null,
    dailyNoteInfo: AppState['dailyNoteInfo']
  ) => {
    if (!selectedHeading || selectedHeading.startsWith('Daily')) {
      const date = !newTask.scheduled
        ? (DateTime.now().toISODate() as string)
        : (DateTime.fromISO(newTask.scheduled).toISODate() as string)

      let path = parsePathFromDate(date, dailyNoteInfo)
      if (selectedHeading && selectedHeading.includes('#'))
        path += '#' + splitHeading(selectedHeading)[1]
      this.createTaskInPath(path, newTask, getters.get('showingPastDates'))
    } else {
      this.createTaskInPath(
        selectedHeading,
        newTask,
        getters.get('showingPastDates')
      )
    }
  }

  async createFileFromPath(path: string) {
    let [fileName] = path.split('#')
    if (!fileName.endsWith('.md')) fileName += '.md'

    let file = this.app.vault.getAbstractFileByPath(fileName)
    const dailyNoteInfo = getters.get('dailyNoteInfo')
    if (!(file instanceof TFile)) {
      let starterText = ''
      if (parseDateFromPath(path, dailyNoteInfo) && dailyNoteInfo.template) {
        const templateFile = await this.getFile(
          dailyNoteInfo.template +
            (dailyNoteInfo.template.endsWith('.md') ? '' : '.md')
        )
        if (templateFile) {
          starterText = await this.app.vault.read(templateFile)
        }
      }
      file = await this.app.vault.create(fileName, starterText)
    }
    if (!(file instanceof TFile)) {
      new Notice(`Time Ruler: failed to create file ${fileName}`)
      throw new Error(`Time Ruler: failed to create file ${fileName}`)
    }
    return file
  }

  private _findPositionInHeading(lines: string[], heading: string, addTaskToEnd: boolean): number {
    let targetLine =
      lines.findIndex((line) =>
        new RegExp(`#+ ${_.escapeRegExp(heading)}$`).test(line)
      ) + 1;
    if (addTaskToEnd) {
      const nextHeadingLine = lines.findIndex(
        (line, i) => i >= targetLine && /^#+ /.test(line) // search from targetLine onwards
      );
      if (nextHeadingLine === -1) { // No subsequent heading
        targetLine = lines.length; // Go to end of file
      } else {
        targetLine = nextHeadingLine;
      }
      // find the end of the heading's non-whitespace text or line before next heading
      while (targetLine > 0 && /^\s*$/.test(lines[targetLine - 1])) {
        targetLine--;
      }
    }
    return targetLine;
  }

  private _findPositionInFile(lines: string[], addTaskToEnd: boolean): number {
    let targetLine: number;
    let i = 0;
    while (lines[i] !== undefined && lines[i].trim() === '') { // Skip initial blank lines
      i++;
    }

    if (addTaskToEnd) {
      const firstHeading = lines.findIndex((line) => /^#+ /.test(line));
      if (firstHeading === -1) targetLine = lines.length; // End of file if no headings
      else targetLine = firstHeading; // Beginning of the first heading section
      // Go to the line before this heading, or end of file if no heading
      if (targetLine > 0 && !lines[targetLine-1]?.trim()) targetLine--; // if line before is blank, use it
      else if (targetLine === lines.length && lines.length > 0 && !lines[targetLine-1]?.trim()) {
        // If at very end and last line is blank, use it.
      } else if (targetLine === 0 && lines.length > 0 && !lines[0]?.trim()) {
        // If at very beginning and first line is blank
      } else if (targetLine < lines.length && lines[targetLine]?.trim() && lines[targetLine-1]?.trim()){
         // if current target is not blank, and line before is not blank, means we are in middle of content.
         // if settings is addTaskToEnd, we should go to end of current block or file.
         // This part of logic for "addTaskToEnd" in a file without specific heading needs clarification from original intent.
         // For now, if firstHeading exists, it targets line before it. If not, end of file.
      }


    } else if (lines[i] === '---' && lines.findIndex((line, idx) => idx > i && line === '---') !== -1) {
      // After frontmatter
      targetLine = lines.findIndex((line, idx) => idx > i && line === '---') + 1;
    } else {
      targetLine = i; // First non-blank line or start of file
    }
    return targetLine;
  }

  private async _findPosition(path: string) {
    let filePath = parseFileFromPath(path);
    let heading = path.split('#')[1];

    const file = await this.createFileFromPath(path); // Ensures file exists
    const text = await this.app.vault.read(file);
    const lines = text.split('\n');

    let targetLine = heading
      ? this._findPositionInHeading(lines, heading, this.settings.addTaskToEnd)
      : this._findPositionInFile(lines, this.settings.addTaskToEnd);

    // Ensure targetLine is not negative
    targetLine = Math.max(0, targetLine);
    // Ensure targetLine does not exceed lines.length (for inserting new line at the end)
    targetLine = Math.min(lines.length, targetLine);


    const position = {
      start: { col: 0, line: targetLine, offset: 0 }, // Offset will be recalc by Obsidian on insert
      end: { col: 0, line: targetLine, offset: 0 },
    };

    return { position, filePath };
  }

  private async createTaskInPath(
    path: string,
    dropData: Partial<TaskProps>,
    completed = false
  ) {
    const { position, filePath: fileName } = await this._findPosition(path) // Changed to _findPosition

    const defaultTask: TaskProps = {
      page: false,
      children: [],
      title: '',
      originalTitle: '',
      originalText: '',
      tags: [],
      priority: TaskPriorities.DEFAULT,
      id: '',
      type: 'task',
      path: fileName,
      position,
      status: ' ',
      fieldFormat: this.settings.fieldFormat,
      completed,
      links: [],
      ...dropData,
    }

    await this.saveTask(defaultTask, true)
    openTask(defaultTask)
    setters.set({ newTask: undefined })
  }

  private async getFile(path: string) {
    let abstractFile = this.app.vault.getAbstractFileByPath(
      parseFileFromPath(path)
    )
    if (!abstractFile || !(abstractFile instanceof TFile)) {
      await this.app.vault.create(parseFileFromPath(path), '')
      abstractFile = this.app.vault.getAbstractFileByPath(
        parseFileFromPath(path)
      )
    }

    if (abstractFile && abstractFile instanceof TFile) return abstractFile
    else return undefined
  }

  async deleteTasks(ids: string[]) {
    const tasks = getters.get('tasks');
    const deletedTaskGroups = ids.map((id) => tasks[id]).filter(Boolean); // Ensure tasks exist
    const files = _.groupBy(deletedTaskGroups, (task) => parseFileFromPath(task.path));

    let allClearedQueryParentIds: string[] = [];

    for (let [filePath, tasksInFile] of _.entries(files)) {
      const clearedIds = await this._deleteTasksFromFile(filePath, tasksInFile as TaskProps[]); // Cast because filter(Boolean) ensures they are TaskProps
      allClearedQueryParentIds.push(...clearedIds);
    }

    if (allClearedQueryParentIds.length > 0) {
      const tasksToUpdate: Record<string, Partial<TaskProps>> = {};
      for (const id of _.uniq(allClearedQueryParentIds)) { // Ensure unique IDs
        tasksToUpdate[id] = { queryParent: undefined }; // Explicitly set to undefined
      }
      // This needs to merge with existing tasks, not overwrite.
      // A direct setters.set({ tasks: tasksToUpdate }) would wipe other tasks.
      // So, we need to fetch existing tasks and apply updates.
      const currentGlobalTasks = getters.get('tasks');
      const finalUpdatedTasks = { ...currentGlobalTasks };
      for(const id in tasksToUpdate){
        if(finalUpdatedTasks[id]){ // Make sure task still exists
          finalUpdatedTasks[id] = { ...finalUpdatedTasks[id], ...tasksToUpdate[id] };
        }
      }
       setters.set({tasks: finalUpdatedTasks});
      // Or, if a patchTasks equivalent exists that can set specific fields to undefined:
      // setters.patchTasks(allClearedQueryParentIds, { queryParent: undefined });
      // For now, using the more comprehensive update.
    }
  }

  private async _deleteTasksFromFile(filePath: string, tasksToDelete: TaskProps[]): Promise<string[]> {
    const file = await this.getFile(filePath);
    if (!file) return [];

    const fileText = await this.app.vault.read(file);
    const lines = fileText.split('\n');
    const clearedQueryParentIds: string[] = [];

    for (let task of _.sortBy(tasksToDelete, (t) => t.position.start.line * -1)) {
      lines.splice(
        task.position.start.line,
        task.position.end.line + 1 - task.position.start.line
      );

      if (task.query) {
        // Collect IDs of tasks that were children of this query task
        const currentGlobalTasks = getters.get('tasks'); // Get up-to-date global tasks
        for (let queriedTask of _.filter(
          currentGlobalTasks, // Use the fresh global task list
          (qt) => qt.queryParent === task.id
        )) {
          clearedQueryParentIds.push(queriedTask.id);
        }
      }
    }

    await this.app.vault.modify(file, lines.join('\n'));
    return clearedQueryParentIds;
  }

  async saveTask(task: TaskProps, newTask?: boolean) {
    const file = await this.getFile(task.path);
    if (!file) return;

    if (task.page) {
      await this._savePageTask(file, task);
    } else {
      await this._saveLineTask(file, task, newTask);
    }
  }

  private async _savePageTask(file: TFile, task: TaskProps): Promise<void> {
    await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
      taskToPage(task, frontmatter);
    });
  }

  private async _saveLineTask(file: TFile, task: TaskProps, newTask?: boolean): Promise<void> {
    const fileText = await this.app.vault.read(file);
    const lines = fileText.split('\n');

    // Ensure line number is within bounds, especially for new tasks at end of file
    const targetLine = Math.min(task.position.start.line, lines.length);
    let currentLineContent = lines[targetLine] ?? '';

    const newText =
      (currentLineContent.match(/^\s*/)?.[0] ?? '') + // Preserve indentation of the line being replaced/prefixed
      taskToText(task, this.settings.fieldFormat);

    if (newTask) {
      lines.splice(targetLine, 0, newText);
    } else {
      // Make sure we don't try to access lines[-1] if targetLine is 0 and file was empty
      lines[targetLine] = newText;
    }

    await this.app.vault.modify(file, lines.join('\n'));
  }

  async onload() {
    this.registerEvent(
      // @ts-ignore
      this.app.workspace.on('layout-change', (cb) => {
        setters.set({ recreateWindow: getters.get('recreateWindow') + 1 })
      })
    )
    this.registerEvent(
      // @ts-ignore
      this.app.workspace.on('resize', (cb) => {
        setters.set({ recreateWindow: getters.get('recreateWindow') + 1 })
      })
    )
    this.registerEvent(
      this.app.metadataCache.on(
        // @ts-ignore
        'dataview:metadata-change',
        (...args) => {
          switch (args[0]) {
            case 'update':
              this.loadTasks(args[1].path, getters.get('showingPastDates'))
              break
            case 'rename':
              this.forgetTasks(args[2])
              this.loadTasks(args[1].path, getters.get('showingPastDates'))
              break
          }
        }
      )
    )
  }
}

export async function getDailyNoteInfo(): Promise<
  AppState['dailyNoteInfo'] | undefined
> {
  try {
    let { folder, format, template } = (await this.app.vault
      .readConfigJson('daily-notes')
      .catch(() => {
        return { folder: undefined, format: undefined }
      })) as Record<string, string>
    if (!folder) folder = '/'
    if (!folder.endsWith('/')) folder += '/'
    if (!format) format = 'YYYY-MM-DD'
    if (!template) template = ''

    return {
      format,
      folder,
      template,
    }
  } catch (err) {
    console.warn(err)
    return {
      format: 'YYYY-MM-DD',
      folder: '/',
      template: '',
    }
  }
}

export async function openTask(task: TaskProps) {
  await this.app.workspace.openLinkText(parseFileFromPath(task.path), '')

  const mdView = this.app.workspace.getActiveViewOfType(MarkdownView)
  if (!mdView) return

  let cmEditor = mdView.editor

  cmEditor.setSelection(
    {
      line: task.position.end.line,
      ch: task.position.end.col,
    },
    {
      line: task.position.end.line,
      ch: task.position.end.col,
    }
  )

  cmEditor.focus()

  /**
   * There's a glitch with Obsidian where it doesn't show this when opening a link from Time Ruler.
   */
  if (Platform.isMobile) {
    getters.getApp()['mobileNavbar'].show()
  }
}

export function openTaskInRuler(id: string) {
  const task = getters.getTask(id)

  if (!task) {
    new Notice('Task not loaded in Time Ruler')
    return
  }

  const scheduled = getParentScheduled(task, getters.get('tasks'))

  if (scheduled) {
    const showingPastDates = getters.get('showingPastDates')
    const searchWithinWeeks = getters.get('searchWithinWeeks')
    const weeksAhead = Math.ceil(
      DateTime.now().diff(DateTime.fromISO(scheduled)).as('weeks')
    )
    if (showingPastDates || weeksAhead > searchWithinWeeks[1]) {
    }
    setters.set({
      showingPastDates: task.completed,
      searchWithinWeeks: [
        searchWithinWeeks[0],
        _.max([weeksAhead, searchWithinWeeks[1]]) as number,
      ],
    })
  }

  setTimeout(async () => {
    const now = toISO(DateTime.now())
    const showingPastDates = getters.get('showingPastDates')
    let section = !scheduled
      ? 'unscheduled'
      : scheduled < now && scheduled !== now.slice(0, 10) && !showingPastDates
      ? 'now'
      : scheduled.slice(0, 10)

    await scrollToSection(section)

    let tries = 0
    const findTask = () => {
      tries++
      if (tries > 10) {
        throw new Error(`Task not found: ${id} in section ${section}`)
      }
      const foundTask = document.querySelector(`[data-id="${id}"]`)

      if (!foundTask) {
        setTimeout(findTask, 250)
        return
      }

      foundTask.scrollIntoView({
        inline: 'center',
        block: 'center',
        behavior: 'smooth',
      })

      foundTask.addClass('!bg-accent')
      setTimeout(() => foundTask.removeClass('!bg-accent'), 1500)
      setTimeout(() => setters.set({ findingTask: null }))
    }

    findTask()
  })
}
