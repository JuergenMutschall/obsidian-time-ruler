import { useDraggable } from '@dnd-kit/core'
import { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities'; // Corrected import path
import _ from 'lodash'
import { DateTime } from 'luxon'
import { getters, setters, useAppStore } from '../app/store'
import { openTask } from '../services/obsidianApi'
import {
  getHeading,
  getToday,
  isDateISO,
  nestedScheduled,
  parseTaskDate,
  roundMinutes,
  toISO,
} from '../services/util'
// getHeading is now used in TaskSubtaskList, so it can be removed if not used elsewhere here.
// Block is now used in TaskSubtaskList, so it can be removed if not used elsewhere here.
import { TaskPriorities, priorityNumberToSimplePriority } from '../types/enums'
// import Block from './Block';
// Button import might be removed if not used by other sub-components later
import Button from './Button'
// Logo import can be removed as TaskDetails now handles its own Logo
// import Logo from './Logo'
import TaskTags from './TaskTags';
import TaskCheckbox from './TaskCheckbox';
import TaskNotes from './TaskNotes';
// TaskTitle import removed, used via TaskContent
// TaskDetails import removed, used via TaskContent
import TaskSubtaskList from './TaskSubtaskList';
import TaskContent from './TaskContent'; // Import TaskContent
import invariant from 'tiny-invariant'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRect } from '@dnd-kit/core/dist/hooks/utilities'

