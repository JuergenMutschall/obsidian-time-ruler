import { test } from '@jest/globals';

import sayHello from './works-everywhere';

test('sayHello says hello', () => {
	expect(sayHello("world")).toBe("Hello, world!");
});
