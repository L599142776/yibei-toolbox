import sharp from 'sharp'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
// 回到项目根目录
const rootDir = resolve(__dirname, '..')
const svgPath = resolve(rootDir, 'public/icon.svg')
const pngPath = resolve(rootDir, 'public/icon.png')

console.log('SVG 路径:', svgPath)
console.log('PNG 路径:', pngPath)

sharp(svgPath)
  .resize(256, 256)
  .png()
  .toFile(pngPath)
  .then(() => {
    console.log('SVG 转 PNG 成功！')
  })
  .catch((err) => {
    console.error('转换失败:', err)
    process.exit(1)
  })