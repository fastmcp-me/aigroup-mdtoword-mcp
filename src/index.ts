#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { DocxMarkdownConverter } from './converter/markdown.js';
import { presetTemplateLoader } from './template/presetLoader.js';
import { DocxTemplateProcessor } from './template/processor.js';
import path from 'path';
import fs from 'fs/promises';

// 创建MCP服务器
const server = new Server(
  {
    name: "aigroup-mdtoword-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {}
    },
  }
);

// 注册工具列表处理器
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "markdown_to_docx",
      description: "将Markdown文档转换为Word文档（DOCX格式），支持样式配置和模板系统",
      inputSchema: {
        type: "object",
        properties: {
          markdown: {
            type: "string",
            description: "Markdown格式的文本内容（与inputPath二选一）"
          },
          inputPath: {
            type: "string",
            description: "Markdown文件路径（与markdown二选一）"
          },
          filename: {
            type: "string",
            description: "输出的Word文档文件名，必须以.docx结尾"
          },
          outputPath: {
            type: "string",
            description: "输出目录，默认为当前工作目录"
          },
          template: {
            type: "object",
            description: "模板配置",
            properties: {
              type: {
                type: "string",
                enum: ["preset"],
                description: "模板类型：preset=预设模板"
              },
              presetId: {
                type: "string",
                description: "预设模板ID，如：academic、business、customer-analysis等"
              }
            }
          },
          styleConfig: {
            type: "object",
            description: "样式配置对象，用于自定义文档外观"
          }
        },
        required: ["filename"]
      }
    }
  ]
}));

// 工具调用处理
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== "markdown_to_docx") {
    throw new Error(`未知工具: ${request.params.name}`);
  }

  const args = request.params.arguments as any;
  
  try {
    // 参数验证
    if (!args.markdown && !args.inputPath) {
      throw new Error('必须提供 markdown 或 inputPath 参数');
    }
    
    if (!args.filename || !args.filename.endsWith('.docx')) {
      throw new Error('filename 必须以 .docx 结尾');
    }

    // 获取Markdown内容
    let markdownContent: string;
    if (args.inputPath) {
      markdownContent = await fs.readFile(args.inputPath, 'utf-8');
    } else {
      markdownContent = args.markdown;
    }

    // 处理样式配置
    let finalStyleConfig = args.styleConfig;
    const templateProcessor = new DocxTemplateProcessor();

    // 如果没有指定模板和样式配置，使用默认的客户分析模板
    if (!args.template && !args.styleConfig) {
      const defaultTemplate = presetTemplateLoader.getDefaultTemplate();
      if (defaultTemplate) {
        finalStyleConfig = defaultTemplate.styleConfig;
      }
    }

    // 如果有模板配置，从模板提取样式并与直接样式配置合并
    if (args.template?.type === 'preset' && args.template.presetId) {
      const presetTemplate = presetTemplateLoader.getPresetTemplate(args.template.presetId);
      if (presetTemplate) {
        const templateStyleConfig = presetTemplate.styleConfig;
        if (finalStyleConfig) {
          const { styleEngine } = await import('./utils/styleEngine.js');
          finalStyleConfig = styleEngine.mergeStyleConfigs(templateStyleConfig, finalStyleConfig);
        } else {
          finalStyleConfig = templateStyleConfig;
        }
      } else {
        throw new Error(`预设模板 "${args.template.presetId}" 不存在`);
      }
    }

    // 执行转换
    const converter = new DocxMarkdownConverter(finalStyleConfig);
    const docxContent = await converter.convert(markdownContent);

    // 保存文件
    const outputPath = args.outputPath || process.cwd();
    await fs.mkdir(outputPath, { recursive: true });
    
    const fullPath = path.join(outputPath, args.filename);
    await fs.writeFile(fullPath, docxContent);

    return {
      content: [
        {
          type: "text",
          text: `✅ 文档转换成功！\n\n📄 文件名: ${args.filename}\n📁 保存路径: ${fullPath}\n💾 文件大小: ${docxContent.length} 字节`
        }
      ]
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    throw new Error(`转换失败: ${errorMessage}`);
  }
});

// 注册资源列表处理器
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: "templates://list",
      mimeType: "text/plain",
      name: "模板列表",
      description: "所有可用的预设模板"
    },
    {
      uri: "templates://default",
      mimeType: "text/plain",
      name: "默认模板",
      description: "默认的客户分析模板信息"
    },
    {
      uri: "style-guide://complete",
      mimeType: "text/plain",
      name: "样式配置指南",
      description: "完整的样式配置文档"
    }
  ]
}));

