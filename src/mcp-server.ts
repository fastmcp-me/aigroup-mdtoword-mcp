
import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { presetTemplateLoader } from './template/presetLoader.js';
import { DocxTemplateProcessor } from './template/processor.js';
import { TableProcessor } from './utils/tableProcessor.js';

// ==================== Zod Schemas ====================

// 主题配置 Schema
const ThemeSchema = z.object({
  name: z.string().optional().describe('主题名称'),
  colors: z.object({
    primary: z.string().regex(/^[0-9A-Fa-f]{6}$/).optional().describe('主色调（6位十六进制）'),
    secondary: z.string().regex(/^[0-9A-Fa-f]{6}$/).optional().describe('辅助色（6位十六进制）'),
    text: z.string().regex(/^[0-9A-Fa-f]{6}$/).optional().describe('文本颜色（6位十六进制）'),
  }).optional(),
  fonts: z.object({
    heading: z.string().optional().describe('标题字体'),
    body: z.string().optional().describe('正文字体'),
    code: z.string().optional().describe('代码字体'),
  }).optional(),
  spacing: z.object({
    small: z.number().optional().describe('小间距（缇）'),
    medium: z.number().optional().describe('中间距（缇）'),
    large: z.number().optional().describe('大间距（缇）'),
  }).optional(),
}).optional();

// 水印配置 Schema
const WatermarkSchema = z.object({
  text: z.string().describe('水印文本'),
  font: z.string().optional().describe('水印字体'),
  size: z.number().min(1).max(200).optional().describe('水印字号'),
  color: z.string().regex(/^[0-9A-Fa-f]{6}$/).optional().describe('水印颜色（6位十六进制）'),
  opacity: z.number().min(0).max(1).optional().describe('透明度（0-1）'),
  rotation: z.number().min(-90).max(90).optional().describe('旋转角度（-90到90）'),
}).optional();

// 目录配置 Schema
const TableOfContentsSchema = z.object({
  enabled: z.boolean().optional().describe('是否启用目录'),
  title: z.string().optional().describe('目录标题'),
  levels: z.array(z.number().min(1).max(6)).optional().describe('包含的标题级别'),
  showPageNumbers: z.boolean().optional().describe('是否显示页码'),
  tabLeader: z.enum(['dot', 'hyphen', 'underscore', 'none']).optional().describe('页码引导符'),
}).optional();

