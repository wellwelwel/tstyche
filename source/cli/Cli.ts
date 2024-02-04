import process from "node:process";
import { TSTyche } from "#api";
import { ConfigService, OptionDefinitionsMap, OptionGroup } from "#config";
import { DiagnosticCategory } from "#diagnostic";
import { Environment } from "#environment";
import { EventEmitter, type EventHandler } from "#events";
import { Logger } from "#logger";
import { addsPackageStepText, diagnosticText, formattedText, helpText } from "#output";
import { StoreService } from "#store";

export class Cli {
  #logger: Logger;
  #storeService: StoreService;

  constructor() {
    this.#logger = new Logger();
    this.#storeService = new StoreService();
  }

  #onStartupEvent: EventHandler = ([eventName, payload]) => {
    switch (eventName) {
      case "store:info":
        this.#logger.writeMessage(addsPackageStepText(payload.compilerVersion, payload.installationPath));
        break;

      case "config:error":
      case "store:error":
        for (const diagnostic of payload.diagnostics) {
          switch (diagnostic.category) {
            case DiagnosticCategory.Error:
              process.exitCode = 1;

              this.#logger.writeError(diagnosticText(diagnostic));
              break;

            case DiagnosticCategory.Warning:
              this.#logger.writeWarning(diagnosticText(diagnostic));
              break;
          }
        }
        break;

      default:
        break;
    }
  };

  async run(commandLineArguments: Array<string>): Promise<void> {
    EventEmitter.addHandler(this.#onStartupEvent);

    if (commandLineArguments.includes("--help")) {
      const commandLineOptionDefinitions = OptionDefinitionsMap.for(OptionGroup.CommandLine);

      this.#logger.writeMessage(helpText(commandLineOptionDefinitions, TSTyche.version));

      return;
    }

    if (commandLineArguments.includes("--prune")) {
      await this.#storeService.prune();

      return;
    }

    if (commandLineArguments.includes("--version")) {
      this.#logger.writeMessage(formattedText(TSTyche.version));

      return;
    }

    if (commandLineArguments.includes("--update")) {
      await this.#storeService.update();

      return;
    }

    const compiler = await this.#storeService.load(
      Environment.typescriptPath == null ? "latest" : "current",
    );

    if (!compiler) {
      return;
    }

    const configService = new ConfigService(compiler, this.#storeService);

    await configService.parseCommandLine(commandLineArguments);

    if (process.exitCode === 1) {
      return;
    }

    await configService.readConfigFile();

    if (process.exitCode === 1) {
      return;
    }

    const resolvedConfig = configService.resolveConfig();

    if (configService.commandLineOptions.showConfig === true) {
      this.#logger.writeMessage(
        formattedText({
          noColor: Environment.noColor,
          noInteractive: Environment.noInteractive,
          storePath: Environment.storePath,
          timeout: Environment.timeout,
          typescriptPath: Environment.typescriptPath,
          ...resolvedConfig,
        }),
      );

      return;
    }

    if (configService.commandLineOptions.install === true) {
      for (const tag of resolvedConfig.target) {
        await this.#storeService.install(tag);
      }

      return;
    }

    let testFiles: Array<string> = [];

    if (resolvedConfig.testFileMatch.length !== 0) {
      testFiles = configService.selectTestFiles();

      if (testFiles.length === 0) {
        return;
      }

      if (configService.commandLineOptions.listFiles === true) {
        this.#logger.writeMessage(formattedText(testFiles));

        return;
      }
    }

    EventEmitter.removeHandler(this.#onStartupEvent);

    const tstyche = new TSTyche(resolvedConfig, this.#storeService);

    await tstyche.run(testFiles);
  }
}