// 资源读取处理
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;

  if (uri === "templates://list") {
    const templates = presetTemplateLoader.getTemplateList();
    const templateInfo = templates.map(t => 
      `- **${t.id}**: ${t.name}${t.isDefault ? ' ⭐ (默认)' : ''}\n  分类: ${t.category}\n  描述: ${t.description}`
    ).join('\n\n');

    return {
      contents: [
        {
          uri,
          mimeType: "text/plain",
          text: `# 可用模板列表\n\n${templateInfo}\n\n## 使用方法\n\n在 template 参数中指定：\n\`\`\`json\n{\n  "type": "preset",\n  "presetId": "模板ID"\n}\n\`\`\``
        }
      ]
    };
  }

  if (uri === "templates://default") {
    const defaultTemplate = presetTemplateLoader.getDefaultTemplate();
    const defaultId = presetTemplateLoader.getDefaultTemplateId();
    
    return {
      contents: [
        {
          uri,
          mimeType: "text/plain",
          text: `# 默认模板\n\nID: ${defaultId}\n名称: ${defaultTemplate?.name}\n分类: ${defaultTemplate?.category}\n描述: ${defaultTemplate?.description}\n\n特点：\n- 正文首行缩进2个字符\n- 黑色文本，宋体字体\n- 符合中文文档规范`
        }
      ]
    };
  }

  if (uri === "style-guide://complete") {
    return {
      contents: [
        {
          uri,
          mimeType: "text/plain",
          text: `# Markdown转Word样式配置指南

## 单位换算
- **缇（Twip）**: 1/1440英寸 = 1/20点，用于间距和边距
- **半点**: 字号单位，24半点 = 12pt
- **示例**: 2个字符缩进 = 480缇，1英寸边距 = 1440缇

## 常用颜色（6位十六进制）
- \`000000\` - 纯黑色
- \`333333\` - 深灰色
- \`666666\` - 中灰色
- \`2E74B5\` - 专业蓝色

## 配置示例

### 基础段落样式
\`\`\`json
{
  "styleConfig": {
    "paragraphStyles": {
      "normal": {
        "font": "宋体",
        "size": 24,
        "indent": { "firstLine": 480 },
        "alignment": "justify"
      }
    }
  }
}
\`\`\`

### 标题样式
\`\`\`json
{
  "styleConfig": {
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
\`\`\``
        }
      ]
    };
  }

  throw new Error(`未知资源: ${uri}`);
});

// 注册提示列表处理器
server.setRequestHandler(ListPromptsRequestSchema, async () => ({
  prompts: [
    {
      name: "markdown_to_docx_help",
      description: "获取Markdown转Word服务的使用帮助"
    },
    {
      name: "markdown_to_docx_examples",
      description: "获取实用示例"
    }
  ]
}));

// 提示获取处理
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const name = request.params.name;

  if (name === "markdown_to_docx_help") {
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `# Markdown转Word服务使用指南

## 🚀 快速开始
最简单的使用方式（使用默认模板）：
\`\`\`json
{
  "markdown": "# 我的报告\\n\\n这是正文内容",
  "filename": "report.docx"
}
\`\`\`

## 📋 可用预设模板
- **academic**: 学术论文
- **business**: 商务报告
- **customer-analysis**: 客户分析（默认）⭐
- **minimal**: 极简风格
- **technical**: 技术文档

## 💡 使用提示
1. 查看 'templates://list' 资源获取所有模板
2. 查看 'style-guide://complete' 资源获取样式指南
3. 可以同时使用模板和自定义样式
4. 输出文件默认保存在当前目录`
          }
        }
      ]
    };
  }

  if (name === "markdown_to_docx_examples") {
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `# 实用示例

## 📝 基础转换
\`\`\`json
{
  "markdown": "# 标题\\n\\n正文内容",
  "filename": "output.docx"
}
\`\`\`

## 📖 从文件读取
\`\`\`json
{
  "inputPath": "./input/document.md",
  "filename": "output.docx",
  "outputPath": "./output"
}
\`\`\`

## 🎨 使用模板
\`\`\`json
{
  "markdown": "# 学术论文\\n\\n内容",
  "filename": "paper.docx",
  "template": {
    "type": "preset",
    "presetId": "academic"
  }
}
\`\`\``
          }
        }
      ]
    };
  }

  throw new Error(`未知提示: ${name}`);
});

// 启动服务器
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("aigroup-mdtoword-mcp MCP 服务器已启动");
}

main().catch((error) => {
  console.error("服务器启动失败:", error);
  process.exit(1);
});