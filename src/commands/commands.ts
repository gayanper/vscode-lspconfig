import {
  commands,
  Disposable,
  ExtensionContext,
  window,
  workspace,
} from "vscode";
import { LanguageClientManager } from "../clients/services";
import * as configurations from "../configurations";
import { ConfigurationManager } from "../configurations/services";
import { Context } from "../types";

function registerCommands(
  context: Context,
  args: CommandRegistrationArgs,
): void {
  context.extensionContext.subscriptions.push(enableLanguageServer(args));
  context.extensionContext.subscriptions.push(restartLanguageServer(args));
  context.extensionContext.subscriptions.push(stopAllLanguageServers(args));
  context.extensionContext.subscriptions.push(showLanguageServerStatus(args));
  context.extensionContext.subscriptions.push(reloadConfiguration(args));
  context.extensionContext.subscriptions.push(createConfigurationFile(args));
  context.extensionContext.subscriptions.push(openConfigurationFile(args));
}

export default registerCommands;

export type CommandRegistrationArgs = {
  configManager: ConfigurationManager;
  lspClientsManager: LanguageClientManager;
};

function enableLanguageServer(args: CommandRegistrationArgs): Disposable {
  return commands.registerCommand(
    "vscode-lspconfig.enableLanguageServer",
    async () => {
      const configs = args.configManager.listAll();

      if (configs.length === 0) {
        window.showInformationMessage(
          "No language server configurations found",
        );
        return;
      }

      const activeConfigs = args.lspClientsManager.getActiveConfigurations();
      const items = configs.map(([id, config]) => ({
        label: config.name,
        detail: `ID: ${id}`,
        id: id,
        picked: activeConfigs.includes(id),
      }));

      const selected = await window.showQuickPick(items, {
        placeHolder: "Select language servers to enable",
        canPickMany: true,
      });

      if (!selected || selected.length === 0) {
        return;
      }

      for (const item of selected) {
        if (!args.lspClientsManager.isActive(item.id)) {
          await args.lspClientsManager.startClient(item.id);
        }
      }

      for (const configId of activeConfigs) {
        if (!selected.some((item) => item.id === configId)) {
          await args.lspClientsManager.stopClient(configId);
        }
      }
    },
  );
}

function restartLanguageServer(args: CommandRegistrationArgs): Disposable {
  return commands.registerCommand(
    "vscode-lspconfig.restartLanguageServer",
    async () => {
      const activeConfigs = args.lspClientsManager.getActiveConfigurations();

      if (activeConfigs.length === 0) {
        window.showInformationMessage("No active language servers");
        return;
      }

      const configs = args.configManager.listAll();
      const items = activeConfigs.map((id) => {
        const config = configs.find(([configId, _]) => configId === id)?.[1];
        return {
          label: config ? config.name : id,
          id: id,
        };
      });

      const selected = await window.showQuickPick(items, {
        placeHolder: "Select a language server to restart",
      });

      if (!selected) {
        return;
      }

      await args.lspClientsManager.restartClient(selected.id);
    },
  );
}

function reloadConfiguration(args: CommandRegistrationArgs): Disposable {
  return commands.registerCommand(
    "vscode-lspconfig.reloadConfiguration",
    () => {
      configurations.reloadConfiguration(args.configManager);
    },
  );
}

function stopAllLanguageServers(args: CommandRegistrationArgs): Disposable {
  return commands.registerCommand(
    "vscode-lspconfig.stopAllLanguageServers",
    async () => {
      await args.lspClientsManager.stopAllClients();
      window.showInformationMessage("All language servers stopped");
    },
  );
}

function showLanguageServerStatus(args: CommandRegistrationArgs): Disposable {
  return commands.registerCommand(
    "vscode-lspconfig.showLanguageServerStatus",
    () => {
      const activeServers = args.lspClientsManager.getActiveConfigurations();
      if (activeServers.length === 0) {
        window.showInformationMessage("No language servers currently active");
      } else {
        window.showInformationMessage(
          `Active language servers: ${activeServers.join(", ")}`,
        );
      }
    },
  );
}

function createConfigurationFile(args: CommandRegistrationArgs): Disposable {
  return commands.registerCommand("vscode-lspconfig.createConfigFile", () => {
    return configurations.createConfigurationFile();
  });
}

function openConfigurationFile(args: CommandRegistrationArgs): Disposable {
  return commands.registerCommand(
    "vscode-lspconfig.openConfigurationFile",
    async () => {
      const filePath = configurations.CONFIGURATION_FILE_PATH;
      if (configurations.isConfigured()) {
        window.showTextDocument(await workspace.openTextDocument(filePath));
      } else {
        window.showErrorMessage("Configuration file does not exist");
      }
    },
  );
}
