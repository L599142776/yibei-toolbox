import ToolLayout from '../../components/ToolLayout'
import Select from '../../components/ui/Select'
import { Key, Lock, Unlock, RefreshCw, Copy, Shield, KeyRound } from 'lucide-react'
import { useState, useCallback } from 'react'
import { toast } from '../../components/ui/Toast'

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
    toast('已复制到剪贴板', 'success')
  }

  return (
    <ToolLayout
      title="AES/RSA 加解密"
      description="AES 对称加密和 RSA 非对称加密工具，使用浏览器 Web Crypto API"
    >
      {/* Tab buttons */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button
          onClick={() => setTab('aes')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            borderRadius: 8,
            fontWeight: 500,
            fontSize: 14,
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: tab === 'aes' ? 'var(--accent)' : 'var(--bg-input)',
            color: tab === 'aes' ? '#fff' : 'var(--text-dim)',
          }}
        >
          <Key size={18} />
          AES 对称加密
        </button>
        <button
          onClick={() => setTab('rsa')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            borderRadius: 8,
            fontWeight: 500,
            fontSize: 14,
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: tab === 'rsa' ? 'var(--accent)' : 'var(--bg-input)',
            color: tab === 'rsa' ? '#fff' : 'var(--text-dim)',
          }}
        >
          <Shield size={18} />
          RSA 非对称加密
        </button>
      </div>

      {/* AES Panel */}
      {tab === 'aes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Key settings */}
          <div style={{ background: 'var(--bg-input)', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text)' }}>
              <Key size={18} style={{ color: 'var(--accent)' }} />
              AES 密钥设置
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-dim)', marginBottom: 6 }}>加密模式</label>
                <Select
                  value={aesMode}
                  onChange={(v) => setAesMode(v as 'GCM' | 'CBC')}
                  options={[
                    { value: 'GCM', label: 'AES-GCM（推荐）' },
                    { value: 'CBC', label: 'AES-CBC' },
                  ]}
                  width="100%"
                  fontSize={14}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-dim)', marginBottom: 6 }}>密钥长度</label>
                <Select
                  value={String(aesKeySize)}
                  onChange={(v) => setAesKeySize(Number(v) as 128 | 192 | 256)}
                  options={[
                    { value: '128', label: '128 位' },
                    { value: '192', label: '192 位' },
                    { value: '256', label: '256 位（推荐）' },
                  ]}
                  width="100%"
                  fontSize={14}
                />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 13, color: 'var(--text-dim)' }}>密钥（十六进制）</label>
                <button
                  onClick={generateAesKey}
                  style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
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
                style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: 'var(--text)', fontFamily: 'monospace' }}
              />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 13, color: 'var(--text-dim)' }}>IV 向量（十六进制）</label>
                <button
                  onClick={generateAesIv}
                  style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
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
                style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: 'var(--text)', fontFamily: 'monospace' }}
              />
            </div>
          </div>

          {/* Input/Output */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text-dim)', marginBottom: 6 }}>明文输入</label>
              <textarea
                value={aesInput}
                onChange={(e) => setAesInput(e.target.value)}
                placeholder="输入要加密的文本..."
                style={{ width: '100%', height: 160, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 12, fontSize: 13, color: 'var(--text)', resize: 'none' }}
              />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 13, color: 'var(--text-dim)' }}>密文输出（Base64）</label>
                {aesOutput && (
                  <button
                    onClick={() => copyToClipboard(aesOutput)}
                    style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
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
                style={{ width: '100%', height: 160, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 12, fontSize: 13, color: 'var(--text)', fontFamily: 'monospace', resize: 'none' }}
              />
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={encryptAES}
              disabled={aesLoading}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '12px 20px',
                borderRadius: 8,
                fontWeight: 500,
                fontSize: 14,
                border: 'none',
                cursor: aesLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                background: 'var(--accent)',
                color: '#fff',
                opacity: aesLoading ? 0.7 : 1,
              }}
            >
              <Lock size={18} />
              {aesLoading ? '处理中...' : '加密'}
            </button>
            <button
              onClick={decryptAES}
              disabled={aesLoading}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '12px 20px',
                borderRadius: 8,
                fontWeight: 500,
                fontSize: 14,
                border: 'none',
                cursor: aesLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                background: 'var(--bg-input)',
                color: 'var(--text)',
                opacity: aesLoading ? 0.7 : 1,
              }}
            >
              <Unlock size={18} />
              {aesLoading ? '处理中...' : '解密'}
            </button>
          </div>

          {aesError && (
            <div style={{ padding: 12, borderRadius: 8, fontSize: 13, color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              {aesError}
            </div>
          )}

          <div style={{ padding: 12, borderRadius: 8, fontSize: 13, color: 'var(--text-dim)', background: 'var(--bg-input)' }}>
            <strong>说明：</strong>密文输出包含 IV，无需单独传输。GCM 模式提供认证加密，可检测篡改。
          </div>
        </div>
      )}

      {/* RSA Panel */}
      {tab === 'rsa' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Key generation */}
          <div style={{ background: 'var(--bg-input)', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text)' }}>
              <KeyRound size={18} style={{ color: 'var(--accent)' }} />
              RSA 密钥对生成
            </h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ minWidth: 200 }}>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-dim)', marginBottom: 6 }}>密钥长度</label>
                <Select
                  value={String(rsaKeySize)}
                  onChange={(v) => setRsaKeySize(Number(v) as 2048 | 4096)}
                  options={[
                    { value: '2048', label: '2048 位（兼容性好）' },
                    { value: '4096', label: '4096 位（更安全）' },
                  ]}
                  width={200}
                  fontSize={14}
                />
              </div>
              <button
                onClick={generateRsaKeyPair}
                disabled={rsaLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 20px',
                  borderRadius: 8,
                  fontWeight: 500,
                  fontSize: 14,
                  border: 'none',
                  cursor: rsaLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  background: 'var(--accent)',
                  color: '#fff',
                  opacity: rsaLoading ? 0.7 : 1,
                }}
              >
                <RefreshCw size={18} style={rsaLoading ? { animation: 'spin 1s linear infinite' } : {}} />
                生成密钥对
              </button>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 13, color: 'var(--text-dim)' }}>公钥（Base64）</label>
                {rsaPublicKey && (
                  <button
                    onClick={() => copyToClipboard(rsaPublicKey)}
                    style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
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
                style={{ width: '100%', height: 100, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 12, fontSize: 12, color: 'var(--text)', fontFamily: 'monospace', resize: 'none' }}
              />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 13, color: 'var(--text-dim)' }}>私钥（Base64，请妥善保管！）</label>
                {rsaPrivateKey && (
                  <button
                    onClick={() => copyToClipboard(rsaPrivateKey)}
                    style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
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
                style={{ width: '100%', height: 100, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 12, fontSize: 12, color: 'var(--text)', fontFamily: 'monospace', resize: 'none' }}
              />
            </div>
          </div>

          {/* Input/Output */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text-dim)', marginBottom: 6 }}>明文输入</label>
              <textarea
                value={rsaInput}
                onChange={(e) => setRsaInput(e.target.value)}
                placeholder="输入要加密的文本..."
                style={{ width: '100%', height: 160, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 12, fontSize: 13, color: 'var(--text)', resize: 'none' }}
              />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 13, color: 'var(--text-dim)' }}>密文输出（Base64）</label>
                {rsaOutput && (
                  <button
                    onClick={() => copyToClipboard(rsaOutput)}
                    style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
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
                style={{ width: '100%', height: 160, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 12, fontSize: 13, color: 'var(--text)', fontFamily: 'monospace', resize: 'none' }}
              />
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={encryptRSA}
              disabled={rsaLoading}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '12px 20px',
                borderRadius: 8,
                fontWeight: 500,
                fontSize: 14,
                border: 'none',
                cursor: rsaLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                background: 'var(--accent)',
                color: '#fff',
                opacity: rsaLoading ? 0.7 : 1,
              }}
            >
              <Lock size={18} />
              用公钥加密
            </button>
            <button
              onClick={decryptRSA}
              disabled={rsaLoading}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '12px 20px',
                borderRadius: 8,
                fontWeight: 500,
                fontSize: 14,
                border: 'none',
                cursor: rsaLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                background: 'var(--bg-input)',
                color: 'var(--text)',
                opacity: rsaLoading ? 0.7 : 1,
              }}
            >
              <Unlock size={18} />
              用私钥解密
            </button>
          </div>

          {rsaError && (
            <div style={{ padding: 12, borderRadius: 8, fontSize: 13, color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              {rsaError}
            </div>
          )}

          <div style={{ padding: 12, borderRadius: 8, fontSize: 13, color: 'var(--text-dim)', background: 'var(--bg-input)' }}>
            <strong>说明：</strong>RSA 使用 RSA-OAEP 算法，适合加密小数据（如对称密钥）。对于大文本，建议配合 AES 使用。
          </div>
        </div>
      )}
    </ToolLayout>
  )
}
