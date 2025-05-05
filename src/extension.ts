import * as vscode from "vscode";
import { CodeReceiverServer } from "./server";
import { CodeRunnerPanel } from "./webview";

let server: CodeReceiverServer | undefined;

export function activate(context: vscode.ExtensionContext) {
  console.log('Extension "runcodelocally" is now active!');

  const startServerCommand = vscode.commands.registerCommand(
    "runcodelocally.startServer",
    async () => {
      if (server && server.isRunning()) {
        vscode.window.showInformationMessage(
          `Server is already running on port ${server.getPort()}`
        );
        return;
      }

      try {
        const config = vscode.workspace.getConfiguration("runcodelocally");
        const port = config.get<number>("port", 9009);

        const panel = CodeRunnerPanel.createOrShow(context.extensionUri, port);

        server = new CodeReceiverServer({
          port,
          onCodeReceived: (code: string) => {
            panel.updateCode(code);
          },
        });

        await server.start();
      } catch (err) {
        vscode.window.showErrorMessage(`Failed to start server: ${err}`);
      }
    }
  );

  const stopServerCommand = vscode.commands.registerCommand(
    "runcodelocally.stopServer",
    async () => {
      if (!server || !server.isRunning()) {
        vscode.window.showInformationMessage("No server is running");
        return;
      }

      try {
        await server.stop();
        server = undefined;
      } catch (err) {
        vscode.window.showErrorMessage(`Failed to stop server: ${err}`);
      }
    }
  );

  const showPanelCommand = vscode.commands.registerCommand(
    "runcodelocally.showPanel",
    () => {
      const config = vscode.workspace.getConfiguration("runcodelocally");
      const port = config.get<number>("port", 9009);

      CodeRunnerPanel.createOrShow(context.extensionUri, port);
    }
  );

  context.subscriptions.push(startServerCommand);
  context.subscriptions.push(stopServerCommand);
  context.subscriptions.push(showPanelCommand);
}

export function deactivate() {
  if (server && server.isRunning()) {
    return server.stop();
  }
  return undefined;
}
