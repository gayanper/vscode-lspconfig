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
  languageConfig?: {
    extensions: string[];
    aliases: string[];
    comments: {
      lineComment: string;
      blockComment: string[];
    };
    brackets: string[][];
    autoClosingPairs: [{ open: string; close: string }];
    surroundingPairs: string[][];
  };
}
