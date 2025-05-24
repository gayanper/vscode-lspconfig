import { ExtensionContext, LogOutputChannel } from "vscode";

export type Context = {
  logChannel: LogOutputChannel;
  extensionContext: ExtensionContext;
};
