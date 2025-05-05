import express from 'express';
import cors from 'cors';
import * as vscode from 'vscode';
import * as http from 'http';

export interface CodeData {
  code: string;
  language: string;
}

export interface ServerOptions {
  port: number;
  onCodeReceived: (codeData: CodeData) => void;
}

export class CodeReceiverServer {
  private app: express.Express;
  private server: http.Server | null = null;
  private port: number;
  private onCodeReceived: (codeData: CodeData) => void;

  constructor(options: ServerOptions) {
    this.port = options.port;
    this.onCodeReceived = options.onCodeReceived;
    this.app = express();

    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.text({ type: '*/*' }));

    this.app.post('/code', (req, res) => {
      let code = req.body;
      let language = 'javascript'; // Default language

      if (typeof code === 'string') {
        if (code.startsWith('lang=') && code.includes('&code=')) {
          try {
            const parts = code.split('&');
            const langPart = parts.find((p) => p.startsWith('lang='));
            const codePart = parts.find((p) => p.startsWith('code='));

            if (langPart && codePart) {
              language = decodeURIComponent(langPart.substring(5));
              code = decodeURIComponent(codePart.substring(5));
            }
          } catch (e) {
            vscode.window.showErrorMessage(
              'Error parsing code and language from URL-encoded data.',
            );
          }
        }

        this.onCodeReceived({ code, language });
        res.send('✅ Code received by VS Code extension');
      } else {
        res
          .status(400)
          .send(
            '❌ Invalid code format. Please send plain text or URL-encoded data.',
          );
      }
    });

    this.app.post('/code-with-language', (req, res) => {
      // express.json() middleware handles parsing if Content-Type is application/json
      const { code, language } = req.body;

      if (typeof code === 'string' && typeof language === 'string') {
        this.onCodeReceived({ code: decodeURIComponent(code), language });
        res.send('✅ Code received by VS Code extension');
      } else {
        // Send error if code or language are not strings or are missing
        res
          .status(400)
          .send(
            "❌ Invalid JSON format. Please send JSON with 'code' and 'language' string properties.",
          );
      }
    });

    this.app.get('/', (_, res) => {
      res.send('RunCodeLocally server is running');
    });
  }

  public start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(this.port, () => {
          vscode.window.showInformationMessage(
            `Server started on port ${this.port}`,
          );
          resolve();
        });

        if (this.server) {
          this.server.on('error', (err: NodeJS.ErrnoException) => {
            if (err.code === 'EADDRINUSE') {
              vscode.window.showErrorMessage(
                `Port ${this.port} is already in use. Please change the port in settings.`,
              );
            } else {
              vscode.window.showErrorMessage(`Server error: ${err.message}`);
            }
            reject(err);
          });
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  public stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          this.server = null;
          vscode.window.showInformationMessage('Server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  public isRunning(): boolean {
    return this.server !== null;
  }

  public getPort(): number {
    return this.port;
  }
}
