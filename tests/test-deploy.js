/**
 * 测试部署的Cloudflare Worker服务
 */

async function testService() {
  console.log('🧪 开始测试部署的Cloudflare Worker服务...\n');

  // 测试基础信息端点
  console.log('1. 测试基础信息端点...');
  try {
    const infoResponse = await fetch('https://mdtoword-mcp.jackdark425.online/');
    const infoData = await infoResponse.json();
    console.log('✅ 基础信息端点测试成功:', infoData.name);
  } catch (error) {
    console.log('❌ 基础信息端点测试失败:', error.message);
  }

  console.log('');

  // 测试健康检查端点
  console.log('2. 测试健康检查端点...');
  try {
    const healthResponse = await fetch('https://mdtoword-mcp.jackdark425.online/health');
    const healthData = await healthResponse.json();
    console.log('✅ 健康检查端点测试成功:', healthData.status);
  } catch (error) {
    console.log('❌ 健康检查端点测试失败:', error.message);
  }

  console.log('');

  // 测试MCP协议端点（发送一个简单的MCP请求）
  console.log('3. 测试MCP协议端点...');
  try {
    const mcpResponse = await fetch('https://mdtoword-mcp.jackdark425.online/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'services/list',
        id: 1
      })
    });
    const mcpData = await mcpResponse.json();
    console.log('✅ MCP协议端点测试响应:', mcpData);
  } catch (error) {
    console.log('❌ MCP协议端点测试失败:', error.message);
  }

  console.log('');

  // 测试一个简单的Markdown转Word请求
  console.log('4. 测试Markdown转Word功能...');
  try {
    const testMarkdown = '# 测试文档\n\n这是一个测试文档。';

    const mcpResponse = await fetch('https://mdtoword-mcp.jackdark425.online/mcp', {
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
            filename: 'test.docx',
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
    console.log('✅ Markdown转Word功能测试响应:', result);

    // Check for download URL
    if (result.structuredContent && result.structuredContent.url) {
      console.log('🔗 下载链接:', result.structuredContent.url);

      // Verify the download link works
      console.log('5. 验证下载链接...');
      const downloadResponse = await fetch(result.structuredContent.url);
      if (downloadResponse.ok) {
        console.log('✅ 下载链接有效 (Status:', downloadResponse.status, ')');
        const blob = await downloadResponse.blob();
        console.log('📦 文件大小:', blob.size, 'bytes');
      } else {
        console.log('❌ 下载链接无效 (Status:', downloadResponse.status, ')');
      }
    }
  } catch (error) {
    console.log('❌ Markdown转Word功能测试失败:', error.message);
  }

  console.log('\n🎉 测试完成！');
}

// 运行测试
testService().catch(console.error);