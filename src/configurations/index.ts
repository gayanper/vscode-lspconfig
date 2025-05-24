import path from "path";
import os from "os";
import fs from "fs";
import { ConfigurationManager } from "./services";
import { ExtensionContext, window, workspace } from "vscode";
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
