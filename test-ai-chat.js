// test-ai-chat.js
// 简单测试脚本，用于验证 AI 对话功能是否正常工作

const URL = 'http://localhost:5174'
const AI_CHAT_PATH = '/ai/chat'

async function main() {
  console.log('测试 AI 对话功能...')

  try {
    // 检查服务器是否运行
    const response = await fetch(URL)
    if (!response.ok) {
      throw new Error(`服务器响应错误: ${response.status}`)
    }

    console.log('✅ 服务器运行正常')

    // 检查工具是否存在
    const toolsResponse = await fetch(`${URL}/tools`)
    if (!toolsResponse.ok) {
      throw new Error(`获取工具列表失败: ${toolsResponse.status}`)
    }

    const tools = await toolsResponse.json()

    // 查找 AI 对话工具
    const aiChatTool = tools.find(t => t.id === 'ai-chat' || t.name === 'AI 对话')

    if (aiChatTool) {
      console.log('✅ AI 对话工具存在')
      console.log('   - ID:', aiChatTool.id)
      console.log('   - 名称:', aiChatTool.name)
      console.log('   - 路径:', aiChatTool.path)
      console.log('   - 分类:', aiChatTool.category)
    } else {
      console.log('❌ 未找到 AI 对话工具')
      console.log('现有工具:')
      tools.slice(0, 10).forEach(tool => console.log(`   - ${tool.name} (${tool.id})`))
      if (tools.length > 10) {
        console.log(`   ... 还有 ${tools.length - 10} 个工具`)
      }
    }

    // 检查工具是否已编译
    const toolResponse = await fetch(`${URL}${AI_CHAT_PATH}`)
    if (toolResponse.ok) {
      console.log('✅ AI 对话工具页面可访问')
    } else {
      console.log('⚠️  AI 对话工具页面不可直接访问')
    }
  } catch (error) {
    console.log(`❌ 测试失败: ${error.message}`)
  }
}

// 使用 fetch API 发送 GET 请求
async function fetchJSON(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  return response.json()
}

// 简单测试服务器是否响应
async function testServer() {
  try {
    const response = await fetch(URL)
    if (response.ok) {
      console.log('✅ 服务器响应')
      return true
    }
    return false
  } catch (error) {
    console.log('❌ 服务器未响应:', error.message)
    return false
  }
}

// 运行测试
testServer()
  .then(available => {
    if (available) {
      main()
    } else {
      console.log('❌ 服务器未响应，请确保开发服务器正在运行')
    }
  })