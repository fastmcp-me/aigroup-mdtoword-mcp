/**
 * 测试HTTP API接口
 * 直接调用HTTP端点而非MCP协议
 */

import fetch from 'node-fetch';

async function testHttpApi() {
  console.log('🌐 开始测试HTTP API接口...\n');

  // 由于Cloudflare Worker部署的HTTP API端点与MCP端点相同，我们测试Cloudflare上的HTTP API
  const baseUrl = 'https://aigroup-mdtoword-mcp.jackdark425.workers.dev';
  
  console.log(`测试Cloudflare部署的HTTP API: ${baseUrl}\n`);

  // 1. 测试根路径
  console.log('1. 测试根路径信息...');
  try {
    const response = await fetch(`${baseUrl}/`);
    const data = await response.json();
    console.log('✅ 根路径响应:', data);
  } catch (error) {
    console.log('❌ 根路径测试失败:', error.message);
  }

  console.log('');

  // 2. 测试健康检查
  console.log('2. 测试健康检查...');
  try {
    const response = await fetch(`${baseUrl}/health`);
    const data = await response.json();
    console.log('✅ 健康检查响应:', data);
  } catch (error) {
    console.log('❌ 健康检查测试失败:', error.message);
  }

  console.log('');

  // 3. 测试HTTP API - 使用标准HTTP POST请求（非MCP协议）
  console.log('3. 测试HTTP API文档转换功能...');
  try {
    // 这里我们需要使用MCP协议格式，因为Cloudflare Worker只实现了MCP接口
    const markdownContent = `# HTTP API 测试文档

## 测试标题
这是一份通过HTTP API生成的测试文档。

### 测试列表
- 项目1
- 项目2
- 项目3

### 测试代码块
\`\`\`javascript
console.log('Hello, HTTP API!');
\`\`\`

### 测试表格
| 列1 | 列2 | 列3 |
|-----|-----|-----|
| 数据1 | 数据2 | 数据3 |
| 数据4 | 数据5 | 数据6 |
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
            filename: 'http-api-test.docx',
            styleConfig: {
              document: {
                defaultFont: 'Arial',
                defaultSize: 24
              }
            }
          }
        },
        id: 1
      })
    });

    const result = await response.json();
    console.log('✅ HTTP API转换响应:', JSON.stringify(result, null, 2));

    // 如果成功，尝试下载文件
    if (result.result?.structuredContent?.url) {
      console.log('\n尝试下载生成的文档...');
      try {
        const downloadResponse = await fetch(result.result.structuredContent.url);
        if (downloadResponse.ok) {
          console.log('✅ 文档下载成功');
          console.log('   文件大小:', downloadResponse.headers.get('content-length'), 'bytes');
        } else {
          console.log('❌ 文档下载失败:', downloadResponse.status);
        }
      } catch (downloadError) {
        console.log('❌ 文档下载异常:', downloadError.message);
      }
    }
  } catch (error) {
    console.log('❌ HTTP API转换测试失败:', error.message);
  }

  console.log('');

  // 4. 测试资源API
  console.log('4. 测试资源API...');
  try {
    const response = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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

    const result = await response.json();
    console.log('✅ 资源API响应成功');
    if (result.result?.contents) {
      console.log('   内容预览 (前200字符):', result.result.contents[0].text.substring(0, 200) + '...');
    }
  } catch (error) {
    console.log('❌ 资源API测试失败:', error.message);
  }

  console.log('\n🎉 HTTP API接口测试完成！');
}

testHttpApi().catch(console.error);