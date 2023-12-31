import { Command } from "commander";
import fs from "fs/promises";
import path from "path";
import { IModule, IModuleInfo } from "./IModule";
import { IValidator, IValidatorInfo, IValidationResult } from "./IValidator";
import { Ruleset } from "./model/ruleset";
import Module from "./modules/tsi-fw-sheet/module";

export class Bootstrapper {
  private readonly program = new Command()
    .version("1.0.0")
    .description("A firewall rule set checker and modularized transformer")
    .showHelpAfterError(true);

  private readonly commandsDir = path.join(__dirname, "commands");
  private readonly modulesDir = path.join(__dirname, "modules");
  private readonly validatorsDir = path.join(__dirname, "validators");

  private availableModulesInfo: IModuleInfo[] = [];
  private availableValidatorsInfo: IValidatorInfo[] = [];

  private availableModules: IModule[] = [];
  private availableValidators: IValidator[] = [];

  private ruleset: Ruleset = new Ruleset("", [], {});

  async run() {
    try {
      await this.loadModules();
      await this.loadValidators();
      await this.loadCommands();
      this.program.parse(process.argv);
    } catch (err) {
      console.error("[ERROR] Error while bootstrapping program:", err);
    }
  }

  public getRuleset(): Ruleset {
    return this.ruleset;
  }

  public runAllValidators() {
    console.info("[INFO] running all validators");
    this.availableValidators.forEach((validator) => {
      this.runValidator(validator.info().name);
    });
  }

  public runValidator(validatorName: string) {
    const validator = this.availableValidators.filter(
      (validator) => validator.info().name === validatorName
    );

    if (validator.length < 1) {
      console.warn("[WARN] unkown validator with name: " + validatorName);
    } else if (validator.length > 1) {
      console.warn(
        "[WARN] multiple validators with name " + validatorName + " found"
      );
      validator.forEach((module) =>
        console.debug(
          "[DEBUG] name=" +
            module.info().name +
            ", description=" +
            module.info().description
        )
      );
    }

    console.info(`[INFO] running validator ${validatorName}`);
    const result = validator[0].validate(this.ruleset);
    console.info(
      `[${
        result.success ? "INFO" : "WARN"
      }] Validator ${validatorName} returned with status ${
        result.success ? "ok" : "error (see details below)"
      }.`
    );
    if (!result.success) {
      result.messages.forEach((message) => console.info(`[WARN] ${message}`));
    }
  }

  public async runModule(
    moduleName: string,
    moduleArguments: string,
    mode: "import" | "export"
  ) {
    const module = this.availableModules.filter(
      (module) => module.info().name === moduleName
    );

    if (module.length < 1) {
      throw Error("unkown module with name: " + moduleName);
    } else if (module.length > 1) {
      throw Error("multiple modules with name " + moduleName + " found");
    }

    console.info(`[INFO] running module ${moduleName} in ${mode}-Mode`);
    switch (mode) {
      case "import":
        this.ruleset = await module[0].import(moduleArguments);
        break;

      case "export":
        await module[0].export(this.ruleset, moduleArguments);
        break;
    }
  }

  private async loadModules() {
    console.debug("[DEBUG] Loading modules from ", this.modulesDir);
    const dirs = await fs.readdir(this.modulesDir);
    for (const dir of dirs) {
      const filePath = path.join(this.modulesDir, dir, "module.js");
      if (path.extname(filePath) === ".js") {
        const ModuleClass = require(filePath).default;
        const module = new ModuleClass();
        if (typeof module["info"] === "function") {
          const moduleInfo: IModuleInfo = module.info();
          console.debug("[DEBUG] Loading module:", moduleInfo.name);
          this.availableModulesInfo.push(moduleInfo);
          this.availableModules.push(module);
        }
      }
    }
    console.debug("[DEBUG] Loading modules finished.\n");
  }

  private async loadValidators() {
    console.debug("[DEBUG] Loading validators from ", this.validatorsDir);
    const dirs = await fs.readdir(this.validatorsDir);
    for (const dir of dirs) {
      const filePath = path.join(this.validatorsDir, dir, "validator.js");
      if (path.extname(filePath) === ".js") {
        const ValidatorClass = require(filePath).default;
        const validator = new ValidatorClass();
        if (typeof validator["info"] === "function") {
          const validatorInfo: IValidatorInfo = validator.info();
          console.debug("[DEBUG] Loading validator:", validatorInfo.name);
          this.availableValidatorsInfo.push(validatorInfo);
          this.availableValidators.push(validator);
        }
      }
    }
    console.debug("[DEBUG] Loading validators finished.\n");
  }

  private async loadCommands() {
    console.debug("[DEBUG] Loading commands from ", this.commandsDir);
    const files = await fs.readdir(this.commandsDir);
    for (const file of files) {
      const filePath = path.join(this.commandsDir, file);
      if (path.extname(file) === ".js") {
        const command = require(filePath);
        if (typeof command.init === "function") {
          console.debug(
            "[DEBUG] Loading command " + file.split(".js")[0] + "..."
          );
          this.program.addCommand(
            command.init(
              this.availableModulesInfo,
              this.availableValidatorsInfo,
              this
            )
          );
        }
      }
    }
    console.debug("[DEBUG] Loading commands finished.\n");
  }
}
