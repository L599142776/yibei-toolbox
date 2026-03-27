// src/tools/common/MobileLookup.tsx
import { useState, useCallback } from 'react'
import { Search, Copy, Trash2, Clock, Smartphone, Building2, Phone } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'

// ============================================================
// 手机号段数据库
// ============================================================

// 运营商类型
type Operator = '移动' | '联通' | '电信' | '未知'

// 运营商颜色
const OPERATOR_COLORS: Record<Operator, string> = {
  '移动': '#1a9f4e',
  '联通': '#0766b4',
  '电信': '#e33059',
  '未知': '#666'
}

// 省份/城市映射 (基于号段前7位)
const PREFIX_DATA: Record<string, { province: string; city: string; operator: Operator; areaCode: string; zipCode: string }> = {
  // 移动 134-139
  '1340000': { province: '广东', city: '深圳', operator: '移动', areaCode: '0755', zipCode: '518000' },
  '1340001': { province: '广东', city: '广州', operator: '移动', areaCode: '020', zipCode: '510000' },
  '1341000': { province: '北京', city: '北京', operator: '移动', areaCode: '010', zipCode: '100000' },
  '1342000': { province: '上海', city: '上海', operator: '移动', areaCode: '021', zipCode: '200000' },
  '1343000': { province: '广东', city: '广州', operator: '移动', areaCode: '020', zipCode: '510000' },
  '1344000': { province: '四川', city: '成都', operator: '移动', areaCode: '028', zipCode: '610000' },
  '1345000': { province: '浙江', city: '杭州', operator: '移动', areaCode: '0571', zipCode: '310000' },
  '1346000': { province: '河南', city: '郑州', operator: '移动', areaCode: '0371', zipCode: '450000' },
  '1347000': { province: '辽宁', city: '沈阳', operator: '移动', areaCode: '024', zipCode: '110000' },
  '1348000': { province: '江苏', city: '南京', operator: '移动', areaCode: '025', zipCode: '210000' },
  '1349000': { province: '湖北', city: '武汉', operator: '移动', areaCode: '027', zipCode: '430000' },
  '1350000': { province: '广东', city: '广州', operator: '移动', areaCode: '020', zipCode: '510000' },
  '1351000': { province: '广东', city: '深圳', operator: '移动', areaCode: '0755', zipCode: '518000' },
  '1352000': { province: '北京', city: '北京', operator: '移动', areaCode: '010', zipCode: '100000' },
  '1353000': { province: '上海', city: '上海', operator: '移动', areaCode: '021', zipCode: '200000' },
  '1354000': { province: '四川', city: '成都', operator: '移动', areaCode: '028', zipCode: '610000' },
  '1355000': { province: '浙江', city: '杭州', operator: '移动', areaCode: '0571', zipCode: '310000' },
  '1356000': { province: '广东', city: '广州', operator: '移动', areaCode: '020', zipCode: '510000' },
  '1357000': { province: '江苏', city: '南京', operator: '移动', areaCode: '025', zipCode: '210000' },
  '1358000': { province: '山东', city: '济南', operator: '移动', areaCode: '0531', zipCode: '250000' },
  '1359000': { province: '辽宁', city: '大连', operator: '移动', areaCode: '0411', zipCode: '116000' },
  '1360000': { province: '上海', city: '上海', operator: '移动', areaCode: '021', zipCode: '200000' },
  '1361000': { province: '广东', city: '深圳', operator: '移动', areaCode: '0755', zipCode: '518000' },
  '1362000': { province: '广东', city: '广州', operator: '移动', areaCode: '020', zipCode: '510000' },
  '1363000': { province: '北京', city: '北京', operator: '移动', areaCode: '010', zipCode: '100000' },
  '1364000': { province: '四川', city: '成都', operator: '移动', areaCode: '028', zipCode: '610000' },
  '1365000': { province: '重庆', city: '重庆', operator: '移动', areaCode: '023', zipCode: '400000' },
  '1366000': { province: '广东', city: '广州', operator: '移动', areaCode: '020', zipCode: '510000' },
  '1367000': { province: '浙江', city: '杭州', operator: '移动', areaCode: '0571', zipCode: '310000' },
  '1368000': { province: '陕西', city: '西安', operator: '移动', areaCode: '029', zipCode: '710000' },
  '1369000': { province: '福建', city: '福州', operator: '移动', areaCode: '0591', zipCode: '350000' },
  '1370000': { province: '广东', city: '广州', operator: '移动', areaCode: '020', zipCode: '510000' },
  '1371000': { province: '广东', city: '深圳', operator: '移动', areaCode: '0755', zipCode: '518000' },
  '1372000': { province: '北京', city: '北京', operator: '移动', areaCode: '010', zipCode: '100000' },
  '1373000': { province: '上海', city: '上海', operator: '移动', areaCode: '021', zipCode: '200000' },
  '1374000': { province: '江苏', city: '南京', operator: '移动', areaCode: '025', zipCode: '210000' },
  '1375000': { province: '四川', city: '成都', operator: '移动', areaCode: '028', zipCode: '610000' },
  '1376000': { province: '浙江', city: '杭州', operator: '移动', areaCode: '0571', zipCode: '310000' },
  '1377000': { province: '山东', city: '济南', operator: '移动', areaCode: '0531', zipCode: '250000' },
  '1378000': { province: '辽宁', city: '沈阳', operator: '移动', areaCode: '024', zipCode: '110000' },
  '1379000': { province: '湖北', city: '武汉', operator: '移动', areaCode: '027', zipCode: '430000' },
  '1380000': { province: '广东', city: '深圳', operator: '移动', areaCode: '0755', zipCode: '518000' },
  '1381000': { province: '北京', city: '北京', operator: '移动', areaCode: '010', zipCode: '100000' },
  '1382000': { province: '上海', city: '上海', operator: '移动', areaCode: '021', zipCode: '200000' },
  '1383000': { province: '广东', city: '广州', operator: '移动', areaCode: '020', zipCode: '510000' },
  '1384000': { province: '四川', city: '成都', operator: '移动', areaCode: '028', zipCode: '610000' },
  '1385000': { province: '浙江', city: '杭州', operator: '移动', areaCode: '0571', zipCode: '310000' },
  '1386000': { province: '江苏', city: '南京', operator: '移动', areaCode: '025', zipCode: '210000' },
  '1387000': { province: '重庆', city: '重庆', operator: '移动', areaCode: '023', zipCode: '400000' },
  '1388000': { province: '山东', city: '济南', operator: '移动', areaCode: '0531', zipCode: '250000' },
  '1389000': { province: '辽宁', city: '沈阳', operator: '移动', areaCode: '024', zipCode: '110000' },
  '1390000': { province: '广东', city: '广州', operator: '移动', areaCode: '020', zipCode: '510000' },
  '1391000': { province: '北京', city: '北京', operator: '移动', areaCode: '010', zipCode: '100000' },
  '1392000': { province: '上海', city: '上海', operator: '移动', areaCode: '021', zipCode: '200000' },
  '1393000': { province: '江苏', city: '南京', operator: '移动', areaCode: '025', zipCode: '210000' },
  '1394000': { province: '四川', city: '成都', operator: '移动', areaCode: '028', zipCode: '610000' },
  '1395000': { province: '浙江', city: '杭州', operator: '移动', areaCode: '0571', zipCode: '310000' },
  '1396000': { province: '广东', city: '深圳', operator: '移动', areaCode: '0755', zipCode: '518000' },
  '1397000': { province: '湖北', city: '武汉', operator: '移动', areaCode: '027', zipCode: '430000' },
  '1398000': { province: '陕西', city: '西安', operator: '移动', areaCode: '029', zipCode: '710000' },
  '1399000': { province: '河南', city: '郑州', operator: '移动', areaCode: '0371', zipCode: '450000' },

  // 移动 147
  '1470000': { province: '全国', city: '通用', operator: '移动', areaCode: '-', zipCode: '-' },
  '1471000': { province: '北京', city: '北京', operator: '移动', areaCode: '010', zipCode: '100000' },
  '1472000': { province: '上海', city: '上海', operator: '移动', areaCode: '021', zipCode: '200000' },
  '1473000': { province: '广东', city: '广州', operator: '移动', areaCode: '020', zipCode: '510000' },
  '1474000': { province: '四川', city: '成都', operator: '移动', areaCode: '028', zipCode: '610000' },
  '1475000': { province: '浙江', city: '杭州', operator: '移动', areaCode: '0571', zipCode: '310000' },
  '1476000': { province: '江苏', city: '南京', operator: '移动', areaCode: '025', zipCode: '210000' },
  '1477000': { province: '山东', city: '济南', operator: '移动', areaCode: '0531', zipCode: '250000' },
  '1478000': { province: '辽宁', city: '沈阳', operator: '移动', areaCode: '024', zipCode: '110000' },
  '1479000': { province: '湖北', city: '武汉', operator: '移动', areaCode: '027', zipCode: '430000' },

  // 移动 150-152
  '1500000': { province: '北京', city: '北京', operator: '移动', areaCode: '010', zipCode: '100000' },
  '1501000': { province: '上海', city: '上海', operator: '移动', areaCode: '021', zipCode: '200000' },
  '1502000': { province: '广东', city: '广州', operator: '移动', areaCode: '020', zipCode: '510000' },
  '1503000': { province: '辽宁', city: '沈阳', operator: '移动', areaCode: '024', zipCode: '110000' },
  '1504000': { province: '江苏', city: '南京', operator: '移动', areaCode: '025', zipCode: '210000' },
  '1505000': { province: '山东', city: '济南', operator: '移动', areaCode: '0531', zipCode: '250000' },
  '1506000': { province: '河南', city: '郑州', operator: '移动', areaCode: '0371', zipCode: '450000' },
  '1507000': { province: '四川', city: '成都', operator: '移动', areaCode: '028', zipCode: '610000' },
  '1508000': { province: '浙江', city: '杭州', operator: '移动', areaCode: '0571', zipCode: '310000' },
  '1509000': { province: '陕西', city: '西安', operator: '移动', areaCode: '029', zipCode: '710000' },
  '1510000': { province: '广东', city: '深圳', operator: '移动', areaCode: '0755', zipCode: '518000' },
  '1511000': { province: '湖北', city: '武汉', operator: '移动', areaCode: '027', zipCode: '430000' },
  '1512000': { province: '黑龙江', city: '哈尔滨', operator: '移动', areaCode: '0451', zipCode: '150000' },
  '1513000': { province: '吉林', city: '长春', operator: '移动', areaCode: '0431', zipCode: '130000' },
  '1514000': { province: '辽宁', city: '大连', operator: '移动', areaCode: '0411', zipCode: '116000' },
  '1515000': { province: '福建', city: '福州', operator: '移动', areaCode: '0591', zipCode: '350000' },
  '1516000': { province: '湖南', city: '长沙', operator: '移动', areaCode: '0731', zipCode: '410000' },
  '1517000': { province: '安徽', city: '合肥', operator: '移动', areaCode: '0551', zipCode: '230000' },
  '1518000': { province: '河北', city: '石家庄', operator: '移动', areaCode: '0311', zipCode: '050000' },
  '1519000': { province: '云南', city: '昆明', operator: '移动', areaCode: '0871', zipCode: '650000' },
  '1520000': { province: '北京', city: '北京', operator: '移动', areaCode: '010', zipCode: '100000' },
  '1521000': { province: '上海', city: '上海', operator: '移动', areaCode: '021', zipCode: '200000' },
  '1522000': { province: '广东', city: '广州', operator: '移动', areaCode: '020', zipCode: '510000' },
  '1523000': { province: '四川', city: '成都', operator: '移动', areaCode: '028', zipCode: '610000' },
  '1524000': { province: '江苏', city: '南京', operator: '移动', areaCode: '025', zipCode: '210000' },
  '1525000': { province: '浙江', city: '杭州', operator: '移动', areaCode: '0571', zipCode: '310000' },
  '1526000': { province: '山东', city: '济南', operator: '移动', areaCode: '0531', zipCode: '250000' },
  '1527000': { province: '辽宁', city: '沈阳', operator: '移动', areaCode: '024', zipCode: '110000' },
  '1528000': { province: '重庆', city: '重庆', operator: '移动', areaCode: '023', zipCode: '400000' },
  '1529000': { province: '湖北', city: '武汉', operator: '移动', areaCode: '027', zipCode: '430000' },

  // 移动 157, 158, 159, 172, 178
  '1570000': { province: '全国', city: '通用', operator: '移动', areaCode: '-', zipCode: '-' },
  '1580000': { province: '北京', city: '北京', operator: '移动', areaCode: '010', zipCode: '100000' },
  '1581000': { province: '上海', city: '上海', operator: '移动', areaCode: '021', zipCode: '200000' },
  '1582000': { province: '广东', city: '广州', operator: '移动', areaCode: '020', zipCode: '510000' },
  '1583000': { province: '辽宁', city: '沈阳', operator: '移动', areaCode: '024', zipCode: '110000' },
  '1584000': { province: '江苏', city: '南京', operator: '移动', areaCode: '025', zipCode: '210000' },
  '1585000': { province: '四川', city: '成都', operator: '移动', areaCode: '028', zipCode: '610000' },
  '1586000': { province: '浙江', city: '杭州', operator: '移动', areaCode: '0571', zipCode: '310000' },
  '1587000': { province: '湖北', city: '武汉', operator: '移动', areaCode: '027', zipCode: '430000' },
  '1588000': { province: '广东', city: '深圳', operator: '移动', areaCode: '0755', zipCode: '518000' },
  '1589000': { province: '陕西', city: '西安', operator: '移动', areaCode: '029', zipCode: '710000' },
  '1590000': { province: '广东', city: '广州', operator: '移动', areaCode: '020', zipCode: '510000' },
  '1591000': { province: '北京', city: '北京', operator: '移动', areaCode: '010', zipCode: '100000' },
  '1592000': { province: '上海', city: '上海', operator: '移动', areaCode: '021', zipCode: '200000' },
  '1593000': { province: '江苏', city: '南京', operator: '移动', areaCode: '025', zipCode: '210000' },
  '1594000': { province: '四川', city: '成都', operator: '移动', areaCode: '028', zipCode: '610000' },
  '1595000': { province: '浙江', city: '杭州', operator: '移动', areaCode: '0571', zipCode: '310000' },
  '1596000': { province: '广东', city: '深圳', operator: '移动', areaCode: '0755', zipCode: '518000' },
  '1597000': { province: '山东', city: '济南', operator: '移动', areaCode: '0531', zipCode: '250000' },
  '1598000': { province: '辽宁', city: '沈阳', operator: '移动', areaCode: '024', zipCode: '110000' },
  '1599000': { province: '湖北', city: '武汉', operator: '移动', areaCode: '027', zipCode: '430000' },
  '1720000': { province: '全国', city: '通用', operator: '移动', areaCode: '-', zipCode: '-' },
  '1780000': { province: '全国', city: '通用', operator: '移动', areaCode: '-', zipCode: '-' },

  // 移动 182, 183, 184
  '1820000': { province: '四川', city: '成都', operator: '移动', areaCode: '028', zipCode: '610000' },
  '1821000': { province: '广东', city: '广州', operator: '移动', areaCode: '020', zipCode: '510000' },
  '1822000': { province: '江苏', city: '南京', operator: '移动', areaCode: '025', zipCode: '210000' },
  '1823000': { province: '浙江', city: '杭州', operator: '移动', areaCode: '0571', zipCode: '310000' },
  '1824000': { province: '山东', city: '济南', operator: '移动', areaCode: '0531', zipCode: '250000' },
  '1825000': { province: '湖北', city: '武汉', operator: '移动', areaCode: '027', zipCode: '430000' },
  '1826000': { province: '陕西', city: '西安', operator: '移动', areaCode: '029', zipCode: '710000' },
  '1827000': { province: '湖南', city: '长沙', operator: '移动', areaCode: '0731', zipCode: '410000' },
  '1828000': { province: '安徽', city: '合肥', operator: '移动', areaCode: '0551', zipCode: '230000' },
  '1829000': { province: '云南', city: '昆明', operator: '移动', areaCode: '0871', zipCode: '650000' },
  '1830000': { province: '上海', city: '上海', operator: '移动', areaCode: '021', zipCode: '200000' },
  '1831000': { province: '广东', city: '深圳', operator: '移动', areaCode: '0755', zipCode: '518000' },
  '1832000': { province: '北京', city: '北京', operator: '移动', areaCode: '010', zipCode: '100000' },
  '1833000': { province: '辽宁', city: '沈阳', operator: '移动', areaCode: '024', zipCode: '110000' },
  '1834000': { province: '河南', city: '郑州', operator: '移动', areaCode: '0371', zipCode: '450000' },
  '1835000': { province: '黑龙江', city: '哈尔滨', operator: '移动', areaCode: '0451', zipCode: '150000' },
  '1836000': { province: '福建', city: '福州', operator: '移动', areaCode: '0591', zipCode: '350000' },
  '1837000': { province: '吉林', city: '长春', operator: '移动', areaCode: '0431', zipCode: '130000' },
  '1838000': { province: '江西', city: '南昌', operator: '移动', areaCode: '0791', zipCode: '330000' },
  '1839000': { province: '重庆', city: '重庆', operator: '移动', areaCode: '023', zipCode: '400000' },
  '1840000': { province: '全国', city: '通用', operator: '移动', areaCode: '-', zipCode: '-' },

  // 移动 187, 188
  '1870000': { province: '上海', city: '上海', operator: '移动', areaCode: '021', zipCode: '200000' },
  '1871000': { province: '北京', city: '北京', operator: '移动', areaCode: '010', zipCode: '100000' },
  '1872000': { province: '广东', city: '广州', operator: '移动', areaCode: '020', zipCode: '510000' },
  '1873000': { province: '江苏', city: '南京', operator: '移动', areaCode: '025', zipCode: '210000' },
  '1874000': { province: '四川', city: '成都', operator: '移动', areaCode: '028', zipCode: '610000' },
  '1875000': { province: '浙江', city: '杭州', operator: '移动', areaCode: '0571', zipCode: '310000' },
  '1876000': { province: '山东', city: '济南', operator: '移动', areaCode: '0531', zipCode: '250000' },
  '1877000': { province: '辽宁', city: '沈阳', operator: '移动', areaCode: '024', zipCode: '110000' },
  '1878000': { province: '湖北', city: '武汉', operator: '移动', areaCode: '027', zipCode: '430000' },
  '1879000': { province: '广东', city: '深圳', operator: '移动', areaCode: '0755', zipCode: '518000' },
  '1880000': { province: '广东', city: '广州', operator: '移动', areaCode: '020', zipCode: '510000' },
  '1881000': { province: '上海', city: '上海', operator: '移动', areaCode: '021', zipCode: '200000' },
  '1882000': { province: '北京', city: '北京', operator: '移动', areaCode: '010', zipCode: '100000' },
  '1883000': { province: '江苏', city: '南京', operator: '移动', areaCode: '025', zipCode: '210000' },
  '1884000': { province: '浙江', city: '杭州', operator: '移动', areaCode: '0571', zipCode: '310000' },
  '1885000': { province: '四川', city: '成都', operator: '移动', areaCode: '028', zipCode: '610000' },
  '1886000': { province: '福建', city: '福州', operator: '移动', areaCode: '0591', zipCode: '350000' },
  '1887000': { province: '辽宁', city: '沈阳', operator: '移动', areaCode: '024', zipCode: '110000' },
  '1888000': { province: '山东', city: '济南', operator: '移动', areaCode: '0531', zipCode: '250000' },
  '1889000': { province: '陕西', city: '西安', operator: '移动', areaCode: '029', zipCode: '710000' },

  // 移动 195, 197, 198
  '1950000': { province: '全国', city: '通用', operator: '移动', areaCode: '-', zipCode: '-' },
  '1970000': { province: '全国', city: '通用', operator: '移动', areaCode: '-', zipCode: '-' },
  '1980000': { province: '全国', city: '通用', operator: '移动', areaCode: '-', zipCode: '-' },
  '1981000': { province: '北京', city: '北京', operator: '移动', areaCode: '010', zipCode: '100000' },
  '1982000': { province: '上海', city: '上海', operator: '移动', areaCode: '021', zipCode: '200000' },
  '1983000': { province: '广东', city: '广州', operator: '移动', areaCode: '020', zipCode: '510000' },
  '1984000': { province: '四川', city: '成都', operator: '移动', areaCode: '028', zipCode: '610000' },
  '1985000': { province: '浙江', city: '杭州', operator: '移动', areaCode: '0571', zipCode: '310000' },
  '1986000': { province: '江苏', city: '南京', operator: '移动', areaCode: '025', zipCode: '210000' },
  '1987000': { province: '山东', city: '济南', operator: '移动', areaCode: '0531', zipCode: '250000' },
  '1988000': { province: '湖北', city: '武汉', operator: '移动', areaCode: '027', zipCode: '430000' },
  '1989000': { province: '广东', city: '深圳', operator: '移动', areaCode: '0755', zipCode: '518000' },

  // 联通 130-132
  '1300000': { province: '北京', city: '北京', operator: '联通', areaCode: '010', zipCode: '100000' },
  '1301000': { province: '河北', city: '石家庄', operator: '联通', areaCode: '0311', zipCode: '050000' },
  '1302000': { province: '上海', city: '上海', operator: '联通', areaCode: '021', zipCode: '200000' },
  '1303000': { province: '辽宁', city: '沈阳', operator: '联通', areaCode: '024', zipCode: '110000' },
  '1304000': { province: '广东', city: '广州', operator: '联通', areaCode: '020', zipCode: '510000' },
  '1305000': { province: '江苏', city: '南京', operator: '联通', areaCode: '025', zipCode: '210000' },
  '1306000': { province: '天津', city: '天津', operator: '联通', areaCode: '022', zipCode: '300000' },
  '1307000': { province: '黑龙江', city: '哈尔滨', operator: '联通', areaCode: '0451', zipCode: '150000' },
  '1308000': { province: '四川', city: '成都', operator: '联通', areaCode: '028', zipCode: '610000' },
  '1309000': { province: '陕西', city: '西安', operator: '联通', areaCode: '029', zipCode: '710000' },
  '1310000': { province: '广东', city: '深圳', operator: '联通', areaCode: '0755', zipCode: '518000' },
  '1311000': { province: '山东', city: '济南', operator: '联通', areaCode: '0531', zipCode: '250000' },
  '1312000': { province: '北京', city: '北京', operator: '联通', areaCode: '010', zipCode: '100000' },
  '1313000': { province: '吉林', city: '长春', operator: '联通', areaCode: '0431', zipCode: '130000' },
  '1314000': { province: '河南', city: '郑州', operator: '联通', areaCode: '0371', zipCode: '450000' },
  '1315000': { province: '辽宁', city: '大连', operator: '联通', areaCode: '0411', zipCode: '116000' },
  '1316000': { province: '江苏', city: '苏州', operator: '联通', areaCode: '0512', zipCode: '215000' },
  '1317000': { province: '浙江', city: '杭州', operator: '联通', areaCode: '0571', zipCode: '310000' },
  '1318000': { province: '湖北', city: '武汉', operator: '联通', areaCode: '027', zipCode: '430000' },
  '1319000': { province: '湖南', city: '长沙', operator: '联通', areaCode: '0731', zipCode: '410000' },
  '1320000': { province: '上海', city: '上海', operator: '联通', areaCode: '021', zipCode: '200000' },
  '1321000': { province: '广东', city: '广州', operator: '联通', areaCode: '020', zipCode: '510000' },
  '1322000': { province: '北京', city: '北京', operator: '联通', areaCode: '010', zipCode: '100000' },
  '1323000': { province: '四川', city: '成都', operator: '联通', areaCode: '028', zipCode: '610000' },
  '1324000': { province: '浙江', city: '宁波', operator: '联通', areaCode: '0574', zipCode: '315000' },
  '1325000': { province: '江苏', city: '南京', operator: '联通', areaCode: '025', zipCode: '210000' },
  '1326000': { province: '福建', city: '厦门', operator: '联通', areaCode: '0592', zipCode: '361000' },
  '1327000': { province: '山东', city: '青岛', operator: '联通', areaCode: '0532', zipCode: '266000' },
  '1328000': { province: '辽宁', city: '沈阳', operator: '联通', areaCode: '024', zipCode: '110000' },
  '1329000': { province: '黑龙江', city: '哈尔滨', operator: '联通', areaCode: '0451', zipCode: '150000' },

  // 联通 145, 155, 156
  '1450000': { province: '全国', city: '通用', operator: '联通', areaCode: '-', zipCode: '-' },
  '1550000': { province: '北京', city: '北京', operator: '联通', areaCode: '010', zipCode: '100000' },
  '1551000': { province: '上海', city: '上海', operator: '联通', areaCode: '021', zipCode: '200000' },
  '1552000': { province: '辽宁', city: '沈阳', operator: '联通', areaCode: '024', zipCode: '110000' },
  '1553000': { province: '河北', city: '石家庄', operator: '联通', areaCode: '0311', zipCode: '050000' },
  '1554000': { province: '吉林', city: '长春', operator: '联通', areaCode: '0431', zipCode: '130000' },
  '1555000': { province: '江苏', city: '南京', operator: '联通', areaCode: '025', zipCode: '210000' },
  '1556000': { province: '山东', city: '济南', operator: '联通', areaCode: '0531', zipCode: '250000' },
  '1557000': { province: '广东', city: '广州', operator: '联通', areaCode: '020', zipCode: '510000' },
  '1558000': { province: '黑龙江', city: '哈尔滨', operator: '联通', areaCode: '0451', zipCode: '150000' },
  '1559000': { province: '内蒙古', city: '呼和浩特', operator: '联通', areaCode: '0471', zipCode: '010000' },
  '1560000': { province: '北京', city: '北京', operator: '联通', areaCode: '010', zipCode: '100000' },
  '1561000': { province: '上海', city: '上海', operator: '联通', areaCode: '021', zipCode: '200000' },
  '1562000': { province: '广东', city: '广州', operator: '联通', areaCode: '020', zipCode: '510000' },
  '1563000': { province: '吉林', city: '长春', operator: '联通', areaCode: '0431', zipCode: '130000' },
  '1564000': { province: '辽宁', city: '沈阳', operator: '联通', areaCode: '024', zipCode: '110000' },
  '1565000': { province: '四川', city: '成都', operator: '联通', areaCode: '028', zipCode: '610000' },
  '1566000': { province: '浙江', city: '杭州', operator: '联通', areaCode: '0571', zipCode: '310000' },
  '1567000': { province: '江苏', city: '南京', operator: '联通', areaCode: '025', zipCode: '210000' },
  '1568000': { province: '山东', city: '济南', operator: '联通', areaCode: '0531', zipCode: '250000' },
  '1569000': { province: '湖北', city: '武汉', operator: '联通', areaCode: '027', zipCode: '430000' },

  // 联通 166, 175, 176, 185, 186, 196
  '1660000': { province: '全国', city: '通用', operator: '联通', areaCode: '-', zipCode: '-' },
  '1750000': { province: '全国', city: '通用', operator: '联通', areaCode: '-', zipCode: '-' },
  '1760000': { province: '北京', city: '北京', operator: '联通', areaCode: '010', zipCode: '100000' },
  '1761000': { province: '上海', city: '上海', operator: '联通', areaCode: '021', zipCode: '200000' },
  '1762000': { province: '广东', city: '广州', operator: '联通', areaCode: '020', zipCode: '510000' },
  '1763000': { province: '江苏', city: '南京', operator: '联通', areaCode: '025', zipCode: '210000' },
  '1764000': { province: '四川', city: '成都', operator: '联通', areaCode: '028', zipCode: '610000' },
  '1765000': { province: '浙江', city: '杭州', operator: '联通', areaCode: '0571', zipCode: '310000' },
  '1766000': { province: '山东', city: '济南', operator: '联通', areaCode: '0531', zipCode: '250000' },
  '1767000': { province: '辽宁', city: '沈阳', operator: '联通', areaCode: '024', zipCode: '110000' },
  '1768000': { province: '湖北', city: '武汉', operator: '联通', areaCode: '027', zipCode: '430000' },
  '1769000': { province: '陕西', city: '西安', operator: '联通', areaCode: '029', zipCode: '710000' },
  '1850000': { province: '北京', city: '北京', operator: '联通', areaCode: '010', zipCode: '100000' },
  '1851000': { province: '上海', city: '上海', operator: '联通', areaCode: '021', zipCode: '200000' },
  '1852000': { province: '广东', city: '广州', operator: '联通', areaCode: '020', zipCode: '510000' },
  '1853000': { province: '四川', city: '成都', operator: '联通', areaCode: '028', zipCode: '610000' },
  '1854000': { province: '江苏', city: '南京', operator: '联通', areaCode: '025', zipCode: '210000' },
  '1855000': { province: '浙江', city: '杭州', operator: '联通', areaCode: '0571', zipCode: '310000' },
  '1856000': { province: '辽宁', city: '沈阳', operator: '联通', areaCode: '024', zipCode: '110000' },
  '1857000': { province: '山东', city: '济南', operator: '联通', areaCode: '0531', zipCode: '250000' },
  '1858000': { province: '湖北', city: '武汉', operator: '联通', areaCode: '027', zipCode: '430000' },
  '1859000': { province: '黑龙江', city: '哈尔滨', operator: '联通', areaCode: '0451', zipCode: '150000' },
  '1860000': { province: '上海', city: '上海', operator: '联通', areaCode: '021', zipCode: '200000' },
  '1861000': { province: '北京', city: '北京', operator: '联通', areaCode: '010', zipCode: '100000' },
  '1862000': { province: '广东', city: '深圳', operator: '联通', areaCode: '0755', zipCode: '518000' },
  '1863000': { province: '江苏', city: '南京', operator: '联通', areaCode: '025', zipCode: '210000' },
  '1864000': { province: '浙江', city: '杭州', operator: '联通', areaCode: '0571', zipCode: '310000' },
  '1865000': { province: '四川', city: '成都', operator: '联通', areaCode: '028', zipCode: '610000' },
  '1866000': { province: '辽宁', city: '沈阳', operator: '联通', areaCode: '024', zipCode: '110000' },
  '1867000': { province: '山东', city: '济南', operator: '联通', areaCode: '0531', zipCode: '250000' },
  '1868000': { province: '湖北', city: '武汉', operator: '联通', areaCode: '027', zipCode: '430000' },
  '1869000': { province: '陕西', city: '西安', operator: '联通', areaCode: '029', zipCode: '710000' },
  '1960000': { province: '全国', city: '通用', operator: '联通', areaCode: '-', zipCode: '-' },

  // 电信 133, 149, 153, 173, 177, 180, 181, 189, 191, 193, 199
  '1330000': { province: '北京', city: '北京', operator: '电信', areaCode: '010', zipCode: '100000' },
  '1331000': { province: '上海', city: '上海', operator: '电信', areaCode: '021', zipCode: '200000' },
  '1332000': { province: '广东', city: '广州', operator: '电信', areaCode: '020', zipCode: '510000' },
  '1333000': { province: '四川', city: '成都', operator: '电信', areaCode: '028', zipCode: '610000' },
  '1334000': { province: '江苏', city: '南京', operator: '电信', areaCode: '025', zipCode: '210000' },
  '1335000': { province: '浙江', city: '杭州', operator: '电信', areaCode: '0571', zipCode: '310000' },
  '1336000': { province: '山东', city: '济南', operator: '电信', areaCode: '0531', zipCode: '250000' },
  '1337000': { province: '辽宁', city: '沈阳', operator: '电信', areaCode: '024', zipCode: '110000' },
  '1338000': { province: '湖北', city: '武汉', operator: '电信', areaCode: '027', zipCode: '430000' },
  '1339000': { province: '陕西', city: '西安', operator: '电信', areaCode: '029', zipCode: '710000' },
  '1490000': { province: '全国', city: '通用', operator: '电信', areaCode: '-', zipCode: '-' },
  '1530000': { province: '北京', city: '北京', operator: '电信', areaCode: '010', zipCode: '100000' },
  '1531000': { province: '上海', city: '上海', operator: '电信', areaCode: '021', zipCode: '200000' },
  '1532000': { province: '广东', city: '广州', operator: '电信', areaCode: '020', zipCode: '510000' },
  '1533000': { province: '四川', city: '成都', operator: '电信', areaCode: '028', zipCode: '610000' },
  '1534000': { province: '江苏', city: '南京', operator: '电信', areaCode: '025', zipCode: '210000' },
  '1535000': { province: '浙江', city: '杭州', operator: '电信', areaCode: '0571', zipCode: '310000' },
  '1536000': { province: '山东', city: '济南', operator: '电信', areaCode: '0531', zipCode: '250000' },
  '1537000': { province: '辽宁', city: '沈阳', operator: '电信', areaCode: '024', zipCode: '110000' },
  '1538000': { province: '湖北', city: '武汉', operator: '电信', areaCode: '027', zipCode: '430000' },
  '1539000': { province: '陕西', city: '西安', operator: '电信', areaCode: '029', zipCode: '710000' },
  '1730000': { province: '全国', city: '通用', operator: '电信', areaCode: '-', zipCode: '-' },
  '1770000': { province: '上海', city: '上海', operator: '电信', areaCode: '021', zipCode: '200000' },
  '1771000': { province: '北京', city: '北京', operator: '电信', areaCode: '010', zipCode: '100000' },
  '1772000': { province: '广东', city: '广州', operator: '电信', areaCode: '020', zipCode: '510000' },
  '1773000': { province: '江苏', city: '南京', operator: '电信', areaCode: '025', zipCode: '210000' },
  '1774000': { province: '四川', city: '成都', operator: '电信', areaCode: '028', zipCode: '610000' },
  '1775000': { province: '浙江', city: '杭州', operator: '电信', areaCode: '0571', zipCode: '310000' },
  '1776000': { province: '山东', city: '济南', operator: '电信', areaCode: '0531', zipCode: '250000' },
  '1777000': { province: '辽宁', city: '沈阳', operator: '电信', areaCode: '024', zipCode: '110000' },
  '1778000': { province: '湖北', city: '武汉', operator: '电信', areaCode: '027', zipCode: '430000' },
  '1779000': { province: '陕西', city: '西安', operator: '电信', areaCode: '029', zipCode: '710000' },
  '1800000': { province: '上海', city: '上海', operator: '电信', areaCode: '021', zipCode: '200000' },
  '1801000': { province: '北京', city: '北京', operator: '电信', areaCode: '010', zipCode: '100000' },
  '1802000': { province: '广东', city: '广州', operator: '电信', areaCode: '020', zipCode: '510000' },
  '1803000': { province: '江苏', city: '南京', operator: '电信', areaCode: '025', zipCode: '210000' },
  '1804000': { province: '四川', city: '成都', operator: '电信', areaCode: '028', zipCode: '610000' },
  '1805000': { province: '浙江', city: '杭州', operator: '电信', areaCode: '0571', zipCode: '310000' },
  '1806000': { province: '辽宁', city: '沈阳', operator: '电信', areaCode: '024', zipCode: '110000' },
  '1807000': { province: '山东', city: '济南', operator: '电信', areaCode: '0531', zipCode: '250000' },
  '1808000': { province: '湖北', city: '武汉', operator: '电信', areaCode: '027', zipCode: '430000' },
  '1809000': { province: '陕西', city: '西安', operator: '电信', areaCode: '029', zipCode: '710000' },
  '1810000': { province: '上海', city: '上海', operator: '电信', areaCode: '021', zipCode: '200000' },
  '1811000': { province: '北京', city: '北京', operator: '电信', areaCode: '010', zipCode: '100000' },
  '1812000': { province: '广东', city: '广州', operator: '电信', areaCode: '020', zipCode: '510000' },
  '1813000': { province: '四川', city: '成都', operator: '电信', areaCode: '028', zipCode: '610000' },
  '1814000': { province: '江苏', city: '南京', operator: '电信', areaCode: '025', zipCode: '210000' },
  '1815000': { province: '浙江', city: '杭州', operator: '电信', areaCode: '0571', zipCode: '310000' },
  '1816000': { province: '辽宁', city: '沈阳', operator: '电信', areaCode: '024', zipCode: '110000' },
  '1817000': { province: '山东', city: '济南', operator: '电信', areaCode: '0531', zipCode: '250000' },
  '1818000': { province: '湖北', city: '武汉', operator: '电信', areaCode: '027', zipCode: '430000' },
  '1819000': { province: '陕西', city: '西安', operator: '电信', areaCode: '029', zipCode: '710000' },
  '1890000': { province: '广东', city: '广州', operator: '电信', areaCode: '020', zipCode: '510000' },
  '1891000': { province: '北京', city: '北京', operator: '电信', areaCode: '010', zipCode: '100000' },
  '1892000': { province: '上海', city: '上海', operator: '电信', areaCode: '021', zipCode: '200000' },
  '1893000': { province: '江苏', city: '南京', operator: '电信', areaCode: '025', zipCode: '210000' },
  '1894000': { province: '浙江', city: '杭州', operator: '电信', areaCode: '0571', zipCode: '310000' },
  '1895000': { province: '四川', city: '成都', operator: '电信', areaCode: '028', zipCode: '610000' },
  '1896000': { province: '福建', city: '福州', operator: '电信', areaCode: '0591', zipCode: '350000' },
  '1897000': { province: '辽宁', city: '沈阳', operator: '电信', areaCode: '024', zipCode: '110000' },
  '1898000': { province: '山东', city: '济南', operator: '电信', areaCode: '0531', zipCode: '250000' },
  '1899000': { province: '湖北', city: '武汉', operator: '电信', areaCode: '027', zipCode: '430000' },
  '1910000': { province: '全国', city: '通用', operator: '电信', areaCode: '-', zipCode: '-' },
  '1930000': { province: '全国', city: '通用', operator: '电信', areaCode: '-', zipCode: '-' },
  '1990000': { province: '全国', city: '通用', operator: '电信', areaCode: '-', zipCode: '-' },
  '1991000': { province: '北京', city: '北京', operator: '电信', areaCode: '010', zipCode: '100000' },
  '1992000': { province: '上海', city: '上海', operator: '电信', areaCode: '021', zipCode: '200000' },
  '1993000': { province: '广东', city: '广州', operator: '电信', areaCode: '020', zipCode: '510000' },
  '1994000': { province: '四川', city: '成都', operator: '电信', areaCode: '028', zipCode: '610000' },
  '1995000': { province: '浙江', city: '杭州', operator: '电信', areaCode: '0571', zipCode: '310000' },
  '1996000': { province: '江苏', city: '南京', operator: '电信', areaCode: '025', zipCode: '210000' },
  '1997000': { province: '山东', city: '济南', operator: '电信', areaCode: '0531', zipCode: '250000' },
  '1998000': { province: '辽宁', city: '沈阳', operator: '电信', areaCode: '024', zipCode: '110000' },
  '1999000': { province: '湖北', city: '武汉', operator: '电信', areaCode: '027', zipCode: '430000' },
}

