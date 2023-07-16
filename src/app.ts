import { Command } from "commander";
import fs from "fs";
import path from "path";

const program = new Command();
program
  .version("1.0.0")
  .description("A firewall rule set checker and modularized transformer");

const controllersDir = path.join(__dirname, "commands");

fs.readdir(controllersDir, (err, files) => {
  if (err) {
    console.error("[ERROR] Error while loading commands:", err);
    return;
  }
  files.forEach((file) => {
    const filePath = path.join(controllersDir, file);
    if (path.extname(file) === ".js") {
      const controller = require(filePath);
      if (typeof controller.init === "function") {
        console.debug(
          "[DEBUG] Loading command " + file.split(".js")[0] + "..."
        );
        program.addCommand(controller.init());
      }
    }
  });
  console.debug();
  program.parse(process.argv);
});
