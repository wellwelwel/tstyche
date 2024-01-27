import fs from "node:fs/promises";
import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";
import { clearFixture, writeFixture } from "./__utils__/fixtureFactory.js";
import { spawnTyche } from "./__utils__/spawnTyche.js";

const packageConfigText = await fs.readFile(new URL("../package.json", import.meta.url), { encoding: "utf8" });
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const { version } = /** @type {{ version: string }} */ (JSON.parse(packageConfigText));

const fixture = "config-version";

beforeAll(async () => {
  await writeFixture(fixture);
});

afterAll(async () => {
  await clearFixture(fixture);
});

describe("'--version' command line option", () => {
  test.each([
    {
      args: ["--version"],
      testCase: "prints the TSTyche version number",
    },
    {
      args: ["--version", "false"],
      testCase: "does not take arguments",
    },
    {
      args: ["feature", "--version"],
      testCase: "ignores search string specified before the option",
    },
    {
      args: ["--version", "feature"],
      testCase: "ignores search string specified after the option",
    },
  ])("$testCase", async ({ args }) => {
    const { exitCode, stderr, stdout } = await spawnTyche(fixture, args);

    expect(stdout).toBe(`${version}\n`);
    expect(stderr).toBe("");

    expect(exitCode).toBe(0);
  });
});