// API地址
const PHONE_API_URL = '/phone-api'

async function lookupPhoneByAPI(phone: string): Promise<LookupResult | null> {
  try {
    const response = await fetch(`${PHONE_API_URL}?dataSource=PHONE_NUMBER_LOCATION&phoneNumber=${phone}`, {
      method: 'GET',
    })
    
    if (!response.ok) {
      return null
    }
    
    const data = await response.json()
    
    if (data.code === 200 && data.data) {
      const d = data.data
      // 映射运营商
      let operator: Operator = '未知'
      const carrier = d.carrier || ''
      if (carrier.includes('移动')) operator = '移动'
      else if (carrier.includes('联通')) operator = '联通'
      else if (carrier.includes('电信')) operator = '电信'
      
      return {
        phone,
        prefix: d.numberPrefix || phone.substring(0, 7),
        province: d.province || '',
        city: d.city || '',
        operator,
        areaCode: d.areaCode || '',
        zipCode: d.postalCode || '',
        valid: true,
        fromAPI: true,
      }
    }
    
    return null
  } catch (error) {
    console.error('API lookup failed:', error)
    return null
  }
}

interface LookupResult {
  phone: string
  prefix: string
  province: string
  city: string
  operator: Operator
  areaCode: string
  zipCode: string
  valid: boolean
  fromAPI?: boolean
}

