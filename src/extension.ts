import * as vscode from "vscode";
import createLanguageClientManager from "./clients";
import { LanguageClientManager } from "./clients/services";
import registerCommands, { patchPackageJson } from "./commands/commands";
import { createConfigurationManager, isConfigured } from "./configurations";
import { Context } from "./types";

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
    context: extContext,
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
