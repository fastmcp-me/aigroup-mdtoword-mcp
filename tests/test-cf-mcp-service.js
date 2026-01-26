/**
 * 测试部署的Cloudflare MCP服务功能
 */
import fetch from 'node-fetch';

async function testCFMCPService() {
  console.log('🧪 开始测试部署的Cloudflare MCP服务功能...\n');

  const baseUrl = 'https://aigroup-mdtoword-mcp.jackdark425.workers.dev';
  console.log(`测试端点: ${baseUrl}\n`);

  // 1. 测试健康检查
  console.log('1. 测试健康检查端点...');
  try {
    const healthResponse = await fetch(`${baseUrl}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ 健康检查响应:', healthData);
  } catch (error) {
    console.log('❌ 健康检查测试失败:', error.message);
  }

  console.log('');

  // 2. 测试MCP协议端点 - 获取工具列表
  console.log('2. 测试MCP工具列表...');
  try {
    const mcpResponse = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/list',
        id: 1
      })
    });
    const mcpData = await mcpResponse.json();
    console.log('✅ MCP工具列表响应成功');
    if (mcpData.result && mcpData.result.tools) {
      console.log(`   发现 ${mcpData.result.tools.length} 个工具:`);
      mcpData.result.tools.forEach(tool => {
        console.log(`   - ${tool.name}: ${tool.title}`);
      });
    }
  } catch (error) {
    console.log('❌ MCP工具列表测试失败:', error.message);
  }

  console.log('');

  // 3. 测试核心Markdown转Word功能
  console.log('3. 测试Markdown转Word核心功能...');
  try {
    const testMarkdown = `# MCP服务测试文档

## 功能测试
这是一份通过Cloudflare Worker MCP服务生成的测试文档。

### 特性验证
- **基础文本格式**: 普通文本、**粗体**、*斜体*
- 无序列表测试
- 有序列表测试

### 代码块示例
\`\`\`javascript
console.log('Hello, MCP Service!');
\`\`\`

### 表格测试
| 列1 | 列2 | 列3 |
|-----|-----|-----|
| 数据1 | 数据2 | 数据3 |
| 数据4 | 数据5 | 数据6 |

### 结论
此文档通过Cloudflare Worker上的MCP服务成功生成，验证了服务的核心功能。`;

    const mcpResponse = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'markdown_to_docx',
          arguments: {
            markdown: testMarkdown,
            filename: 'mcp-service-test.docx',
            styleConfig: {
              document: {
                defaultFont: 'Arial',
                defaultSize: 24
              }
            }
          }
        },
        id: 2
      })
    });
    
    const result = await mcpResponse.json();
    console.log('✅ Markdown转Word功能测试响应:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.log('❌ Markdown转Word功能测试失败:', error.message);
  }

  console.log('\n🎉 Cloudflare MCP服务功能测试完成！');
}

// 运行测试
testCFMCPService().catch(console.error);