interface HistoryItem {
  phone: string
  result: LookupResult
  timestamp: number
}

// ============================================================
// 工具函数
// ============================================================

function validatePhone(phone: string): boolean {
  return /^\d{11}$/.test(phone)
}

function getOperatorFromPrefix(prefix: string): Operator {
  const first3 = prefix.substring(0, 3)

  // 移动
  if (/^134|135|136|137|138|139$/.test(first3)) return '移动'
  if (/^147$/.test(first3)) return '移动'
  if (/^150|151|152$/.test(first3)) return '移动'
  if (/^157|158|159$/.test(first3)) return '移动'
  if (/^172$/.test(first3)) return '移动'
  if (/^178$/.test(first3)) return '移动'
  if (/^182|183|184$/.test(first3)) return '移动'
  if (/^187|188$/.test(first3)) return '移动'
  if (/^195$/.test(first3)) return '移动'
  if (/^197$/.test(first3)) return '移动'
  if (/^198$/.test(first3)) return '移动'

  // 联通
  if (/^130|131|132$/.test(first3)) return '联通'
  if (/^145$/.test(first3)) return '联通'
  if (/^155|156$/.test(first3)) return '联通'
  if (/^166$/.test(first3)) return '联通'
  if (/^175|176$/.test(first3)) return '联通'
  if (/^185|186$/.test(first3)) return '联通'
  if (/^196$/.test(first3)) return '联通'

  // 电信
  if (/^133$/.test(first3)) return '电信'
  if (/^149$/.test(first3)) return '电信'
  if (/^153$/.test(first3)) return '电信'
  if (/^173$/.test(first3)) return '电信'
  if (/^177$/.test(first3)) return '电信'
  if (/^180|181$/.test(first3)) return '电信'
  if (/^189$/.test(first3)) return '电信'
  if (/^191$/.test(first3)) return '电信'
  if (/^193$/.test(first3)) return '电信'
  if (/^199$/.test(first3)) return '电信'

  return '未知'
}

