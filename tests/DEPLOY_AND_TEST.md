# 部署和测试说明

## 部署到 Cloudflare Workers

### 1. 安装依赖
```bash
npm install -g wrangler
```

### 2. 登录 Cloudflare
```bash
wrangler login
```

### 3. 构建项目
```bash
npm run build
```

### 4. 部署到 Cloudflare
```bash
wrangler deploy
```

## 测试 OpenAI 插件规范端点

部署完成后，您可以使用以下命令测试各个端点：

### 1. 测试插件清单
```bash
curl https://your-worker.your-subdomain.workers.dev/.well-known/ai-plugin.json
```

### 2. 测试 OpenAPI 规范 (YAML)
```bash
curl https://your-worker.your-subdomain.workers.dev/openapi.yaml
```

### 3. 测试 OpenAPI 规范 (JSON)
```bash
curl https://your-worker.your-subdomain.workers.dev/openapi.json
```

### 4. 测试 Logo 端点
```bash
curl -I https://your-worker.your-subdomain.workers.dev/logo.png
```

### 5. 测试 HTTP API 端点
```bash
curl -X POST https://your-worker.your-subdomain.workers.dev/convert \
  -H "Content-Type: application/json" \
  -d '{
    "markdown": "# Test Document\n\nThis is a test.",
    "filename": "test.docx"
  }'
```

### 6. 运行自动化测试
```bash
node test-openai-plugin-endpoints.js
```

## 验证 MCP 端点

确保 MCP 端点仍然正常工作：

```bash
curl -X POST https://your-worker.your-subdomain.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "markdown_to_docx",
      "arguments": {
        "markdown": "# Test Document\n\nThis is a test.",
        "filename": "test.docx"
      }
    },
    "id": "test"
  }'
```

## 完整功能测试

部署完成后，服务将支持以下功能：

1. **MCP 端点** - 保持向后兼容性
2. **HTTP API 端点** - 简化 REST 接口
3. **OpenAI 插件规范** - 支持 AI 模型集成
4. **OpenAPI 规范** - 提供 API 文档
5. **健康检查** - 服务状态监控

所有端点共享相同的底层转换逻辑，确保功能一致性。