export type TaskComponentProps = TaskProps & {
  subtasks?: TaskProps[]
  dragContainer: string
  startISO?: string
  renderType?: 'deadline'
}
export default function Task({
  dragContainer,
  startISO,
  subtasks,
  renderType,
  dragging, // Reverted to dragging
  ...task
}: TaskComponentProps & { dragging?: true }) { // Reverted to dragging
  const completeTask = () => {
    setters.patchTasks([task.id], {
      completion: toISO(roundMinutes(DateTime.now()), true),
      completed: true,
    })
  }

  subtasks = useAppStore((state) => {
    const taskDate = parseTaskDate(task, state.tasks)
    let newSubtasks = _.flatMap(
      subtasks ??
        task.children
          .concat(task.queryChildren ?? [])
          .map((id) => state.tasks[id]),
      (subtask) => {
        if (!subtask) return []
        if (
          !subtask.scheduled &&
          !subtask.due &&
          !state.settings.scheduledSubtasks
        )
          return []
        if (subtask.due && !task.scheduled) return []

        if (!nestedScheduled(taskDate, parseTaskDate(subtask, state.tasks))) {
          return []
        }
        if (subtask.completed !== state.showingPastDates) return []
        return subtask
      }
    )

    if (!state.settings.scheduledSubtasks && task.scheduled)
      newSubtasks = newSubtasks.filter((task) => task.scheduled)
    return newSubtasks
  })

  const dragData: DragData = {
    dragType: 'task',
    renderType,
    dragContainer,
    ...task,
  }
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    isDragging,
    node,
    activatorEvent,
  } = useDraggable({
    id: `${task.id}::${renderType}::${dragContainer}`,
    data: dragData,
  })

  let dragOffsetRef = useRef(0)
  useEffect(() => {
    if (!isDragging || !activatorEvent) return
    const target = activatorEvent.target as HTMLElement
    // Iterate through target's parents to find element with data-task attribute
    let taskElement = target
    while (
      taskElement &&
      !taskElement.hasAttribute('data-task') &&
      taskElement.parentElement
    ) {
      taskElement = taskElement.parentElement
    }

    if (taskElement && taskElement.hasAttribute('data-task')) {
      // Found element with data-task attribute
      // You can use the found element here for the drag offset calculation
      const rect = taskElement.getBoundingClientRect()
      if (activatorEvent instanceof MouseEvent) {
        const dragOffset = rect.right - activatorEvent.clientX
        if (dragOffset !== dragOffsetRef.current) {
          dragOffsetRef.current = dragOffset
          setters.set({
            dragOffset,
          })
        }
      } else if (activatorEvent instanceof TouchEvent) {
        const dragOffset = rect.right - activatorEvent.touches[0].clientX
        if (dragOffset !== dragOffsetRef.current) {
          dragOffsetRef.current = dragOffset
          setters.set({
            dragOffset,
          })
        }
      }
    }

    // setters.set({dragOffset: })
  }, [isDragging])

  const isLink = renderType && ['parent', 'deadline'].includes(renderType)
  const isCalendar = useAppStore((state) => state.settings.viewMode === 'week')
  const smallText = isLink || isCalendar

  if (!startISO) startISO = task.scheduled

  const collapsed = useAppStore((state) => state.collapsed[task.id] ?? false)

  const lengthDragData: DragData = {
    dragType: 'task-length',
    id: task.id,
    start: task?.scheduled ?? '',
    end: task?.scheduled ?? '',
  }
  const {
    setNodeRef: setLengthNodeRef,
    attributes: lengthAttributes,
    listeners: lengthListeners,
  } = useDraggable({
    id: `${task.id}::${renderType}::length::${dragContainer}`,
    data: lengthDragData,
  })

  const deadlineDragData: DragData = {
    dragType: 'due',
    task,
  }
  const {
    setNodeRef: setDeadlineNodeRef,
    attributes: deadlineAttributes,
    listeners: deadlineListeners,
  } = useDraggable({
    id: `${task.id}::${renderType}::deadline::${dragContainer}`,
    data: deadlineDragData,
  })

  const dailyNoteInfo = useAppStore((state) => state.dailyNoteInfo)
  const groupBy = useAppStore((state) => state.settings.groupBy)

  if (!task) return <></>

  const childWidth = useAppStore((state) => state.childWidth)
  const [isWide, setIsWide] = useState(false)
  useEffect(() => {
    const tR = document.getElementById('#time-ruler')
    if (!tR) return
    const width = tR.clientWidth / childWidth
    if (width > 400 && !isWide) setIsWide(true)
    else if (width < 400 && isWide) setIsWide(false)
  }, [childWidth, isWide])

  const showingPastDates = useAppStore((state) => state.showingPastDates)
  const today = getToday()
  const now = DateTime.now().toISO()
  const hasLengthDrag: boolean = !!(
    task.scheduled &&
    !isDateISO(task.scheduled) &&
    !(showingPastDates ? task.scheduled > today : task.scheduled < now)
  );

  // Get the computed style for the body element
  const computedStyle = getComputedStyle(document.body)
  // Get the value of the --line-height-normal CSS variable
  const lineHeightNormal = computedStyle
    .getPropertyValue('--line-height-normal')
    .trim()

  // taskTitle function removed, logic moved to TaskTitle.tsx
  const handleOpenTask = () => openTask(task); // Create stable callback

  const isMobile = useMemo(() => getters.getObsidianAPI().app.isMobile, [])

  const isCurrentlyDragging: boolean = !!dragging; // Reverted to dragging
  const currentLengthListeners: SyntheticListenerMap = lengthListeners || {};

  // Explicitly define props for TaskContent
  const taskContentProps = {
    task: task,
    renderType: renderType,
    isLink: isLink || false,
    lineHeightNormal: lineHeightNormal,
    onOpenTask: handleOpenTask,
    taskPath: task.path,
    startISO: startISO,
    hasLengthDrag: hasLengthDrag,
    mainTaskDragging: isCurrentlyDragging,
    dndAttributes: attributes,
    dndListeners: listeners || {}, // Added fallback for undefined listeners
    setLengthNodeRef: setLengthNodeRef,
    lengthAttributes: lengthAttributes,
    lengthListeners: currentLengthListeners,
    setDeadlineNodeRef: setDeadlineNodeRef,
    deadlineAttributes: deadlineAttributes,
    deadlineListeners: deadlineListeners,
  };

  return (
    <div
      className={`relative rounded-icon transition-colors duration-300 w-full min-h-line`}
      data-id={isLink ? '' : task.id}
      data-task={task.status === ' ' ? '' : task.status}
    >
      <div
        className={`pt-0.5 selectable group flex items-start rounded-icon pr-2 font-sans overflow-hidden ${
          smallText ? 'text-sm' : ''
        }`}
        ref={setNodeRef}
      >
        <div className='flex h-line w-indent flex-none items-center justify-center'>
          <TaskCheckbox
            completed={task.completed}
            status={task.status}
            isLink={isLink || false}
            isMobile={isMobile}
            onComplete={completeTask}
          />
        </div>
        <TaskContent {...taskContentProps} />
      </div>
      <TaskTags tags={task.tags} groupBy={groupBy} />
      <TaskNotes notes={task.notes} isLink={isLink || false} />
      <TaskSubtaskList
        taskId={task.id}
        task={task}
        subtasks={subtasks}
        collapsed={collapsed}
        onToggleCollapse={() => setters.patchCollapsed([task.id], !collapsed)} // Define handleToggleCollapse or inline
        dragContainer={dragContainer}
        startISO={startISO}
        dailyNoteInfo={dailyNoteInfo}
        groupBy={groupBy}
      />
    </div>
  )
}
