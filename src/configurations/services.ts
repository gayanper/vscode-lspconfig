import * as fs from "fs";
import * as vscode from "vscode";
import { LanguageServerConfig } from "./types";
import { Context } from "../types";

export class ConfigurationManager {
  private configs: Map<string, LanguageServerConfig> = new Map();
  private readonly configurationFilePath: string;
  private outputChannel: vscode.LogOutputChannel;

  constructor(context: Context, filePath: string) {
    this.configurationFilePath = filePath;
    this.outputChannel = context.logChannel;
  }

  findConfigs(args: { languageId: string; scheme: string }): string[] {
    const configIds = this.listAll()
      .filter(([_, config]) => {
        return (
          config.documentSelector.find(
            (value) =>
              value.language === args.languageId &&
              value.scheme === args.scheme,
          ) !== undefined
        );
      })
      .map(([id, _]) => id);

    this.outputChannel.debug(
      "Language configurations for language (%s): [%s]",
      args.languageId,
      configIds.join(", "),
    );
    return configIds;
  }

  get(id: string): LanguageServerConfig | undefined {
    return this.configs.get(id);
  }

  listAll(): [string, LanguageServerConfig][] {
    return Array.from(this.configs.entries());
  }

  async load(): Promise<boolean> {
    return new Promise((resolve) => {
      if (fs.existsSync(this.configurationFilePath)) {
        try {
          fs.readFile(this.configurationFilePath, "utf8", (err, data) => {
            if (err) {
              this.outputChannel.error(
                `Error reading configuration file: ${err.message}`,
                err,
              );
              vscode.window.showErrorMessage(
                `Error loading LSP configurations: ${err.message}`,
              );
              return resolve(false);
            }

            try {
              // Use Function constructor to evaluate the JS file
              // This is a workaround since we can't use dynamic import in VS Code extensions
              const func = new Function("require", "module", "exports", data);
              const module = { exports: {} };
              func(require, module, module.exports);
              const userConfigs = module.exports;

              if (userConfigs && typeof userConfigs === "object") {
                Object.entries(userConfigs).forEach(([id, config]) => {
                  this.configs.set(id, config);
                });
                this.outputChannel.info(
                  "Successfully loaded language server configurations",
                );
                resolve(true);
              }
            } catch (evalErr) {
              this.outputChannel.error(
                `Error evaluating configuration file`,
                evalErr,
              );
              vscode.window.showErrorMessage(
                `Error loading LSP configurations: ${evalErr}`,
              );
              resolve(false);
            }
          });
        } catch (err) {
          vscode.window.showErrorMessage(
            `Error loading LSP configurations: ${err}`,
          );
          this.outputChannel.error("Error loading configuration file:", err);
          resolve(false);
        }
      }
    });
  }

  async reload(): Promise<boolean> {
    this.outputChannel.info("Reloading language server configurations...");
    this.configs.clear();
    return this.load();
  }
}
