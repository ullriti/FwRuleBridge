import { Command } from "commander";
import fs from "fs/promises";
import path from "path";
import { IModule, IModuleInfo, ModuleResult } from "./IModule";
import { IValidator, IValidatorInfo, ValidationResult } from "./IValidator";
import { Ruleset } from "./model/ruleset";

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

  private ruleset: Ruleset;

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

  public runAllValidators(): ValidationResult[] {
    const validationResults: ValidationResult[] = [];

    console.debug("[DEBUG] running all validators");
    this.availableValidators.forEach((validator) => {
      console.debug("[DEBUG] run validator " + validator.info().name);
      validationResults.push(validator.validate(this.ruleset));
    });

    return validationResults;
  }

  public runValidator(validatorName: string): ValidationResult {
    const validator = this.availableValidators.filter(
      (validator) => validator.info().name === validatorName
    );

    if (validator.length < 1) {
      console.debug("[DEBUG] unkown validator with name: " + validatorName);
      return {
        success: false,
        message: "unknown validator",
      };
    } else if (validator.length > 1) {
      console.debug(
        "[DEBUG] multiple validators with name " + validatorName + " found"
      );
      validator.forEach((module) =>
        console.debug(
          "[DEBUG] name=" +
            module.info().name +
            ", description=" +
            module.info().description
        )
      );
      return {
        success: false,
        message: "duplicated validator names",
      };
    }

    console.debug(
      "[DEBUG] running validator " +
        validatorName +
        " => " +
        validator[0].info().description
    );
    return validator[0].validate(this.ruleset);
  }

  public runModule(moduleName: string, moduleInput: string): ModuleResult {
    const module = this.availableModules.filter(
      (module) => module.info().name === moduleName
    );

    if (module.length < 1) {
      console.debug("[DEBUG] unkown module with name: " + moduleName);
      return {
        success: false,
        message: "unknown module",
      };
    } else if (module.length > 1) {
      console.debug(
        "[DEBUG] multiple modules with name " + moduleName + " found"
      );
      module.forEach((module) =>
        console.debug(
          "[DEBUG] name=" +
            module.info().name +
            ", description=" +
            module.info().description
        )
      );
      return {
        success: false,
        message: "duplicated module names",
      };
    }

    console.debug(
      "[DEBUG] running module " +
        moduleName +
        " => " +
        module[0].info().description
    );
    const result = module[0].import(moduleInput);
    if (!result.data) {
      return {
        success: false,
        message: "no data after import",
      };
    } else {
      this.ruleset = result.data;
      return result;
    }
  }

  private async loadModules() {
    console.debug("[DEBUG] Loading modules from ", this.modulesDir);
    const files = await fs.readdir(this.modulesDir);
    for (const file of files) {
      const filePath = path.join(this.modulesDir, file);
      if (path.extname(file) === ".js") {
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
    const files = await fs.readdir(this.validatorsDir);
    for (const file of files) {
      const filePath = path.join(this.validatorsDir, file);
      if (path.extname(file) === ".js") {
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
              this.availableValidatorsInfo
            )
          );
        }
      }
    }
    console.debug("[DEBUG] Loading commands finished.\n");
  }
}
