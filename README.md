# RunCodeLocally (本地运行代码)

RunCodeLocally 是一个 VS Code 扩展，允许您接收并运行来自网页的代码。它会创建一个本地 HTTP 服务器，监听从网页发送的代码片段，在 VS Code 面板中显示它们，并让您直接在 VS Code 中运行代码。

## 功能

- 启动本地 HTTP 服务器以接收来自网页的代码
- 可配置的服务器端口（默认：9009）
- 在专用的 VS Code 面板中显示接收到的代码
- 运行 JavaScript 代码并查看输出
- 为网页提供简单的 API 以将代码发送到 VS Code

## 工作原理

1. 在 VS Code 中使用命令面板启动服务器
2. 扩展在配置的端口上创建一个本地 HTTP 服务器
3. 网页可以使用简单的 fetch 请求将代码发送到服务器
4. 代码会出现在 VS Code 面板中，您可以在其中运行它

## 安装

1. 下载扩展 VSIX 文件
2. 在 VS Code 中，转到扩展视图 (Ctrl+Shift+X)
3. 点击“...”菜单并选择“从 VSIX 安装...”
4. 选择下载的 VSIX 文件

## 使用方法

### 启动服务器

1. 打开命令面板 (Ctrl+Shift+P)
2. 输入“Start Code Receiver Server”（启动代码接收服务器）并选择该命令
3. 将打开一个面板，显示服务器状态和端口

### 从网页发送代码

使用 fetch 请求将代码发送到 VS Code。支持以下几种方式：

**方法 1：发送纯文本代码（默认为 JavaScript）**

将代码作为纯文本发送到 `/code` 端点。

```javascript
fetch('http://localhost:9009/code', {
  method: 'POST',
  headers: {
    'Content-Type': 'text/plain', // 或其他非 application/json 的类型
  },
  body: "console.log('来自网页的你好！');",
})
  .then((response) => response.text())
  .then((data) => console.log(data))
  .catch((error) => console.error('错误:', error));
```

**方法 2：发送 URL 编码的代码和语言**

将包含 `lang` 和 `code` 参数的 URL 编码字符串发送到 `/code` 端点。

```javascript
const language = 'python';
const code = 'print("来自网页的你好！")';
const encodedBody = `lang=${encodeURIComponent(language)}&code=${encodeURIComponent(code)}`;

fetch('http://localhost:9009/code', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded', // 或其他非 application/json 的类型
  },
  body: encodedBody,
})
  .then((response) => response.text())
  .then((data) => console.log(data))
  .catch((error) => console.error('错误:', error));
```

**方法 3：发送包含代码和语言的 JSON**

将包含 `code` 和 `language` 属性的 JSON 对象发送到 `/code-with-language` 端点。

```javascript
fetch('http://localhost:9009/code-with-language', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    language: 'javascript',
    code: "console.log('来自网页的 JSON 你好！');",
  }),
})
  .then((response) => response.text())
  .then((data) => console.log(data))
  .catch((error) => console.error('错误:', error));
```

### 运行代码

当代码出现在 VS Code 面板中时，点击“运行代码”按钮执行它并查看输出。

## 扩展设置

此扩展提供以下设置：

- `runcodelocally.port`：本地 HTTP 服务器的端口号（默认：9009）

## 示例 HTML 页面

`examples` 文件夹中包含一个示例 HTML 页面。在浏览器中打开 `examples/demo.html` 以测试向 VS Code 发送代码。

## 要求

- VS Code 1.99.0 或更高版本
- Node.js 运行时（用于运行 JavaScript 代码）

## 已知问题

- 目前仅支持运行 JavaScript 代码
- 如果在设置中更改了端口，需要手动重新启动服务器

## 未来增强

- 支持多种编程语言
- 面板中的代码高亮
- 将接收到的代码保存为文件
- 接收到的代码片段历史记录

## 发行说明

### 0.0.1

RunCodeLocally 的初始版本

---

## 开发者信息

### 构建扩展

1. 克隆仓库
2. 运行 `pnpm install` 安装依赖项
3. 运行 `pnpm run compile` 构建扩展
4. 按 F5 开始调试

### 项目结构

- `src/extension.ts`：主扩展入口点
- `src/server.ts`：HTTP 服务器实现
- `src/webview.ts`：VS Code webview 面板实现
- `examples/demo.html`：用于测试的示例 HTML 页面

**祝您使用愉快！**
