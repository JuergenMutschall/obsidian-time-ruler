// src/tests/unit/calendarApi.test.ts

import { CalendarAPI } from '../../app/CalendarAPI';
import { getters, setters, setMockGetter, resetMockGetters } from './__mocks__/store';
import { request as mockRequest, Notice as mockNotice, setMockIcalData, Platform } from './__mocks__/obsidian';
import { DateTime, Settings } from 'luxon';

// Mock obsidian module
jest.mock('obsidian', () => require('./__mocks__/obsidian'), { virtual: true });
// Mock store module
jest.mock('../../app/store', () => require('./__mocks__/store'), { virtual: true });

const CALENDAR_URL_1 = 'http://example.com/cal1.ics';
const CALENDAR_URL_2 = 'http://example.com/cal2.ics';

const DEFAULT_CALENDAR_SETTINGS = [{ url: CALENDAR_URL_1, name: 'Calendar 1', color: '#FF0000' }];

// Consistent "now" for testing date boundaries
const MOCK_NOW = DateTime.fromISO('2023-10-26T10:00:00.000Z', { zone: 'utc' }); // Use UTC for mock base

describe('CalendarAPI.loadEvents', () => {
  let calendarAPI: CalendarAPI;
  let originalPlatformIsMobile: boolean;
  let originalNavigatorOnLine: PropertyDescriptor | undefined;

  beforeEach(() => {
    jest.clearAllMocks(); // Clears mock usage data, but not implementations
    resetMockGetters(); // Reset store mock values

    // Set Luxon's "now" to a fixed time for consistent testing
    Settings.now = () => MOCK_NOW.toMillis();
    Settings.defaultZone = 'utc'; // Ensure consistent timezone for tests

    calendarAPI = new CalendarAPI(setters.set, getters.get);

    // Mock navigator.onLine
    originalNavigatorOnLine = Object.getOwnPropertyDescriptor(window.navigator, 'onLine');
    Object.defineProperty(window.navigator, 'onLine', {
      value: true,
      configurable: true,
    });

    // Mock Platform.isMobile
    originalPlatformIsMobile = Platform.isMobile;
    Platform.isMobile = false; // Default to not mobile

    // Reset mock ical data
    setMockIcalData('');
  });

  afterEach(() => {
    // Restore Luxon's original "now"
    Settings.now = () => Date.now();
    Settings.defaultZone = 'system';

    // Restore navigator.onLine
    if (originalNavigatorOnLine) {
      Object.defineProperty(window.navigator, 'onLine', originalNavigatorOnLine);
    }

    // Restore Platform.isMobile
    Platform.isMobile = originalPlatformIsMobile;
  });

  // --- Test Cases Will Go Here ---

  it('1. Basic Event Parsing: should parse a simple non-recurring event', async () => {
    const icalData = `
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test Corp//NONSGML Event Calendar//EN
CALNAME:Test Calendar
BEGIN:VEVENT
UID:12345
DTSTAMP:20231026T000000Z
DTSTART:20231026T100000Z
DTEND:20231026T110000Z
SUMMARY:Simple Event
DESCRIPTION:Event Description
LOCATION:Event Location
END:VEVENT
END:VCALENDAR
    `.trim();
    setMockIcalData(icalData);

    await calendarAPI.loadEvents(DEFAULT_CALENDAR_SETTINGS);

    expect(mockRequest).toHaveBeenCalledWith({ url: CALENDAR_URL_1 });
    expect(setters.set).toHaveBeenCalledTimes(1);
    const eventsArg = setters.set.mock.calls[0][1]; // Second argument of the first call

    expect(Object.keys(eventsArg).length).toBe(1);
    const eventKey = Object.keys(eventsArg)[0];
    const event = eventsArg[eventKey];

    expect(event.summary).toBe('Simple Event');
    // In the CalendarAPI, start and end are Luxon DateTime objects.
    // The mock 'now' is 2023-10-26T10:00:00Z. Event is 2023-10-26T10:00:00Z to 11:00:00Z
    expect(event.start.toISO()).toBe('2023-10-26T10:00:00.000Z');
    expect(event.end.toISO()).toBe('2023-10-26T11:00:00.000Z');
    expect(event.description).toBe('Event Description');
    expect(event.location).toBe('Event Location');
    expect(event.calendarName).toBe('Test Calendar'); // From CALNAME
    expect(event.calendarUrl).toBe(CALENDAR_URL_1);
    expect(event.color).toBe('#FF0000');
  });

  it('2. Recurring Events: should generate occurrences for a daily recurring event', async () => {
    // Event recurs daily for 3 days, starting "today" relative to MOCK_NOW
    // MOCK_NOW is 2023-10-26T10:00:00Z
    const icalData = `
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test Corp//NONSGML Event Calendar//EN
BEGIN:VEVENT
UID:dailyevent
DTSTAMP:20231026T000000Z
DTSTART:20231026T140000Z
DTEND:20231026T150000Z
RRULE:FREQ=DAILY;COUNT=3
SUMMARY:Daily Meeting
END:VEVENT
END:VCALENDAR
    `.trim();
    setMockIcalData(icalData);
    setMockGetter('searchWithinWeeks', 0); // Default, search range is small, effectively MOCK_NOW to MOCK_NOW + default window

    await calendarAPI.loadEvents(DEFAULT_CALENDAR_SETTINGS);

    expect(setters.set).toHaveBeenCalledTimes(1);
    const eventsArg = setters.set.mock.calls[0][1];
    // Should generate 3 occurrences
    // Note: Default search window in CalendarAPI is from 'now' to 'now + 7 days' if searchWithinWeeks is 0 or not set.
    // With MOCK_NOW = 2023-10-26, window is 2023-10-26 to 2023-11-02
    // The 3 occurrences are: 2023-10-26, 2023-10-27, 2023-10-28
    expect(Object.keys(eventsArg).length).toBe(3);

    const event1 = eventsArg['dailyevent_2023-10-26T14:00:00.000Z'];
    expect(event1).toBeDefined();
    expect(event1.summary).toBe('Daily Meeting');
    expect(event1.start.toISO()).toBe('2023-10-26T14:00:00.000Z');

    const event2 = eventsArg['dailyevent_2023-10-27T14:00:00.000Z'];
    expect(event2).toBeDefined();
    expect(event2.start.toISO()).toBe('2023-10-27T14:00:00.000Z');

    const event3 = eventsArg['dailyevent_2023-10-28T14:00:00.000Z'];
    expect(event3).toBeDefined();
    expect(event3.start.toISO()).toBe('2023-10-28T14:00:00.000Z');
  });

  it('3. Recurring Events with Exceptions: should exclude EXDATEs', async () => {
    // Daily event for 4 days, but one day is excluded
    // MOCK_NOW = 2023-10-26
    const icalData = `
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test Corp//NONSGML Event Calendar//EN
BEGIN:VEVENT
UID:exdateevent
DTSTAMP:20231026T000000Z
DTSTART:20231026T160000Z
DTEND:20231026T170000Z
RRULE:FREQ=DAILY;COUNT=4
EXDATE:20231027T160000Z
SUMMARY:Event with Exception
END:VEVENT
END:VCALENDAR
    `.trim();
    setMockIcalData(icalData);
    // Search window: 2023-10-26 to 2023-11-02
    await calendarAPI.loadEvents(DEFAULT_CALENDAR_SETTINGS);

    expect(setters.set).toHaveBeenCalledTimes(1);
    const eventsArg = setters.set.mock.calls[0][1];
    // Expected occurrences: 2023-10-26, 2023-10-28, 2023-10-29 (3 total)
    expect(Object.keys(eventsArg).length).toBe(3);
    expect(eventsArg['exdateevent_2023-10-26T16:00:00.000Z']).toBeDefined();
    expect(eventsArg['exdateevent_2023-10-27T16:00:00.000Z']).toBeUndefined(); // Excluded
    expect(eventsArg['exdateevent_2023-10-28T16:00:00.000Z']).toBeDefined();
    expect(eventsArg['exdateevent_2023-10-29T16:00:00.000Z']).toBeDefined();
  });

  it('4. Recurring Events with Overrides (Recurrence-ID): should apply overrides', async () => {
    // Daily event, one instance is modified
    // MOCK_NOW = 2023-10-26
    const icalData = `
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test Corp//NONSGML Event Calendar//EN
BEGIN:VEVENT
UID:overrideevent
DTSTAMP:20231026T000000Z
DTSTART:20231026T090000Z
DTEND:20231026T100000Z
RRULE:FREQ=DAILY;COUNT=3
SUMMARY:Original Summary
END:VEVENT
BEGIN:VEVENT
UID:overrideevent
RECURRENCE-ID:20231027T090000Z
DTSTAMP:20231026T010000Z
DTSTART:20231027T093000Z
DTEND:20231027T103000Z
SUMMARY:Overridden Summary
END:VEVENT
END:VCALENDAR
    `.trim();
    setMockIcalData(icalData);
    // Search window: 2023-10-26 to 2023-11-02
    await calendarAPI.loadEvents(DEFAULT_CALENDAR_SETTINGS);

    expect(setters.set).toHaveBeenCalledTimes(1);
    const eventsArg = setters.set.mock.calls[0][1];
    expect(Object.keys(eventsArg).length).toBe(3);

    const event1 = eventsArg['overrideevent_2023-10-26T09:00:00.000Z'];
    expect(event1.summary).toBe('Original Summary');
    expect(event1.start.toISO()).toBe('2023-10-26T09:00:00.000Z');

    const event2 = eventsArg['overrideevent_2023-10-27T09:30:00.000Z']; // Key uses overridden start time
    expect(event2.summary).toBe('Overridden Summary');
    expect(event2.start.toISO()).toBe('2023-10-27T09:30:00.000Z'); // Overridden start
    expect(event2.end.toISO()).toBe('2023-10-27T10:30:00.000Z');   // Overridden end

    const event3 = eventsArg['overrideevent_2023-10-28T09:00:00.000Z'];
    expect(event3.summary).toBe('Original Summary');
    expect(event3.start.toISO()).toBe('2023-10-28T09:00:00.000Z');
  });

  describe('5. Date Boundary Filtering', () => {
    // MOCK_NOW is 2023-10-26T10:00:00Z (Thursday)
    const icalDataSingleEvent = `
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test Corp//NONSGML Event Calendar//EN
BEGIN:VEVENT
UID:boundarytest
DTSTAMP:20231020T000000Z
DTSTART:20231020T120000Z
DTEND:20231020T130000Z
SUMMARY:Past Event
END:VEVENT
BEGIN:VEVENT
UID:boundarytest2
DTSTAMP:20231026T000000Z
DTSTART:20231026T120000Z
DTEND:20231026T130000Z
SUMMARY:Today Event
END:VEVENT
BEGIN:VEVENT
UID:boundarytest3
DTSTAMP:20231120T000000Z
DTSTART:20231120T120000Z
DTEND:20231120T130000Z
SUMMARY:Future Event
END:VEVENT
END:VCALENDAR
    `.trim();

    beforeEach(() => {
        setMockIcalData(icalDataSingleEvent);
    });

    it('should filter events if showingPastDates is false and searchWithinWeeks is 0 (today to +7 days)', async () => {
      setMockGetter('showingPastDates', false);
      setMockGetter('searchWithinWeeks', 0); // Search from MOCK_NOW to MOCK_NOW + 7 days
      // MOCK_NOW = 2023-10-26. Range: 2023-10-26 to 2023-11-02

      await calendarAPI.loadEvents(DEFAULT_CALENDAR_SETTINGS);
      const eventsArg = setters.set.mock.calls[0][1];
      expect(Object.keys(eventsArg).length).toBe(1);
      expect(eventsArg['boundarytest2_2023-10-26T12:00:00.000Z']).toBeDefined(); // Today Event
    });

    it('should include past events if showingPastDates is true and searchWithinWeeks is 0 (today to +7 days, past also)', async () => {
      setMockGetter('showingPastDates', true);
      setMockGetter('searchWithinWeeks', 0); // Future search: MOCK_NOW to MOCK_NOW + 7 days. Past: All past events
      // MOCK_NOW = 2023-10-26. Range: (Past) + 2023-10-26 to 2023-11-02

      await calendarAPI.loadEvents(DEFAULT_CALENDAR_SETTINGS);
      const eventsArg = setters.set.mock.calls[0][1];
      expect(Object.keys(eventsArg).length).toBe(2);
      expect(eventsArg['boundarytest_2023-10-20T12:00:00.000Z']).toBeDefined(); // Past Event
      expect(eventsArg['boundarytest2_2023-10-26T12:00:00.000Z']).toBeDefined(); // Today Event
    });

    it('should filter events based on searchWithinWeeks (e.g., 1 week back, 1 week forward)', async () => {
      setMockGetter('showingPastDates', 'within'); // This implies searchWithinWeeks for past too
      setMockGetter('searchWithinWeeks', 1); // Search from MOCK_NOW - 1 week to MOCK_NOW + 1 week
      // MOCK_NOW = 2023-10-26. Range: 2023-10-19 to 2023-11-02

      await calendarAPI.loadEvents(DEFAULT_CALENDAR_SETTINGS);
      const eventsArg = setters.set.mock.calls[0][1];
      expect(Object.keys(eventsArg).length).toBe(2);
      expect(eventsArg['boundarytest_2023-10-20T12:00:00.000Z']).toBeDefined(); // Past Event (within 1 week)
      expect(eventsArg['boundarytest2_2023-10-26T12:00:00.000Z']).toBeDefined(); // Today Event
    });
  });

  it('6. All-Day Events: should parse DTSTART;VALUE=DATE correctly', async () => {
    // MOCK_NOW = 2023-10-26
    const icalData = `
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test Corp//NONSGML Event Calendar//EN
BEGIN:VEVENT
UID:alldayevent
DTSTAMP:20231026T000000Z
DTSTART;VALUE=DATE:20231027
DTEND;VALUE=DATE:20231028
SUMMARY:All Day Event
END:VEVENT
END:VCALENDAR
    `.trim();
    setMockIcalData(icalData);
    await calendarAPI.loadEvents(DEFAULT_CALENDAR_SETTINGS);

    expect(setters.set).toHaveBeenCalledTimes(1);
    const eventsArg = setters.set.mock.calls[0][1];
    const event = eventsArg['alldayevent_2023-10-27']; // Key might be just date for all-day from ical.js

    expect(event).toBeDefined();
    expect(event.summary).toBe('All Day Event');
    // Luxon, when parsing a date-only string like "2023-10-27", sets time to 00:00:00 in the local zone.
    // Since we set Settings.defaultZone = 'utc', it will be UTC midnight.
    expect(event.start.toISO()).toBe('2023-10-27T00:00:00.000Z');
    // For DTEND with VALUE=DATE, ical.js (and RFC 5545) states it's non-inclusive.
    // So an event from 2023-10-27 to 2023-10-28 is a one-day event on the 27th.
    // The CalendarAPI adjusts this to be the end of the day for the *start* date.
    expect(event.end.toISO()).toBe('2023-10-27T23:59:59.999Z');
    expect(event.allDay).toBe(true);
  });

  it('7. Error Handling (Request Failure): should handle request errors gracefully', async () => {
    mockRequest.mockImplementationOnce(() => Promise.reject(new Error('Network error')));
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await calendarAPI.loadEvents(DEFAULT_CALENDAR_SETTINGS);

    expect(mockRequest).toHaveBeenCalledWith({ url: CALENDAR_URL_1 });
    expect(setters.set).toHaveBeenCalledTimes(1); // Called once with empty events for that calendar
    expect(setters.set.mock.calls[0][1]).toEqual({}); // Should be an empty object for events
    expect(mockNotice).toHaveBeenCalledWith('Time Ruler: calendars offline. Error fetching calendar Calendar 1: Network error');
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Error fetching calendar Calendar 1'), expect.any(Error));

    consoleErrorSpy.mockRestore();
  });

  it('8. Offline Handling (window.navigator.onLine = false): should not fetch and warn', async () => {
    Object.defineProperty(window.navigator, 'onLine', { value: false, configurable: true });
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    await calendarAPI.loadEvents(DEFAULT_CALENDAR_SETTINGS);

    expect(mockRequest).not.toHaveBeenCalled();
    expect(setters.set).toHaveBeenCalledTimes(1); // Still called to clear/set events
    expect(setters.set.mock.calls[0][1]).toEqual({});
    expect(consoleWarnSpy).toHaveBeenCalledWith('Time Ruler: Calendars offline. Skipping fetch for Calendar 1.');
    // No Notice for this specific case based on current CalendarAPI implementation, only console.warn

    consoleWarnSpy.mockRestore();
  });

  describe('9. Multiple Calendars', () => {
    const calendarSettingsMulti = [
      { url: CALENDAR_URL_1, name: 'Calendar 1', color: '#FF0000' },
      { url: CALENDAR_URL_2, name: 'Calendar 2', color: '#00FF00' },
    ];
    const icalData1 = `
BEGIN:VCALENDAR
VERSION:2.0
CALNAME:Cal1
BEGIN:VEVENT
UID:event1
DTSTART:20231026T100000Z
DTEND:20231026T110000Z
SUMMARY:Event from Cal1
END:VEVENT
END:VCALENDAR`.trim();
    const icalData2 = `
BEGIN:VCALENDAR
VERSION:2.0
CALNAME:Cal2
BEGIN:VEVENT
UID:event2
DTSTART:20231026T120000Z
DTEND:20231026T130000Z
SUMMARY:Event from Cal2
END:VEVENT
END:VCALENDAR`.trim();

    it('should fetch and process events from all calendars', async () => {
      mockRequest
        .mockImplementationOnce(() => Promise.resolve(icalData1))
        .mockImplementationOnce(() => Promise.resolve(icalData2));

      await calendarAPI.loadEvents(calendarSettingsMulti);

      expect(mockRequest).toHaveBeenCalledTimes(2);
      expect(mockRequest).toHaveBeenCalledWith({ url: CALENDAR_URL_1 });
      expect(mockRequest).toHaveBeenCalledWith({ url: CALENDAR_URL_2 });

      expect(setters.set).toHaveBeenCalledTimes(1);
      const eventsArg = setters.set.mock.calls[0][1];
      expect(Object.keys(eventsArg).length).toBe(2);

      const ev1 = Object.values(eventsArg).find((e: any) => e.summary === 'Event from Cal1');
      const ev2 = Object.values(eventsArg).find((e: any) => e.summary === 'Event from Cal2');

      expect(ev1).toBeDefined();
      expect(ev1.calendarName).toBe('Cal1');
      expect(ev1.color).toBe('#FF0000');

      expect(ev2).toBeDefined();
      expect(ev2.calendarName).toBe('Cal2');
      expect(ev2.color).toBe('#00FF00');
    });

    it('should handle one calendar failing and others succeeding', async () => {
      mockRequest
        .mockImplementationOnce(() => Promise.reject(new Error('Failed Cal1')))
        .mockImplementationOnce(() => Promise.resolve(icalData2));
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await calendarAPI.loadEvents(calendarSettingsMulti);

      expect(mockRequest).toHaveBeenCalledTimes(2);
      expect(mockNotice).toHaveBeenCalledWith('Time Ruler: calendars offline. Error fetching calendar Calendar 1: Failed Cal1');

      expect(setters.set).toHaveBeenCalledTimes(1);
      const eventsArg = setters.set.mock.calls[0][1];
      expect(Object.keys(eventsArg).length).toBe(1); // Only event from Cal2

      const ev2 = Object.values(eventsArg).find((e: any) => e.summary === 'Event from Cal2');
      expect(ev2).toBeDefined();
      expect(ev2.calendarName).toBe('Cal2');

      consoleErrorSpy.mockRestore();
    });
  });

  it('10. Empty Calendar Data: should call setters.set with empty events object', async () => {
    const icalDataEmpty = `
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test Corp//NONSGML Event Calendar//EN
CALNAME:EmptyCal
END:VCALENDAR
    `.trim();
    setMockIcalData(icalDataEmpty);

    await calendarAPI.loadEvents(DEFAULT_CALENDAR_SETTINGS);

    expect(mockRequest).toHaveBeenCalledWith({ url: CALENDAR_URL_1 });
    expect(setters.set).toHaveBeenCalledTimes(1);
    const eventsArg = setters.set.mock.calls[0][1];
    expect(Object.keys(eventsArg).length).toBe(0);
  });

  describe('11. Calendar Name Parsing', () => {
    const icalDataWithName = `
BEGIN:VCALENDAR
VERSION:2.0
CALNAME:My Actual Calendar Name
BEGIN:VEVENT
UID:event.with.calname
DTSTART:20231026T100000Z
DTEND:20231026T110000Z
SUMMARY:Event
END:VEVENT
END:VCALENDAR`.trim();

    const icalDataWithoutName = `
BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:event.without.calname
DTSTART:20231026T110000Z
DTEND:20231026T120000Z
SUMMARY:Event
END:VEVENT
END:VCALENDAR`.trim();

    it('should use CALNAME if present', async () => {
      setMockIcalData(icalDataWithName);
      await calendarAPI.loadEvents(DEFAULT_CALENDAR_SETTINGS);

      const eventsArg = setters.set.mock.calls[0][1];
      const event = Object.values(eventsArg)[0] as any;
      expect(event.calendarName).toBe('My Actual Calendar Name');
    });

    it('should use fallback name from settings if CALNAME is not present', async () => {
      setMockIcalData(icalDataWithoutName);
      // DEFAULT_CALENDAR_SETTINGS provides 'Calendar 1'
      await calendarAPI.loadEvents(DEFAULT_CALENDAR_SETTINGS);

      const eventsArg = setters.set.mock.calls[0][1];
      const event = Object.values(eventsArg)[0] as any;
      expect(event.calendarName).toBe('Calendar 1'); // Fallback to name from settings
    });

    it('should use "Default" if CALNAME is not present and settings name is also missing/empty', async () => {
        setMockIcalData(icalDataWithoutName);
        await calendarAPI.loadEvents([{ url: CALENDAR_URL_1, name: '', color: '#0000FF' }]); // Empty name in settings

        const eventsArg = setters.set.mock.calls[0][1];
        const event = Object.values(eventsArg)[0] as any;
        expect(event.calendarName).toBe('Default'); // Fallback to 'Default'
      });
  });
});
