# GIS 地图工具模块

**依赖:** Leaflet + React-Leaflet + Turf.js + shpjs

## OVERVIEW
GIS 地图工具集：地图可视化、坐标转换、面积/距离计算、GeoJSON 编辑。

## TOOLS (9个)
| ID | 名称 | 核心功能 |
|----|------|---------|
| `map-viewer` | 地图文件查看器 | Shapefile/GeoJSON/KML 可视化 |
| `shapefile-explorer` | Shapefile 地图数据浏览器 | 地图+属性表双向联动浏览 |
| `area-calculator` | 多边形面积计算 | 绘制/导入多边形，计算面积周长 |
| `distance-calculator` | 距离测量 | 地图选点或坐标输入 |
| `coordinate-converter` | 坐标系转换 | WGS84/GCJ-02/BD-09/Mercator 互转 |
| `geojson-editor` | GeoJSON 编辑器 | 在线编辑、验证、预览 |
| `bounding-box` | 边界框工具 | 生成和可视化 bbox |
| `coordinate-picker` | 地图坐标拾取 | 点击获取坐标，支持 WGS84/DMS/UTM 格式 |

## KEY FILES
| File | Purpose |
|------|---------|
| `MapViewer.tsx` | 地图容器 + 图层管理 |
| `ShapefileExplorer.tsx` | 地图+属性表双向联动，可拖拽分屏布局 |
| `AreaCalculator.tsx` | 面积计算 + WKT 导入 |
| `CoordinateConverter.tsx` | 坐标系转换 (批量支持) |
| `CoordinatePicker.tsx` | 坐标拾取，多格式支持 |

## CONVENTIONS (GIS)
- **Leaflet MapContainer** — 每个工具独立 MapContainer 实例
- **CRS** — 使用 `L.CRS.Simple` 处理非地理坐标文件
- **坐标系约定** — WGS84 (EPSG:4326) 为内部标准
- **GeoJSON 规范** — 使用 RFC 7946，坐标顺序 [lng, lat]

## COORDINATE SYSTEMS (THIS MODULE)
| System | Code | Used By |
|--------|------|---------|
| WGS84 | EPSG:4326 | GPS, 国际标准 |
| GCJ-02 | 中国加密 | 高德地图 |
| BD-09 | 中国加密 | 百度地图 |
| Mercator | EPSG:3857 | Web 地图 |
| UTM | zone-based | 工程测量 |
| DMS | 度分秒 | 传统地图 |

## TURF.JS USAGE
- `@turf/area` — 计算多边形面积
- `@turf/distance` — 计算两点间距离
- `@turf/centroid` — 计算几何中心
- `@turf/bbox` — 计算边界框
- `@turf/transform-rotate` — 坐标旋转

## SHPJS (Shapefile)
- 支持 `.shp`, `.dbf`, `.prj` 文件打包为 `.zip`
- 自动解析属性表并显示为信息面板

## ShapefileExplorer 双向联动架构

`ShapefileExplorer.tsx` 实现地图与属性表的双向选择联动：

- **数据源：** `@microti/file-handler` 解析 Shapefile，每行数据含 `GEOMETRY` 字段（GeoJSON geometry JSON 字符串）
- **GeoJSON 构建：** `JSON.parse(row.GEOMETRY)` 提取几何，合并属性构建 `FeatureCollection`
- **选中状态：** `selectedIdx`（原始行号）同时驱动地图高亮和表格行高亮
- **地图 → 表格：** `onEachFeature` 绑定点击事件，设置 `selectedIdx`，表格滚动到对应行
- **表格 → 地图：** 行号列点击设置 `selectedIdx`，`FitToFeature` 组件定位地图视口
- **高亮样式：** 通过 `geoLayerRef` 访问 Leaflet 图层，手动 `setStyle` 更新选中要素样式
- **分屏布局：** CSS Grid + 拖拽分隔条，最小宽度限制 300px/400px

## ANTI-PATTERNS (GIS)
- ❌ 不要混用 lng/lat 和 lat/lng 顺序
- ❌ 不要在 Turf.js 外计算球面距离
- ❌ GeoJSON coordinates 不要使用 [lat, lng]

## ROOT CONVENTIONS
- 工具注册在 `src/tools/registry.ts`
- 组件使用 `ToolLayout` 包装
- 图标使用 Lucide React