function lookupPhone(phone: string): LookupResult {
  if (!validatePhone(phone)) {
    return {
      phone,
      prefix: '',
      province: '',
      city: '',
      operator: '未知',
      areaCode: '',
      zipCode: '',
      valid: false
    }
  }

  // 尝试7位号段匹配
  const prefix7 = phone.substring(0, 7)
  if (PREFIX_DATA[prefix7]) {
    const data = PREFIX_DATA[prefix7]
    return {
      phone,
      prefix: prefix7,
      province: data.province,
      city: data.city,
      operator: data.operator,
      areaCode: data.areaCode,
      zipCode: data.zipCode,
      valid: true
    }
  }

  // 尝试4位号段匹配
  const prefix4 = phone.substring(0, 4)
  if (PREFIX_DATA[prefix4 + '000']) {
    const data = PREFIX_DATA[prefix4 + '000']
    return {
      phone,
      prefix: prefix4,
      province: data.province,
      city: data.city,
      operator: data.operator,
      areaCode: data.areaCode,
      zipCode: data.zipCode,
      valid: true
    }
  }

  // 尝试3位号段匹配
  const prefix3 = phone.substring(0, 3)
  const operator = getOperatorFromPrefix(prefix3)
  
  if (operator !== '未知') {
    return {
      phone,
      prefix: prefix3,
      province: '全国',
      city: '通用',
      operator,
      areaCode: '-',
      zipCode: '-',
      valid: true
    }
  }

  return {
    phone,
    prefix: '',
    province: '',
    city: '',
    operator: '未知',
    areaCode: '',
    zipCode: '',
    valid: false
  }
}

