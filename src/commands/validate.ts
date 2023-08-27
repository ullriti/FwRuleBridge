import { Argument, Command, InvalidArgumentError, Option } from "commander";
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
    .command("validate")
    .aliases(["val"])
    .addArgument(
      new Argument(
        "<inputModule>",
        "module which is used to transform given input to fwRuleBridge model"
      ).choices(availableModules.map((value) => value.name))
    )
    .addArgument(
      new Argument("<input>", "input which is used by the inputModule")
    )
    .addOption(
      new Option(
        "-u, --use <validators>",
        "comma separated list of validators which should be used (choices: " +
          availableValidators.map((value) => value.name).toString() +
          ")"
      ).argParser((input, _previous) => {
        input.split(",").forEach((value) => {
          if (!availableValidators.map((value) => value.name).includes(value)) {
            throw new InvalidArgumentError(
              value +
                " is not a valid Validator.\navailable Validators:\n" +
                availableValidators.map(
                  (value) => value.name + " - " + value.description + "\n"
                )
            );
          }
        });
        return input.split(",");
      })
    )
    .description(
      "Validates the firewall ruleset which will be loaded from <input> with module <inputModule>"
    )
    .summary("validate ruleset")
    .showHelpAfterError(true)
    .action(async (inputModule, input, options, command) => {
      await bootstrapper.runModule(inputModule, input, "import");
      bootstrapper.runAllValidators();
    });

  console.debug(
    "[DEBUG] Command " +
      path.basename(__filename, ".js") +
      " loaded successfully."
  );

  return command;
}