// 页眉页脚配置 Schema
const HeaderFooterSchema = z.object({
  header: z.object({
    content: z.string().optional().describe('页眉内容文本'),
    alignment: z.enum(['left', 'center', 'right', 'both']).optional().describe('页眉对齐方式：left(左对齐)、center(居中)、right(右对齐)、both(两端对齐)'),
  }).optional().describe('默认页眉配置（应用于所有页或奇数页）'),
  footer: z.object({
    content: z.string().optional().describe('页脚内容文本（页码前的文字，如"第 "）'),
    showPageNumber: z.boolean().optional().describe('是否显示当前页码。设为true时会在页脚显示页码'),
    pageNumberFormat: z.string().optional().describe('页码后缀文本（紧跟页码后的文字，如" 页"）。示例：content="第 " + 页码 + pageNumberFormat=" 页" = "第 1 页"'),
    showTotalPages: z.boolean().optional().describe('是否显示总页数。设为true时会显示文档总页数'),
    totalPagesFormat: z.string().optional().describe('总页数前的连接文本（如" / 共 "、" of "）。示例：完整格式为"第 1 页 / 共 5 页"'),
    alignment: z.enum(['left', 'center', 'right', 'both']).optional().describe('页脚对齐方式'),
  }).optional().describe('默认页脚配置（应用于所有页或奇数页）。支持灵活的页码格式组合'),
  firstPageHeader: z.object({
    content: z.string().optional().describe('首页页眉内容'),
    alignment: z.enum(['left', 'center', 'right', 'both']).optional().describe('首页页眉对齐方式'),
  }).optional().describe('首页专用页眉（需设置differentFirstPage为true）。常用于封面页不显示页眉或显示特殊内容'),
  firstPageFooter: z.object({
    content: z.string().optional().describe('首页页脚内容'),
    showPageNumber: z.boolean().optional().describe('首页是否显示页码'),
    pageNumberFormat: z.string().optional().describe('首页页码格式'),
    showTotalPages: z.boolean().optional().describe('首页是否显示总页数'),
    totalPagesFormat: z.string().optional().describe('首页总页数格式'),
    alignment: z.enum(['left', 'center', 'right', 'both']).optional().describe('首页页脚对齐'),
  }).optional().describe('首页专用页脚（需设置differentFirstPage为true）。常用于封面页不显示页码'),
  evenPageHeader: z.object({
    content: z.string().optional().describe('偶数页页眉内容'),
    alignment: z.enum(['left', 'center', 'right', 'both']).optional().describe('偶数页页眉对齐'),
  }).optional().describe('偶数页专用页眉（需设置differentOddEven为true）。用于双面打印时奇偶页显示不同内容'),
  evenPageFooter: z.object({
    content: z.string().optional().describe('偶数页页脚内容'),
    showPageNumber: z.boolean().optional().describe('偶数页是否显示页码'),
    pageNumberFormat: z.string().optional().describe('偶数页页码格式'),
    showTotalPages: z.boolean().optional().describe('偶数页是否显示总页数'),
    totalPagesFormat: z.string().optional().describe('偶数页总页数格式'),
    alignment: z.enum(['left', 'center', 'right', 'both']).optional().describe('偶数页页脚对齐'),
  }).optional().describe('偶数页专用页脚（需设置differentOddEven为true）'),
  differentFirstPage: z.boolean().optional().describe('是否首页不同。设为true时首页使用firstPageHeader和firstPageFooter，常用于封面页'),
  differentOddEven: z.boolean().optional().describe('是否奇偶页不同。设为true时偶数页使用evenPageHeader和evenPageFooter，用于双面打印'),
  pageNumberStart: z.number().optional().describe('页码起始编号。默认为1，可设置为其他数字如5表示从第5页开始编号'),
  pageNumberFormatType: z.enum(['decimal', 'upperRoman', 'lowerRoman', 'upperLetter', 'lowerLetter']).optional().describe('页码数字格式：decimal(阿拉伯数字1,2,3)、upperRoman(大写罗马I,II,III)、lowerRoman(小写罗马i,ii,iii)、upperLetter(大写字母A,B,C)、lowerLetter(小写字母a,b,c)'),
}).optional().describe('页眉页脚配置。支持显示页码、总页数、不同首页、奇偶页不同等功能。页码格式可灵活组合，如"第 1 页 / 共 5 页"、"Page 1 of 5"等');

// 表格样式配置 Schema
const TableStylesSchema = z.object({
  default: z.object({
    columnWidths: z.array(z.number()).optional().describe('列宽数组（缇）'),
    cellAlignment: z.object({
      horizontal: z.enum(['left', 'center', 'right']).optional().describe('水平对齐'),
      vertical: z.enum(['top', 'center', 'bottom']).optional().describe('垂直对齐'),
    }).optional(),
    stripedRows: z.object({
      enabled: z.boolean().optional().describe('是否启用斑马纹'),
      oddRowShading: z.string().regex(/^[0-9A-Fa-f]{6}$/).optional().describe('奇数行背景色'),
      evenRowShading: z.string().regex(/^[0-9A-Fa-f]{6}$/).optional().describe('偶数行背景色'),
    }).optional(),
  }).optional(),
}).optional();

// 图片样式配置 Schema
const ImageStylesSchema = z.object({
  default: z.object({
    maxWidth: z.number().optional().describe('最大宽度（缇）'),
    maxHeight: z.number().optional().describe('最大高度（缇）'),
    maintainAspectRatio: z.boolean().optional().describe('保持宽高比'),
    alignment: z.enum(['left', 'center', 'right']).optional().describe('对齐方式'),
    border: z.object({
      color: z.string().regex(/^[0-9A-Fa-f]{6}$/).optional().describe('边框颜色'),
      width: z.number().optional().describe('边框宽度'),
      style: z.enum(['single', 'double', 'dotted', 'dashed']).optional().describe('边框样式'),
    }).optional(),
  }).optional(),
}).optional();

