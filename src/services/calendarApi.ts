import * as ical2json from 'ical2json'
import ical from 'ical'
import _ from 'lodash'
import { DateTime } from 'luxon'
import { Component, Notice, request } from 'obsidian'
import { getters, setters } from '../app/store'
import TimeRulerPlugin from '../main'
import { toISO } from './util'
// import moment from 'moment'; // moment is imported but not used.

// Types for iCalendar event data
export interface IcalDateTime {
  date?: string;
  dateTime?: string;
  dateOnly?: boolean;
  getTimezoneOffset?: () => number;
  // Note: The actual type from 'ical' library might be more complex (e.g., a Date object with attached params)
  // For simplicity, we're typing based on usage. Consider refining if direct Date object methods are needed beyond getTimezoneOffset.
}

export interface IcalRRule {
  between: (startDate: Date, endDate: Date) => Date[];
  // The 'ical' library's RRule object is more complex, often a 'node-rrule' RRule instance.
  // Typing just 'between' based on usage.
}

export interface IcalEventData {
  type?: string; // 'VEVENT' is common
  start?: IcalDateTime;
  end?: IcalDateTime;
  summary?: string;
  description?: string;
  location?: string;
  rrule?: IcalRRule;
  // Recurrences can override parts of the original event.
  recurrences?: Record<string, Partial<IcalEventData>>; // Key is recurrence ID (date string)
  // EXDATE stores exception dates. Key is date string, value is often the date string or true.
  exdate?: Record<string, IcalDateTime | boolean>; // Value can be an object with date info or just true
  // Other properties like uid, dtstamp etc. exist but are not used in current logic
  [key: string]: any; // Allow other properties from ical library
}

let reportedOffline = false
export default class CalendarAPI extends Component {
  settings: TimeRulerPlugin['settings']
  removeCalendar: (calendar: string) => void

  constructor(
    settings: CalendarAPI['settings'],
    removeCalendar: CalendarAPI['removeCalendar']
  ) {
    super()
    this.settings = settings
    this.removeCalendar = removeCalendar
  }

