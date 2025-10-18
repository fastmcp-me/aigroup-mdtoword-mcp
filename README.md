# aigroup-mdtoword-mcp

本地 Markdown 到 Word 文档转换工具，支持 MCP (Model Context Protocol) 协议通信。

## 特性

- ✅ 完整的 Markdown 语法支持（标题、段落、列表、表格、代码块、引用等）
- 🎨 丰富的样式配置系统
- 📋 多种预设模板（学术论文、商务报告、客户分析等）
- 🖼️ 图片支持（本地、网络、Base64）
- 🔧 MCP 协议支持，易于集成到 AI 工具链
- 💾 本地文件处理，无需云存储

## 安装

### 全局安装

```bash
npm install -g aigroup-mdtoword-mcp
```

### 本地安装

```bash
npm install aigroup-mdtoword-mcp
```

### 通过 npx 直接使用

```bash
npx aigroup-mdtoword-mcp
```

## 使用方式

### 1. 作为 MCP 服务器

在 Roo Code 或其他支持 MCP 的工具中配置：

```json
{
  "mcpServers": {
    "aigroup-mdtoword-mcp": {
      "command": "npx",
      "args": ["-y", "aigroup-mdtoword-mcp"],
      "alwaysAllow": ["markdown_to_docx"]
    }
  }
}
```

### 2. 基本用法示例

#### 最简单的转换

```json
{
  "markdown": "# 我的文档\n\n这是正文内容，会自动应用默认样式。",
  "filename": "output.docx"
}
```

#### 从文件读取

```json
{
  "inputPath": "./input/document.md",
  "filename": "output.docx",
  "outputPath": "./output"
}
```

#### 使用预设模板

```json
{
  "markdown": "# 学术论文\n\n## 摘要\n\n本文探讨...",
  "filename": "paper.docx",
  "template": {
    "type": "preset",
    "presetId": "academic"
  }
}
```

#### 自定义样式配置

```json
{
  "markdown": "# 标题\n\n正文内容",
  "filename": "custom.docx",
  "styleConfig": {
    "document": {
      "defaultFont": "微软雅黑",
      "defaultSize": 24
    },
    "paragraphStyles": {
      "normal": {
        "indent": {
          "firstLine": 480
        },
        "alignment": "justify"
      }
    },
    "headingStyles": {
      "h1": {
        "font": "黑体",
        "size": 36,
        "color": "2E74B5",
        "bold": true
      }
    }
  }
}
```

## 预设模板

### customer-analysis（默认）⭐
客户分析模板，特点：
- 正文首行缩进 2 个字符（480缇）
- 黑色文本，宋体字体
- 符合中文文档规范

### academic
学术论文模板，适合：
- 学术论文
- 研究报告
- 毕业论文

### business
商务报告模板，适合：
- 商务报告
- 工作总结
- 项目方案

### technical
技术文档模板，适合：
- API 文档
- 技术规范
- 开发文档

### minimal
极简模板，适合：
- 简单文档
- 快速笔记
- 临时文档

## MCP 工具

### markdown_to_docx

将 Markdown 文档转换为 Word 文档（DOCX 格式）。

**参数：**

- `markdown` (string, 可选): Markdown 内容（与 inputPath 二选一）
- `inputPath` (string, 可选): Markdown 文件路径（与 markdown 二选一）
- `filename` (string, 必需): 输出文件名，必须以 .docx 结尾
- `outputPath` (string, 可选): 输出目录，默认为当前工作目录
- `template` (object, 可选): 模板配置
  - `type`: 模板类型（preset）
  - `presetId`: 预设模板 ID
- `styleConfig` (object, 可选): 样式配置对象

## MCP 资源

### templates://list
获取所有可用的预设模板列表

### templates://default
获取默认模板信息

### style-guide://complete
获取完整的样式配置指南

## MCP 提示

### markdown_to_docx_help
获取使用帮助和快速开始指南

### markdown_to_docx_examples
获取实用示例和最佳实践

## 样式配置说明

### 单位换算

- **缇（Twip）**: 1/1440英寸 = 1/20点，用于间距和边距
- **半点**: 字号单位，24半点 = 12pt
- **示例**: 
  - 2个字符缩进 = 480缇
  - 1英寸边距 = 1440缇
  - 12pt字号 = 24半点

### 常用颜色（6位十六进制）

- `000000` - 纯黑色
- `333333` - 深灰色
- `666666` - 中灰色
- `2E74B5` - 专业蓝色
- `D73A49` - 警告红色

### 首行缩进计算

公式：字号(半点) × 字符数 × 10

- 24号字体 2字符: 480缇
- 28号字体 2字符: 560缇
- 20号字体 2字符: 400缇

## 开发

### 构建项目

```bash
npm run build
```

### 开发模式

```bash
npm run dev
```

### 运行测试

```bash
npm test
```

## 系统要求

- Node.js >= 18.0.0
- npm >= 8.0.0

## 支持的操作系统

- Windows
- macOS
- Linux

## 许可证

MIT

## 问题反馈

如有问题，请在 GitHub Issues 中提交：
https://github.com/aigroup/aigroup-mdtoword-mcp/issues

## 贡献

欢迎提交 Pull Request！

## 更新日志

### 1.0.0 (2024-10-18)

- 🎉 首次发布
- ✅ 支持完整的 Markdown 语法
- 🎨 提供丰富的样式配置系统
- 📋 内置 5 种预设模板
- 🔧 完整的 MCP 协议支持
- 💾 本地文件处理，无需云存储