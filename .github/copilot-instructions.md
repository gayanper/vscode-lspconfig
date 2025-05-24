<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# VS Code LSP Config

This is a VS Code extension project that configures external language servers for different file types, similar to Neovim's lspconfig plugin.

Please use the get_vscode_api with a query as input to fetch the latest VS Code API references.

## Project Structure

- `src/extension.ts`: Main extension entry point
- `src/types.ts`: Global types used across other layers of the extension
- `src/clients/index.ts`: Manages language clients
- `src/configurations/index.ts`: Manages language server configurations
- `src/commands/index.ts`: Manages all command implementations

## Things to keep in mind

- This extension follows the Language Server Protocol (LSP) specification
- We use vscode-languageclient to communicate with language servers
- Server configurations are stored in JavaScript files
