
// 为Cloudflare Workers环境适配的MCP服务器
// 使用 shared McpServer 和 CloudflareWorkerTransport
import { createMcpServer } from './mcp-server.js';
import { CloudflareWorkerTransport } from './utils/cloudflare-transport.js';
import { DocxMarkdownConverterWorker } from './converter/markdown-worker.js';
import { z } from 'zod';

// 定义Cloudflare Workers需要的类型
interface ExecutionContext {
  waitUntil(promise: Promise<any>): void;
  passThroughOnException(): void;
}

export interface Env {
  BUCKET: any;
}

// 定义直接API的输入Schema
const DirectApiSchema = z.object({
  markdown: z.string().describe('Markdown格式的文本内容'),
  filename: z.string().regex(/\.docx$/).describe('输出的Word文档文件名，必须以.docx结尾'),
  template: z.object({
    type: z.enum(['preset']),
    presetId: z.string()
  }).optional().describe('模板配置'),
  styleConfig: z.object({
    theme: z.object({
      name: z.string().optional(),
      colors: z.object({
        primary: z.string().regex(/^[0-9A-Fa-f]{6}$/).optional(),
        secondary: z.string().regex(/^[0-9A-Fa-f]{6}$/).optional(),
        text: z.string().regex(/^[0-9A-Fa-f]{6}$/).optional(),
      }).optional(),
    }).optional(),
    watermark: z.object({
      text: z.string(),
      font: z.string().optional(),
      size: z.number().min(1).max(200).optional(),
      color: z.string().regex(/^[0-9A-Fa-f]{6}$/).optional(),
      opacity: z.number().min(0).max(1).optional(),
      rotation: z.number().min(-90).max(90).optional(),
    }).optional(),
    tableOfContents: z.object({
      enabled: z.boolean().optional(),
      title: z.string().optional(),
      levels: z.array(z.number().min(1).max(6)).optional(),
      showPageNumbers: z.boolean().optional(),
      tabLeader: z.enum(['dot', 'hyphen', 'underscore', 'none']).optional(),
    }).optional(),
    headerFooter: z.object({
      header: z.object({
        content: z.string().optional(),
        alignment: z.enum(['left', 'center', 'right', 'both']).optional(),
      }).optional(),
      footer: z.object({
        content: z.string().optional(),
        showPageNumber: z.boolean().optional(),
        pageNumberFormat: z.string().optional(),
        showTotalPages: z.boolean().optional(),
        totalPagesFormat: z.string().optional(),
        alignment: z.enum(['left', 'center', 'right', 'both']).optional(),
      }).optional(),
      firstPageHeader: z.object({
        content: z.string().optional(),
        alignment: z.enum(['left', 'center', 'right', 'both']).optional(),
      }).optional(),
      firstPageFooter: z.object({
        content: z.string().optional(),
        showPageNumber: z.boolean().optional(),
        pageNumberFormat: z.string().optional(),
        showTotalPages: z.boolean().optional(),
        totalPagesFormat: z.string().optional(),
        alignment: z.enum(['left', 'center', 'right', 'both']).optional(),
      }).optional(),
      evenPageHeader: z.object({
        content: z.string().optional(),
        alignment: z.enum(['left', 'center', 'right', 'both']).optional(),
      }).optional(),
      evenPageFooter: z.object({
        content: z.string().optional(),
        showPageNumber: z.boolean().optional(),
        pageNumberFormat: z.string().optional(),
        showTotalPages: z.boolean().optional(),
        totalPagesFormat: z.string().optional(),
        alignment: z.enum(['left', 'center', 'right', 'both']).optional(),
      }).optional(),
      differentFirstPage: z.boolean().optional(),
      differentOddEven: z.boolean().optional(),
      pageNumberStart: z.number().optional(),
      pageNumberFormatType: z.enum(['decimal', 'upperRoman', 'lowerRoman', 'upperLetter', 'lowerLetter']).optional(),
    }).optional(),
    tableStyles: z.object({
      default: z.object({
        columnWidths: z.array(z.number()).optional(),
        cellAlignment: z.object({
          horizontal: z.enum(['left', 'center', 'right']).optional(),
          vertical: z.enum(['top', 'center', 'bottom']).optional(),
        }).optional(),
        stripedRows: z.object({
          enabled: z.boolean().optional(),
          oddRowShading: z.string().regex(/^[0-9A-Fa-f]{6}$/).optional(),
          evenRowShading: z.string().regex(/^[0-9A-Fa-f]{6}$/).optional(),
        }).optional(),
      }).optional(),
    }).optional(),
    imageStyles: z.object({
      default: z.object({
        maxWidth: z.number().optional(),
        maxHeight: z.number().optional(),
        maintainAspectRatio: z.boolean().optional(),
        alignment: z.enum(['left', 'center', 'right']).optional(),
        border: z.object({
          color: z.string().regex(/^[0-9A-Fa-f]{6}$/).optional(),
          width: z.number().optional(),
          style: z.enum(['single', 'double', 'dotted', 'dashed']).optional(),
        }).optional(),
      }).optional(),
    }).optional(),
    document: z.object({
      defaultFont: z.string().optional(),
      defaultSize: z.number().optional(),
    }).optional(),
  }).optional().describe('样式配置对象'),
});

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      const url = new URL(request.url);

      // 健康检查
      if (url.pathname === '/health') {
        return new Response(JSON.stringify({
          status: 'healthy',
          service: 'aigroup-mdtoword-mcp',
          version: '4.0.2',
          timestamp: new Date().toISOString(),
          environment: 'cloudflare-worker',
          features: ['mcp', 'http-api', 'docx-conversion', 'cloud-storage']
        }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
          },
        });
      }

      // 根路径信息
      if (url.pathname === '/') {
        return new Response(JSON.stringify({
          name: 'aigroup-mdtoword-mcp',
          version: '4.0.2',
          description: 'Markdown to Word conversion service with MCP protocol and HTTP API support (Cloudflare Worker)',
          endpoints: {
            mcp: '/mcp',
            convert: '/convert',
            health: '/health',
          },
          documentation: 'https://github.com/jackdark425/aigroup-mdtoword-mcp',
        }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
          },
        });
      }

      // 处理CORS预检请求
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, mcp-session-id, Authorization',
          },
        });
      }

      // 文件下载路由
      if (url.pathname.startsWith('/files/')) {
        const filename = url.pathname.slice(7); // remove '/files/'
        if (!filename) return new Response('Filename missing', { status: 400 });

        const object = await env.BUCKET.get(filename);
        if (!object) return new Response('File Not Found', { status: 404 });

        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set('etag', object.httpEtag);

        return new Response(object.body, { headers });
      }

      // MCP协议请求
      if (url.pathname === '/mcp') {
        // 检查请求方法
        if (request.method !== 'POST') {
          return new Response('Method Not Allowed', {
            status: 405,
            headers: { 'Allow': 'POST' }
          });
        }

        // 获取请求体
        const body = await request.json();

        // 创建Transport和Server
        // @ts-ignore - body type might rely on exact JSONRPC validation, transport handles it loosely initially
        const transport = new CloudflareWorkerTransport(body);

        const server = createMcpServer({
          name: 'aigroup-mdtoword-mcp',
          version: '4.0.2',
          ConverterClass: DocxMarkdownConverterWorker,
          // Worker environment doesn't support FS, so we don't pass fileSystem handler
          cloudStorage: {
            async upload(filename: string, content: Uint8Array, contentType: string) {
              // Ensure unique filename or overwrite?
              // For now, overwrite if same name, or maybe prefix with timestamp to ensure uniqueness?
              // Let's use the provided filename but maybe cleanup
              await env.BUCKET.put(filename, content, {
                httpMetadata: { contentType }
              });
              // Use the actual host from the request to ensure correct domain in URLs
              return `${request.headers.get('X-Forwarded-Proto') || 'https'}://${request.headers.get('Host') || url.host}/files/${filename}`;
            }
          }
        });

        // 连接 Transport
        await server.connect(transport);

        // 等待响应 (由 CloudflareWorkerTransport 捕获)
        const response = await transport.response;

        return new Response(JSON.stringify(response), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, mcp-session-id'
          },
        });
      }

      // 直接API端点 - 将请求转发给MCP服务器进行处理
      if (url.pathname === '/convert') {
        // 检查请求方法
        if (request.method !== 'POST') {
          return new Response('Method Not Allowed', {
            status: 405,
            headers: { 'Allow': 'POST' }
          });
        }

        try {
          // 解析请求体
          const inputData = await request.json();
          
          // 验证输入数据
          const parsedData = DirectApiSchema.parse(inputData);
          
          // 构造MCP协议请求
          const mcpRequest = {
            method: 'tools/call',
            jsonrpc: '2.0' as const,
            id: 'direct-api-request',
            params: {
              name: 'markdown_to_docx',
              arguments: {
                markdown: parsedData.markdown,
                filename: parsedData.filename,
                template: parsedData.template,
                styleConfig: parsedData.styleConfig
              }
            }
          };

          // 创建Transport和Server
          const transport = new CloudflareWorkerTransport(mcpRequest);

          const server = createMcpServer({
            name: 'aigroup-mdtoword-mcp',
            version: '4.0.2',
            ConverterClass: DocxMarkdownConverterWorker,
            // Worker environment doesn't support FS, so we don't pass fileSystem handler
            cloudStorage: {
              async upload(filename: string, content: Uint8Array, contentType: string) {
                await env.BUCKET.put(filename, content, {
                  httpMetadata: { contentType }
                });
                // Use the actual host from the request to ensure correct domain in URLs
                return `${request.headers.get('X-Forwarded-Proto') || 'https'}://${request.headers.get('Host') || url.host}/files/${filename}`;
              }
            }
          });

          // 连接 Transport
          await server.connect(transport);

          // 等待响应 (由 CloudflareWorkerTransport 捕获)
          const response = await transport.response;

          // 类型守卫来区分错误和成功响应
          if ('error' in response) {
            return new Response(JSON.stringify({
              success: false,
              error: response.error.message || 'Unknown error occurred'
            }), {
              status: 500,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
              },
            });
          } else if ('result' in response) {
            // 提取结果内容
            const result = response.result;
            const structuredContent = result?.structuredContent;

            // 类型断言以处理structuredContent的类型
            if (structuredContent && typeof structuredContent === 'object' && 'success' in structuredContent && structuredContent.success) {
              const contentObj = structuredContent as any;
              // 返回成功的直接API响应
              return new Response(JSON.stringify({
                success: true,
                filename: contentObj.filename,
                downloadUrl: contentObj.url,
                size: contentObj.size,
                message: contentObj.message
              }), {
                headers: {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*',
                  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
                  'Access-Control-Allow-Headers': 'Content-Type'
                },
              });
            } else {
              // 错误情况
              const errorContent = result?.content?.[0]?.text || 'Unknown error occurred';
              return new Response(JSON.stringify({
                success: false,
                error: errorContent
              }), {
                status: 500,
                headers: {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*',
                  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
                  'Access-Control-Allow-Headers': 'Content-Type'
                },
              });
            }
          } else {
            // 响应格式不符合预期
            return new Response(JSON.stringify({
              success: false,
              error: 'Unexpected response format'
            }), {
              status: 500,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
              },
            });
          }
        } catch (validationError) {
          // 输入验证失败
          return new Response(JSON.stringify({
            success: false,
            error: 'Invalid input data',
            details: validationError instanceof Error ? validationError.message : String(validationError)
          }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type'
            },
          });
        }
      }

      // OpenAPI规范端点
      if (url.pathname === '/openapi.yaml' || url.pathname === '/openapi.json') {
        if (url.pathname === '/openapi.yaml') {
          // 返回YAML格式的OpenAPI规范
          const yamlSpec = `openapi: 3.0.0
info:
 title: Markdown转Word转换器
 description: 将Markdown格式的文本转换为Word文档(DOCX格式)，支持丰富的样式配置选项。
 version: 4.0.2
servers:
 - url: ${url.origin}
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
             type: object
             required:
               - markdown
               - filename
             properties:
               markdown:
                 type: string
                 description: 要转换的Markdown格式文本内容
                 example: "# 标题\\n\\n这是一段内容。"
               filename:
                 type: string
                 description: 输出的Word文档文件名，必须以.docx结尾
                 pattern: ".*\\\\.docx$"
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
     responses:
       '200':
         description: 转换成功
         content:
           application/json:
             schema:
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
       '400':
         description: 请求参数错误
         content:
           application/json:
             schema:
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
       '500':
         description: 服务器内部错误
         content:
           application/json:
             schema:
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
     x-openai-isConsequential: false`;

          return new Response(yamlSpec, {
            headers: {
              'Content-Type': 'text/yaml',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type'
            },
          });
        } else {
          // 返回JSON格式的OpenAPI规范
          const jsonSpec = {
            openapi: '3.0.0',
            info: {
              title: 'Markdown转Word转换器',
              description: '将Markdown格式的文本转换为Word文档(DOCX格式)，支持丰富的样式配置选项。',
              version: '4.0.2'
            },
            servers: [
              { url: url.origin }
            ],
            paths: {
              '/convert': {
                post: {
                  summary: '转换Markdown为Word文档',
                  description: '将提供的Markdown内容转换为Word文档，并返回下载链接。',
                  operationId: 'convertMarkdownToWord',
                  requestBody: {
                    required: true,
                    content: {
                      'application/json': {
                        schema: {
                          type: 'object',
                          required: ['markdown', 'filename'],
                          properties: {
                            markdown: {
                              type: 'string',
                              description: '要转换的Markdown格式文本内容',
                              example: '# 标题\\n\\n这是一段内容。'
                            },
                            filename: {
                              type: 'string',
                              description: '输出的Word文档文件名，必须以.docx结尾',
                              pattern: '.*\\.docx$',
                              example: 'document.docx'
                            },
                            template: {
                              type: 'object',
                              description: '模板配置',
                              properties: {
                                type: {
                                  type: 'string',
                                  enum: ['preset'],
                                  description: '模板类型'
                                },
                                presetId: {
                                  type: 'string',
                                  description: '预设模板ID (如: academic, business, customer-analysis, technical, minimal, enhanced-features)'
                                }
                              },
                              example: {
                                type: 'preset',
                                presetId: 'customer-analysis'
                              }
                            },
                            styleConfig: {
                              type: 'object',
                              description: '样式配置对象',
                              properties: {
                                theme: {
                                  type: 'object',
                                  description: '主题配置',
                                  properties: {
                                    name: {
                                      type: 'string',
                                      description: '主题名称'
                                    },
                                    colors: {
                                      type: 'object',
                                      properties: {
                                        primary: {
                                          type: 'string',
                                          pattern: '^[0-9A-Fa-f]{6}$',
                                          description: '主色调（6位十六进制）'
                                        },
                                        secondary: {
                                          type: 'string',
                                          pattern: '^[0-9A-Fa-f]{6}$',
                                          description: '辅助色（6位十六进制）'
                                        },
                                        text: {
                                          type: 'string',
                                          pattern: '^[0-9A-Fa-f]{6}$',
                                          description: '文本颜色（6位十六进制）'
                                        }
                                      }
                                    }
                                  }
                                },
                                watermark: {
                                  type: 'object',
                                  description: '水印配置',
                                  properties: {
                                    text: {
                                      type: 'string',
                                      description: '水印文本'
                                    },
                                    font: {
                                      type: 'string',
                                      description: '水印字体'
                                    },
                                    size: {
                                      type: 'number',
                                      minimum: 1,
                                      maximum: 200,
                                      description: '水印字号'
                                    },
                                    color: {
                                      type: 'string',
                                      pattern: '^[0-9A-Fa-f]{6}$',
                                      description: '水印颜色（6位十六进制）'
                                    },
                                    opacity: {
                                      type: 'number',
                                      minimum: 0,
                                      maximum: 1,
                                      description: '透明度（0-1）'
                                    },
                                    rotation: {
                                      type: 'number',
                                      minimum: -90,
                                      maximum: 90,
                                      description: '旋转角度（-90到90）'
                                    }
                                  }
                                },
                                document: {
                                  type: 'object',
                                  description: '文档基本配置',
                                  properties: {
                                    defaultFont: {
                                      type: 'string',
                                      description: '默认字体',
                                      example: 'Arial'
                                    },
                                    defaultSize: {
                                      type: 'number',
                                      description: '默认字号（半点）',
                                      example: 24
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  },
                  responses: {
                    '200': {
                      description: '转换成功',
                      content: {
                        'application/json': {
                          schema: {
                            type: 'object',
                            properties: {
                              success: {
                                type: 'boolean',
                                description: '转换是否成功'
                              },
                              filename: {
                                type: 'string',
                                description: '生成的文件名'
                              },
                              downloadUrl: {
                                type: 'string',
                                description: '文档下载链接'
                              },
                              size: {
                                type: 'number',
                                description: '文件大小（字节）'
                              },
                              message: {
                                type: 'string',
                                description: '操作消息'
                              }
                            },
                            required: ['success', 'filename', 'downloadUrl', 'size', 'message']
                          }
                        }
                      }
                    },
                    '400': {
                      description: '请求参数错误',
                      content: {
                        'application/json': {
                          schema: {
                            type: 'object',
                            properties: {
                              success: {
                                type: 'boolean',
                                description: '操作是否成功'
                              },
                              error: {
                                type: 'string',
                                description: '错误信息'
                              }
                            },
                            required: ['success', 'error']
                          }
                        }
                      }
                    },
                    '500': {
                      description: '服务器内部错误',
                      content: {
                        'application/json': {
                          schema: {
                            type: 'object',
                            properties: {
                              success: {
                                type: 'boolean',
                                description: '操作是否成功'
                              },
                              error: {
                                type: 'string',
                                description: '错误信息'
                              }
                            },
                            required: ['success', 'error']
                          }
                        }
                      }
                    }
                  },
                  'x-openai-isConsequential': false
                }
              }
            }
          };

          return new Response(JSON.stringify(jsonSpec), {
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type'
            },
          });
        }
      }

      // OpenAI插件清单端点
      if (url.pathname === '/.well-known/ai-plugin.json') {
        const pluginManifest = {
          schema_version: 'v1',
          name_for_model: 'markdown_to_word_converter',
          name_for_human: 'Markdown转Word转换器',
          description_for_model: '将Markdown格式的文本转换为Word文档(DOCX格式)，支持丰富的样式配置选项。',
          description_for_human: '将Markdown文档转换为专业的Word文档。',
          auth: {
            type: 'none'
          },
          api: {
            type: 'openapi',
            url: `${url.origin}/openapi.yaml`,
            has_user_authentication: false
          },
          logo_url: `${url.origin}/logo.png`,
          contact_email: 'support@example.com',
          legal_info_url: 'https://example.com/legal'
        };

        return new Response(JSON.stringify(pluginManifest), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
          },
        });
      }

      // Logo端点 - 返回一个简单的SVG logo
      if (url.pathname === '/logo.png') {
        // 实际上返回一个SVG，但设置为PNG MIME类型以简化
        const svgLogo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
          <rect width="100" height="100" fill="#3498db"/>
          <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="16" fill="white">MD→DOCX</text>
        </svg>`;

        return new Response(svgLogo, {
          headers: {
            'Content-Type': 'image/svg+xml',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=3600'
          },
        });
      }

      // 未知路径
      return new Response('Not Found', {
        status: 404,
        headers: { 'Content-Type': 'text/plain' }
      });
    } catch (error) {
      console.error('Worker错误:', error);
      return new Response(JSON.stringify({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : String(error),
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
      });
    }
  },
};