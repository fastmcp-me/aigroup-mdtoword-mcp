/**
 * 测试已部署的Cloudflare Worker服务
 */
import fetch from 'node-fetch';

async function testDeployedCFWorker() {
  console.log('🧪 开始测试已部署的Cloudflare Worker服务...\n');

  // 测试不同的可能端点
  const endpoints = [
    'https://mdtoword-mcp.jackdark425.online',
    'https://aigroup-mdtoword-mcp.jackdark425.workers.dev'
  ];

  for (const baseUrl of endpoints) {
    console.log(`🔍 测试端点: ${baseUrl}`);
    
    try {
      // 测试健康检查
      console.log('  1. 测试健康检查端点...');
      try {
        const healthResponse = await fetch(`${baseUrl}/health`);
        const healthData = await healthResponse.json();
        console.log('  ✅ 健康检查响应:', healthData);
      } catch (error) {
        console.log('  ❌ 健康检查测试失败:', error.message);
      }

      console.log('');

      // 测试MCP协议端点
      console.log('  2. 测试MCP协议端点...');
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
        console.log('  ✅ MCP协议端点测试响应:', JSON.stringify(mcpData, null, 2));
      } catch (error) {
        console.log('  ❌ MCP协议端点测试失败:', error.message);
      }

      console.log('');

      // 如果前面的测试都成功，再测试Markdown转Word功能
      console.log('  3. 测试Markdown转Word功能...');
      try {
        const testMarkdown = '# 测试文档\n\n这是部署服务的测试文档。';

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
                filename: 'test-cf-worker.docx'
              }
            },
            id: 2
          })
        });
        const result = await mcpResponse.json();
        console.log('  ✅ Markdown转Word功能测试响应:', JSON.stringify(result, null, 2));
      } catch (error) {
        console.log('  ❌ Markdown转Word功能测试失败:', error.message);
      }

      console.log('');
      
    } catch (endpointError) {
      console.log(`  ❌ 端点 ${baseUrl} 无法访问:`, endpointError.message);
      console.log('');
    }
  }

  console.log('🎉 部署的Cloudflare Worker服务测试完成！');
}

// 运行测试
testDeployedCFWorker().catch(console.error);