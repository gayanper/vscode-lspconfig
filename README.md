# VS Code LSP Config

A VS Code extension for configuring external language servers for different file types, similar to Neovim's lspconfig plugin.

## Features

- Configure language servers for different file types using a JavaScript configuration file
- Enable/disable language servers on-demand
- View the status of running language servers
- Easily restart language servers
- Inspired by Neovim's lspconfig plugin

## Usage

1. Install the extension from the VS Code marketplace
2. Create a configuration file by running the command: `LSP Config: Create Configuration File`
3. Edit the `lspconfig.js` file to configure your desired language servers
4. Enable language servers with the command: `LSP Config: Enable/Disable Language Servers`

## Configuration

All extension configuration is stored in the `<UserHome>/.config/vscode-lspconfig` folder.

**Configuration File Path:**
- **macOS/Linux**: `~/.config/vscode-lspconfig/`
- **Windows**: `%USERPROFILE%\.config\vscode-lspconfig\`

In addition to this, the extension looks for syntax and VS Code language configuration files inside a folder within the above 
configuration directory with a name that matches the languageId.

The main configuration file is `lspconfig.js`, which contains the primary configuration defining the language servers that 
will be loaded by this extension.

This file should export an object where each key is a language server identifier (languageId) and the value is the configuration for that server.

Example configuration:

```javascript
module.exports = {
  bashls: {
    name: "Bash Language Server",
    command: "bash-language-server",
    args: ["start"],
    documentSelector: [
      { scheme: "file", language: "bashls" }
    ],
    settings: {
      bashIde: {
        globPattern: "**/*@(.sh|.inc|.bash|.command)"
      }
    },
    language: {
      extensions: [".sh", ".bash"],
      aliases: ["sh", "bash"]
    }
  }
};
```

### Configuration Options

Each language server configuration can include the following options:

| Option | Type | Description | Required |
|--------|------|-------------|----------|
| `name` | `string` | Display name of the language server | Yes |
| `command` | `string` or `string[]` | Command or path to the language server executable | Yes |
| `args` | `string[]` | Command line arguments to pass to the language server | No |
| `documentSelector[].language` | `string` | Language identifier that the server handles (e.g., "javascript"). The value should be the same as the key used for the configuration entry (languageId) | Yes |
| `documentSelector[].scheme` | `string` | URI scheme the server supports (e.g., "file") | Yes |
| `initializationOptions` | `any` | Options to pass to the language server during initialization | No |
| `settings` | `any` | Configuration settings to send to the language server | No |
| `revealOutputChannelOn` | `"info"` \| `"warn"` \| `"error"` \| `"never"` | When to reveal the output channel | No |
| `env` | `{ [key: string]: string }` | Environment variables to set when running the language server | No |
| `installMessage` | `string` | Message to display when the language server is not installed | No |
| `language.extensions` | `string[]` | File extensions associated with the language (e.g., [".js", ".jsx"]) | No |
| `language.aliases` | `string[]` | Language aliases that can be used in VS Code (e.g., ["JavaScript"]) | No |
| `language.enableConfig` | `boolean` | Whether to enable configuration for this language | No |
| `language.enableSyntax` | `boolean` | Whether to enable syntax highlighting for this language | No |


### Language Configuration

When `language.enableConfig` is set to `true`, the extension will look for a file named `language-configuration.json` inside the dedicated language folder as described in the [configuration section](#configuration). The file structure should be as described in the [VS Code documentation](https://code.visualstudio.com/api/language-extensions/language-configuration-guide#language-configuration).

### Syntax Configuration

When `language.enableSyntax` is set to `true`, the extension will look for a file named `tmLanguage.json` inside the dedicated language folder as described in the [configuration section](#configuration). The file structure should be as described in the [VS Code documentation](https://code.visualstudio.com/api/language-extensions/syntax-highlight-guide).

<br>
## Commands

The extension provides the following commands:

- `LSP Config: Create Configuration File`: Create a new configuration file in your workspace
- `LSP Config: Enable/Disable Language Servers`: Enable or disable language servers
- `LSP Config: Restart Language Server`: Restart a running language server
- `LSP Config: Reload Configuration`: Reload the configuration file after making changes
- `LSP Config: Stop All Language Servers`: Stop all running language servers
- `LSP Config: Show Language Server Status`: Show which language servers are currently active

## Requirements

- VS Code 1.60.0 or higher
- Language servers must be installed separately

## Inspiration

This extension is inspired by Neovim's [lspconfig](https://github.com/neovim/nvim-lspconfig) project.

## License

Apache License 2.0. See [LICENSE](LICENSE) file for details.
