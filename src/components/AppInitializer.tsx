// AppInitializer.tsx
import React, { useEffect, useState } from 'react';
import { DateTime } from 'luxon';
import { Notice } from 'obsidian';
import { getters, setters, useAppStore } from '../app/store';
import { getToday } from '../services/util'; // scrollToSection removed
import { sounds } from 'src/assets/assets';
import { TimelineViewHandle } from './TimelineViewHandle'; // Import the handle type

// Define props for AppInitializer
interface AppInitializerProps {
  reload: () => Promise<void>;
  weeksShownState: number;
  setWeeksShown: (weeks: number) => void;
  showingPastDates: boolean;
  searchWithinWeeks: [number, number];
  calendarMode: boolean;
  timelineViewRef: React.RefObject<TimelineViewHandle | undefined>; // Added timelineViewRef
}

const AppInitializer: React.FC<AppInitializerProps> = (props) => {
  const {
    reload,
    weeksShownState,
    setWeeksShown,
    showingPastDates,
    searchWithinWeeks,
    calendarMode,
    timelineViewRef, // Destructure timelineViewRef
  } = props;

  useEffect(() => {
    reload();
  }, [reload]); // Keep reload dependency as it's a function from props

  // const [now, setNow] = useState(DateTime.now()); // Retaining this for the timer logic
  // It seems `now` state was also requested to be here from the previous subtask.
  // If `App.tsx` needs `now` for `times` array, it should use its own `DateTime.now()` as it does.
  const [, setNow] = useState(DateTime.now()); // Keep setNow for the timer, but now value isn't directly used elsewhere
                                               // after this refactor. The original `now` was for the `times` array in App.tsx
                                               // which App.tsx now handles with its own `nowForTimes`.
                                               // So the `now` state here is only for the timer logic.

  useEffect(() => {
    const update = () => {
      setNow(DateTime.now()); // This updates the local 'now' for the timer check.
    };
    const interval = window.setInterval(update, 60000);

    const checkTimer = () => {
      const { startISO, maxSeconds, playing } = getters.get('timer');
      if (
        playing &&
        startISO &&
        maxSeconds &&
        new Date().toISOString() >= startISO
      ) {
        setters.patchTimer({
          maxSeconds: null,
          startISO: new Date().toISOString(),
          negative: true,
          playing: true,
        });
        if (getters.getApp().isMobile) {
          sounds.timer.play();
          new Notice('Timer complete');
        } else {
          switch (getters.get('settings').timerEvent) {
            case 'notification':
              new Notification('Timer complete');
              break;
            case 'sound':
              sounds.timer.play();
              new Notice('Timer complete');
              break;
          }
        }
      }
    };
    const timerInterval = window.setInterval(checkTimer, 1000);

    return () => {
      window.clearInterval(interval);
      window.clearInterval(timerInterval);
    };
  }, []);

  // useEffect(() => {
  useEffect(() => {
    // Wait for the ref to be populated and then scroll
    const timeout = setTimeout(() => {
      if (timelineViewRef?.current) {
        timelineViewRef.current.scrollTo(getToday());
      }
    }, 1000); // Keep delay to ensure TimelineView's DOM is ready
    return () => clearTimeout(timeout);
  }, [timelineViewRef]); // Depend on timelineViewRef

  // Moved useEffect hooks from App.tsx
  useEffect(() => {
    if (calendarMode) {
      setWeeksShown(4);
    } else {
      setWeeksShown(1);
    }
  }, [calendarMode, setWeeksShown]);

  useEffect(() => {
    getters.getObsidianAPI()?.loadTasks('', showingPastDates);
  }, [weeksShownState, showingPastDates]);

  useEffect(() => {
    getters.getObsidianAPI()?.loadTasks('', showingPastDates);
  }, [searchWithinWeeks, showingPastDates]);

  useEffect(() => {
    if (showingPastDates && -weeksShownState < searchWithinWeeks[0]) {
      setters.set({
        searchWithinWeeks: [-weeksShownState, searchWithinWeeks[1]],
      });
    }
    if (!showingPastDates && weeksShownState > searchWithinWeeks[1]) {
      setters.set({
        searchWithinWeeks: [searchWithinWeeks[0], weeksShownState],
      });
    }
  }, [showingPastDates, weeksShownState, searchWithinWeeks]);


  return null; // This component doesn't render anything
};

export default AppInitializer;
