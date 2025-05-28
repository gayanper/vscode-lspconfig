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

function isEqual(arg1: LanguageExtension[], arg2: LanguageExtension[]) {
  if (arg1.length !== arg2.length) {
    return false;
  }

  for (const value1 of arg1) {
    let matched = false;
    for (const value2 of arg2) {
      if (value1.id !== value2.id) {
        continue;
      }

      if (!isStrArrEqual(value1.aliases, value2.aliases)) {
        continue;
      }

      if (!isStrArrEqual(value1.extensions, value2.extensions)) {
        continue;
      }

      matched = true;
      break;
    }

    if (!matched) {
      return false;
    }
  }
  return true;
}

function isStrArrEqual(arr1?: string[], arr2?: string[]): boolean {
  if (!arr1 || !arr2) {
    return false;
  }

  const sorted1 = arr1.sort();
  const sorted2 = arr2.sort();

  if (!sorted1.every((a, i) => a === sorted2[i])) {
    return false;
  }

  return true;
}

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

    const languageConfigsToMerge = configManager
      .listAll();
    if (languageConfigsToMerge.length > 0) {
      languageConfigsToMerge.forEach(([id, config]) => {
        if (config.languageConfig) {
          languageExtensions.push({
            id: id,
            aliases: [config.name],
            extensions: config.languageConfig.extensions,
          });
        }
      });
    }

    const modified = !isEqual(languageExtensions, rawLanguages || []);
    if (modified) {
      packageJson.contributes.languages = languageExtensions;
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

      context.logChannel.info(
        "Added following language contributions to : ",
        languageExtensions.map((lang) => lang.id).join(", "),
      );
      return "modified";
    } else {
      return "unmodified";
    }
  } catch (error) {
    context.logChannel.error(
      "Failed to update language configurations:",
      error,
    );
    return "failed";
  }
}
