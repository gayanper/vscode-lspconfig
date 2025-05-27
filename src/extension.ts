import * as vscode from "vscode";
import createLanguageClientManager from "./clients";
import { LanguageClientManager } from "./clients/services";
import registerCommands from "./commands/commands";
import {
  createConfigurationManager,
  isConfigured,
  updateLanguageConfigurations,
} from "./configurations";
import { Context } from "./types";
import { ConfigurationManager } from "./configurations/services";

let languageClientManager: LanguageClientManager;

export async function activate(context: vscode.ExtensionContext) {
  console.log("Activating VS Code LSP Config extension...");
  let logChannel = vscode.window.createOutputChannel("LSPConfig", {
    log: true,
  });
  context.subscriptions.push(logChannel);

  let extContext: Context = {
    extensionContext: context,
    logChannel: logChannel,
  };

  let configManager = createConfigurationManager(extContext);
  languageClientManager = createLanguageClientManager(
    extContext,
    configManager,
  );

  registerCommands(extContext, {
    configManager: configManager,
    lspClientsManager: languageClientManager,
  });

  if (isConfigured()) {
    await configManager.load();
    await patchPackageJson(configManager, extContext);
  } else {
    vscode.window
      .showInformationMessage(
        "Welcome to VS Code LSP Config! Create a configuration file to get started.",
        "Create Configuration",
      )
      .then((selection) => {
        if (selection === "Create Configuration") {
          vscode.commands.executeCommand("vscode-lspconfig.createConfigFile");
        }
      });
  }

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(async (editor) => {
      if (editor && editor.document) {
        languageClientManager.startClientsForLanguage(editor.document);
      }
    }),
  );
  handleActiveTextEditors();
}

function handleActiveTextEditors() {
  const activeTextEditors = vscode.window.visibleTextEditors;
  if (activeTextEditors.length > 0) {
    activeTextEditors.forEach((editor) => {
      const document = editor.document;
      if (document) {
        languageClientManager.startClientsForLanguage(document);
      }
    });
  }
}

export function deactivate() {
  if (languageClientManager) {
    return languageClientManager.stopAllClients();
  }
  return undefined;
}

async function patchPackageJson(
  configManager: ConfigurationManager,
  context: Context,
) {
  const result = await updateLanguageConfigurations(configManager, context);
  switch (result) {
    case "failed": {
      vscode.window.showErrorMessage(
        "Failed to update language configurations, please check the logs.",
      );
      break;
    }
    case "modified": {
      vscode.window
        .showInformationMessage(
          "Protocol Buffers language support has been added. Please reload the extension for changes to take effect.",
          "Reload Window",
        )
        .then((selection) => {
          if (selection === "Reload Window") {
            vscode.commands.executeCommand("workbench.action.reloadWindow");
          }
        });
      break;
    }
    default:
  }
}
