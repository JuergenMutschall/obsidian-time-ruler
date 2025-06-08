// TimelineView.tsx
import React, { Fragment, useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { DateTime } from 'luxon';
import Day from './Day';
import Unscheduled from './Unscheduled';
import { getStartDate } from '../services/util';
import { AppState } from '../app/store';
import { TimelineViewHandle } from './TimelineViewHandle'; // Import the handle type

export type ActualTimesType = (Parameters<typeof Day>[0] | { type: 'unscheduled' })[];

export interface TimelineViewProps {
  times: ActualTimesType;
  calendarMode: boolean;
  childWidth: number;
  childClass: string;
  showingPastDates: boolean;
  borders: AppState['settings']['borders'];
}

const TimelineView = forwardRef<TimelineViewHandle, TimelineViewProps>((props, ref) => {
  const {
    times,
    calendarMode,
    childWidth,
    childClass,
    showingPastDates,
    borders,
  } = props;

  const scroller = useRef<HTMLDivElement>(null);
  const [scrollViews, setScrollViews] = useState([-1, 1]);

  useImperativeHandle(ref, () => ({
    scrollTo: (sectionId: string) => {
      if (!scroller.current) return;
      const elementId = sectionId === 'unscheduled' ? 'time-ruler-unscheduled' : `time-ruler-${sectionId}`;
      const element = scroller.current.querySelector(`#${elementId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
      } else {
        console.warn(`TimelineView: Element with ID #${elementId} not found for scrolling.`);
      }
    }
  }), []); // Empty dependency array ensures the handle is stable

  const updateScroll = () => {
    if (!scroller.current || childWidth === 0) return;
    const scrollWidth = scroller.current.getBoundingClientRect().width;
    const unscheduledElement = scroller.current.querySelector('#time-ruler-unscheduled');
    const unscheduledWidthVal = unscheduledElement ? unscheduledElement.getBoundingClientRect().width : 0;

    if (scrollWidth === 0) return;

    const itemEffectiveWidth = scrollWidth / childWidth;
    let itemsScrolledPastUnscheduled = 0;
    if (itemEffectiveWidth > 0 && scroller.current.scrollLeft > unscheduledWidthVal) {
        itemsScrolledPastUnscheduled = (scroller.current.scrollLeft - unscheduledWidthVal) / itemEffectiveWidth;
    }

    const currentChildIndex = unscheduledWidthVal > 0 ? itemsScrolledPastUnscheduled + 1 : itemsScrolledPastUnscheduled;

    const leftLevel = Math.floor(currentChildIndex);
    const rightLevel = Math.ceil(currentChildIndex + childWidth);

    if (leftLevel !== scrollViews[0] || rightLevel !== scrollViews[1]) {
      setScrollViews([leftLevel, rightLevel]);
    }
  };

  useEffect(updateScroll, [childWidth, calendarMode, times, props]);

  useEffect(() => {
    updateScroll();
  }, []);

  useEffect(() => {
    if (!scroller.current) return;
    const timesScroller = scroller.current;

    const childNodes = timesScroller.childNodes;
    if (!childNodes || childNodes.length === 0) return;

    let targetElement: HTMLElement | null = null;
    if (showingPastDates) {
      if (childNodes.length >= 2) {
        targetElement = childNodes.item(childNodes.length - 2) as HTMLElement;
      } else {
        targetElement = childNodes.item(0) as HTMLElement;
      }
    } else {
      if (childNodes.length >= 2) {
        targetElement = childNodes.item(1) as HTMLElement;
      } else {
        targetElement = childNodes.item(0) as HTMLElement;
      }
    }

    if (targetElement && typeof targetElement.offsetLeft === 'number') {
      // Initial scroll without smooth behavior, or handled by scrollTo prop from AppInitializer
      // For now, this effect is for non-imperative scrolling adjustments.
      // The imperative scrollTo will handle specific requests.
      // This one can be a direct scrollLeft assignment.
      timesScroller.scrollLeft = targetElement.offsetLeft;
    }
  }, [calendarMode, showingPastDates, childWidth, times]);


  const frameClass = `p-0.5 child:p-1 child:bg-primary child:rounded-icon child:h-full child:w-full ${
    borders ? 'child:border-solid child:border-divider child:border-[1px]' : ''
  }`;

  return (
    <div
      className={`flex h-full w-full snap-mandatory rounded-icon text-base child:flex-none child:snap-start ${childClass} !overflow-x-auto overflow-y-clip child:h-full snap-x`}
      id='time-ruler-times'
      data-auto-scroll={calendarMode ? 'y' : 'x'}
      ref={scroller}
      onScroll={updateScroll}
    >
      {times.map((time, i) => {
        const isShowing = i >= scrollViews[0] && i <= scrollViews[1];
        return time.type === 'unscheduled' ? (
          <div
            key='unscheduled'
            id='time-ruler-unscheduled'
            className={`${frameClass} !w-full flex-none`}
          >
            {isShowing && <Unscheduled />}
          </div>
        ) : (
          <Fragment key={time.startISO + '::' + time.type}>
            <div
              id={`time-ruler-${getStartDate(DateTime.fromISO(time.startISO))}`}
              className={frameClass}
            >
              {isShowing && <Day {...time} />}
            </div>
            {calendarMode && DateTime.fromISO(time.startISO).weekday === 7 ? (
              <div className='!h-0 !w-1'></div>
            ) : null}
          </Fragment>
        );
      })}
    </div>
  );
});

export default TimelineView;
