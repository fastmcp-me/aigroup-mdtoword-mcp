/**
 * 测试OpenAI插件规范端点
 * 验证部署后的端点是否正常工作
 */

import fetch from 'node-fetch';

async function testOpenAiPluginEndpoints() {
  // 使用实际部署的URL，如果尚未部署，则跳过测试
  const baseUrl = process.env.DEPLOYED_URL || 'https://aigroup-mdtoword-mcp.jackdark425.workers.dev';
  
  console.log('🔍 测试OpenAI插件规范端点...');
  console.log(`🎯 目标URL: ${baseUrl}\n`);

  // 测试1: OpenAI插件清单端点
  console.log('1. 测试 /.well-known/ai-plugin.json 端点...');
  try {
    const pluginResponse = await fetch(`${baseUrl}/.well-known/ai-plugin.json`);
    console.log(`   状态码: ${pluginResponse.status}`);
    
    if (pluginResponse.status === 200) {
      const pluginData = await pluginResponse.json();
      console.log('   ✅ 响应成功');
      console.log(`   📝 插件名称: ${pluginData.name_for_model}`);
      console.log(`   📝 人类可读名称: ${pluginData.name_for_human}`);
      console.log(`   📝 描述: ${pluginData.description_for_model}`);
      console.log(`   🔗 API规范URL: ${pluginData.api.url}`);
      
      // 验证必要字段
      const requiredFields = ['schema_version', 'name_for_model', 'name_for_human', 'description_for_model', 'auth', 'api'];
      const missingFields = requiredFields.filter(field => !(field in pluginData));
      if (missingFields.length === 0) {
        console.log('   ✅ 所有必需字段存在');
      } else {
        console.log(`   ⚠️ 缺少字段: ${missingFields.join(', ')}`);
      }
    } else {
      console.log('   ❌ 端点不可用 - 这可能是因为服务尚未部署');
      console.log('   💡 提示: 请先部署服务后再运行此测试');
    }
  } catch (error) {
    console.log(`   ❌ 请求失败: ${error.message}`);
    console.log('   💡 提示: 如果是404错误，说明服务尚未部署到指定URL');
  }

  console.log('');

  // 测试2: OpenAPI规范端点 (YAML)
  console.log('2. 测试 /openapi.yaml 端点...');
  try {
    const yamlResponse = await fetch(`${baseUrl}/openapi.yaml`);
    console.log(`   状态码: ${yamlResponse.status}`);
    
    if (yamlResponse.status === 200) {
      const yamlContent = await yamlResponse.text();
      console.log('   ✅ 响应成功');
      console.log(`   📄 内容长度: ${yamlContent.length} 字符`);
      
      // 检查基本的OpenAPI字段
      if (yamlContent.includes('openapi: 3.0.0')) {
        console.log('   ✅ 包含有效的OpenAPI声明');
      }
      if (yamlContent.includes('/convert')) {
        console.log('   ✅ 包含转换API端点定义');
      }
    } else {
      console.log('   ❌ 端点不可用 - 这可能是因为服务尚未部署');
    }
  } catch (error) {
    console.log(`   ❌ 请求失败: ${error.message}`);
  }

  console.log('');

  // 测试3: OpenAPI规范端点 (JSON)
  console.log('3. 测试 /openapi.json 端点...');
  try {
    const jsonResponse = await fetch(`${baseUrl}/openapi.json`);
    console.log(`   状态码: ${jsonResponse.status}`);
    
    if (jsonResponse.status === 200) {
      const jsonData = await jsonResponse.json();
      console.log('   ✅ 响应成功');
      console.log(`   📝 API标题: ${jsonData.info.title}`);
      console.log(`   📝 API版本: ${jsonData.info.version}`);
      
      // 检查是否存在convert端点
      if (jsonData.paths && jsonData.paths['/convert']) {
        console.log('   ✅ 包含转换API端点定义');
      } else {
        console.log('   ❌ 缺少转换API端点定义');
      }
    } else {
      console.log('   ❌ 端点不可用 - 这可能是因为服务尚未部署');
    }
  } catch (error) {
    console.log(`   ❌ 请求失败: ${error.message}`);
  }

  console.log('');

  // 测试4: Logo端点
  console.log('4. 测试 /logo.png 端点...');
  try {
    const logoResponse = await fetch(`${baseUrl}/logo.png`);
    console.log(`   状态码: ${logoResponse.status}`);
    
    if (logoResponse.status === 200) {
      const contentType = logoResponse.headers.get('content-type');
      console.log('   ✅ 响应成功');
      console.log(`   🖼️ 内容类型: ${contentType}`);
    } else {
      console.log('   ❌ 端点不可用 - 这可能是因为服务尚未部署');
    }
  } catch (error) {
    console.log(`   ❌ 请求失败: ${error.message}`);
  }

  console.log('');

  // 测试5: 原有功能端点仍然可用
  console.log('5. 测试原有功能端点...');
  
  // 测试根路径
  try {
    const rootResponse = await fetch(baseUrl);
    console.log(`   根路径状态码: ${rootResponse.status}`);
    if (rootResponse.status === 200) {
      const rootData = await rootResponse.json();
      console.log('   ✅ 根路径响应成功');
      console.log(`   📝 服务名称: ${rootData.name}`);
    }
  } catch (error) {
    console.log(`   ❌ 根路径请求失败: ${error.message}`);
  }
  
  // 测试健康检查
  try {
    const healthResponse = await fetch(`${baseUrl}/health`);
    console.log(`   健康检查状态码: ${healthResponse.status}`);
    if (healthResponse.status === 200) {
      const healthData = await healthResponse.json();
      console.log('   ✅ 健康检查响应成功');
      console.log(`   🏥 状态: ${healthData.status}`);
    }
  } catch (error) {
    console.log(`   ❌ 健康检查请求失败: ${error.message}`);
  }

  console.log('\n📋 测试总结:');
  console.log('- 如果所有端点都返回200状态码，则OpenAI插件规范实现正确');
  console.log('- 如果部分端点返回404，则服务可能尚未部署或配置有误');
  console.log('- 部署后重新运行此测试以验证完整功能');
}

// 运行测试
testOpenAiPluginEndpoints().catch(console.error);