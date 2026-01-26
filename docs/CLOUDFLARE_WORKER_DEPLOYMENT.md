# Cloudflare Worker 部署指南

本文档介绍如何将 aigroup-mdtoword-mcp 服务部署到 Cloudflare Workers。

## 前提条件

1. 安装 Node.js (版本 >= 18.0.0)
2. 安装 Wrangler CLI 工具
3. 拥有一个 Cloudflare 账户

## 安装 Wrangler

```bash
npm install -g wrangler
```

或者使用 npx 直接运行：

```bash
npx wrangler
```

## 登录到 Cloudflare

```bash
wrangler login
```

## 项目配置

1. 确保项目根目录包含以下文件：
   - `src/worker.ts`: Cloudflare Worker 入口文件
   - `wrangler.toml`: Cloudflare Worker 配置文件
   - `package.json`: 包含必要的依赖项

2. 编辑 `wrangler.toml` 文件，更新账户 ID：

```toml
[env.production]
account_id = "your-account-id-here"  # 替换为你的Cloudflare账户ID
```

## 部署到 Cloudflare Workers

### 方法一：直接部署

```bash
# 部署到生产环境
wrangler deploy

# 部署到开发环境（测试用）
wrangler deploy --env development
```

### 方法二：使用 npm 脚本

```bash
# 使用 package.json 中定义的脚本
npm run deploy:worker
```

## 环境变量配置

如果需要配置环境变量，可以通过以下方式：

```bash
# 在 wrangler.toml 中配置
[vars]
NODE_ENV = "production"
VERSION = "4.0.2"
```

或者使用 secrets：

```bash
wrangler secret put SECRET_NAME
```

## API 端点

部署完成后，你的服务将可通过以下端点访问：

- `https://your-worker.your-subdomain.workers.dev/` - 主页信息
- `https://your-worker.your-subdomain.workers.dev/health` - 健康检查
- `https://your-worker.your-subdomain.workers.dev/mcp` - MCP 协议接口

## 实际部署示例

本次部署的实际端点为：
- 主页: https://aigroup-mdtoword-mcp.jackdark425.workers.dev/
- 健康检查: https://aigroup-mdtoword-mcp.jackdark425.workers.dev/health
- MCP 接口: https://aigroup-mdtoword-mcp.jackdark425.workers.dev/mcp

## 功能说明

Cloudflare Worker 版本支持以下功能：

1. **MCP 协议支持**：完全兼容 Model Context Protocol
2. **Markdown 转 Word**：核心转换功能
3. **模板系统**：支持预设模板
4. **样式配置**：支持样式定制
5. **资源访问**：通过 MCP 协议访问各种资源

注意：由于 Cloudflare Workers 的限制，某些依赖文件系统的功能可能不可用。

## 开发和调试

### 本地开发

```bash
# 使用 wrangler 进行本地开发
wrangler dev
```

### 日志查看

```bash
# 查看实时日志
wrangler tail
```

## 故障排除

### 常见问题

1. **部署失败**：检查 wrangler.toml 配置和账户权限
2. **依赖问题**：确保所有依赖都兼容 Cloudflare Workers 环境
3. **内存限制**：Cloudflare Workers 有内存限制，避免处理过大的文档

### 调试技巧

- 使用 `wrangler dev` 进行本地测试
- 检查控制台日志输出
- 确认所有导入的模块都支持 Workers 环境

## 更新部署

当更新代码后，只需重新运行部署命令：

```bash
wrangler deploy
```

新版本将自动部署到 Cloudflare Workers。