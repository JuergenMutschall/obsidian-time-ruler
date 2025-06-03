import { isDateISO, roundMinutes, parseFolderFromPath, parseFileFromPath, splitHeading, convertSearchToRegExp, isLengthType, isGreater, hasPriority } from '../../services/util';
import { DateTime } from 'luxon';
import { TaskPriorities } from '../../types/enums';

// Mock Luxon's DateTime.now if any tests rely on a fixed "current" time, though roundMinutes primarily manipulates a given DateTime.
// For roundMinutes, we directly create DateTime instances.

describe('Utility Functions', () => {
  describe('isDateISO', () => {
    it('should return true for valid ISO date strings', () => {
      expect(isDateISO('2023-10-26')).toBe(true);
      expect(isDateISO('2024-01-15')).toBe(true);
    });

    it('should return false for invalid ISO date strings', () => {
      expect(isDateISO('2023/10/26')).toBe(false);
      expect(isDateISO('26-10-2023')).toBe(false);
      expect(isDateISO('2023-10-26T10:00:00Z')).toBe(false); // Should be date only
      expect(isDateISO('invalid-date')).toBe(false);
      expect(isDateISO('')).toBe(false);
    });

    it('should return false for null or undefined input', () => {
      expect(isDateISO(null as any)).toBe(false);
      expect(isDateISO(undefined as any)).toBe(false);
    });
  });

  describe('roundMinutes', () => {
    it('should round down to the nearest 15 minute interval', () => {
      expect(roundMinutes(DateTime.fromISO('2023-10-26T10:00:00')).minute).toBe(0);
      expect(roundMinutes(DateTime.fromISO('2023-10-26T10:14:00')).minute).toBe(0);
      expect(roundMinutes(DateTime.fromISO('2023-10-26T10:15:00')).minute).toBe(15);
      expect(roundMinutes(DateTime.fromISO('2023-10-26T10:29:59')).minute).toBe(15);
      expect(roundMinutes(DateTime.fromISO('2023-10-26T10:30:00')).minute).toBe(30);
      expect(roundMinutes(DateTime.fromISO('2023-10-26T10:44:30')).minute).toBe(30);
      expect(roundMinutes(DateTime.fromISO('2023-10-26T10:45:00')).minute).toBe(45);
      expect(roundMinutes(DateTime.fromISO('2023-10-26T10:59:00')).minute).toBe(45);
    });

    it('should keep other date/time components the same', () => {
      const dt = DateTime.fromISO('2023-10-26T10:07:30');
      const rounded = roundMinutes(dt);
      expect(rounded.year).toBe(2023);
      expect(rounded.month).toBe(10);
      expect(rounded.day).toBe(26);
      expect(rounded.hour).toBe(10);
      expect(rounded.second).toBe(0); // roundMinutes also zeros out seconds and ms
      expect(rounded.millisecond).toBe(0);
    });
  });

  describe('parseFolderFromPath', () => {
    it('should return the immediate parent folder', () => {
      expect(parseFolderFromPath('path/to/some/file.md')).toBe('some');
      expect(parseFolderFromPath('another/folder/note.txt')).toBe('folder');
    });

    it('should return the path itself if it is a root file or folder name', () => {
      expect(parseFolderFromPath('rootfile.md')).toBe('rootfile.md');
      expect(parseFolderFromPath('RootFolder/')).toBe('RootFolder'); // handles trailing slash
      expect(parseFolderFromPath('RootFolder')).toBe('RootFolder');
    });

    it('should handle paths with leading slash', () => {
      expect(parseFolderFromPath('/path/to/file.md')).toBe('to');
    });

    it('should return empty string for empty or root path', () => {
      expect(parseFolderFromPath('')).toBe('');
      expect(parseFolderFromPath('/')).toBe('');
    });
  });

  describe('parseFileFromPath', () => {
    it('should extract filename and ensure .md extension', () => {
      expect(parseFileFromPath('path/to/file.md')).toBe('file.md');
      expect(parseFileFromPath('path/to/file')).toBe('file.md');
    });

    it('should remove headings, aliases, and line numbers', () => {
      expect(parseFileFromPath('file.md#heading')).toBe('file.md');
      expect(parseFileFromPath('file#heading with spaces')).toBe('file.md');
      expect(parseFileFromPath('file.md>alias part')).toBe('file.md');
      expect(parseFileFromPath('file.md::123')).toBe('file.md');
      expect(parseFileFromPath('file#heading::123>alias')).toBe('file.md');
    });

    it('should handle "Daily" by converting to current daily note path', () => {
      // Mocking getPathFromDate for "Daily" case, as it relies on global store `getters`
      // This is a bit tricky as parseFileFromPath itself calls parsePathFromDate which uses getters
      // For an isolated unit test, this specific "Daily" case might be better tested in an integration manner
      // or by injecting dependencies to parsePathFromDate.
      // For now, we test other functionalities. A more advanced setup would mock getters.
      // The function converts "Daily" to the current daily note name.
      // This test will verify that a YYYY-MM-DD.md format is returned.
      const dailyNoteRegex = /^\d{4}-\d{2}-\d{2}\.md$/;
      expect(parseFileFromPath('Daily')).toMatch(dailyNoteRegex);
    });

    it('should handle root files', () => {
      expect(parseFileFromPath('rootfile.md')).toBe('rootfile.md');
      expect(parseFileFromPath('rootfile')).toBe('rootfile.md');
    });

    it('should return ".md" for empty or only special character paths', () => {
      expect(parseFileFromPath('')).toBe('.md');
      expect(parseFileFromPath('#heading')).toBe('.md');
      expect(parseFileFromPath('>alias')).toBe('.md');
    });
  });

  describe('splitHeading', () => {
    it('should split by ">" first', () => {
      expect(splitHeading('container>title#sub')).toEqual(['container', 'title#sub']);
    });

    it('should split by "#" if no ">"', () => {
      expect(splitHeading('container#title')).toEqual(['container', 'title']);
      expect(splitHeading('file.md#section title')).toEqual(['file.md', 'section title']);
    });

    it('should split by last "/" if no ">" or "#"', () => {
      expect(splitHeading('path/to/file')).toEqual(['path/to', 'file']);
      expect(splitHeading('rootfile')).toEqual(['', 'rootfile']);
    });

    it('should return ["", title] if no delimiters or only filename', () => {
      expect(splitHeading('Just a title')).toEqual(['', 'Just a title']);
    });

    it('should handle empty string', () => {
      expect(splitHeading('')).toEqual(['', '']);
    });
  });

  describe('convertSearchToRegExp', () => {
    it('should create a regex that matches characters in sequence, case insensitively', () => {
      const regex = convertSearchToRegExp('abc');
      expect(regex.test('axbyc')).toBe(true);
      expect(regex.test('AB C')).toBe(true);
      expect(regex.test('acb')).toBe(false);
    });

    it('should escape special regex characters', () => {
      const regex = convertSearchToRegExp('a.b*c+');
      expect(regex.test('a.b*c+')).toBe(true); // matches literal string
      expect(regex.source).toContain('\\.');
      expect(regex.source).toContain('\\*');
      expect(regex.source).toContain('\\+');
    });

    it('should return a regex for empty string that matches anything (due to .*?)', () => {
      // The behavior of `split('').map().join('.*?')` on empty string results in `new RegExp('', 'i')`
      // which matches empty strings or positions. If it was `new RegExp('.*?', 'i')` it would match any string.
      // Current impl: `new RegExp(search.split('').map().join('.*?'), 'i')`
      // If search is '', split is [], map is [], join is ''. So `new RegExp('', 'i')`
      const regex = convertSearchToRegExp('');
      expect(regex.test('')).toBe(true);
      expect(regex.test('abc')).toBe(true); // an empty regex matches any position within the string
    });
  });

  describe('isLengthType', () => {
    it('should return true for "task-length" or "time"', () => {
      expect(isLengthType('task-length')).toBe(true);
      expect(isLengthType('time')).toBe(true);
    });

    it('should return false for other types or undefined', () => {
      expect(isLengthType('task')).toBe(false);
      expect(isLengthType('group')).toBe(false);
      expect(isLengthType(undefined)).toBe(false);
      expect(isLengthType(null as any)).toBe(false);
    });
  });

  describe('isGreater', () => {
    it('should correctly compare two ISO date/datetime strings', () => {
      expect(isGreater('2023-10-26', '2023-10-27')).toBe(true); // last is greater
      expect(isGreater('2023-10-27', '2023-10-26')).toBe(false);
      expect(isGreater('2023-10-26T10:00', '2023-10-26T11:00')).toBe(true);
      expect(isGreater('2023-10-26T11:00', '2023-10-26T10:00')).toBe(false);
      expect(isGreater('2023-10-26', '2023-10-26')).toBe(false);
    });

    it('should handle cases with one undefined input', () => {
      expect(isGreater(undefined, '2023-10-27')).toBe(true);
      expect(isGreater('2023-10-26', undefined)).toBe(false);
    });

    it('should return false if both are undefined or lastScheduled is undefined', () => {
      expect(isGreater(undefined, undefined)).toBe(false);
    });
  });

  describe('hasPriority', () => {
    it('should return true if task priority is not DEFAULT', () => {
      expect(hasPriority({ priority: TaskPriorities.HIGH } as any)).toBe(true);
      expect(hasPriority({ priority: TaskPriorities.LOWEST } as any)).toBe(true);
    });

    it('should return false if task priority is DEFAULT', () => {
      expect(hasPriority({ priority: TaskPriorities.DEFAULT } as any)).toBe(false);
    });

    it('should return false if priority is undefined (though TS might prevent this)', () => {
      // This case depends on how strictly TaskProps is typed and used.
      // If priority can be undefined on TaskProps, this test is relevant.
      expect(hasPriority({} as any)).toBe(false); // Assuming undefined priority defaults to or is treated as DEFAULT
      expect(hasPriority({ priority: undefined } as any)).toBe(false);
    });
  });

});
