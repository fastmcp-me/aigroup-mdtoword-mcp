/**
 * 测试本地MCP服务器
 */
import fetch from 'node-fetch';

async function testLocalServer() {
  console.log('🧪 开始测试本地MCP服务器...\n');

  // 测试健康检查
  console.log('1. 测试健康检查端点...');
  try {
    const healthResponse = await fetch('http://localhost:3000/health');
    const healthData = await healthResponse.json();
    console.log('✅ 健康检查响应:', healthData);
  } catch (error) {
    console.log('❌ 健康检查测试失败:', error.message);
  }

  console.log('');

  // 测试MCP协议端点
  console.log('2. 测试MCP协议端点...');
  try {
    const mcpResponse = await fetch('http://localhost:3000/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/list',
        id: 1
      })
    });
    const mcpData = await mcpResponse.json();
    console.log('✅ MCP协议端点测试响应:', JSON.stringify(mcpData, null, 2));
  } catch (error) {
    console.log('❌ MCP协议端点测试失败:', error.message);
  }

  console.log('');

  // 测试一个简单的Markdown转Word请求
  console.log('3. 测试Markdown转Word功能...');
  try {
    const testMarkdown = '# 测试文档\n\n这是一个本地测试文档。';

    const mcpResponse = await fetch('http://localhost:3000/mcp', {
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
            markdown: testMarkdown,
            filename: 'test-local.docx'
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

  console.log('\n🎉 本地服务器测试完成！');
}

// 运行测试
testLocalServer().catch(console.error);