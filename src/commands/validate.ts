import { Command } from "commander";
import path from "path";

export function init() {
  const command = new Command()
    .command("validate <inputModule> <input>")
    .aliases(["val"])
    .description(
      "Validates the firewall ruleset which will be loaded from <input> with module <inputModule>"
    )
    .summary("validate ruleset")
    .action((args: string[]) => {
      console.log("validate");
    });

  console.debug(
    "[DEBUG] Command " +
      path.basename(__filename, ".js") +
      " loaded successfully."
  );

  return command;
}
