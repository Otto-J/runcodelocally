import express from 'express';
import cors from 'cors';
import * as vscode from 'vscode';
import * as http from 'http';

export interface ServerOptions {
  port: number;
  onCodeReceived: (code: string) => void;
}

export class CodeReceiverServer {
  private app: express.Express;
  private server: http.Server | null = null;
  private port: number;
  private onCodeReceived: (code: string) => void;

  constructor(options: ServerOptions) {
    this.port = options.port;
    this.onCodeReceived = options.onCodeReceived;
    this.app = express();
    
    this.app.use(cors());
    this.app.use(express.text({ type: '*/*' }));
    
    this.app.post('/code', (req, res) => {
      const code = req.body;
      if (typeof code === 'string') {
        this.onCodeReceived(code);
        res.send('✅ Code received by VS Code extension');
      } else {
        res.status(400).send('❌ Invalid code format. Please send plain text.');
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
          vscode.window.showInformationMessage(`Server started on port ${this.port}`);
          resolve();
        });
        
        if (this.server) {
          this.server.on('error', (err: NodeJS.ErrnoException) => {
          if (err.code === 'EADDRINUSE') {
            vscode.window.showErrorMessage(
              `Port ${this.port} is already in use. Please change the port in settings.`
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
