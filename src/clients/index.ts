import { ExtensionContext } from "vscode";
import { ConfigurationManager } from "../configurations/services";
import { LanguageClientManager } from "./services";
import { Context } from "../types";

function createLanguageClientManager(
  context: Context,
  configManager: ConfigurationManager,
) {
  return new LanguageClientManager(context, configManager);
}

export default createLanguageClientManager;
