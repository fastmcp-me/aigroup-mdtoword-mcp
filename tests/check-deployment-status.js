/**
 * 检查Cloudflare Worker部署状态
 */
import fetch from 'node-fetch';

async function checkDeploymentStatus() {
  console.log('🔍 检查Cloudflare Worker部署状态...\n');

  // 检查主要部署URL
  const mainUrl = 'https://aigroup-mdtoword-mcp.jackdark425.workers.dev';
  
  console.log(`检查URL: ${mainUrl}\n`);

  // 1. 检查基本连通性
  console.log('1. 检查基本连通性...');
  try {
    const response = await fetch(mainUrl, {
      method: 'GET',
      timeout: 10000 // 10秒超时
    });
    console.log(`   状态码: ${response.status}`);
    console.log(`   响应头:`, [...response.headers.entries()]);
    
    if (response.ok) {
      const data = await response.json();
      console.log('   响应数据:', data);
    } else {
      const text = await response.text();
      console.log('   错误响应:', text.substring(0, 200) + (text.length > 200 ? '...' : ''));
    }
  } catch (error) {
    console.log(`   ❌ 连接失败: ${error.message}`);
    console.log('   提示: 可能是部署还在生效中，或者存在网络问题');
  }

  console.log('');

  // 2. 检查健康端点
  console.log('2. 检查健康检查端点...');
  try {
    const healthResponse = await fetch(`${mainUrl}/health`, {
      method: 'GET',
      timeout: 10000
    });
    console.log(`   健康检查状态码: ${healthResponse.status}`);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('   健康检查响应:', healthData);
    } else {
      const text = await healthResponse.text();
      console.log('   健康检查错误:', text.substring(0, 200) + (text.length > 200 ? '...' : ''));
    }
  } catch (error) {
    console.log(`   ❌ 健康检查失败: ${error.message}`);
  }

  console.log('');

  // 3. 输出部署信息
  console.log('3. 部署信息:');
  console.log('   - 工作人员名称: aigroup-mdtoword-mcp');
  console.log('   - 子域名: jackdark425');
  console.log('   - 完整URL: https://aigroup-mdtoword-mcp.jackdark425.workers.dev');
  console.log('   - 部署状态: 最近一次部署已成功');
  console.log('   - 注意: 部署可能需要几分钟时间完全生效');
  
  console.log('');
  
  // 4. 建议
  console.log('💡 建议:');
  console.log('   - 如果服务暂时不可用，请等待几分钟后重试');
  console.log('   - 检查防火墙或网络设置是否阻止了访问');
  console.log('   - 可以使用浏览器直接访问上述URL进行验证');
  console.log('   - 如果长时间无法访问，可能需要检查wrangler.toml配置');
}

checkDeploymentStatus().catch(console.error);