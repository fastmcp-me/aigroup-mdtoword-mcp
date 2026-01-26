# OpenAI插件规范 - Markdown转Word服务

## API概述

这是一个用于将Markdown格式文本转换为Word文档的API服务，专为大模型调用设计，符合OpenAI插件规范。

## API端点

### 主要功能端点
- **转换端点**:
  - URL: `https://your-worker.your-subdomain.workers.dev/convert`
  - 方法: `POST`
  - 内容类型: `application/json`
  - 用途: 将Markdown转换为Word文档

### OpenAI插件端点
- **插件清单**:
  - URL: `https://your-worker.your-subdomain.workers.dev/.well-known/ai-plugin.json`
  - 方法: `GET`
  - 用途: 提供插件元数据

- **API规范**:
  - URL: `https://your-worker.your-subdomain.workers.dev/openapi.yaml`
  - 方法: `GET`
  - 用途: 提供OpenAPI规范 (也支持 `/openapi.json`)

- **Logo**:
  - URL: `https://your-worker.your-subdomain.workers.dev/logo.png`
  - 方法: `GET`
  - 用途: 插件图标

## OpenAI插件清单 (ai-plugin.json)

```json
{
  "schema_version": "v1",
  "name_for_model": "markdown_to_word_converter",
  "name_for_human": "Markdown转Word转换器",
  "description_for_model": "将Markdown格式的文本转换为Word文档(DOCX格式)，支持丰富的样式配置选项。",
  "description_for_human": "将Markdown文档转换为专业的Word文档。",
  "auth": {
    "type": "none"
  },
  "api": {
    "type": "openapi",
    "url": "https://your-worker.your-subdomain.workers.dev/openapi.yaml",
    "has_user_authentication": false
  },
  "logo_url": "https://your-worker.your-subdomain.workers.dev/logo.png",
  "contact_email": "support@example.com",
  "legal_info_url": "https://example.com/legal"
}
```

## OpenAPI规范 (openapi.yaml)

```yaml
openapi: 3.0.0
info:
  title: Markdown转Word转换器
  description: 将Markdown格式的文本转换为Word文档(DOCX格式)，支持丰富的样式配置选项。
  version: 4.0.2
servers:
  - url: https://your-worker.your-subdomain.workers.dev
paths:
  /convert:
    post:
      summary: 转换Markdown为Word文档
      description: 将提供的Markdown内容转换为Word文档，并返回下载链接。
      operationId: convertMarkdownToWord
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ConvertRequest'
      responses:
        '200':
          description: 转换成功
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ConvertResponse'
        '400':
          description: 请求参数错误
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '500':
          description: 服务器内部错误
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
      x-openai-isConsequential: false
components:
  schemas:
    ConvertRequest:
      type: object
      required:
        - markdown
        - filename
      properties:
        markdown:
          type: string
          description: 要转换的Markdown格式文本内容
          example: "# 标题\n\n这是一段内容。"
        filename:
          type: string
          description: 输出的Word文档文件名，必须以.docx结尾
          pattern: ".*\\.docx$"
          example: "document.docx"
        template:
          type: object
          description: 模板配置
          properties:
            type:
              type: string
              enum: [preset]
              description: 模板类型
            presetId:
              type: string
              description: 预设模板ID (如: academic, business, customer-analysis, technical, minimal, enhanced-features)
          example:
            type: "preset"
            presetId: "customer-analysis"
        styleConfig:
          type: object
          description: 样式配置对象
          properties:
            theme:
              type: object
              description: 主题配置
              properties:
                name:
                  type: string
                  description: 主题名称
                colors:
                  type: object
                  properties:
                    primary:
                      type: string
                      pattern: "^[0-9A-Fa-f]{6}$"
                      description: 主色调（6位十六进制）
                    secondary:
                      type: string
                      pattern: "^[0-9A-Fa-f]{6}$"
                      description: 辅助色（6位十六进制）
                    text:
                      type: string
                      pattern: "^[0-9A-Fa-f]{6}$"
                      description: 文本颜色（6位十六进制）
            watermark:
              type: object
              description: 水印配置
              properties:
                text:
                  type: string
                  description: 水印文本
                font:
                  type: string
                  description: 水印字体
                size:
                  type: number
                  minimum: 1
                  maximum: 200
                  description: 水印字号
                color:
                  type: string
                  pattern: "^[0-9A-Fa-f]{6}$"
                  description: 水印颜色（6位十六进制）
                opacity:
                  type: number
                  minimum: 0
                  maximum: 1
                  description: 透明度（0-1）
                rotation:
                  type: number
                  minimum: -90
                  maximum: 90
                  description: 旋转角度（-90到90）
            document:
              type: object
              description: 文档基本配置
              properties:
                defaultFont:
                  type: string
                  description: 默认字体
                  example: "Arial"
                defaultSize:
                  type: number
                  description: 默认字号（半点）
                  example: 24
    ConvertResponse:
      type: object
      properties:
        success:
          type: boolean
          description: 转换是否成功
        filename:
          type: string
          description: 生成的文件名
        downloadUrl:
          type: string
          description: 文档下载链接
        size:
          type: number
          description: 文件大小（字节）
        message:
          type: string
          description: 操作消息
      required:
        - success
        - filename
        - downloadUrl
        - size
        - message
    ErrorResponse:
      type: object
      properties:
        success:
          type: boolean
          description: 操作是否成功
        error:
          type: string
          description: 错误信息
      required:
        - success
        - error
```

## 大模型调用示例

### 功能描述
当大模型需要将生成的内容保存为Word文档时，可以使用此API。

### 调用时机
- 用户要求将对话内容或分析结果导出为Word文档
- 需要生成结构化报告
- 需要格式化的文档输出

### 调用示例

```json
{
  "name": "markdown_to_word_converter",
  "arguments": "{\"markdown\":\"# 项目报告\\n\\n## 概述\\n这是一份关于项目的详细报告。\\n\\n## 结论\\n项目成功完成。\",\"filename\":\"project_report.docx\",\"styleConfig\":{\"document\":{\"defaultFont\":\"Arial\",\"defaultSize\":24}}}"
}
```

### 参数说明
- `markdown`: 要转换的Markdown文本内容
- `filename`: 期望的输出文件名（必须以.docx结尾）
- `styleConfig`: 可选的样式配置，如字体、主题等

### 响应处理
大模型应解析API响应，提取`downloadUrl`并告知用户文档已生成，提供下载链接。

## 注意事项

1. **安全性**: 此API无需认证，任何用户都可以调用
2. **文件名限制**: 文件名必须以.docx结尾
3. **内容限制**: 单次请求的Markdown内容不宜过大
4. **响应时间**: 转换过程可能需要几秒钟时间
5. **下载链接有效期**: 生成的文档链接长期有效，存储在Cloudflare R2中

## 错误处理

- 如果缺少必需参数，API将返回400错误
- 如果转换过程中出现错误，API将返回500错误
- 文件名格式不正确时会返回验证错误