// 样式配置 Schema
const StyleConfigSchema = z.object({
  theme: ThemeSchema,
  watermark: WatermarkSchema,
  tableOfContents: TableOfContentsSchema,
  headerFooter: HeaderFooterSchema,
  tableStyles: TableStylesSchema,
  imageStyles: ImageStylesSchema,
  document: z.object({
    defaultFont: z.string().optional().describe('默认字体'),
    defaultSize: z.number().optional().describe('默认字号（半点）'),
  }).optional(),
  paragraphStyles: z.record(z.any()).optional().describe('段落样式配置'),
  headingStyles: z.record(z.any()).optional().describe('标题样式配置'),
}).optional();

// 模板配置 Schema
const TemplateSchema = z.object({
  type: z.enum(['preset']).describe('模板类型：preset=预设模板'),
  presetId: z.string().describe('预设模板ID。可选值：academic（学术论文）、business（商务报告）、customer-analysis（客户分析-默认）、technical（技术文档）、minimal（极简风格）、enhanced-features（增强功能示例）'),
}).optional().describe('模板配置。使用预设模板可以快速应用专业样式，也可以与styleConfig组合使用');

// 工具输入 Schema
const MarkdownToDocxInputSchema = z.object({
  markdown: z.string().optional().describe('Markdown格式的文本内容（与inputPath二选一）'),
  inputPath: z.string().optional().describe('Markdown文件路径（与markdown二选一）'),
  filename: z.string().regex(/\.docx$/).describe('输出的Word文档文件名，必须以.docx结尾'),
  outputPath: z.string().optional().describe('输出目录，默认为当前工作目录'),
  template: TemplateSchema,
  styleConfig: StyleConfigSchema.describe('样式配置对象。支持主题系统（theme）、水印（watermark）、页眉页脚（headerFooter）、自动目录（tableOfContents）、表格样式（tableStyles）、图片样式（imageStyles）等。可与template组合使用以覆盖模板的默认样式'),
});

// 工具输出 Schema
const MarkdownToDocxOutputSchema = z.object({
  success: z.boolean(),
  filename: z.string(),
  path: z.string().optional(),
  size: z.number(),
  message: z.string().optional(),
  content: z.array(z.number()).optional(), // Add binary content support for worker
  url: z.string().optional(),
});

interface FileSystemHandler {
  readFile: (path: string, encoding: string) => Promise<string>;
  writeFile: (path: string, content: any) => Promise<void>;
  mkdir: (path: string, options?: any) => Promise<void>;
  resolvePath: (...paths: string[]) => string;
  dirname: (path: string) => string;
  cwd: () => string;
}

export interface CloudStorageHandler {
  upload: (filename: string, content: Uint8Array, contentType: string) => Promise<string>; // Returns public URL or key
  baseUrl?: string;
}

interface McpServerOptions {
  name: string;
  version: string;
  ConverterClass: any;
  fileSystem?: FileSystemHandler;
  cloudStorage?: CloudStorageHandler;
}

