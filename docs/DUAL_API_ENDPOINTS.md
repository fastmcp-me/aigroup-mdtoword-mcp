# 双API端点支持文档

本服务同时支持两种API端点：传统的MCP协议端点和简化的HTTP API端点，以满足不同的集成需求。

## 端点概览

| 端点 | 方法 | 功能 | 适用场景 |
|------|------|------|----------|
| `/mcp` | POST | MCP协议接口 | 需要标准MCP协议兼容性的场景 |
| `/convert` | POST | 直接HTTP API | 简单集成、快速开发 |
| `/health` | GET | 健康检查 | 服务状态监控 |
| `/files/*` | GET | 文件下载 | 下载转换后的文档 |
| `/.well-known/ai-plugin.json` | GET | OpenAI插件清单 | AI模型集成 |
| `/openapi.yaml` | GET | OpenAPI规范(YAML) | API文档和集成 |
| `/openapi.json` | GET | OpenAPI规范(JSON) | API文档和集成 |
| `/logo.png` | GET | 插件Logo | OpenAI插件显示 |

## HTTP API 端点 (`/convert`)

### 请求格式

```json
{
  "markdown": "# 标题\n\n内容...",
  "filename": "output.docx",
  "template": {
    "type": "preset",
    "presetId": "customer-analysis"
  },
  "styleConfig": {
    "document": {
      "defaultFont": "Arial",
      "defaultSize": 24
    }
  }
}
```

### 参数说明

- `markdown` (string, 必需): Markdown格式的文档内容
- `filename` (string, 必需): 输出文件名，必须以`.docx`结尾
- `template` (object, 可选): 模板配置
- `styleConfig` (object, 可选): 样式配置

### 响应格式

```json
{
  "success": true,
  "filename": "output.docx",
  "downloadUrl": "https://your-worker.your-subdomain.workers.dev/files/output.docx",
  "size": 12345,
  "message": "文档转换成功！"
}
```

### 错误响应

```json
{
  "success": false,
  "error": "错误信息"
}
```

## MCP 端点 (`/mcp`)

### 请求格式

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "markdown_to_docx",
    "arguments": {
      "markdown": "# 标题\n\n内容...",
      "filename": "output.docx",
      "styleConfig": {
        "document": {
          "defaultFont": "Arial",
          "defaultSize": 24
        }
      }
    }
  },
  "id": "request-id"
}
```

### 响应格式

遵循标准MCP协议响应格式：

```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [...],
    "structuredContent": {
      "success": true,
      "filename": "output.docx",
      "url": "https://...",
      "size": 12345,
      "message": "文档转换成功！"
    }
  },
  "id": "request-id"
}
```

## 使用示例

### HTTP API 使用示例 (JavaScript)

```javascript
const response = await fetch('https://your-worker.your-subdomain.workers.dev/convert', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    markdown: '# Hello World\n\nThis is a test.',
    filename: 'test.docx',
    styleConfig: {
      document: {
        defaultFont: 'Arial',
        defaultSize: 24
      }
    }
  })
});

const result = await response.json();
console.log('下载链接:', result.downloadUrl);
```

### MCP 端点使用示例 (JavaScript)

```javascript
const response = await fetch('https://your-worker.your-subdomain.workers.dev/mcp', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    jsonrpc: '2.0',
    method: 'tools/call',
    params: {
      name: 'markdown_to_docx',
      arguments: {
        markdown: '# Hello World\n\nThis is a test.',
        filename: 'test.docx'
      }
    },
    id: 'unique-request-id'
  })
});

const result = await response.json();
console.log('结构化内容:', result.result.structuredContent);
```

## 优势对比

| 特性 | HTTP API | MCP 端点 |
|------|----------|----------|
| 易用性 | 非常简单 | 需要了解MCP协议 |
| 协议复杂度 | 简单的REST | 标准MCP协议 |
| 集成速度 | 快速 | 需要更多配置 |
| 兼容性 | 专有格式 | 标准协议 |
| 功能完整性 | 核心功能 | 完整MCP功能 |

## 内部实现

两种API端点共享相同的底层转换逻辑：

- HTTP API请求被内部转换为MCP协议请求
- 两者都使用相同的`McpServer`实例
- 统一的错误处理和验证机制
- 共享云存储上传功能

这种设计确保了功能的一致性，同时提供了灵活的接入方式。