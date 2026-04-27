/**
 * util.js
 * by john trinh
 * all that
 */

/**
 * INCLUSIVE MIN EXCLUSIVE MAX
 * @param {number} min - inclusive :3
 * @param {number} max - exclusive :3
 * @returns the integer
 */
export const getRandomIntBetween = (min, max) => Math.floor(Math.random() * (max - min)) + min

export const getDatePretty = (date = new Date()) => date.toLocaleDateString('en-US', {
	month: 'long',
	day: 'numeric',
	year: 'numeric',
})