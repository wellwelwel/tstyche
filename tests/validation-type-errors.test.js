import { strict as assert } from "node:assert";
import { test } from "mocha";
import { matchSnapshot } from "./__utilities__/assert.js";
import { getFixtureFileUrl, getTestFileName } from "./__utilities__/fixture.js";
import { normalizeOutput } from "./__utilities__/output.js";
import { spawnTyche } from "./__utilities__/tstyche.js";

const testFileName = getTestFileName(import.meta.url);
const fixtureUrl = getFixtureFileUrl(testFileName);

test("handles top level type errors", async function() {
  const { exitCode, stderr, stdout } = await spawnTyche(fixtureUrl, ["top-level"]);

  await matchSnapshot(normalizeOutput(stdout), {
    fileName: `${testFileName}-top-level-errors-stdout`,
    testFileUrl: import.meta.url,
  });

  await matchSnapshot(stderr, {
    fileName: `${testFileName}-top-level-errors-stderr`,
    testFileUrl: import.meta.url,
  });

  assert.equal(exitCode, 1);
});

test("handles describe level type errors", async function() {
  const { exitCode, stderr, stdout } = await spawnTyche(fixtureUrl, ["describe-level"]);

  await matchSnapshot(normalizeOutput(stdout), {
    fileName: `${testFileName}-describe-level-errors-stdout`,
    testFileUrl: import.meta.url,
  });

  await matchSnapshot(stderr, {
    fileName: `${testFileName}-describe-level-errors-stderr`,
    testFileUrl: import.meta.url,
  });

  assert.equal(exitCode, 1);
});

test("handles test level type errors", async function() {
  const { exitCode, stderr, stdout } = await spawnTyche(fixtureUrl, ["test-level"]);

  await matchSnapshot(normalizeOutput(stdout), {
    fileName: `${testFileName}-test-level-errors-stdout`,
    testFileUrl: import.meta.url,
  });

  await matchSnapshot(stderr, {
    fileName: `${testFileName}-test-level-errors-stderr`,
    testFileUrl: import.meta.url,
  });

  assert.equal(exitCode, 1);
});

test("handles matcher level type errors", async function() {
  const { exitCode, stderr, stdout } = await spawnTyche(fixtureUrl, ["matcher-level"]);

  await matchSnapshot(normalizeOutput(stdout), {
    fileName: `${testFileName}-matcher-level-errors-stdout`,
    testFileUrl: import.meta.url,
  });

  await matchSnapshot(stderr, {
    fileName: `${testFileName}-matcher-level-errors-stderr`,
    testFileUrl: import.meta.url,
  });

  assert.equal(exitCode, 1);
});
