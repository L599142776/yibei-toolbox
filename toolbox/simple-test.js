// simple-test.js
// 简单网络测试脚本

const PORT = 5174
const URL = `http://localhost:${PORT}`

async function testServer() {
  console.log(`正在尝试连接到服务器: ${URL}`)
  
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    
    const response = await fetch(URL, {
      method: 'GET',
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const text = await response.text()
    console.log(`✅ 服务器响应成功 (${response.status})`)
    console.log(`响应内容长度: ${text.length} 字节`)
    
    if (text.length > 1000) {
      console.log(`前 1000 字节: ${text.slice(0, 1000)}...`)
    } else {
      console.log(`完整响应: ${text}`)
    }

    return true
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('❌ 请求超时 (10秒)')
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.log('❌ 网络连接失败，请确保服务器正在运行')
    } else {
      console.log(`❌ 连接失败: ${error.message}`)
    }
    return false
  }
}

async function testNetwork() {
  console.log('测试本地网络连接...')
  
  try {
    // 测试本地主机连接
    const localResponse = await fetch('http://127.0.0.1')
    console.log(`✅ 本地主机响应: ${localResponse.status}`)
  } catch (error) {
    console.log(`❌ 本地主机无响应: ${error.message}`)
  }

  // 测试 IPv6
  try {
    const ipv6Response = await fetch('http://[::1]')
    console.log(`✅ IPv6 主机响应: ${ipv6Response.status}`)
  } catch (error) {
    console.log(`❌ IPv6 主机无响应: ${error.message}`)
  }

  // 测试外部服务器
  try {
    const googleResponse = await fetch('https://www.google.com', {
      method: 'GET',
      mode: 'no-cors'
    })
    console.log('✅ 外部服务器响应')
  } catch (error) {
    console.log(`❌ 外部服务器无响应: ${error.message}`)
  }
}

async function testToolsRoute() {
  console.log(`正在测试工具列表接口: ${URL}/tools`)
  
  try {
    const response = await fetch(`${URL}/tools`)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    console.log(`✅ 工具列表接口响应成功`)
    console.log(`工具数量: ${data.length}`)
    
    return data
  } catch (error) {
    console.log(`❌ 工具列表接口失败: ${error.message}`)
    return null
  }
}

async function runAllTests() {
  console.log('================================')
  console.log('  AI 对话功能测试')
  console.log('================================')

  console.log()
  await testNetwork()
  
  console.log()
  const serverRunning = await testServer()
  
  if (serverRunning) {
    console.log()
    const toolsData = await testToolsRoute()
    
    if (toolsData) {
      // 查找 AI 对话工具
      const aiChatTool = toolsData.find(tool => 
        tool.id === 'ai-chat' || 
        tool.name === 'AI 对话' ||
        tool.category === 'ai'
      )

      if (aiChatTool) {
        console.log()
        console.log('✅ 找到 AI 对话工具:')
        console.log(`   - ID: ${aiChatTool.id}`)
        console.log(`   - 名称: ${aiChatTool.name}`)
        console.log(`   - 分类: ${aiChatTool.category}`)
        console.log(`   - 图标: ${aiChatTool.icon}`)
        console.log(`   - 路径: ${aiChatTool.path}`)
        
        if (aiChatTool.description) {
          console.log(`   - 描述: ${aiChatTool.description}`)
        }
      } else {
        console.log()
        console.log('❌ 未找到 AI 对话工具')
        console.log('所有工具:')
        
        const groupedTools = {}
        toolsData.forEach(tool => {
          groupedTools[tool.category] = groupedTools[tool.category] || []
          groupedTools[tool.category].push(tool)
        })

        Object.keys(groupedTools).sort().forEach(category => {
          console.log(`\n${category.toUpperCase()}: (${groupedTools[category].length} 个)`)
          groupedTools[category].forEach(tool => {
            console.log(`  - ${tool.name} (${tool.id})`)
          })
        })
      }
    }
  }

  console.log()
  console.log('================================')
}

runAllTests()