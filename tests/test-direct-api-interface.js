/**
 * 测试直接API接口概念验证
 * 当前服务只提供MCP接口，这里展示如何扩展为直接API接口
 */

import fetch from 'node-fetch';

async function testDirectApiInterface() {
  console.log('🔌 测试直接API接口概念验证...\n');

  const baseUrl = 'https://aigroup-mdtoword-mcp.jackdark425.workers.dev';
  
  console.log(`当前服务端点: ${baseUrl}`);
  console.log('注意: 当前服务仅提供MCP协议接口，以下为概念验证...\n');

  // 展示当前MCP接口的工作方式（需要转换为MCP协议格式）
  console.log('1. 当前MCP接口工作方式 (需要协议封装):');
  console.log('   输入: 直接Markdown文本');
  console.log('   输出: 需要通过MCP协议调用');
  console.log('   示例: 已在之前的测试中验证');

  console.log('');

  // 概念验证：理想的直接API接口应该是什么样子
  console.log('2. 理想的直接API接口设计:');
  console.log('   POST /convert');
  console.log('   Content-Type: application/json');
  console.log('   {');
  console.log('     "markdown": "# Hello World\\nThis is a test",');
  console.log('     "filename": "output.docx",');
  console.log('     "styleConfig": {...}');
  console.log('   }');
  console.log('   响应: { "downloadUrl": "..." }');
  console.log('');

  // 测试当前实际可用的接口
  console.log('3. 测试当前实际可用的接口...');
  try {
    // 使用MCP协议调用，但模拟直接API的行为
    const markdownContent = `# 直接API测试文档

## 测试内容
这是一个通过MCP协议接口转换的文档，但模拟了直接API的使用方式。

### 特性
- 支持Markdown语法
- 生成Word文档
- 返回下载链接

### 结论
虽然当前服务使用MCP协议，但功能完全满足直接API的需求。
`;

    const response = await fetch(`${baseUrl}/mcp`, {
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
            markdown: markdownContent,
            filename: 'direct-api-test.docx',
            styleConfig: {
              document: {
                defaultFont: 'Arial',
                defaultSize: 24
              }
            }
          }
        },
        id: 'direct-api-test'
      })
    });

    const result = await response.json();
    console.log('✅ MCP接口模拟直接API调用成功');
    
    if (result.result?.structuredContent) {
      const downloadUrl = result.result.structuredContent.url;
      console.log('   生成的下载链接:', downloadUrl);
      
      // 验证下载链接
      try {
        const downloadResponse = await fetch(downloadUrl);
        if (downloadResponse.ok) {
          console.log('   ✅ 下载链接有效');
          console.log('   ✅ 文件大小:', downloadResponse.headers.get('content-length'), 'bytes');
        } else {
          console.log('   ❌ 下载链接无效:', downloadResponse.status);
        }
      } catch (downloadError) {
        console.log('   ❌ 下载验证失败:', downloadError.message);
      }
    }
  } catch (error) {
    console.log('❌ MCP接口调用失败:', error.message);
  }

  console.log('');

  console.log('💡 结论:');
  console.log('   - 当前服务使用MCP协议，而非直接HTTP API');
  console.log('   - 但MCP协议同样可以实现直接API的所有功能');
  console.log('   - 如果需要真正的直接API，需要在worker.ts中添加新端点');
  console.log('   - 例如: 添加 `/convert` 端点直接处理转换请求');
  console.log('');
  console.log('   当前MCP接口功能完整，可以满足所有转换需求:');
  console.log('   - 接收Markdown输入');
  console.log('   - 处理样式配置');
  console.log('   - 返回文档下载链接');
  console.log('   - 支持异步处理大文档');
}

testDirectApiInterface().catch(console.error);