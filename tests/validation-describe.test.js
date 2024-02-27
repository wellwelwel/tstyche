import { strict as assert } from "node:assert";
import { test } from "mocha";
import { getFixtureUrl } from "./__utils__/fixtureFactory.js";
import { getTestFileName } from "./__utils__/getTestFileName.js";
import { matchSnapshot } from "./__utils__/matchSnapshot.js";
import { normalizeOutput } from "./__utils__/normalizeOutput.js";
import { spawnTyche } from "./__utils__/spawnTyche.js";

const testFileName = getTestFileName(import.meta.url);
const fixtureUrl = getFixtureUrl(testFileName);

test("handles 'expect()' nested within 'describe()'", async function() {
  const { exitCode, stderr, stdout } = await spawnTyche(fixtureUrl, ["handles-expect"]);

  await matchSnapshot(normalizeOutput(stdout), {
    fileName: `${testFileName}-handles-expect-stdout`,
    testFileUrl: import.meta.url,
  });

  await matchSnapshot(stderr, {
    fileName: `${testFileName}-handles-expect-stderr`,
    testFileUrl: import.meta.url,
  });

  assert.equal(exitCode, 1);
});