import * as cp from "child_process";
import * as vscode from "vscode";
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
} from "vscode-languageclient/node";
import { LanguageServerConfig } from "../configurations/types";
import { ConfigurationManager } from "../configurations/services";
import { Context } from "../types";

export class LanguageClientManager {
  private clients: Map<string, LanguageClient> = new Map();
  private outputChannel: vscode.LogOutputChannel;
  private extensionContext: vscode.ExtensionContext;
  private activeConfigurations: Map<string, boolean> = new Map();
  private readonly configManager: ConfigurationManager;

  constructor(context: Context, configManager: ConfigurationManager) {
    this.extensionContext = context.extensionContext;
    this.configManager = configManager;
    this.outputChannel = context.logChannel;
  }

  async startClientsForLanguage(doc: vscode.TextDocument): Promise<void> {
    if (doc.uri.scheme !== "file" && !doc.languageId) {
      return;
    }
    const fileScheme = doc.uri.scheme;
    const languageId = doc.languageId;
    this.configManager
      .findConfigs({ languageId: languageId, scheme: fileScheme })
      .forEach((id) => this.startClient(id));
  }

  async startClient(configId: string): Promise<boolean> {
    if (this.clients.has(configId)) {
      this.outputChannel.info(`Language server ${configId} is already running`);
      return true;
    }

    const config = this.configManager.get(configId);
    if (!config) {
      this.outputChannel.info(
        `Language server configuration for ${configId} not found`,
      );
      return false;
    }

    try {
      if (
        !this.commandExists(
          Array.isArray(config.command) ? config.command[0] : config.command,
        )
      ) {
        if (config.installMessage) {
          const install = await vscode.window.showWarningMessage(
            `The language server '${config.name}' command was not found. ${config.installMessage}`,
            "Install Instructions",
          );

          if (install) {
            this.outputChannel.show();
            this.outputChannel.info(
              `\nInstallation instructions for ${config.name}:`,
            );
            this.outputChannel.info(config.installMessage);
          }
        } else {
          vscode.window.showWarningMessage(
            `The language server '${config.name}' command was not found. Please install it and try again.`,
          );
        }
        return false;
      }

      const serverOptions = this.createServerOptions(config);

      const clientOptions = this.createClientOptions(config);

      const client = new LanguageClient(
        configId,
        config.name,
        serverOptions,
        clientOptions,
      );

      this.outputChannel.info(`Starting language server: ${config.name}`);
      await client.start();
      const disposable = vscode.Disposable.from(client);
      this.extensionContext.subscriptions.push(disposable);
      this.clients.set(configId, client);
      this.activeConfigurations.set(configId, true);

      if ("onReady" in client) {
        await (client as any).onReady();
      }

      this.outputChannel.info(
        `Language server ${config.name} started successfully`,
      );
      return true;
    } catch (err) {
      this.outputChannel.info(
        `Error starting language server ${config.name}: ${err}`,
      );
      vscode.window.showErrorMessage(
        `Failed to start language server: ${config.name}`,
      );
      return false;
    }
  }

  async stopClient(configId: string): Promise<boolean> {
    const client = this.clients.get(configId);
    if (!client) {
      this.outputChannel.info(`Language server ${configId} is not running`);
      return false;
    }

    try {
      this.outputChannel.info(`Stopping language server: ${configId}`);
      await client.stop();
      this.clients.delete(configId);
      this.activeConfigurations.set(configId, false);
      this.outputChannel.info(
        `Language server ${configId} stopped successfully`,
      );
      return true;
    } catch (err) {
      this.outputChannel.error(
        `Error stopping language server ${configId}: ${err}`,
        err,
      );
      vscode.window.showErrorMessage(
        `Failed to stop language server: ${configId}`,
      );
      return false;
    }
  }

  async stopAllClients(): Promise<void> {
    const promises = Array.from(this.clients.keys()).map((configId) =>
      this.stopClient(configId),
    );
    await Promise.all(promises);
  }

  private commandExists(command: string): boolean {
    try {
      const whichCommand = process.platform === "win32" ? "where" : "which";
      cp.execSync(`${whichCommand} ${command}`, { stdio: "ignore" });
      return true;
    } catch (e) {
      return false;
    }
  }

  private createServerOptions(config: LanguageServerConfig): ServerOptions {
    const command = Array.isArray(config.command)
      ? config.command[0]
      : config.command;
    const args = Array.isArray(config.command)
      ? config.command.slice(1).concat(config.args || [])
      : config.args || [];

    return {
      run: {
        command,
        args,
        options: {
          env: { ...process.env, ...config.env },
        },
      },
      debug: {
        command,
        args,
        options: {
          env: { ...process.env, ...config.env },
        },
      },
    };
  }

  private createClientOptions(
    config: LanguageServerConfig,
  ): LanguageClientOptions {
    const documentSelector = config.documentSelector;
    let revealOutputChannelOn: any = config.revealOutputChannelOn || "error";
    return {
      documentSelector,
      outputChannel: this.outputChannel,
      revealOutputChannelOn,
      initializationOptions: config.initializationOptions,
      middleware: {},
      synchronize: {
        configurationSection: Object.keys(config.settings || {}),
      },
      workspaceFolder:
        vscode.workspace.workspaceFolders &&
        vscode.workspace.workspaceFolders.length > 0
          ? vscode.workspace.workspaceFolders[0]
          : undefined,
    };
  }

  getActiveConfigurations(): string[] {
    return Array.from(this.activeConfigurations.entries())
      .filter(([_, active]) => active)
      .map(([configId, _]) => configId);
  }

  isActive(configId: string): boolean {
    return this.activeConfigurations.get(configId) || false;
  }

  async restartClient(configId: string): Promise<boolean> {
    await this.stopClient(configId);
    return this.startClient(configId);
  }
}
