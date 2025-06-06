// TimeRulerHeader.tsx
import React, { useEffect, useRef, useState } from 'react';
// import $ from 'jquery'; // jQuery import removed
import { DateTime } from 'luxon';
import {
  AppState,
  getters,
  setters,
  useAppStore,
} from '../app/store';
import { getToday } from '../services/util'; // scrollToSection removed
import Button from './Button';
import Droppable from './Droppable';
import { TimelineViewHandle } from './TimelineViewHandle'; // Import the handle type
import Logo from './Logo';
import NewTask from './NewTask';
import { TimeSpanTypes } from './Minutes'; // Assuming TimesType might be needed or a part of it.
                                         // If TimesType is complex and defined in App.tsx,
                                         // it might need to be moved to a shared types file.
                                         // For now, I'll include what seems directly related.

// Copied from App.tsx and renamed from Buttons
// Props might need adjustment if TimesType is not fully moved or is simplified.
// For now, let's assume TimesType will be simplified or defined here.
// Placeholder for TimesType definition if needed
type TimesType = (Parameters<typeof Day>[0] | { type: 'unscheduled' })[]
// This is a forward declaration/placeholder. We'll need to define Day or adjust this.
// Since Day is not being moved, this will likely cause an issue.
// For now, I will use a simpler type for times or expect it to be passed.
// A better approach would be to define TimesType in a shared file.

// Simplified TimesType for now
type SimplifiedTimesType = { startISO?: string; type: 'unscheduled' | string }[];


