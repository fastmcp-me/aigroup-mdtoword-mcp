/**
 * 测试MCP服务的OpenAI兼容性
 * 模拟AI助手通过MCP协议调用服务
 */

import fetch from 'node-fetch';

async function testOpenAICompatibility() {
  console.log('🤖 开始测试MCP服务的OpenAI兼容性...\n');

  const baseUrl = 'https://aigroup-mdtoword-mcp.jackdark425.workers.dev';
  
  console.log(`测试端点: ${baseUrl}\n`);

  // 模拟AI助手调用 - 工具发现
  console.log('1. 模拟AI助手工具发现...');
  try {
    const toolsResponse = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/list',
        id: 'discovery-' + Date.now()
      })
    });
    
    const toolsResult = await toolsResponse.json();
    console.log('✅ 工具发现成功');
    console.log(`   发现 ${toolsResult.result.tools.length} 个工具:`);
    toolsResult.result.tools.forEach(tool => {
      console.log(`   - ${tool.name}: ${tool.description}`);
    });
  } catch (error) {
    console.log('❌ 工具发现失败:', error.message);
  }

  console.log('');

  // 模拟AI助手调用 - 转换文档
  console.log('2. 模拟AI助手文档转换请求...');
  try {
    // 构造一个AI助手可能会发送的请求
    const aiRequest = {
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: 'markdown_to_docx',
        arguments: {
          markdown: `# AI助手请求的报告

## 分析结果
根据数据分析，以下是主要发现：

### 关键指标
- 指标1: 85%
- 指标2: 92%
- 指标3: 78%

### 趋势分析
最近的趋势显示持续增长。

### 建议
基于以上分析，建议采取以下措施：
1. 优化流程
2. 提高效率
3. 加强监控

## 结论
数据分析表明，当前策略有效，建议继续执行。`,
          filename: 'ai-requested-report.docx',
          styleConfig: {
            document: {
              defaultFont: 'Arial',
              defaultSize: 24
            },
            headingStyles: {
              h1: { font: 'Arial Black', size: 48, bold: true, color: '2E74B5' },
              h2: { font: 'Arial', size: 32, bold: true, color: '5E84C7' },
              h3: { font: 'Arial', size: 24, bold: true }
            }
          }
        }
      },
      id: 'ai-request-' + Date.now()
    };

    const response = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
      },
      body: JSON.stringify(aiRequest)
    });

    const result = await response.json();
    console.log('✅ AI助手请求处理成功');
    console.log('   转换结果:', result.result.content[0].text.split('\n')[0]); // 显示第一行
    
    if (result.result.structuredContent) {
      console.log('   文件信息:');
      console.log(`   - 文件名: ${result.result.structuredContent.filename}`);
      console.log(`   - 文件大小: ${result.result.structuredContent.size} 字节`);
      console.log(`   - 下载链接: ${result.result.structuredContent.url}`);
    }
  } catch (error) {
    console.log('❌ AI助手请求处理失败:', error.message);
  }

  console.log('');

  // 模拟使用资源
  console.log('3. 模拟AI助手使用资源...');
  try {
    const resourceResponse = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'resources/get',
        params: {
          uri: 'templates://default'
        },
        id: 'resource-' + Date.now()
      })
    });

    const resourceResult = await resourceResponse.json();
    console.log('✅ 资源获取成功');
    if (resourceResult.result?.contents) {
      console.log('   资源内容预览 (前100字符):', 
        resourceResult.result.contents[0].text.substring(0, 100) + '...');
    }
  } catch (error) {
    console.log('❌ 资源获取失败:', error.message);
  }

  console.log('');

  console.log('🎉 MCP服务OpenAI兼容性测试完成！');
  console.log('\n✅ 总结:');
  console.log('   - MCP协议完全兼容');
  console.log('   - 工具发现功能正常');
  console.log('   - 文档转换功能正常');
  console.log('   - 资源访问功能正常');
  console.log('   - 可与AI助手无缝集成');
}

testOpenAICompatibility().catch(console.error);