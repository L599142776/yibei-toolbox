import ToolLayout from '../../components/ToolLayout'
import { Key, Lock, Unlock, RefreshCw, Copy, Shield } from 'lucide-react'
import { useState, useCallback } from 'react'

// Convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

// Convert Base64 to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

// Convert string to ArrayBuffer
function stringToArrayBuffer(str: string): ArrayBuffer {
  const encoder = new TextEncoder()
  return encoder.encode(str).buffer
}

// Convert ArrayBuffer to string
function arrayBufferToString(buffer: ArrayBuffer): string {
  const decoder = new TextDecoder()
  return decoder.decode(buffer)
}

export default function AesRsaTool() {
  const [tab, setTab] = useState<'aes' | 'rsa'>('aes')

  // AES state
  const [aesKey, setAesKey] = useState('')
  const [aesIv, setAesIv] = useState('')
  const [aesKeySize, setAesKeySize] = useState<128 | 192 | 256>(256)
  const [aesMode, setAesMode] = useState<'GCM' | 'CBC'>('GCM')
  const [aesInput, setAesInput] = useState('')
  const [aesOutput, setAesOutput] = useState('')
  const [aesError, setAesError] = useState('')
  const [aesLoading, setAesLoading] = useState(false)

  // RSA state
  const [rsaPublicKey, setRsaPublicKey] = useState('')
  const [rsaPrivateKey, setRsaPrivateKey] = useState('')
  const [rsaKeySize, setRsaKeySize] = useState<2048 | 4096>(2048)
  const [rsaInput, setRsaInput] = useState('')
  const [rsaOutput, setRsaOutput] = useState('')
  const [rsaError, setRsaError] = useState('')
  const [rsaLoading, setRsaLoading] = useState(false)

  // Generate random bytes as hex
  function generateRandomHex(length: number): string {
    const bytes = crypto.getRandomValues(new Uint8Array(length))
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  }

  // AES functions
  const generateAesKey = useCallback(() => {
    const keyByteLength = aesKeySize / 8
    const keyHex = generateRandomHex(keyByteLength)
    setAesKey(keyHex)
    setAesError('')
  }, [aesKeySize])

  const generateAesIv = useCallback(() => {
    // GCM uses 12 bytes (96 bits) IV, CBC uses 16 bytes
    const ivLength = aesMode === 'GCM' ? 12 : 16
    const ivHex = generateRandomHex(ivLength)
    setAesIv(ivHex)
  }, [aesMode])

  const encryptAES = useCallback(async () => {
    if (!aesKey || !aesIv || !aesInput) {
      setAesError('请填写密钥、IV和明文')
      return
    }
    setAesLoading(true)
    setAesError('')
    try {
      const keyBytes = new Uint8Array(aesKey.match(/.{2}/g)!.map((b) => parseInt(b, 16)))
      const ivBytes = new Uint8Array(aesIv.match(/.{2}/g)!.map((b) => parseInt(b, 16)))
      const plaintext = stringToArrayBuffer(aesInput)

      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyBytes,
        { name: `AES-${aesMode}` },
        false,
        ['encrypt']
      )

      const ciphertext = await crypto.subtle.encrypt(
        { name: `AES-${aesMode}`, iv: ivBytes },
        cryptoKey,
        plaintext
      )

      // Combine IV + ciphertext for storage/transmission
      const combined = new Uint8Array(ivBytes.length + new Uint8Array(ciphertext).length)
      combined.set(ivBytes)
      combined.set(new Uint8Array(ciphertext), ivBytes.length)

      setAesOutput(arrayBufferToBase64(combined.buffer))
    } catch (e) {
      setAesError(`加密失败: ${e instanceof Error ? e.message : '未知错误'}`)
    } finally {
      setAesLoading(false)
    }
  }, [aesKey, aesIv, aesInput, aesMode])

  const decryptAES = useCallback(async () => {
    if (!aesKey || !aesIv || !aesOutput) {
      setAesError('请填写密钥、IV和密文')
      return
    }
    setAesLoading(true)
    setAesError('')
    try {
      const keyBytes = new Uint8Array(aesKey.match(/.{2}/g)!.map((b) => parseInt(b, 16)))
      const ivLength = aesMode === 'GCM' ? 12 : 16
      const combined = new Uint8Array(base64ToArrayBuffer(aesOutput))
      const ivBytes = combined.slice(0, ivLength)
      const ciphertext = combined.slice(ivLength)

      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyBytes,
        { name: `AES-${aesMode}` },
        false,
        ['decrypt']
      )

      const plaintext = await crypto.subtle.decrypt(
        { name: `AES-${aesMode}`, iv: ivBytes },
        cryptoKey,
        ciphertext
      )

      setAesInput(arrayBufferToString(plaintext))
    } catch (e) {
      setAesError(`解密失败: ${e instanceof Error ? e.message : '密钥或密文错误'}`)
    } finally {
      setAesLoading(false)
    }
  }, [aesKey, aesOutput, aesMode])

  // RSA functions
  const generateRsaKeyPair = useCallback(async () => {
    setRsaLoading(true)
    setRsaError('')
    try {
      const keyPair = await crypto.subtle.generateKey(
        {
          name: 'RSA-OAEP',
          modulusLength: rsaKeySize,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256',
        },
        true,
        ['encrypt', 'decrypt']
      )

      const publicKeyExported = await crypto.subtle.exportKey('spki', keyPair.publicKey)
      const privateKeyExported = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey)

      setRsaPublicKey(arrayBufferToBase64(publicKeyExported))
      setRsaPrivateKey(arrayBufferToBase64(privateKeyExported))
    } catch (e) {
      setRsaError(`密钥生成失败: ${e instanceof Error ? e.message : '未知错误'}`)
    } finally {
      setRsaLoading(false)
    }
  }, [rsaKeySize])

  const encryptRSA = useCallback(async () => {
    if (!rsaPublicKey || !rsaInput) {
      setRsaError('请填写公钥和明文')
      return
    }
    setRsaLoading(true)
    setRsaError('')
    try {
      const publicKeyData = base64ToArrayBuffer(rsaPublicKey)
      const publicKey = await crypto.subtle.importKey(
        'spki',
        publicKeyData,
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        false,
        ['encrypt']
      )

      const plaintext = stringToArrayBuffer(rsaInput)
      const ciphertext = await crypto.subtle.encrypt(
        { name: 'RSA-OAEP' },
        publicKey,
        plaintext
      )

      setRsaOutput(arrayBufferToBase64(ciphertext))
    } catch (e) {
      setRsaError(`加密失败: ${e instanceof Error ? e.message : '未知错误'}`)
    } finally {
      setRsaLoading(false)
    }
  }, [rsaPublicKey, rsaInput])

  const decryptRSA = useCallback(async () => {
    if (!rsaPrivateKey || !rsaOutput) {
      setRsaError('请填写私钥和密文')
      return
    }
    setRsaLoading(true)
    setRsaError('')
    try {
      const privateKeyData = base64ToArrayBuffer(rsaPrivateKey)
      const privateKey = await crypto.subtle.importKey(
        'pkcs8',
        privateKeyData,
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        false,
        ['decrypt']
      )

      const ciphertext = base64ToArrayBuffer(rsaOutput)
      const plaintext = await crypto.subtle.decrypt(
        { name: 'RSA-OAEP' },
        privateKey,
        ciphertext
      )

      setRsaInput(arrayBufferToString(plaintext))
    } catch (e) {
      setRsaError(`解密失败: ${e instanceof Error ? e.message : '密钥或密文错误'}`)
    } finally {
      setRsaLoading(false)
    }
  }, [rsaPrivateKey, rsaOutput])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <ToolLayout
      title="AES/RSA 加解密"
      description="AES 对称加密和 RSA 非对称加密工具，使用浏览器 Web Crypto API"
    >
      {/* Tab buttons */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('aes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            tab === 'aes'
              ? 'bg-blue-500 text-white shadow-lg'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          <Key size={18} />
          AES 对称加密
        </button>
        <button
          onClick={() => setTab('rsa')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            tab === 'rsa'
              ? 'bg-purple-500 text-white shadow-lg'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          <Shield size={18} />
          RSA 非对称加密
        </button>
      </div>

      {/* AES Panel */}
      {tab === 'aes' && (
        <div className="space-y-6">
          {/* Key settings */}
          <div className="bg-gray-800/50 rounded-lg p-4 space-y-4">
            <h3 className="font-semibold text-gray-200 flex items-center gap-2">
              <Key size={18} />
              AES 密钥设置
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">加密模式</label>
                <select
                  value={aesMode}
                  onChange={(e) => setAesMode(e.target.value as 'GCM' | 'CBC')}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                >
                  <option value="GCM">AES-GCM（推荐，支持认证加密）</option>
                  <option value="CBC">AES-CBC</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">密钥长度</label>
                <select
                  value={aesKeySize}
                  onChange={(e) => setAesKeySize(Number(e.target.value) as 128 | 192 | 256)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                >
                  <option value={128}>128 位</option>
                  <option value={192}>192 位</option>
                  <option value={256}>256 位（推荐）</option>
                </select>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm text-gray-400">密钥（十六进制）</label>
                <button
                  onClick={generateAesKey}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <RefreshCw size={12} />
                  生成
                </button>
              </div>
              <input
                type="text"
                value={aesKey}
                onChange={(e) => setAesKey(e.target.value)}
                placeholder="点击生成或手动输入 16/24/32 字节密钥"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white font-mono text-sm"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm text-gray-400">IV 向量（十六进制）</label>
                <button
                  onClick={generateAesIv}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <RefreshCw size={12} />
                  生成
                </button>
              </div>
              <input
                type="text"
                value={aesIv}
                onChange={(e) => setAesIv(e.target.value)}
                placeholder="点击生成 IV（GCM: 24字符, CBC: 32字符）"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white font-mono text-sm"
              />
            </div>
          </div>

          {/* Input/Output */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">明文输入</label>
              <textarea
                value={aesInput}
                onChange={(e) => setAesInput(e.target.value)}
                placeholder="输入要加密的文本..."
                className="w-full h-40 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white resize-none"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm text-gray-400">密文输出（Base64）</label>
                {aesOutput && (
                  <button
                    onClick={() => copyToClipboard(aesOutput)}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    <Copy size={12} />
                    复制
                  </button>
                )}
              </div>
              <textarea
                value={aesOutput}
                onChange={(e) => setAesOutput(e.target.value)}
                placeholder="加密/解密结果将显示在这里..."
                className="w-full h-40 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white font-mono text-sm resize-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={encryptAES}
              disabled={aesLoading}
              className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-green-600 text-white py-3 rounded-lg font-medium transition-colors"
            >
              <Lock size={18} />
              {aesLoading ? '处理中...' : '加密'}
            </button>
            <button
              onClick={decryptAES}
              disabled={aesLoading}
              className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-600 text-white py-3 rounded-lg font-medium transition-colors"
            >
              <Unlock size={18} />
              {aesLoading ? '处理中...' : '解密'}
            </button>
          </div>

          {aesError && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-300 text-sm">
              {aesError}
            </div>
          )}

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-blue-300 text-sm">
            <strong>说明：</strong>密文输出包含 IV，无需单独传输。GCM 模式提供认证加密，可检测篡改。
          </div>
        </div>
      )}

      {/* RSA Panel */}
      {tab === 'rsa' && (
        <div className="space-y-6">
          {/* Key generation */}
          <div className="bg-gray-800/50 rounded-lg p-4 space-y-4">
            <h3 className="font-semibold text-gray-200 flex items-center gap-2">
              <Shield size={18} />
              RSA 密钥对生成
            </h3>
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <label className="block text-sm text-gray-400 mb-1">密钥长度</label>
                <select
                  value={rsaKeySize}
                  onChange={(e) => setRsaKeySize(Number(e.target.value) as 2048 | 4096)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                >
                  <option value={2048}>2048 位（兼容性好）</option>
                  <option value={4096}>4096 位（更安全）</option>
                </select>
              </div>
              <button
                onClick={generateRsaKeyPair}
                disabled={rsaLoading}
                className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                <RefreshCw size={18} className={rsaLoading ? 'animate-spin' : ''} />
                生成密钥对
              </button>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm text-gray-400">公钥（Base64）</label>
                {rsaPublicKey && (
                  <button
                    onClick={() => copyToClipboard(rsaPublicKey)}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    <Copy size={12} />
                    复制
                  </button>
                )}
              </div>
              <textarea
                value={rsaPublicKey}
                onChange={(e) => setRsaPublicKey(e.target.value)}
                placeholder="生成密钥对后将自动填入公钥，或粘贴他人的公钥..."
                className="w-full h-24 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white font-mono text-xs resize-none"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm text-gray-400">私钥（Base64，请妥善保管！）</label>
                {rsaPrivateKey && (
                  <button
                    onClick={() => copyToClipboard(rsaPrivateKey)}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    <Copy size={12} />
                    复制
                  </button>
                )}
              </div>
              <textarea
                value={rsaPrivateKey}
                onChange={(e) => setRsaPrivateKey(e.target.value)}
                placeholder="生成密钥对后将自动填入私钥..."
                className="w-full h-24 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white font-mono text-xs resize-none"
              />
            </div>
          </div>

          {/* Input/Output */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">明文输入</label>
              <textarea
                value={rsaInput}
                onChange={(e) => setRsaInput(e.target.value)}
                placeholder="输入要加密的文本..."
                className="w-full h-40 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white resize-none"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm text-gray-400">密文输出（Base64）</label>
                {rsaOutput && (
                  <button
                    onClick={() => copyToClipboard(rsaOutput)}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    <Copy size={12} />
                    复制
                  </button>
                )}
              </div>
              <textarea
                value={rsaOutput}
                onChange={(e) => setRsaOutput(e.target.value)}
                placeholder="加密/解密结果将显示在这里..."
                className="w-full h-40 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white font-mono text-sm resize-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={encryptRSA}
              disabled={rsaLoading}
              className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-green-600 text-white py-3 rounded-lg font-medium transition-colors"
            >
              <Lock size={18} />
              用公钥加密
            </button>
            <button
              onClick={decryptRSA}
              disabled={rsaLoading}
              className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-600 text-white py-3 rounded-lg font-medium transition-colors"
            >
              <Unlock size={18} />
              用私钥解密
            </button>
          </div>

          {rsaError && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-300 text-sm">
              {rsaError}
            </div>
          )}

          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 text-purple-300 text-sm">
            <strong>说明：</strong>RSA 使用 RSA-OAEP 算法，适合加密小数据（如对称密钥）。对于大文本，建议配合 AES 使用。
          </div>
        </div>
      )}
    </ToolLayout>
  )
}
