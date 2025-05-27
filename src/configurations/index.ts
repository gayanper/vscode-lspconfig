import path from "path";
import os from "os";
import fs from "fs";
import { ConfigurationManager } from "./services";
import { ExtensionContext, languages, window, workspace } from "vscode";
import TEMPLATE from "./template";
import { Context } from "../types";

export const CONFIGURATION_FILE_PATH = buildConfigurationFilePath();

export function createConfigurationManager(context: Context) {
  return new ConfigurationManager(context, CONFIGURATION_FILE_PATH);
}

export async function createConfigurationFile(): Promise<boolean> {
  const filePath = CONFIGURATION_FILE_PATH;
  if (fs.existsSync(filePath)) {
    const overwrite = await window.showWarningMessage(
      "Configuration file already exists. Overwrite?",
      "Yes",
      "No",
    );

    if (overwrite !== "Yes") {
      return false;
    }
  }
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, TEMPLATE, { encoding: "utf8" });

    const doc = await workspace.openTextDocument(filePath);
    await window.showTextDocument(doc);

    return true;
  } catch (err) {
    window.showErrorMessage(`Failed to create configuration file: ${err}`);
    return false;
  }
}

export async function reloadConfiguration(configManager: ConfigurationManager) {
  const filePath = CONFIGURATION_FILE_PATH;
  if (fs.existsSync(filePath)) {
    await configManager.reload();
  } else {
    const created = await createConfigurationFile();
    if (!created) {
      window.showErrorMessage("Failed to create configuration file");
      return;
    }
    await configManager.reload();
  }
  window.showInformationMessage("Language server configurations reloaded");
}

export function isConfigured(): boolean {
  return fs.existsSync(CONFIGURATION_FILE_PATH);
}

function buildConfigurationFilePath(): string {
  const homeDir = getUserHomeDir();
  const configPath = path.join(
    homeDir,
    ".config",
    "vscode-lspconfig",
    "lspconfig.js",
  );
  return configPath;
}

function getUserHomeDir(): string {
  return (
    process.env.HOME ||
    process.env.USERPROFILE ||
    (process.env.HOMEDRIVE && process.env.HOMEPATH
      ? path.join(process.env.HOMEDRIVE, process.env.HOMEPATH)
      : os.homedir())
  );
}

type LanguageExtension = {
  id: string;
  extensions?: string[];
  aliases?: string[];
};

export async function updateLanguageConfigurations(
  configManager: ConfigurationManager,
  context: Context,
): Promise<"modified" | "failed" | "unmodified"> {
  const extensionPath = context.extensionContext.extensionPath;
  const packageJsonPath = path.join(extensionPath, "package.json");

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    const rawLanguages = packageJson.contributes?.languages;
    let languageExtensions: LanguageExtension[] = [];
    if (rawLanguages) {
      languageExtensions = rawLanguages as LanguageExtension[];
    }

    const languageIds = languageExtensions.map((e) => e.id);
    // add already registered languages in vscode
    const registeredLangIds = await languages.getLanguages();
    languageIds.push(...registeredLangIds);
    const languageConfigsToMerge = configManager
      .listAll()
      .filter(([id, _]) => !languageIds.includes(id));
    if (languageConfigsToMerge.length > 0) {
      let modified: boolean = false;
      languageConfigsToMerge.forEach(([id, config]) => {
        if (config.languageConfig) {
          languageExtensions.push({
            id: id,
            aliases: [config.name],
            extensions: config.languageConfig.extensions,
          });
          modified = true;
        }
      });

      if (modified) {
        packageJson.contributes.languages = languageExtensions;
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

        context.logChannel.info(
          "Added following language contributions to package.json:",
          languageExtensions.map((lang) => lang.id).join(", "),
        );
        return "modified";
      }
    }
    return "unmodified";
  } catch (error) {
    context.logChannel.error(
      "Failed to update language configurations:",
      error,
    );
    return "failed";
  }
}
