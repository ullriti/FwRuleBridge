import { Command } from "commander";
import fs from "fs/promises";
import path from "path";
import { IModuleInfo } from "./IModule";
import { IValidatorInfo } from "./IValidator";
import { Module } from "module";

export class Bootstrapper {
  private readonly program = new Command()
    .version("1.0.0")
    .description("A firewall rule set checker and modularized transformer")
    .showHelpAfterError(true);

  private readonly commandsDir = path.join(__dirname, "commands");
  private readonly modulesDir = path.join(__dirname, "modules");
  private readonly validatorsDir = path.join(__dirname, "validators");

  private availableModules: IModuleInfo[] = [];
  private availableValidators: IValidatorInfo[] = [];

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
          this.availableModules.push(moduleInfo);
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
          this.availableValidators.push(validatorInfo);
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
            command.init(this.availableModules, this.availableValidators)
          );
        }
      }
    }
    console.debug("[DEBUG] Loading commands finished.\n");
  }
}
