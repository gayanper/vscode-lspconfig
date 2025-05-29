import fs, { existsSync } from "fs";
import os from "os";
import path from "path";
import { languages, window, workspace } from "vscode";
import { Context } from "../types";
import { ConfigurationManager } from "./services";
import TEMPLATE from "./template";
import { LanguageServerConfig } from "./types";
import { isDeepEqual } from "../utils";

export const CONFIGURATION_FILE_PATH = buildConfigurationFilePath();

export const CONFIGURATION_DIR_PATH = path.dirname(CONFIGURATION_FILE_PATH);

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
    window.showInformationMessage("Language server configurations reloaded");
  } else {
    window.showErrorMessage(
      "Configuration file not found, Use [LSP Config: Create Configuration File] command to create one.",
    );
  }
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
  configuration?: string;
};

type GrammarExtension = {
  language: string;
  scopeName: string;
  path: string;
};

export async function updateLanguageExtension(
  configManager: ConfigurationManager,
  context: Context,
): Promise<"modified" | "failed" | "unmodified"> {
  const extensionPath = context.extensionContext.extensionPath;
  const packageJsonPath = path.join(extensionPath, "package.json");

  try {
    context.logChannel.info("Removing old symlinks...");
    removeSymlinks(context);

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    const rawLanguages = packageJson.contributes?.languages;
    const rawGrammars = packageJson.contributes?.grammars;

    let languageExtensions: LanguageExtension[] = [];
    let grammarExtensions: GrammarExtension[] = [];

    const languageConfigsToMerge = configManager.listAll();
    if (languageConfigsToMerge.length > 0) {
      languageConfigsToMerge.forEach(([id, config]) => {
        if (config.language) {
          const langEntry: LanguageExtension = {
            id: id,
            aliases: [config.name],
            extensions: config.language.extensions,
          };

          if (config.language?.enableConfig) {
            const linkFileName = `${id}-language-configuration.json`;
            const configFilePath = path.join(
              CONFIGURATION_DIR_PATH,
              id,
              "language-configuration.json",
            );
            if (existsSync(configFilePath)) {
              const linkPath = path.join(
                context.extensionContext.extensionPath,
                "languages",
                linkFileName,
              );
              fs.symlinkSync(configFilePath, linkPath, "file");
              langEntry.configuration = `./languages/${linkFileName}`;
            } else {
              context.logChannel.warn(
                "Language configuration file not found for:",
                id,
              );
            }
          }
          languageExtensions.push(langEntry);

          // merge grammar files
          if (config.language?.enableSyntax) {
            const syntaxFilePath = path.join(
              CONFIGURATION_DIR_PATH,
              id,
              "tmLanguage.json",
            );
            const linkFileName = `${id}.tmLanguage.json`;

            if (existsSync(syntaxFilePath)) {
              const linkPath = path.join(
                context.extensionContext.extensionPath,
                "syntaxes",
                linkFileName,
              );
              fs.symlinkSync(syntaxFilePath, linkPath, "file");
              grammarExtensions.push({
                scopeName: `source.${id}`,
                language: id,
                path: `./syntaxes/${linkFileName}`,
              });
            } else {
              context.logChannel.warn("Syntax file not found for:", id);
            }
          }
        }
      });
    }

    const modified =
      !isDeepEqual(languageExtensions, rawLanguages || []) ||
      !isDeepEqual(grammarExtensions, rawGrammars || []);
    if (modified) {
      packageJson.contributes.languages = languageExtensions;
      packageJson.contributes.grammars = grammarExtensions;

      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

      context.logChannel.info(
        "Added language and grammar contributions to : ",
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

function removeSymlinks(context: Context) {
  const extensionPath = context.extensionContext.extensionPath;

  // remove all symlinks inside the languages folder
  const languagesPath = path.join(extensionPath, "languages");
  if (fs.existsSync(languagesPath)) {
    const files = fs.readdirSync(languagesPath);
    files.forEach((file) => {
      const filePath = path.join(languagesPath, file);
      if (fs.lstatSync(filePath).isSymbolicLink()) {
        fs.unlinkSync(filePath);
        context.logChannel.debug(`Removed symlink: ${filePath}`);
      }
    });
  }

  // remove all symlinks inside the syntaxes folder
  const syntaxesPath = path.join(extensionPath, "syntaxes");
  if (fs.existsSync(syntaxesPath)) {
    const files = fs.readdirSync(syntaxesPath);
    files.forEach((file) => {
      const filePath = path.join(syntaxesPath, file);
      if (fs.lstatSync(filePath).isSymbolicLink()) {
        fs.unlinkSync(filePath);
        context.logChannel.debug(`Removed symlink: ${filePath}`);
      }
    });
  }
}
