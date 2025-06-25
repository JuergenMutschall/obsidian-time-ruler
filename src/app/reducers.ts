import { ImmerReducer } from 'immer-reducer';
import { AppState, TaskProps, EventProps, DragData } from './store'; // Assuming types are exported from store.ts

// It's good practice to define payload types for reducers if they are complex
// For simple ones, inline types are fine.

export class AppImmerReducers extends ImmerReducer<AppState> {
  // Corresponds to the old setters.set - a generic way to update parts of the state
  _set(newState: Partial<AppState>) {
    // It's generally better to have more specific reducers,
    // but this can be a direct replacement for the old 'set'
    // This needs to be used carefully.
    Object.assign(this.draftState, newState);
  }

  // Specific reducers are preferred:

  setTasks(tasks: Record<string, TaskProps>) {
    this.draftState.tasks = tasks;
  }

  setEvents(events: Record<string, EventProps>) {
    this.draftState.events = events;
  }

  patchTask(taskId: string, taskProps: Partial<TaskProps>) {
    if (this.draftState.tasks[taskId]) {
      this.draftState.tasks[taskId] = {
        ...this.draftState.tasks[taskId],
        ...taskProps,
      };
    }
  }

  deleteTask(taskId: string) {
    delete this.draftState.tasks[taskId];
  }

  setApis(apis: Partial<AppState['apis']>) {
    this.draftState.apis = { ...this.draftState.apis, ...apis };
  }

  setDragData(dragData: DragData | null) {
    this.draftState.dragData = dragData;
  }

  setDragMode(dragMode: AppState['dragMode']) {
    this.draftState.dragMode = dragMode;
  }

  setFindingTask(findingTask: string | null) {
    this.draftState.findingTask = findingTask;
  }

  setInScroll(inScroll: number) {
    this.draftState.inScroll = inScroll;
  }

  setSearchStatus(searchStatus: boolean) {
    this.draftState.searchStatus = searchStatus;
  }

  setDailyNoteInfo(dailyNoteInfo: Partial<AppState['dailyNoteInfo']>) {
    this.draftState.dailyNoteInfo = {
      ...this.draftState.dailyNoteInfo,
      ...dailyNoteInfo,
    };
  }

  setFileOrder(fileOrder: string[]) {
    this.draftState.fileOrder = fileOrder;
  }

  setNewTask(newTask: AppState['newTask']) {
    this.draftState.newTask = newTask;
  }

  setSettings(settings: Partial<AppState['settings']>) {
    this.draftState.settings = { ...this.draftState.settings, ...settings };
  }

  patchCollapsed(ids: string[], collapsed: boolean) {
    for (const id of ids) {
      this.draftState.collapsed[id] = collapsed;
    }
  }

  toggleCollapsed(id: string) {
    this.draftState.collapsed[id] = !this.draftState.collapsed[id];
  }

  setShowingPastDates(showingPastDates: boolean) {
    this.draftState.showingPastDates = showingPastDates;
  }

  setSearchWithinWeeks(searchWithinWeeks: [number, number]) {
    this.draftState.searchWithinWeeks = searchWithinWeeks;
  }

  setChildWidth(childWidth: number) {
    this.draftState.childWidth = childWidth;
  }

  patchTimer(timer: Partial<AppState['timer']>) {
    this.draftState.timer = { ...this.draftState.timer, ...timer };
  }

  setRecreateWindow(recreateWindow: number) {
    this.draftState.recreateWindow = recreateWindow;
  }

  setDragOffset(dragOffset: number) {
    this.draftState.dragOffset = dragOffset;
  }
}
