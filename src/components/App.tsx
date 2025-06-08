import {
  DndContext,
  DragOverlay,
  MeasuringConfiguration,
  MouseSensor,
  PointerSensor,
  TouchSensor,
  pointerWithin,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import _ from 'lodash' // jQuery import removed
import { DateTime } from 'luxon'
import { Notice, Platform } from 'obsidian' // Notice needed for reload
import { getAPI } from 'obsidian-dataview' // Needed for reload
import { useEffect, useRef, useState } from 'react' // Fragment might not be needed anymore
// sounds import can likely be removed if not used elsewhere in App.tsx
import { onDragEnd, onDragStart } from 'src/services/dragging'
import invariant from 'tiny-invariant' // Needed for reload
import {
  AppState,
  getters,
  setters,
  useAppStore,
  useAppStoreRef,
} from '../app/store'
import { useAutoScroll } from '../services/autoScroll'
import { getDailyNoteInfo } from '../services/obsidianApi' // Needed for reload
import {
  getStartDate,
  getToday,
  roundMinutes,
  // scrollToSection, // This is in AppInitializer
  toISO,
  useChildWidth,
} from '../services/util'
import AppInitializer from './AppInitializer'
import Block from './Block'
import Day from './Day'; // Moved to TimelineView
import Group from './Group'
import { TimeSpanTypes } from './Minutes' // Still needed for TimesType definition
import NewTask from './NewTask'
import Search from './Search'
import Task from './Task'
import TimeRulerHeader from './TimeRulerHeader'
// import Unscheduled from './Unscheduled'; // Moved to TimelineView
import TimelineView, { ActualTimesType } from './TimelineView'; // Import ActualTimesType
import { TimelineViewHandle } from './TimelineViewHandle'; // Import the handle type
import { isCallChain } from 'typescript'

// Simplified TimesType for props passed to TimeRulerHeader
// This matches the simplification in TimeRulerHeader.tsx
type SimplifiedTimesType = { startISO?: string; type: 'unscheduled' | string }[];

/**
 * @param apis: We need to store these APIs within the store in order to hold their references to call from the store itself, which is why we do things like this.
 */
export default function App({ apis }: { apis: Required<AppState['apis']> }) {
  const timeRulerContainerRef = useRef<HTMLDivElement>(null);
  const timelineViewRef = useRef<TimelineViewHandle>(null); // Create TimelineView ref

  const reload = async () => {
    const dv = getAPI()
    invariant(dv, 'please install Dataview to use Time Ruler.')
    if (!dv.index.initialized) {
      // @ts-ignore
      getters.getApp().metadataCache.on('dataview:index-ready', () => {
        reload()
      })
      return
    }

    // reload settings
    apis.obsidian.reload()
    const dailyNoteInfo = await getDailyNoteInfo()

    const settings: AppState['settings'] = {
      muted: apis.obsidian.getSetting('muted'),
      twentyFourHourFormat: apis.obsidian.getSetting('twentyFourHourFormat'),
      groupBy: apis.obsidian.getSetting('groupBy'),
      dayStartEnd: apis.obsidian.getSetting('dayStartEnd'),
      showCompleted: apis.obsidian.getSetting('showCompleted'),
      extendBlocks: apis.obsidian.getSetting('extendBlocks'),
      hideTimes: apis.obsidian.getSetting('hideTimes'),
      borders: apis.obsidian.getSetting('borders'),
      viewMode: apis.obsidian.getSetting('viewMode'),
      timerEvent: apis.obsidian.getSetting('timerEvent'),
      scheduledSubtasks: apis.obsidian.getSetting('scheduledSubtasks'),
    }

    setters.set({
      apis,
      dailyNoteInfo,
      settings,
    })

    apis.calendar.loadEvents()
    apis.obsidian.loadTasks('', getters.get('showingPastDates'))
  }

  const showingPastDates = useAppStore((state) => state.showingPastDates)

  // 'now' state is no longer here, but 'today' derived from getToday() might still be needed
  // for TimesType calculations if 'now' was not directly used for 'today's date part.
  // The 'times' array calculation uses 'now' for the first element's start/end ISO.
  // This 'now' will need to come from the store if AppInitializer is managing it,
  // or App.tsx needs to get it from DateTime.now() directly if it's just for rendering.
  // For now, let's assume `DateTime.now()` can be used if a live 'now' is needed for rendering,
  // or that the logic within `times` will be adapted.
  // Re-checking the 'times' array logic:
  // The `now` variable was used to determine the start/end of the *current* day's block.
  // If AppInitializer updates `now` in the store, we might need to pull it from there.
  // Or, if `times` is meant to be relatively static based on component load time, `DateTime.now()` is fine.
  // The `reload` function in `AppInitializer` sets `apis` and `settings` in the store.
  // The `now` state in `AppInitializer` is local to it and used for its timer logic.
  // Let's use a fresh DateTime.now() for the times array calculation here.
  const nowForTimes = DateTime.now();
  const today = DateTime.fromISO(getToday())
  const [weeksShownState, setWeeksShown] = useState(1)
  const viewMode = useAppStore((state) => state.settings.viewMode)
  const calendarMode = viewMode === 'week'
  const datesShown = weeksShownState * 7 * (showingPastDates ? -1 : 1)
  // useEffect for calendarMode/setWeeksShown moved to AppInitializer

  // useEffect for loadTasks based on weeksShownState, showingPastDates moved to AppInitializer

  const dayStart = useAppStore((state) => state.settings.dayStartEnd[0])
  const showCompleted = useAppStore((state) => state.settings.showCompleted)

  const times: ActualTimesType = [ // Changed TimesType to ActualTimesType
    { type: 'unscheduled' },
    {
      startISO:
        showingPastDates || showCompleted
          ? toISO(today.startOf('day').plus({ hours: dayStart }))
          : toISO(nowForTimes), // Use nowForTimes
      endISO: showingPastDates
        ? toISO(nowForTimes) // Use nowForTimes
        : toISO(today.plus({ days: 1, hours: dayStart })),
      type: 'minutes' as TimeSpanTypes,
      dragContainer: 'app',
      isNow: true,
    },
    ..._.range(showingPastDates ? -1 : 1, datesShown).map((i) => ({
      startISO: toISO(today.plus({ days: i, hours: dayStart })),
      endISO: toISO(today.plus({ days: i + 1, hours: dayStart })),
      type: 'minutes' as TimeSpanTypes,
      dragContainer: 'app',
    })),
  ]
  if (showingPastDates) times.reverse()

  const searchWithinWeeks = useAppStore((state) => state.searchWithinWeeks)

  // useEffect for loadTasks based on searchWithinWeeks, showingPastDates moved to AppInitializer

  // useEffect for searchWithinWeeks adjustment moved to AppInitializer

  const [activeDrag, activeDragRef] = useAppStoreRef((state) => state.dragData)

  useAutoScroll()

  // measuringConfig uses timeRulerContainerRef, so it stays in App.tsx
  const measuringConfig: MeasuringConfiguration = {
    draggable: {
      measure: (el) => {
        const containerRect = timeRulerContainerRef.current?.getBoundingClientRect();
        const rect = el.getBoundingClientRect();
        // Fallback for containerRect if ref is not yet attached or element not found
        const fallbackRect = { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
        const R = containerRect ?? fallbackRect;

        return {
          ...rect,
          left: rect.left - R.left,
          top: rect.top - R.top,
        };
      },
    },
    dragOverlay: {
      measure: (el) => {
        const containerRect = timeRulerContainerRef.current?.getBoundingClientRect();
        const rect = el.getBoundingClientRect();
        const fallbackRect = { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
        const R = containerRect ?? fallbackRect;

        return {
          ...rect,
          left: rect.left - R.left,
          top: rect.top - R.top,
        };
      },
    },
  };

  const getDragElement = () => {
    if (!activeDrag) return <></>

    switch (activeDrag.dragType) {
      case 'task':
        return <Task {...activeDrag} dragging /> // Reverted to dragging
      case 'task-length':
      case 'time':
        return <></>
      case 'group':
        return <Group {...activeDrag} />
      case 'block':
        return <Block {...activeDrag} dragging />
      case 'new_button':
        return <NewTask dragContainer='activeDrag' />
      case 'due':
        return <div className='h-line p-2 text-accent'>due</div>
    }
  }

  // scroller, scrollViews, updateScroll, and related useEffects moved to TimelineView.tsx
  const { childWidth, childClass } = useChildWidth() // This is still needed for App.tsx to pass to TimelineView
  const trueChildWidth = useAppStore((state) => state.childWidth) // This is used by DragOverlay, so it stays

  // The useEffect that scrolls based on calendarMode/showingPastDates (using timeRulerContainerRef)
  // was specific to the #time-ruler-times div. This responsibility is now with TimelineView.
  // So that useEffect is also considered "moved" or superseded by TimelineView's internal logic.

  const sensors = useSensors(
    ...(Platform.isMobile
      ? [
          useSensor(TouchSensor, {
            activationConstraint: {
              delay: 250,
              tolerance: 5,
            },
          }),
        ]
      : [
          useSensor(PointerSensor, {
            activationConstraint: { delay: 100, tolerance: 50 },
          }),
          useSensor(MouseSensor, {
            activationConstraint: { delay: 100, tolerance: 50 },
          }),
        ])
  )

  // useEffect for overflow and padding styles is removed. Styles will be applied directly.

  const borders = useAppStore((state) => state.settings.borders) // Still needed for App.tsx to pass to TimelineView
  // frameClass is now defined within TimelineView.tsx

  const searchStatus = useAppStore((state) => state.searchStatus)
  const dragOffset = useAppStore((state) => state.dragOffset)

  return (
    <>
      <AppInitializer
        reload={reload}
        weeksShownState={weeksShownState}
        setWeeksShown={setWeeksShown}
        showingPastDates={showingPastDates}
        searchWithinWeeks={searchWithinWeeks}
        calendarMode={calendarMode}
        timelineViewRef={timelineViewRef} // Pass timelineViewRef to AppInitializer
      />
      <DndContext
        onDragStart={onDragStart}
        onDragEnd={(ev) => onDragEnd(ev, activeDragRef)}
        onDragCancel={() => setters.set({ dragData: null })}
        collisionDetection={pointerWithin}
        measuring={measuringConfig}
        sensors={sensors}
        autoScroll={false}
      >
        <div
          id='time-ruler'
          ref={timeRulerContainerRef} // Attach the ref
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            // overflow: 'hidden', // Original style on #time-ruler
            backgroundColor: 'var(--background-secondary)',
            // Applying styles previously on parent directly here:
            overflow: 'clip',
            padding: '4px 8px 8px',
          }}
          className={`time-ruler-container sidebar-color`}
        >
          <DragOverlay
            dropAnimation={null}
            className='backdrop-blur opacity-50'
            style={{
              width:
                activeDrag?.dragType === 'due'
                  ? undefined
                  : `calc((100% - 48px) / ${trueChildWidth})`,
              marginLeft:
                activeDrag?.dragType === 'task'
                  ? `${Math.floor(dragOffset)}px`
                  : '',
            }}
          >
            {getDragElement()}
          </DragOverlay>

          {/* Updated to use TimeRulerHeader */}
          {/* The 'times' prop will need to be mapped or ensured it matches SimplifiedTimesType */}
          <TimeRulerHeader
            times={times.map(t => ({ type: t.type, startISO: t.type !== 'unscheduled' ? t.startISO : undefined })) as SimplifiedTimesType}
            datesShown={datesShown}
            setWeeksShown={setWeeksShown}
            weeksShownState={weeksShownState}
            setupStore={reload} // Now correctly passing the reload function from App.tsx
            showingPastDates={showingPastDates}
            timelineViewRef={timelineViewRef} // Pass timelineViewRef to TimeRulerHeader
          />

          {/* JSX for rendering the timeline itself is moved to TimelineView */}
          <TimelineView
            times={times}
            calendarMode={calendarMode}
            childWidth={childWidth}
            childClass={childClass}
            showingPastDates={showingPastDates}
            borders={borders}
            ref={timelineViewRef} // Pass ref to TimelineView
          />
        </div>
      </DndContext>
      {searchStatus && <Search />}
    </>
  )
}
