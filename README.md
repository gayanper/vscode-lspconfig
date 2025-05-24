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

The extension uses a `lspconfig.js` file in your user folder to configure language servers. The configuration file is located at:

**Configuration File Path:**
- **macOS/Linux**: `~/.config/vscode-lspconfig/lspconfig.js`
- **Windows**: `%USERPROFILE%\.config\vscode-lspconfig\lspconfig.js`

This file should export an object where each key is a language server identifier and the value is the configuration for that server.

Example configuration:

```javascript
module.exports = {
  pyright: {
    name: "Pyright",
    command: "pyright-langserver",
    args: ["--stdio"],
    documentSelector: [
      { scheme: "file", language: "python" }
    ],
    settings: {
      python: {
        analysis: {
          autoSearchPaths: true,
          useLibraryCodeForTypes: true
        }
      }
    }
  },
  bash_language_server: {
    name: "Bash Language Server",
    command: "bash-language-server",
    args: ["start"],
    documentSelector: [
      { scheme: "file", language: "shellscript" }
    ],
    settings: {
      bashIde: {
        globPattern: "**/*@(.sh|.inc|.bash|.command)"
      }
    }
  }
};
```

## Configuration Options

Each language server configuration can include the following options:

- `name`: Display name of the language server
- `command`: Command to start the language server (string or array)
- `args`: Arguments for the language server (array)
- `documentSelector`: VS Code document selectors to determine which files this server applies to
- `settings`: Settings for the language server
- `initializationOptions`: Options to pass to the language server during initialization
- `revealOutputChannelOn`: When to reveal the output channel ('info', 'warn', 'error', 'never')
- `env`: Environment variables for the language server process
- `installMessage`: Message to show when the language server is not installed

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