  async loadEvents() {
    if (!window.navigator.onLine) {
      console.warn('Time Ruler: Calendars offline.')
      return
    }
    const events: Record<string, EventProps> = {}
    let i = 0

    let offline = false

    const searchWithinWeeks = getters.get('searchWithinWeeks')
    const showingPastDates = getters.get('showingPastDates')
    const dateBounds: [DateTime, DateTime] = showingPastDates
      ? [
          DateTime.now().minus({ weeks: searchWithinWeeks[1] }),
          DateTime.now().plus({ days: 1 }),
        ]
      : [
          DateTime.now().minus({ days: 1 }),
          DateTime.now().plus({ weeks: searchWithinWeeks[1] }),
        ]

    const calendarLoads = this.settings.calendars.map(async (calendar) => {
      try {
        const data = await request(calendar)
        const icsEvents = ical.parseICS(data)

        const calendarName = data.match(/CALNAME:(.*)/)?.[1] ?? 'Default'
        for (let [id, event] of _.entries(icsEvents) as [string, IcalEventData][]) {
          if (!event || !event.start || !event.end || event.type !== 'VEVENT') continue

          // Ensure rrule, start, and end objects exist before trying to access their properties
          if (event.rrule && event.start && event.end) {
            const rruleStart = event.start; // To satisfy TypeScript that event.start is defined here
            var dates: Date[] = event.rrule.between(
              dateBounds[0].toJSDate(),
              dateBounds[1].toJSDate()
            );
            if (dates.length > 0 && rruleStart.getTimezoneOffset) {
              // patch for events convering between daylight savings time and the current time
              const timeDifference =
                rruleStart.getTimezoneOffset() - dates[0].getTimezoneOffset();
              dates.forEach((x: Date) => {
                x.setTime(x.getTime() - timeDifference * 60 * 1000);
              });
            }

            if (event.recurrences) { // No need for != undefined with strict null checks
              for (const r in event.recurrences) {
                // Check if 'r' is a valid date string for a recurrence
                const recurrenceDate = new Date(r);
                if (isNaN(recurrenceDate.getTime())) continue; // Skip if 'r' is not a valid date

                const dateTime = DateTime.fromJSDate(recurrenceDate).setZone(
                  'local'
                );
                if (dateTime < dateBounds[1] && dateTime >= dateBounds[0]) {
                  dates.push(recurrenceDate);
                }
              }
            }
            // event.start and event.end are guaranteed to be defined here due to the outer if condition.
            let duration =
              DateTime.fromJSDate(event.end as Date).toMillis() - // Cast to Date if IcalDateTime is not directly Date
              DateTime.fromJSDate(event.start as Date).toMillis();

            for (let date of dates) {
              const dateLookupKey = date.toISOString().substring(0, 10)
              let currentStart: DateTime, currentEnd: DateTime;
              let currentTitle = event.summary; // Default to original summary

              const recurrenceEvent = event.recurrences?.[dateLookupKey];
              const exceptionExists = event.exdate?.[dateLookupKey];

              if (exceptionExists) {
                continue; // Skip this date as it's an exception
              }

              if (recurrenceEvent && recurrenceEvent.start && recurrenceEvent.end) {
                // We found an override with defined start and end
                currentStart = DateTime.fromJSDate(recurrenceEvent.start as Date).setZone('local');
                const currentEventDuration =
                  DateTime.fromJSDate(recurrenceEvent.end as Date).toMillis() -
                  currentStart.toMillis();
                currentEnd = currentStart.plus({ millisecond: currentEventDuration }).setZone('local');
                if (recurrenceEvent.summary) {
                  currentTitle = recurrenceEvent.summary;
                }
              } else {
                // No valid recurrence override or no exception, use original event's duration
                currentStart = DateTime.fromJSDate(date).setZone('local');
                currentEnd = currentStart.plus({ milliseconds: duration });
              }

              const startString = rruleStart.dateOnly // Use rruleStart (which is event.start)
                ? (currentStart.toISODate() as string)
                : toISO(currentStart.setZone('local'));
              const endString = rruleStart.dateOnly // Use rruleStart (which is event.start)
                ? (currentEnd.toISODate() as string)
                : toISO(currentEnd.setZone('local'));

              const thisId = `${id}-${startString}`;
              // Use currentTitle for this specific occurrence
              const props: EventProps = {
                id: thisId,
                title: currentTitle ?? '',
                startISO: startString,
                endISO: endString,
                type: 'event',
                calendarId: `${i}`,
                calendarName: calendarName,
                color: '',
                notes: recurrenceEvent?.description ?? event.description, // Use recurrence description if available
                location: recurrenceEvent?.location ?? event.location, // Use recurrence location if available
              }
              events[thisId] = props
            }
          } else if (event.start && event.end) { // Process non-recurring events, ensure start and end are defined
            let end = DateTime.fromJSDate(event.end as Date).setZone('local');
            if (end < dateBounds[0]) continue;

            let start = DateTime.fromJSDate(event.start as Date).setZone('local');
            if (start > dateBounds[1]) continue;

            const startString = event.start.dateOnly
              ? (start.toISODate() as string)
              : toISO(start);
            const endString = event.start.dateOnly // Assuming end dateOnly follows start dateOnly
              ? (end.toISODate() as string)
              : toISO(end);

            const props: EventProps = {
              id,
              title: event.summary ?? '',
              startISO: startString,
              endISO: endString,
              type: 'event',
              calendarId: `${i}`,
              calendarName: calendarName,
              color: '',
                notes: event.description, // Non-recurring, so original description
                location: event.location,  // Non-recurring, so original location
            }

            events[id] = props;
          }
        }

        i++
      } catch (err) {
        console.error(err)

        offline = true
      }

      if (offline && !reportedOffline) {
        reportedOffline = true
        new Notice('Time Ruler: calendars offline.')
      }
    })

    await Promise.all(calendarLoads)

    setters.set({ events })
  }
}
