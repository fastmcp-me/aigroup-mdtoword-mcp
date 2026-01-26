# Cloudflare Workers 部署说明

## 前提条件

在部署到Cloudflare Workers之前，请确保已安装以下工具：

1. **Node.js** (版本 >= 18.0.0)
2. **npm** (版本 >= 8.0.0)
3. **Wrangler CLI** (Cloudflare官方CLI工具)

### 安装 Wrangler

```bash
npm install -g wrangler
```

### 登录 Cloudflare

```bash
wrangler login
```

这将打开浏览器窗口，允许您授权Wrangler访问您的Cloudflare账户。

## 配置 R2 存储桶

此服务使用Cloudflare R2进行文件存储。您需要创建相应的存储桶：

1. 在Cloudflare控制台中创建R2存储桶
2. 记下存储桶名称（例如：`mdtoword-files`）

## 修改配置文件

在部署前，您需要编辑 `wrangler.toml` 文件以匹配您的环境：

```toml
name = "aigroup-mdtoword-mcp"  # 您想要的worker名称
main = "src/worker.ts"

compatibility_date = "2024-12-18"
compatibility_flags = ["nodejs_compat"]

# 环境变量
[vars]
NODE_ENV = "production"
VERSION = "4.0.2"

# R2存储桶配置
[[r2_buckets]]
binding = "BUCKET"
bucket_name = "your-bucket-name"  # 替换为您的R2存储桶名称
preview_bucket_name = "your-bucket-name-dev"  # 替换为您的开发存储桶名称

# 环境配置
[env.production]
account_id = "your-account-id-here"  # 替换为您的Cloudflare账户ID
routes = [
	"your-domain.your-subdomain.workers.dev"  # 替换为您的自定义域名或使用默认workers.dev域名
]

# 开发配置
[dev]
port = 8787
local_protocol = "http"
upstream_protocol = "https"
```

## 部署步骤

### 1. 构建项目

```bash
npm run build
```

### 2. 部署到 Cloudflare Workers

#### 部署到预览环境（开发）
```bash
wrangler deploy --dry-run
```

#### 部署到生产环境
```bash
wrangler deploy
```

### 3. 验证部署

部署完成后，您可以访问以下端点来验证服务：

- **服务信息**: `https://your-worker.your-subdomain.workers.dev/`
- **健康检查**: `https://your-worker.your-subdomain.workers.dev/health`
- **MCP端点**: `https://your-worker.your-subdomain.workers.dev/mcp`
- **HTTP API端点**: `https://your-worker.your-subdomain.workers.dev/convert`
- **OpenAI插件清单**: `https://your-worker.your-subdomain.workers.dev/.well-known/ai-plugin.json`
- **OpenAPI规范**: `https://your-worker.your-subdomain.workers.dev/openapi.yaml`
- **Logo**: `https://your-worker.your-subdomain.workers.dev/logo.png`

## 部署后验证

部署完成后，您可以运行测试脚本来验证所有端点：

```bash
node test-openai-plugin-endpoints.js
```

该脚本将测试所有OpenAI插件规范端点以及原有的功能端点。

## 自定义域名配置

如果您希望使用自定义域名：

1. 在Cloudflare DNS设置中添加CNAME记录指向您的workers.dev子域名
2. 在Cloudflare Workers控制台中添加自定义域名
3. 更新 `wrangler.toml` 中的 `routes` 配置

## 故障排除

### 常见问题

1. **部署失败**: 确保已登录wrangler并具有正确的账户权限
2. **R2错误**: 确认R2存储桶名称正确且账户有相应权限
3. **构建错误**: 确保所有依赖项都已安装

### 检查日志

```bash
wrangler tail
```

这将实时显示worker的日志输出，有助于调试问题。

## 环境变量说明

- `NODE_ENV`: 设置为 "production" 以启用生产环境优化
- `VERSION`: 服务版本号，用于标识和监控

## 资源清理

如果需要删除worker：

```bash
wrangler delete
```

## 更新部署

当您对代码进行更改后，只需再次运行：

```bash
npm run build
wrangler deploy
```

这将部署更新后的版本。