import { Argument, Command } from "commander";
import path from "path";
import { IModuleInfo } from "../IModule";
import { IValidatorInfo } from "../IValidator";
import { Bootstrapper } from "../bootstrapper";

export function init(
  availableModules: IModuleInfo[],
  availableValidators: IValidatorInfo[],
  bootstrapper: Bootstrapper
) {
  const command = new Command()
    .command("transform")
    .aliases(["trans"])
    .addArgument(
      new Argument(
        "<inputModule>",
        "module which is used to transform given input to fwRuleBridge model"
      ).choices(availableModules.map((value) => value.name))
    )
    .addArgument(
      new Argument("<input>", "input which is used by the inputModule")
    )
    .addArgument(
      new Argument(
        "<outputModule>",
        "module which is used to create output from fwRuleBridge model"
      ).choices(availableModules.map((value) => value.name))
    )
    .addArgument(
      new Argument("<output>", "ouput which is created by the outputModule")
    )
    .description(
      "Reads a given input with the inputModule and transforms it to a output by using outputModule"
    )
    .summary("transform ruleset")
    .option("-S, --skipValidation", "skip validation of the ruleset")
    .showHelpAfterError(true)
    .action(
      async (inputModule, input, outputModule, output, options, command) => {
        await bootstrapper.runModule(inputModule, input, "import");
        if (!options.skipValidation) bootstrapper.runAllValidators();
        await bootstrapper.runModule(outputModule, output, "export");
      }
    );

  console.debug(
    "[DEBUG] Command " +
      path.basename(__filename, ".js") +
      " loaded successfully."
  );

  return command;
}
