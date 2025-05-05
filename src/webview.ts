import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import * as childProcess from 'child_process';

export class CodeRunnerPanel {
  public static currentPanel: CodeRunnerPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private readonly extensionUri: vscode.Uri;
  private disposables: vscode.Disposable[] = [];
  private serverPort: number;

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, serverPort: number) {
    this.panel = panel;
    this.extensionUri = extensionUri;
    this.serverPort = serverPort;

    this.updateWebview();

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

    this.panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case 'runCode':
            this.runCode(message.code, message.language);
            break;
          case 'clearCode':
            this.panel.webview.postMessage({ command: 'clearOutput' });
            break;
          case 'changeLanguage':
            this.currentLanguage = message.language;
            break;
        }
      },
      null,
      this.disposables
    );
  }

  public static createOrShow(extensionUri: vscode.Uri, serverPort: number, defaultLanguage: string = 'javascript'): CodeRunnerPanel {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (CodeRunnerPanel.currentPanel) {
      CodeRunnerPanel.currentPanel.panel.reveal(column);
      CodeRunnerPanel.currentPanel.serverPort = serverPort;
      CodeRunnerPanel.currentPanel.currentLanguage = defaultLanguage;
      CodeRunnerPanel.currentPanel.updateWebview();
      return CodeRunnerPanel.currentPanel;
    }

    const panel = vscode.window.createWebviewPanel(
      'codeRunnerPanel',
      'Code Runner Panel',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
      }
    );

    CodeRunnerPanel.currentPanel = new CodeRunnerPanel(panel, extensionUri, serverPort);
    CodeRunnerPanel.currentPanel.currentLanguage = defaultLanguage;
    return CodeRunnerPanel.currentPanel;
  }

  private currentLanguage: string = 'javascript';

  public updateCode(code: string, language: string = 'javascript'): void {
    this.currentLanguage = language;
    this.panel.webview.postMessage({ command: 'updateCode', code, language });
  }

  private updateWebview(): void {
    this.panel.webview.html = this.getHtmlForWebview();
  }

  private getHtmlForWebview(): string {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Code Runner</title>
        <style>
            body {
                font-family: var(--vscode-font-family);
                padding: 20px;
                color: var(--vscode-editor-foreground);
                background-color: var(--vscode-editor-background);
            }
            .container {
                display: flex;
                flex-direction: column;
                height: 100vh;
            }
            .header {
                margin-bottom: 10px;
            }
            .server-info {
                margin-bottom: 20px;
                padding: 10px;
                background-color: var(--vscode-editor-inactiveSelectionBackground);
                border-radius: 5px;
            }
            .code-container, .output-container {
                flex: 1;
                margin-bottom: 20px;
            }
            .code-area, .output-area {
                width: 100%;
                height: 200px;
                background-color: var(--vscode-editor-background);
                color: var(--vscode-editor-foreground);
                border: 1px solid var(--vscode-panel-border);
                padding: 10px;
                font-family: monospace;
                white-space: pre;
                overflow: auto;
                border-radius: 5px;
            }
            .button-container {
                margin: 10px 0;
            }
            button {
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                padding: 8px 12px;
                margin-right: 10px;
                cursor: pointer;
                border-radius: 3px;
            }
            button:hover {
                background-color: var(--vscode-button-hoverBackground);
            }
            h3 {
                margin-top: 0;
                color: var(--vscode-editor-foreground);
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>Code Runner Panel</h2>
            </div>
            
            <div class="server-info">
                <p>Server running on port: <strong>${this.serverPort}</strong></p>
                <p>Send code to this server using:</p>
                <pre>fetch("http://localhost:${this.serverPort}/code", {
    method: "POST",
    body: "your code here"
});</pre>
            </div>
            
            <div class="code-container">
                <h3>Received Code:</h3>
                <div style="display: flex; align-items: center; margin-bottom: 10px;">
                    <label for="languageSelect" style="margin-right: 10px;">Language:</label>
                    <select id="languageSelect" style="padding: 5px; border-radius: 3px;">
                        <option value="javascript">JavaScript</option>
                        <option value="typescript">TypeScript</option>
                        <option value="dart">Dart</option>
                        <option value="python">Python</option>
                        <option value="ruby">Ruby</option>
                        <option value="go">Go</option>
                        <option value="php">PHP</option>
                        <option value="rust">Rust</option>
                    </select>
                </div>
                <div class="code-area" id="codeDisplay"></div>
            </div>
            
            <div class="button-container">
                <button id="runButton">Run Code</button>
                <button id="clearButton">Clear</button>
            </div>
            
            <div class="output-container">
                <h3>Output:</h3>
                <div class="output-area" id="outputDisplay"></div>
            </div>
        </div>
        
        <script>
            (function() {
                const vscode = acquireVsCodeApi();
                const codeDisplay = document.getElementById('codeDisplay');
                const outputDisplay = document.getElementById('outputDisplay');
                const runButton = document.getElementById('runButton');
                const clearButton = document.getElementById('clearButton');
                
                let currentLanguage = 'javascript';
                
                window.addEventListener('message', event => {
                    const message = event.data;
                    switch (message.command) {
                        case 'updateCode':
                            codeDisplay.textContent = message.code;
                            if (message.language) {
                                currentLanguage = message.language;
                                document.getElementById('languageSelect').value = message.language;
                            }
                            break;
                        case 'updateOutput':
                            outputDisplay.textContent = message.output;
                            break;
                        case 'clearOutput':
                            outputDisplay.textContent = '';
                            break;
                    }
                });
                
                const languageSelect = document.getElementById('languageSelect');
                
                languageSelect.addEventListener('change', () => {
                    currentLanguage = languageSelect.value;
                    vscode.postMessage({
                        command: 'changeLanguage',
                        language: currentLanguage
                    });
                });
                
                runButton.addEventListener('click', () => {
                    const code = codeDisplay.textContent;
                    vscode.postMessage({
                        command: 'runCode',
                        code: code,
                        language: currentLanguage
                    });
                });
                
                clearButton.addEventListener('click', () => {
                    codeDisplay.textContent = '';
                    outputDisplay.textContent = '';
                    vscode.postMessage({
                        command: 'clearCode'
                    });
                });
            }());
        </script>
    </body>
    </html>`;
  }

  private async runCode(code: string, language?: string): Promise<void> {
    if (!code || code.trim() === '') {
      this.panel.webview.postMessage({ 
        command: 'updateOutput', 
        output: 'No code to run.' 
      });
      return;
    }

    const lang = language || this.currentLanguage;
    
    try {
      const tempDir = os.tmpdir();
      let tempFile: string;
      let process: childProcess.ChildProcess;
      
      switch (lang.toLowerCase()) {
        case 'javascript':
        case 'js':
          tempFile = path.join(tempDir, `runcodelocally_${Date.now()}.js`);
          fs.writeFileSync(tempFile, code);
          process = childProcess.spawn('node', [tempFile]);
          break;
          
        case 'typescript':
        case 'ts':
          tempFile = path.join(tempDir, `runcodelocally_${Date.now()}.ts`);
          fs.writeFileSync(tempFile, code);
          process = childProcess.spawn('npx', ['ts-node', tempFile]);
          break;
          
        case 'dart':
          tempFile = path.join(tempDir, `runcodelocally_${Date.now()}.dart`);
          fs.writeFileSync(tempFile, code);
          process = childProcess.spawn('dart', [tempFile]);
          break;
          
        case 'python':
        case 'py':
          tempFile = path.join(tempDir, `runcodelocally_${Date.now()}.py`);
          fs.writeFileSync(tempFile, code);
          process = childProcess.spawn('python3', [tempFile]);
          break;
          
        case 'ruby':
        case 'rb':
          tempFile = path.join(tempDir, `runcodelocally_${Date.now()}.rb`);
          fs.writeFileSync(tempFile, code);
          process = childProcess.spawn('ruby', [tempFile]);
          break;
          
        case 'go':
          tempFile = path.join(tempDir, `runcodelocally_${Date.now()}.go`);
          fs.writeFileSync(tempFile, code);
          process = childProcess.spawn('go', ['run', tempFile]);
          break;
          
        case 'php':
          tempFile = path.join(tempDir, `runcodelocally_${Date.now()}.php`);
          fs.writeFileSync(tempFile, code);
          process = childProcess.spawn('php', [tempFile]);
          break;
          
        case 'rust':
        case 'rs':
          const rustDir = path.join(tempDir, `rust_${Date.now()}`);
          fs.mkdirSync(rustDir);
          tempFile = path.join(rustDir, 'main.rs');
          fs.writeFileSync(tempFile, code);
          process = childProcess.spawn('rustc', [tempFile, '-o', path.join(rustDir, 'output')]);
          process = childProcess.spawn(path.join(rustDir, 'output'));
          break;
          
        default:
          tempFile = path.join(tempDir, `runcodelocally_${Date.now()}.js`);
          fs.writeFileSync(tempFile, code);
          process = childProcess.spawn('node', [tempFile]);
      }
      
      let stdout = '';
      let stderr = '';
      
      if (process.stdout) {
        process.stdout.on('data', (data) => {
          stdout += data.toString();
        });
      }
      
      if (process.stderr) {
        process.stderr.on('data', (data) => {
          stderr += data.toString();
        });
      }
      
      process.on('close', (exitCode) => {
        try {
          fs.unlinkSync(tempFile);
        } catch (err) {
          console.error('Failed to delete temp file:', err);
        }
        
        const output = stderr ? `Error (${exitCode}):\n${stderr}` : stdout;
        this.panel.webview.postMessage({ 
          command: 'updateOutput', 
          output: output 
        });
      });
    } catch (err) {
      this.panel.webview.postMessage({ 
        command: 'updateOutput', 
        output: `Error running code: ${err}` 
      });
    }
  }

  public dispose(): void {
    CodeRunnerPanel.currentPanel = undefined;

    this.panel.dispose();

    while (this.disposables.length) {
      const x = this.disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }
}
