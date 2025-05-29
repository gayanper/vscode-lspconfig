export interface LanguageServerConfig {
  name: string;
  command: string | string[];
  args?: string[];
  documentSelector: { language: string; scheme: string }[];
  initializationOptions?: any;
  settings?: any;
  revealOutputChannelOn?: "info" | "warn" | "error" | "never";
  env?: { [key: string]: string };
  installMessage?: string;
  language?: {
    extensions: string[];
    aliases: string[];
    enableConfig?: boolean;
    enableSyntax?: boolean;
  };
}
