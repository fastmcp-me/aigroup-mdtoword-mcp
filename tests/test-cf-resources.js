/**
 * 测试Cloudflare Worker的MCP资源功能
 */
import fetch from 'node-fetch';

async function testResources() {
  console.log('📚 开始测试MCP资源功能...\n');

  const baseUrl = 'https://aigroup-mdtoword-mcp.jackdark425.workers.dev';
  
  // 获取所有资源
  console.log('1. 获取所有可用资源...');
  try {
    const resourcesResponse = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'resources/list',
        id: 1
      })
    });
    const resourcesData = await resourcesResponse.json();
    console.log('✅ 资源列表获取成功');
    console.log(`   发现 ${resourcesData.result.resources.length} 个资源:`);
    resourcesData.result.resources.forEach(resource => {
      console.log(`   - ${resource.uri}: ${resource.name}`);
    });
  } catch (error) {
    console.log('❌ 资源列表获取失败:', error.message);
  }

  console.log('');

  // 测试访问特定资源
  console.log('2. 测试访问模板列表资源...');
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
          uri: 'templates://list'
        },
        id: 2
      })
    });
    const resourceData = await resourceResponse.json();
    console.log('✅ 模板列表资源获取成功');
    if (resourceData.result?.contents) {
      console.log('   内容预览 (前200字符):', 
        resourceData.result.contents[0]?.text?.substring(0, 200) + '...');
    }
  } catch (error) {
    console.log('❌ 模板列表资源获取失败:', error.message);
  }

  console.log('');

  // 测试访问默认模板资源
  console.log('3. 测试访问默认模板资源...');
  try {
    const defaultResponse = await fetch(`${baseUrl}/mcp`, {
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
        id: 3
      })
    });
    const defaultData = await defaultResponse.json();
    console.log('✅ 默认模板资源获取成功');
    if (defaultData.result?.contents) {
      console.log('   内容预览 (前200字符):', 
        defaultData.result.contents[0]?.text?.substring(0, 200) + '...');
    }
  } catch (error) {
    console.log('❌ 默认模板资源获取失败:', error.message);
  }

  console.log('');

  console.log('🎉 MCP资源功能测试完成！');
}

// 运行资源测试
testResources().catch(console.error);