export function createMcpServer(options: McpServerOptions) {
  const server = new McpServer(
    {
      name: options.name,
      version: options.version,
    },
    {
      debouncedNotificationMethods: [
        'notifications/tools/list_changed',
        'notifications/resources/list_changed',
        'notifications/prompts/list_changed',
      ],
    }
  );

  // ==================== 工具注册 ====================

  server.registerTool(
    'markdown_to_docx',
    {
      title: 'Markdown 转 Word',
      description: '将Markdown文档转换为Word文档（DOCX格式），支持样式配置、模板系统和多种图像嵌入方式（本地文件、网络图片、Base64编码）',
      inputSchema: MarkdownToDocxInputSchema.shape,
      outputSchema: MarkdownToDocxOutputSchema.shape,
    },
    async (args) => {
      try {
        if (!args.markdown && !args.inputPath) {
          throw new Error('必须提供 markdown 或 inputPath 参数');
        }

        let markdownContent: string;
        let baseDir: string | undefined;

        if (args.inputPath) {
          if (!options.fileSystem) {
            throw new Error('在当前环境中（如Cloudflare Workers）不支持读取本地文件 inputPath。请直接使用 markdown 参数传递内容。');
          }
          markdownContent = await options.fileSystem.readFile(args.inputPath, 'utf-8');
          baseDir = options.fileSystem.dirname(options.fileSystem.resolvePath(args.inputPath));
        } else {
          markdownContent = args.markdown!;
          if (options.fileSystem) {
            baseDir = options.fileSystem.cwd();
          } else {
            // Worker environment - usually no baseDir unless provided by other means, but converter handles undefined
            baseDir = undefined;
          }
        }

        let finalStyleConfig = args.styleConfig;

        if (!args.template && !args.styleConfig) {
          const defaultTemplate = presetTemplateLoader.getDefaultTemplate();
          if (defaultTemplate) {
            finalStyleConfig = defaultTemplate.styleConfig as any;
          }
        }

        if (args.template?.type === 'preset' && args.template.presetId) {
          const presetTemplate = presetTemplateLoader.getPresetTemplate(args.template.presetId);
          if (presetTemplate) {
            const templateStyleConfig = presetTemplate.styleConfig;
            if (finalStyleConfig) {
              const { styleEngine } = await import('./utils/styleEngine.js');
              finalStyleConfig = styleEngine.mergeStyleConfigs(templateStyleConfig as any, finalStyleConfig as any) as any;
            } else {
              finalStyleConfig = templateStyleConfig as any;
            }
          } else {
            throw new Error(`预设模板 "${args.template.presetId}" 不存在`);
          }
        }

        const converter = new options.ConverterClass(finalStyleConfig as any, baseDir);
        // Note: verify converter.convert returns Uint8Array or Buffer?
        // DocxMarkdownConverter (node) usually returns Buffer.
        // DocxMarkdownConverterWorker usually returns Uint8Array.
        // We'll treat as generic ArrayBufferLike or Uint8Array.
        const docxContent = await converter.convert(markdownContent);

        const output: any = {
          success: true,
          filename: args.filename,
          size: docxContent.length || docxContent.byteLength,
          message: '文档转换成功！',
        };

        let messageText = `✅ ${output.message}\n\n📄 文件名: ${output.filename}`;

        if (options.fileSystem) {
          const outputPath = args.outputPath || options.fileSystem.cwd();
          await options.fileSystem.mkdir(outputPath, { recursive: true });
          const fullPath = options.fileSystem.resolvePath(outputPath, args.filename);
          await options.fileSystem.writeFile(fullPath, docxContent);
          output.path = fullPath;
          messageText += `\n📁 保存路径: ${output.path}`;
        } else if (options.cloudStorage) {
          // Upload to cloud storage
          const url = await options.cloudStorage.upload(args.filename, new Uint8Array(docxContent), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
          output.url = url;
          output.filename = args.filename;
          // We can still return content if expected, but URL is better for large files
          // For now, let's NOT return content bytes to keep response small if URL is available, 
          // UNLESS user specifically requested bytes? The schema allows content.
          // Let's return content as well for backward compat or if client needs it immediately, 
          // but normally URL is enough.
          // However, keeping previous behavior of returning content in "else" block (which was for worker without FS)
          // might be safer to keep both?
          // Let's decide: If cloudStorage, give URL.
          messageText += `\n🔗 下载链接: ${url}`;
        } else {
          // For worker without FS or Cloud Storage, we return content for client to handle
          output.content = Array.from(new Uint8Array(docxContent));
          messageText += `\n(文件内容已包含在响应中)`;
        }

        messageText += `\n💾 文件大小: ${output.size} 字节`;

        return {
          content: [
            {
              type: 'text',
              text: messageText,
            },
          ],
          structuredContent: output,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '未知错误';
        return {
          content: [
            {
              type: 'text',
              text: `❌ 转换失败: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.registerTool(
    'create_table_from_csv',
    {
      title: '从CSV创建表格',
      description: '将CSV数据转换为可用于文档的表格数据',
      inputSchema: {
        csvData: z.string().describe('CSV格式的数据'),
        hasHeader: z.boolean().optional().default(true).describe('第一行是否为表头'),
        delimiter: z.string().optional().default(',').describe('分隔符'),
        styleName: z.string().optional().default('minimal').describe('表格样式名称'),
      },
      outputSchema: {
        success: z.boolean(),
        rowCount: z.number(),
        columnCount: z.number(),
        styleName: z.string(),
        preview: z.string(),
      },
    },
    async ({ csvData, hasHeader = true, delimiter = ',', styleName = 'minimal' }) => {
      try {
        const tableData = TableProcessor.fromCSV(csvData, { hasHeader, delimiter, styleName });
        const validation = TableProcessor.validate(tableData);

        if (!validation.valid) {
          throw new Error(`表格数据验证失败: ${validation.errors.join(', ')}`);
        }

        const rowCount = tableData.rows.length;
        const columnCount = tableData.rows[0]?.length || 0;
        const preview = tableData.rows.slice(0, 3).map((row) =>
          `${tableData.rows.indexOf(row) + 1}. ${row.map(cell => cell.content).join(' | ')}`
        ).join('\n');

        const output = {
          success: true,
          rowCount,
          columnCount,
          styleName: typeof tableData.style === 'string' ? tableData.style : 'custom',
          preview: preview || '空表格'
        };

        return {
          content: [
            {
              type: 'text',
              text: `✅ CSV表格创建成功！\n\n📊 行数: ${rowCount}\n📊 列数: ${columnCount}\n🎨 样式: ${output.styleName}\n\n📝 预览（前3行）:\n${output.preview}`,
            },
          ],
          structuredContent: output,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '未知错误';
        return {
          content: [
            {
              type: 'text',
              text: `❌ CSV表格创建失败: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.registerTool(
    'create_table_from_json',
    {
      title: '从JSON创建表格',
      description: '将JSON数组数据转换为可用于文档的表格数据',
      inputSchema: {
        jsonData: z.string().describe('JSON格式的数据（数组）'),
        columns: z.array(z.string()).optional().describe('要包含的列名（可选，默认全部）'),
        styleName: z.string().optional().default('minimal').describe('表格样式名称'),
      },
      outputSchema: {
        success: z.boolean(),
        rowCount: z.number(),
        columnCount: z.number(),
        styleName: z.string(),
        preview: z.string(),
      },
    },
    async ({ jsonData, columns, styleName = 'minimal' }) => {
      try {
        const tableData = TableProcessor.fromJSON(jsonData, { columns, styleName });
        const validation = TableProcessor.validate(tableData);

        if (!validation.valid) {
          throw new Error(`表格数据验证失败: ${validation.errors.join(', ')}`);
        }

        const rowCount = tableData.rows.length;
        const columnCount = tableData.rows[0]?.length || 0;
        const preview = tableData.rows.slice(0, 3).map((row) =>
          `${tableData.rows.indexOf(row) + 1}. ${row.map(cell => cell.content).join(' | ')}`
        ).join('\n');

        const output = {
          success: true,
          rowCount,
          columnCount,
          styleName: typeof tableData.style === 'string' ? tableData.style : 'custom',
          preview: preview || '空表格'
        };

        return {
          content: [
            {
              type: 'text',
              text: `✅ JSON表格创建成功！\n\n📊 行数: ${rowCount}\n📊 列数: ${columnCount}\n🎨 样式: ${output.styleName}\n\n📝 预览（前3行）:\n${output.preview}`,
            },
          ],
          structuredContent: output,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '未知错误';
        return {
          content: [
            {
              type: 'text',
              text: `❌ JSON表格创建失败: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.registerTool(
    'list_table_styles',
    {
      title: '列出表格样式',
      description: '获取所有可用的预定义表格样式',
      inputSchema: {},
      outputSchema: {
        styles: z.array(z.object({
          name: z.string(),
          description: z.string(),
        })),
        count: z.number(),
      },
    },
    async () => {
      try {
        const styles = TableProcessor.listPresetStyles();
        const output = {
          styles,
          count: styles.length,
        };

        const styleList = styles.map(s => `• **${s.name}**: ${s.description}`).join('\n');

        return {
          content: [
            {
              type: 'text',
              text: `📋 可用表格样式（共${output.count}种）:\n\n${styleList}\n\n💡 在创建表格时使用 styleName 参数指定样式`,
            },
          ],
          structuredContent: output,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '未知错误';
        return {
          content: [
            {
              type: 'text',
              text: `❌ 获取表格样式失败: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // ==================== 资源注册 ====================

  server.registerResource(
    'templates-list',
    'templates://list',
    {
      title: '模板列表',
      description: '所有可用的预设模板',
      mimeType: 'text/markdown',
    },
    async (uri) => {
      const templates = presetTemplateLoader.getTemplateList();
      const templateInfo = templates
        .map(
          (t) =>
            `- **${t.id}**: ${t.name}${t.isDefault ? ' ⭐ (默认)' : ''}\n  分类: ${t.category}\n  描述: ${t.description}`
        )
        .join('\n\n');

      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'text/markdown',
            text: `# 可用模板列表\n\n${templateInfo}\n\n## 使用方法\n\n在 template 参数中指定：\n\`\`\`json\n{\n  "type": "preset",\n  "presetId": "模板ID"\n}\n\`\`\``,
          },
        ],
      };
    }
  );

  server.registerResource(
    'templates-default',
    'templates://default',
    {
      title: '默认模板',
      description: '默认的客户分析模板信息',
      mimeType: 'text/markdown',
    },
    async (uri) => {
      const defaultTemplate = presetTemplateLoader.getDefaultTemplate();
      const defaultId = presetTemplateLoader.getDefaultTemplateId();

      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'text/markdown',
            text: `# 默认模板\n\nID: ${defaultId}\n名称: ${defaultTemplate?.name}\n分类: ${defaultTemplate?.category}\n描述: ${defaultTemplate?.description}\n\n特点：\n- 正文首行缩进2个字符\n- 黑色文本，宋体字体\n- 符合中文文档规范`,
          },
        ],
      };
    }
  );

  server.registerResource(
    'template-details',
    new ResourceTemplate('templates://{templateId}', { list: undefined }),
    {
      title: '模板详情',
      description: '查看特定模板的详细配置',
      mimeType: 'application/json',
    },
    async (uri, { templateId }) => {
      const template = presetTemplateLoader.getPresetTemplate(templateId as string);

      if (!template) {
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: 'text/plain',
              text: `模板 "${templateId}" 不存在`,
            },
          ],
        };
      }

      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'application/json',
            text: JSON.stringify(template, null, 2),
          },
        ],
      };
    }
  );

  server.registerResource(
    'style-guide',
    'style-guide://complete',
    {
      title: '样式配置指南',
      description: '完整的样式配置文档',
      mimeType: 'text/markdown',
    },
    async (uri) => {
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'text/markdown',
            text: `# Markdown转Word样式配置指南\n\n## 单位换算\n- **缇（Twip）**: 1/1440英寸 = 1/20点，用于间距和边距\n- **半点**: 字号单位，24半点 = 12pt\n- **示例**: 2个字符缩进 = 480缇，1英寸边距 = 1440缇\n\n## 常用颜色（6位十六进制）\n- \`000000\` - 纯黑色\n- \`333333\` - 深灰色\n- \`666666\` - 中灰色\n- \`2E74B5\` - 专业蓝色`,
          },
        ],
      };
    }
  );

  server.registerResource(
    'converters-supported-formats',
    'converters://supported_formats',
    {
      title: '支持的格式',
      description: '支持的输入和输出格式列表',
      mimeType: 'application/json',
    },
    async (uri) => {
      const formats = {
        input: {
          markdown: {
            name: 'Markdown',
            extensions: ['.md', '.markdown'],
            mimeType: 'text/markdown',
            features: ['标题', '段落', '列表', '表格', '代码块', '图片', '链接', '强调']
          }
        },
        output: {
          docx: {
            name: 'Microsoft Word',
            extension: '.docx',
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            features: ['完整样式', '主题系统', '水印', '页眉页脚', '目录', '表格', '图片']
          }
        }
      };
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'application/json',
            text: JSON.stringify(formats, null, 2),
          },
        ],
      };
    }
  );

  // ==================== 提示注册 ====================
  // (Simplified prompts registry)

  server.registerPrompt(
    'markdown_to_docx_help',
    {
      title: '使用帮助',
      description: '获取Markdown转Word服务的使用帮助',
    },
    () => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: '查看完整使用指南请访问 README.md 或使用 style-guide://complete 资源',
          },
        },
      ],
    })
  );

  return server;
}
