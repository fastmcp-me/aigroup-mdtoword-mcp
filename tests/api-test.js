/**
 * 测试Cloudflare Worker API端点
 */
async function testApiEndpoints() {
  console.log('🧪 测试Cloudflare Worker API端点...\n');

  // 测试主页
  console.log('1. 测试主页端点...');
  try {
    const response1 = await fetch('https://aigroup-mdtoword-mcp.jackdark425.workers.dev/');
    const data1 = await response1.json();
    console.log('✅ 主页响应:', data1.name, '- 版本:', data1.version);
  } catch (error) {
    console.log('❌ 主页测试失败:', error.message);
  }

  console.log('');

  // 测试健康检查
  console.log('2. 测试健康检查端点...');
  try {
    const response2 = await fetch('https://aigroup-mdtoword-mcp.jackdark425.workers.dev/health');
    const data2 = await response2.json();
    console.log('✅ 健康检查响应:', data2.status, '- 服务:', data2.service);
  } catch (error) {
    console.log('❌ 健康检查测试失败:', error.message);
  }

  console.log('');

  // 测试MCP端点（使用fetch API）
  console.log('3. 测试MCP端点...');
  try {
    const mcpResponse = await fetch('https://aigroup-mdtoword-mcp.jackdark425.workers.dev/mcp', {
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
    
    const mcpResult = await mcpResponse.json();
    console.log('✅ MCP端点响应:', mcpResult);
  } catch (error) {
    console.log('❌ MCP端点测试失败:', error.message);
  }

  console.log('');

  // 尝试调用markdown_to_docx工具
  console.log('4. 测试Markdown转Word功能...');
  try {
    const testResponse = await fetch('https://aigroup-mdtoword-mcp.jackdark425.workers.dev/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          tool: 'markdown_to_docx',
          arguments: {
            markdown: '# 测试文档\n\n这是一个API测试。',
            filename: 'test.docx'
          }
        },
        id: 2
      })
    });
    
    const testResult = await testResponse.json();
    console.log('✅ Markdown转Word响应:', testResult);
  } catch (error) {
    console.log('❌ Markdown转Word测试失败:', error.message);
  }

  console.log('\n🎉 API端点测试完成！');
}

// 运行测试（在浏览器环境中）
// testApiEndpoints();