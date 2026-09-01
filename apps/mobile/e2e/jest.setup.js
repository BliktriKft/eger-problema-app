/**
 * Jest setup — runs once per test FILE (i.e. before each spec file).
 *
 * Detox expects the global `device` and Detox helpers to be on `global`.
 * The `detox` import wires that up so we don't need to do anything more
 * than import.  We also reset the device clock / locale here so flaky
 * tests have one less surprise source.
 */

require('detox');
const { device } = require('detox');

beforeAll(async () => {
  // Set a stable locale + timezone so the calendar / time displays don't
  // drift between local dev and CI. The app under test is Hungarian-
  // first so we run Eger-time / hu-HU.
  await device.setLocale('hu-HU');
  await device.setTimezone('Europe/Budapest');
});

afterAll(async () => {
  // Nothing to clean up — Detox's test runner disposes the device.
});
