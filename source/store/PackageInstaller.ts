import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import { Diagnostic } from "#diagnostic";
import { Environment } from "#environment";
import { EventEmitter } from "#events";
import { Path } from "#path";
import type { CancellationToken } from "#token";
import { Lock } from "./Lock.js";
import { StoreDiagnosticText } from "./StoreDiagnosticText.js";
import type { DiagnosticsHandler } from "./types.js";

export class PackageInstaller {
  #onDiagnostics: DiagnosticsHandler;
  #storePath: string;
  #timeout = Environment.timeout * 1000;

  constructor(storePath: string, onDiagnostics: DiagnosticsHandler) {
    this.#storePath = storePath;
    this.#onDiagnostics = onDiagnostics;
  }

  async ensure(version: string, cancellationToken?: CancellationToken): Promise<string | undefined> {
    const installationPath = Path.join(this.#storePath, version);
    const readyFilePath = Path.join(installationPath, "__ready__");
    const modulePath = Path.join(installationPath, "node_modules", "typescript", "lib", "typescript.js");

    if (existsSync(readyFilePath)) {
      return modulePath;
    }

    if (
      await Lock.isLocked(installationPath, {
        cancellationToken,
        // TODO 'Diagnostic.extendWith()' could be used here too
        onDiagnostics: (text) => {
          this.#onDiagnostics(Diagnostic.error([StoreDiagnosticText.failedToInstalTypeScript(version), text]));
        },
        timeout: this.#timeout,
      })
    ) {
      return;
    }

    const lock = new Lock(installationPath);

    EventEmitter.dispatch(["store:info", { compilerVersion: version, installationPath }]);

    try {
      await fs.mkdir(installationPath, { recursive: true });

      const packageJson = {
        name: "tstyche-typescript",
        version,
        description: "Do not change. This package was generated by TSTyche",
        private: true,
        license: "MIT",
        dependencies: {
          typescript: version,
        },
      };

      await fs.writeFile(Path.join(installationPath, "package.json"), JSON.stringify(packageJson, null, 2));
      await this.#install(installationPath);

      await fs.writeFile(readyFilePath, "");

      return modulePath;
    } catch (error) {
      this.#onDiagnostics(Diagnostic.fromError(StoreDiagnosticText.failedToInstalTypeScript(version), error));
    } finally {
      lock.release();
    }

    return;
  }

  async #install(cwd: string) {
    const args = ["install", "--ignore-scripts", "--no-bin-links", "--no-package-lock"];

    return new Promise<void>((resolve, reject) => {
      const spawnedNpm = spawn("npm", args, {
        cwd,
        shell: true,
        stdio: "ignore",
        timeout: this.#timeout,
      });

      spawnedNpm.on("error", (error) => {
        reject(error);
      });

      spawnedNpm.on("close", (code, signal) => {
        if (code === 0) {
          resolve();
        }

        if (signal != null) {
          reject(new Error(`setup timeout of ${this.#timeout / 1000}s was exceeded`));
        }

        reject(new Error(`process exited with code ${code}`));
      });
    });
  }
}
