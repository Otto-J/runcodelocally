# RunCodeLocally

RunCodeLocally is a VS Code extension that allows you to receive and run code from web pages. It creates a local HTTP server that listens for code snippets sent from web pages, displays them in a VS Code panel, and lets you run the code directly within VS Code.

## Features

- Start a local HTTP server to receive code from web pages
- Configurable server port (default: 9000)
- Display received code in a dedicated VS Code panel
- Run JavaScript code and see the output
- Simple API for web pages to send code to VS Code

## How It Works

1. Start the server in VS Code using the command palette
2. The extension creates a local HTTP server on the configured port
3. Web pages can send code to the server using a simple fetch request
4. The code appears in the VS Code panel where you can run it

## Installation

1. Download the extension VSIX file
2. In VS Code, go to Extensions view (Ctrl+Shift+X)
3. Click the "..." menu and select "Install from VSIX..."
4. Select the downloaded VSIX file

## Usage

### Starting the Server

1. Open the Command Palette (Ctrl+Shift+P)
2. Type "Start Code Receiver Server" and select the command
3. A panel will open showing the server status and port

### Sending Code from a Web Page

Use a simple fetch request to send code to VS Code:

```javascript
fetch("http://localhost:9000/code", {
    method: "POST",
    body: "console.log('Hello from web page!');"
})
.then(response => response.text())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

### Running the Code

Once code appears in the VS Code panel, click the "Run Code" button to execute it and see the output.

## Extension Settings

This extension contributes the following settings:

* `runcodelocally.port`: Port number for the local HTTP server (default: 9000)

## Example HTML Page

An example HTML page is included in the `examples` folder. Open `examples/demo.html` in a browser to test sending code to VS Code.

## Requirements

- VS Code 1.99.0 or higher
- Node.js runtime (for running JavaScript code)

## Known Issues

- Currently only supports running JavaScript code
- The server needs to be manually restarted if the port is changed in settings

## Future Enhancements

- Support for multiple programming languages
- Code highlighting in the panel
- Save received code as files
- History of received code snippets

## Release Notes

### 0.0.1

Initial release of RunCodeLocally

---

## For Developers

### Building the Extension

1. Clone the repository
2. Run `pnpm install` to install dependencies
3. Run `pnpm run compile` to build the extension
4. Press F5 to start debugging

### Project Structure

- `src/extension.ts`: Main extension entry point
- `src/server.ts`: HTTP server implementation
- `src/webview.ts`: VS Code webview panel implementation
- `examples/demo.html`: Example HTML page for testing

**Enjoy!**