const TimeRulerHeader = ({
  times, // Changed from TimesType to SimplifiedTimesType
  weeksShownState,
  setWeeksShown,
  setupStore,
  showingPastDates,
  timelineViewRef, // Added timelineViewRef
}: {
  times: SimplifiedTimesType;
  weeksShownState: number;
  setWeeksShown: (weeksShownState: number) => void;
  setupStore: () => void;
  showingPastDates: boolean;
  timelineViewRef?: React.RefObject<TimelineViewHandle | undefined>; // Optional for safety
}) => {
  const now = DateTime.now();
  const viewMode = useAppStore((state) => state.settings.viewMode);
  const calendarMode = viewMode === 'week';

  useEffect(() => {
    $(`#time-ruler-${getToday()}`)[0]?.scrollIntoView();
  }, [viewMode, showingPastDates]);

  const nextButton = (
    <div className='flex'>
      <Button
        onClick={() => setWeeksShown(weeksShownState + (calendarMode ? 4 : 1))}
        src={'chevron-right'}
      />
      {weeksShownState > (calendarMode ? 4 : 0) && (
        <Button
          className={`force-hover rounded-icon`}
          onClick={() =>
            setWeeksShown(weeksShownState - (calendarMode ? 4 : 1))
          }
          src='chevron-left'
        />
      )}
    </div>
  );

  const [showingModal, setShowingModal] = useState(false);
  const modalFrame = useRef<HTMLDivElement>(null);
  const checkShowing = (ev: MouseEvent) => {
    if (modalFrame.current && !modalFrame.current.contains(ev.target as Node)) {
      setShowingModal(false);
    }
  };

  useEffect(() => {
    if (showingModal) {
      window.addEventListener('click', checkShowing);
    } else {
      window.removeEventListener('click', checkShowing);
    }
    return () => window.removeEventListener('click', checkShowing);
  }, [showingModal]);

  const today = getToday(); // Simplified: getStartDate requires DateTime

  const renderButton = (time: SimplifiedTimesType[number], i: number) => {
    const start = time.type === 'unscheduled' ? undefined : time.startISO; // Simplified
    const thisDate = start ? DateTime.fromISO(start) : undefined;
    return (
      <Droppable
        key={time.type === 'unscheduled' ? 'unscheduled' : time.startISO}
        id={(time.type === 'unscheduled' ? 'unscheduled' : start) + '::button'}
        data={{
          scheduled: start,
        }}
      >
        <Button
          className='h-[28px]'
          onClick={() => {
            const sectionId = time.type === 'unscheduled' ? 'unscheduled' : start;
            if (sectionId && timelineViewRef?.current) {
              timelineViewRef.current.scrollTo(sectionId);
            }
          }}
        >
          {time.type === 'unscheduled'
            ? 'None'
            : thisDate!.toFormat('EEE MMM d')}
        </Button>
      </Droppable>
    );
  };

  const hideTimes = useAppStore((state) => state.settings.hideTimes);
  // const childWidth = useAppStore((state) => state.childWidth); // childWidth is not used here

  return (
    <>
      <div className={`flex w-full items-center space-x-1 rounded-icon`}>
        <div
          className={`${
            calendarMode
              ? ''
              : 'flex justify-center h-full space-x-1 items-center'
          }`}
        >
          <div className='group relative'>
            <Button
              src='more-horizontal'
              onClick={(ev) => {
                setShowingModal(!showingModal);
                ev.stopPropagation();
              }}
            />
            {showingModal && (
              <div
                className='tr-menu'
                ref={modalFrame}
                onClick={() => setShowingModal(false)}
              >
                <div className='flex flex-col items-center'>
                  <div
                    className='clickable-icon w-full'
                    onClick={() => {
                      setters.set({ showingPastDates: !showingPastDates });
                    }}
                  >
                    <Logo
                      src={showingPastDates ? 'chevron-right' : 'chevron-left'}
                      className='w-6 flex-none'
                    />
                    <span className='whitespace-nowrap'>
                      {showingPastDates ? 'Future' : 'Past'}
                    </span>
                  </div>
                  <div
                    className='clickable-icon w-full'
                    onClick={async () => {
                      setupStore();
                    }}
                  >
                    <Logo src={'rotate-cw'} className='w-6 flex-none' />
                    <span className='whitespace-nowrap'>Reload</span>
                  </div>
                  <div
                    className='clickable-icon w-full'
                    onClick={() => {
                      getters.getObsidianAPI().setSetting({
                        hideTimes: !hideTimes,
                      });
                    }}
                  >
                    <Logo src={'kanban'} className='w-6 flex-none rotate-90' />
                    <span className='whitespace-nowrap'>
                      {hideTimes ? 'Show' : 'Hide'} Times
                    </span>
                  </div>
                  <div className='text-muted my-1 w-fit'>Group By</div>
                  <div className='flex w-fit'>
                    {[
                      ['path', 'Path', 'folder-tree'],
                      ['priority', 'Priority', 'alert-circle'],
                      ['hybrid', 'Hybrid', 'arrow-down-narrow-wide'],
                      ['tags', 'Tags', 'hash'],
                      [false, 'None', 'x'],
                    ].map(
                      ([groupBy, title, src]: [
                        AppState['settings']['groupBy'],
                        string,
                        string
                      ]) => (
                        <div className='flex flex-col items-center' key={title}>
                          <Button
                            src={src}
                            title={title}
                            className={`${
                              getters.getApp().isMobile
                                ? '!w-8 !h-8'
                                : '!w-6 !h-6'
                            } !p-0 flex-none`}
                            onClick={() => {
                              getters.getObsidianAPI().setSetting({
                                groupBy: groupBy,
                              });
                            }}
                          />
                          <div className='text-xs text-faint'>{title}</div>
                        </div>
                      )
                    )}
                  </div>
                  <div className='text-muted my-1 w-fit'>Layout</div>
                  <div className='flex w-fit'>
                    {[
                      ['hour', 'Hours', 'square'],
                      ['day', 'Days', 'gallery-horizontal'],
                      ['week', 'Weeks', 'layout-grid'],
                    ].map(
                      ([viewMode, title, src]: [
                        AppState['settings']['viewMode'],
                        string,
                        string
                      ]) => (
                        <div className='flex flex-col items-center' key={title}>
                          <Button
                            src={src}
                            title={title}
                            className={`${
                              getters.getApp().isMobile
                                ? '!w-8 !h-8'
                                : '!w-6 !h-6'
                            } !p-0 flex-none`}
                            onClick={() => {
                              getters.getObsidianAPI().setSetting({
                                viewMode,
                              });
                            }}
                          />
                          <div className='text-xs text-faint'>{title}</div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <Button
            src='search'
            className={`${calendarMode ? 'mb-2' : ''}`}
            onClick={() => setters.set({ searchStatus: true })}
          />
          {calendarMode && <NewTask dragContainer='buttons' />}
        </div>

        <div
          className={`no-scrollbar flex w-full snap-mandatory rounded-icon pb-0.5 child:snap-start overflow-x-auto ${
            calendarMode
              ? `overflow-y-auto snap-y flex-wrap h-[152px] ${
                  // childWidth > 1 ? '*:w-[14.2%] *:!justify-start' : '' // childWidth not available
                  ''
                }`
              : 'overflow-x-auto snap-x space-x-2 items-center'
          }`}
          data-auto-scroll={calendarMode ? 'y' : 'x'}
        >
          {times.map((time, i) => {
            return renderButton(time, i);
          })}

          {nextButton}
        </div>
        {!calendarMode && <NewTask dragContainer='buttons' />}
      </div>
    </>
  );
};

export default TimeRulerHeader;
