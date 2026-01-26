/**
 * 测试Cloudflare Worker中同时支持的HTTP API和MCP服务
 * 验证两个服务端点的功能
 */

import fetch from 'node-fetch';

async function testBothApiEndpoints() {
  console.log('🔌 测试HTTP API和MCP服务端点...\n');

  // 使用本地开发服务器地址，如果部署到Cloudflare则更改此URL
  const baseUrl = process.env.CF_API_URL || 'http://localhost:8787'; // 假设本地开发端口
  
  console.log(`服务基础URL: ${baseUrl}`);
  console.log('注意: 此测试需要先启动本地开发服务器或部署到Cloudflare Workers\n');

  // 测试根路径信息
  console.log('1. 测试根路径信息...');
  try {
    const infoResponse = await fetch(`${baseUrl}/`);
    const info = await infoResponse.json();
    console.log('服务信息:', JSON.stringify(info, null, 2));
  } catch (error) {
    console.log('❌ 获取服务信息失败:', error.message);
  }

  console.log('');

  // 准备测试用的Markdown内容
  const testMarkdown = `# 双API服务测试文档

## HTTP API测试内容
这是通过HTTP API端点转换的文档。

### 特性
- 支持直接HTTP POST请求
- 无需MCP协议封装
- 简化的JSON输入格式
- 直接返回文档下载链接

## MCP服务测试内容
这是通过MCP协议端点转换的相同文档。

### 特性
- 支持MCP协议标准
- 保持向后兼容性
- 支持复杂的工具调用
- 标准化的响应格式

### 样式测试
这个文档使用了自定义样式配置。

### 结论
服务同时支持HTTP API和MCP协议，提供双重接入方式。
`;

  // 测试HTTP API端点
  console.log('2. 测试HTTP API端点 (/convert)...');
  
  try {
    const httpApiResponse = await fetch(`${baseUrl}/convert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        markdown: testMarkdown,
        filename: 'http-api-test.docx',
        styleConfig: {
          document: {
            defaultFont: 'Arial',
            defaultSize: 24
          }
        }
      })
    });

    console.log(`HTTP API响应状态: ${httpApiResponse.status} ${httpApiResponse.statusText}`);
    
    const httpApiResult = await httpApiResponse.json();
    console.log('HTTP API响应内容:', JSON.stringify(httpApiResult, null, 2));

    if (httpApiResult.success && httpApiResult.downloadUrl) {
      console.log('\n✅ HTTP API调用成功!');
      console.log(`📄 文件名: ${httpApiResult.filename}`);
      console.log(`📥 下载链接: ${httpApiResult.downloadUrl}`);
      console.log(`📏 文件大小: ${httpApiResult.size} bytes`);
    } else {
      console.log('❌ HTTP API调用失败');
      if (httpApiResult.error) {
        console.log(`错误信息: ${httpApiResult.error}`);
      }
    }
  } catch (error) {
    console.log('❌ HTTP API请求失败:', error.message);
    console.log('💡 提示: 如果使用localhost，请确保本地开发服务器正在运行');
  }

  console.log('');

  // 测试MCP端点
  console.log('3. 测试MCP端点 (/mcp)...');
  
  try {
    const mcpResponse = await fetch(`${baseUrl}/mcp`, {
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
            filename: 'mcp-api-test.docx',
            styleConfig: {
              document: {
                defaultFont: 'Times New Roman',
                defaultSize: 24
              }
            }
          }
        },
        id: 'mcp-test-request'
      })
    });

    console.log(`MCP响应状态: ${mcpResponse.status} ${mcpResponse.statusText}`);
    
    const mcpResult = await mcpResponse.json();
    console.log('MCP响应内容:', JSON.stringify(mcpResult, null, 2));

    if (mcpResult.result && mcpResult.result.structuredContent) {
      const content = mcpResult.result.structuredContent;
      console.log('\n✅ MCP调用成功!');
      console.log(`📄 文件名: ${content.filename}`);
      if (content.url) {
        console.log(`📥 下载链接: ${content.url}`);
      }
      console.log(`📏 文件大小: ${content.size} bytes`);
    } else {
      console.log('❌ MCP调用失败或没有预期的响应结构');
    }
  } catch (error) {
    console.log('❌ MCP请求失败:', error.message);
    console.log('💡 提示: 如果使用localhost，请确保本地开发服务器正在运行');
  }

  console.log('');

  // 测试错误情况 - HTTP API
  console.log('4. 测试HTTP API错误处理...');
  try {
    const errorResponse = await fetch(`${baseUrl}/convert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // 缺少必需字段的请求
        markdown: testMarkdown
        // 注意：缺少filename字段，应该导致验证错误
      })
    });

    console.log(`HTTP API错误响应状态: ${errorResponse.status}`);
    const errorResult = await errorResponse.json();
    console.log('HTTP API错误响应:', JSON.stringify(errorResult, null, 2));

    if (errorResponse.status === 400 && errorResult.error) {
      console.log('✅ HTTP API正确处理了输入验证错误');
    } else {
      console.log('⚠️ HTTP API输入验证可能未按预期工作');
    }
  } catch (error) {
    console.log('❌ HTTP API错误情况测试失败:', error.message);
  }

  console.log('\n💡 总结:');
  console.log('- 服务同时支持HTTP API (/convert) 和 MCP (/mcp) 两种端点');
  console.log('- HTTP API提供简化的RESTful接口');
  console.log('- MCP端点保持向后兼容性和标准协议支持');
  console.log('- 两个端点共享相同的底层转换逻辑');
  console.log('- 统一的错误处理和验证机制');
  console.log('- 支持CORS以便前端集成');
}

testBothApiEndpoints().catch(console.error);