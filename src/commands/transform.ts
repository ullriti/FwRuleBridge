import { Command } from "commander";
import path from "path";

export function init() {
  const command = new Command()
    .command("transform <inputModule> <input> <outputModule> <output>")
    .aliases(["trans"])
    .description(
      "Reads a given input with the inputModule and transforms it to a output by using outputModule"
    )
    .summary("transform ruleset")
    .option("-S, --skip-validation", "skip validation of the ruleset")
    .action((args: string[]) => {
      console.log("transform");
    });

  console.debug(
    "[DEBUG] Command " +
      path.basename(__filename, ".js") +
      " loaded successfully."
  );

  return command;
}
