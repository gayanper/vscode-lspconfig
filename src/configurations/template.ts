const TEMPLATE = `/**
 * VS Code Language Server Configuration
 * 
 * This file defines language server configurations for different file types.
 * Inspired by Neovim's lspconfig plugin.
 */

/**
 * @typedef {Object} LanguageServerConfig
 * @property {string} name - Display name of the language server
 * @property {string|string[]} command - Command to start the language server
 * @property {string[]} [args] - Arguments for the language server command
 * @property {Object[]} documentSelector - VS Code document selectors
 * @property {Object} [initializationOptions] - Options to pass to the language server during initialization
 * @property {Object} [settings] - Settings for the language server
 * @property {'info'|'warn'|'error'|'never'} [revealOutputChannelOn] - When to reveal the output channel
 * @property {Object} [env] - Environment variables for the language server process
 * @property {string} [installMessage] - Message to show when the language server is not installed
 */

module.exports = {
  // Example: Python language server (pyright)
  // pyright: {
  //   name: 'Pyright',
  //   command: 'pyright-langserver',
  //   args: ['--stdio'],
  //   documentSelector: [],
  //   settings: {
  //     python: {
  //       analysis: {
  //         autoSearchPaths: true,
  //         diagnosticMode: 'openFilesOnly',
  //         useLibraryCodeForTypes: true
  //       }
  //     }
  //   },
  //   installMessage: 'To use pyright, install it via npm: npm install -g pyright',
  //   languageConfig: {
  //      comments: {
  //        lineComment: '#',
  //        blockComment ['"""', '"""']
  //      },
  //      brackets: [
  //        ['{', '}'],
  //        ['[', ']'],
  //        ['(', ')']
  //      ]
  //   }
  // },

  // Example: Bash language server
  // bash: {
  //   name: 'Bash Language Server',
  //   command: 'bash-language-server',
  //   args: ['start'],
  //   documentSelector: [
  //     { scheme: 'file', language: 'shellscript' },
  //     { scheme: 'file', language: 'bash' }
  //   ],
  //   installMessage: 'To use bash-language-server, install it via npm: npm install -g bash-language-server'
  // },

  // Add your language server configurations here
};
`;

export default TEMPLATE;