// ============================================================
// 组件
// ============================================================

export default function MobileLookup() {
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<'single' | 'batch'>('single')
  const [results, setResults] = useState<LookupResult[]>([])
  const [copied, setCopied] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 初始化历史记录（从 localStorage 懒加载）
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('mobile-lookup-history')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // 保存历史记录
  const saveHistory = useCallback((items: HistoryItem[]) => {
    setHistory(items)
    localStorage.setItem('mobile-lookup-history', JSON.stringify(items))
  }, [])

  // 查询
  const handleLookup = useCallback(async () => {
    if (!input.trim()) return

    setLoading(true)
    setError(null)

    try {
      let newResults: LookupResult[] = []

      if (mode === 'single') {
        const phone = input.trim()
        const apiResult = await lookupPhoneByAPI(phone)
        if (apiResult) {
          newResults = [apiResult]
        } else {
          newResults = [lookupPhone(phone)]
        }
      } else {
        const phones = input
          .split(/[\n,]/)
          .map(p => p.trim())
          .filter(p => p.length > 0)
          .slice(0, 100)

        const apiPromises = phones.map(phone => lookupPhoneByAPI(phone))
        const apiResults = await Promise.all(apiPromises)
        
        newResults = phones.map((phone, idx) => {
          const apiResult = apiResults[idx]
          if (apiResult) {
            return apiResult
          }
          return lookupPhone(phone)
        })
      }

      setResults(newResults)

      const newHistory: HistoryItem[] = newResults
        .filter(r => r.valid)
        .map(result => ({
          phone: result.phone,
          result,
          timestamp: Date.now()
        }))

      if (newHistory.length > 0) {
        const existingPhones = new Set(newHistory.map(h => h.phone))
        const filteredHistory = history.filter(h => !existingPhones.has(h.phone))
        const updatedHistory = [...newHistory, ...filteredHistory].slice(0, 50)
        saveHistory(updatedHistory)
      }
    } catch (err) {
      setError('查询失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }, [input, mode, history, saveHistory])

  // 复制结果
  const copyResult = useCallback((result: LookupResult) => {
    const text = `${result.phone} ${result.province} ${result.city} ${result.operator} 区号:${result.areaCode} 邮编:${result.zipCode}`
    navigator.clipboard.writeText(text)
    setCopied(result.phone)
    setTimeout(() => setCopied(null), 2000)
  }, [])

  // 清除历史
  const clearHistory = useCallback(() => {
    saveHistory([])
  }, [saveHistory])

  // 从历史恢复
  const restoreFromHistory = useCallback((phone: string) => {
    setInput(phone)
    setMode('single')
  }, [])

  return (
    <ToolLayout 
      title="手机号归属地查询" 
      description="查询手机号码的省份、城市、运营商、区号和邮编信息，支持批量查询"
    >
      {/* 模式切换 */}
      <div className="btn-group">
        <button
          className={`btn ${mode === 'single' ? '' : 'btn-outline'}`}
          onClick={() => setMode('single')}
        >
          单号查询
        </button>
        <button
          className={`btn ${mode === 'batch' ? '' : 'btn-outline'}`}
          onClick={() => setMode('batch')}
        >
          批量查询
        </button>
      </div>

      {/* 输入区域 */}
      <div style={{ marginBottom: 16 }}>
        <label className="tool-label">
          {mode === 'single' ? '请输入手机号码' : '请输入手机号码（每行一个，最多100个）'}
        </label>
        {mode === 'single' ? (
          <input
            type="text"
            className="input"
            placeholder="请输入11位手机号码，如：13800138000"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
            maxLength={11}
            style={{ width: '100%' }}
          />
        ) : (
          <textarea
            className="textarea"
            placeholder="13800138000&#10;13900139000&#10;..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{ width: '100%', minHeight: 120 }}
          />
        )}
      </div>

      {/* Full screen loading overlay */}
      {loading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          overflow: 'hidden',
        }}>
          {/* Animated background grid */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(rgba(99, 102, 241, 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(99, 102, 241, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            animation: 'gridMove 20s linear infinite',
          }} />
          
          {/* Floating particles */}
          {[...Array(20)].map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              width: Math.random() * 4 + 2 + 'px',
              height: Math.random() * 4 + 2 + 'px',
              background: `rgba(${Math.random() > 0.5 ? '99, 102, 241' : '139, 92, 246'}, ${Math.random() * 0.5 + 0.3})`,
              borderRadius: '50%',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              animation: `float ${Math.random() * 3 + 2}s ease-in-out infinite`,
              animationDelay: Math.random() * 2 + 's',
            }} />
          ))}
          
          {/* Glowing orbs */}
          <div style={{
            position: 'absolute',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
            top: '10%',
            left: '20%',
            animation: 'pulse 4s ease-in-out infinite',
          }} />
          <div style={{
            position: 'absolute',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, transparent 70%)',
            bottom: '15%',
            right: '15%',
            animation: 'pulse 5s ease-in-out infinite reverse',
          }} />
          <div style={{
            position: 'absolute',
            width: '250px',
            height: '250px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(236, 72, 153, 0.1) 0%, transparent 70%)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            animation: 'pulse 3s ease-in-out infinite',
          }} />
          
          {/* Main spinner */}
          <div style={{ position: 'relative', width: 100, height: 100, zIndex: 1 }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              border: '4px solid rgba(99, 102, 241, 0.1)',
              borderTopColor: '#6366f1',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              boxShadow: '0 0 30px rgba(99, 102, 241, 0.5)',
            }} />
            <div style={{
              position: 'absolute',
              inset: 10,
              border: '4px solid rgba(139, 92, 246, 0.1)',
              borderTopColor: '#8b5cf6',
              borderRadius: '50%',
              animation: 'spin 1.4s linear infinite reverse',
              boxShadow: '0 0 20px rgba(139, 92, 246, 0.4)',
            }} />
            <div style={{
              position: 'absolute',
              inset: 20,
              border: '4px solid rgba(168, 85, 247, 0.1)',
              borderTopColor: '#a855f7',
              borderRadius: '50%',
              animation: 'spin 0.7s linear infinite',
              boxShadow: '0 0 15px rgba(168, 85, 247, 0.3)',
            }} />
            <div style={{
              position: 'absolute',
              inset: 30,
              border: '3px solid rgba(236, 72, 153, 0.1)',
              borderTopColor: '#ec4899',
              borderRadius: '50%',
              animation: 'spin 1.1s linear infinite reverse',
              boxShadow: '0 0 10px rgba(236, 72, 153, 0.3)',
            }} />
            <div style={{
              position: 'absolute',
              inset: 40,
              border: '2px solid rgba(99, 102, 241, 0.05)',
              borderTopColor: '#6366f1',
              borderRadius: '50%',
              animation: 'spin 0.5s linear infinite',
            }} />
          </div>
          
          <div style={{
            marginTop: 32,
            fontSize: 18,
            color: '#fff',
            fontWeight: 600,
            letterSpacing: '2px',
            textShadow: '0 0 20px rgba(99, 102, 241, 0.8)',
            zIndex: 1,
          }}>
            正在查询归属地
          </div>
          <div style={{
            marginTop: 12,
            fontSize: 14,
            color: 'rgba(255,255,255,0.5)',
            zIndex: 1,
          }}>
          </div>
        </div>
      )}

      {/* 查询按钮 */}
      <div className="btn-group">
        <button className="btn" onClick={handleLookup} disabled={!input.trim() || loading}>
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ position: 'relative', width: 18, height: 18 }}>
                <span style={{ position: 'absolute', inset: 0, border: '2px solid transparent', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <span style={{ position: 'absolute', inset: 3, border: '2px solid transparent', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1.2s linear infinite reverse' }} />
                <span style={{ position: 'absolute', inset: 6, border: '2px solid transparent', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
              </span>
              查询中
            </span>
          ) : (
            <>
              <Search size={16} />
              查询
            </>
          )}
        </button>
        {input && (
          <button className="btn btn-outline" onClick={() => setInput('')}>
            清空
          </button>
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <div style={{ marginTop: 12, padding: 12, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: 'var(--radius)', color: '#ef4444', fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* 结果展示 */}
      {results.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: 'var(--text-dim)' }}>
            查询结果 ({results.filter(r => r.valid).length}/{results.length})
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {results.map((result, idx) => (
              <div
                key={idx}
                style={{
                  background: 'var(--bg-input)',
                  border: `1px solid ${result.valid ? 'var(--border)' : '#e53'}`,
                  borderRadius: 'var(--radius)',
                  padding: 16,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* 运营商颜色条 */}
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 4,
                    background: result.valid ? OPERATOR_COLORS[result.operator] : '#e53',
                  }}
                />
                
                {result.valid ? (
                  <div style={{ paddingLeft: 12 }}>
                    {/* 手机号 */}
                    <div style={{ 
                      fontSize: 20, 
                      fontWeight: 700, 
                      marginBottom: 12,
                      fontFamily: 'monospace',
                      letterSpacing: 2,
                    }}>
                      {result.phone}
                    </div>

                    {/* 详细信息网格 */}
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                      gap: 12,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: `${OPERATOR_COLORS[result.operator]}20`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <Building2 size={16} color={OPERATOR_COLORS[result.operator]} />
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>运营商</div>
                          <div style={{ 
                            fontWeight: 600, 
                            color: OPERATOR_COLORS[result.operator],
                          }}>
                            {result.operator}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: 'rgba(99, 102, 241, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <Smartphone size={16} color="var(--accent)" />
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>归属地</div>
                          <div style={{ fontWeight: 600 }}>{result.province} {result.city}</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: 'rgba(16, 185, 129, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <Phone size={16} color="#10b981" />
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>区号</div>
                          <div style={{ fontWeight: 600 }}>{result.areaCode}</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: 'rgba(245, 158, 11, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                            <path d="M4 4h16v16H4z" />
                            <path d="M4 10h16" />
                            <path d="M10 4v16" />
                          </svg>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>邮编</div>
                          <div style={{ fontWeight: 600 }}>{result.zipCode}</div>
                        </div>
                      </div>
                    </div>

                    {/* 复制按钮 */}
                    <button
                      onClick={() => copyResult(result)}
                      style={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        background: copied === result.phone ? 'var(--accent)' : 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        padding: '6px 12px',
                        fontSize: 12,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        color: copied === result.phone ? '#fff' : 'var(--text)',
                        transition: 'all 0.2s',
                      }}
                    >
                      <Copy size={14} />
                      {copied === result.phone ? '已复制' : '复制'}
                    </button>
                  </div>
                ) : (
                  <div style={{ paddingLeft: 12, color: '#e53' }}>
                    <span style={{ fontWeight: 600 }}>{result.phone}</span>
                    <span style={{ marginLeft: 8, fontSize: 13 }}>无效的手机号码</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 历史记录 */}
      {history.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: 12,
          }}>
            <h3 style={{ 
              fontSize: 14, 
              fontWeight: 600, 
              color: 'var(--text-dim)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}>
              <Clock size={14} />
              查询历史
            </h3>
            <button
              onClick={clearHistory}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Trash2 size={14} />
              清空
            </button>
          </div>

          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 8,
          }}>
            {history.slice(0, 20).map((item, idx) => (
              <button
                key={idx}
                onClick={() => restoreFromHistory(item.phone)}
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border)',
                  borderRadius: 20,
                  padding: '6px 14px',
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  color: 'var(--text)',
                  transition: 'all 0.2s',
                }}
              >
                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                  {item.phone}
                </span>
                <span style={{ 
                  fontSize: 11, 
                  color: OPERATOR_COLORS[item.result.operator],
                  fontWeight: 500,
                }}>
                  {item.result.operator}
                </span>
                <span style={{ 
                  fontSize: 11, 
                  color: 'var(--text-muted)',
                }}>
                  {item.result.province}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 运营商说明 */}
      <div style={{ marginTop: 32, padding: 16, background: 'var(--bg-input)', borderRadius: 'var(--radius)', fontSize: 13, color: 'var(--text-dim)' }}>
        <h4 style={{ fontWeight: 600, marginBottom: 8, color: 'var(--text)' }}>支持号段</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <div>
            <span style={{ fontWeight: 600, color: OPERATOR_COLORS['移动'] }}>中国移动</span>
            <div style={{ fontSize: 12, marginTop: 4 }}>134-139, 147, 150-152, 157-159, 172, 178, 182-184, 187-188, 195, 197, 198</div>
          </div>
          <div>
            <span style={{ fontWeight: 600, color: OPERATOR_COLORS['联通'] }}>中国联通</span>
            <div style={{ fontSize: 12, marginTop: 4 }}>130-132, 145, 155-156, 166, 175-176, 185-186, 196</div>
          </div>
          <div>
            <span style={{ fontWeight: 600, color: OPERATOR_COLORS['电信'] }}>中国电信</span>
            <div style={{ fontSize: 12, marginTop: 4 }}>133, 149, 153, 173, 177, 180-181, 189, 191, 193, 199</div>
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
