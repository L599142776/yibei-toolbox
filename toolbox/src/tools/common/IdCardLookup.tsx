// src/tools/common/IdCardLookup.tsx
import { useState, useMemo } from 'react'
import { User, Calendar, MapPin, Shield, Check, X, AlertCircle } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'

// Chinese administrative division codes (first 6 digits)
const REGION_CODES: Record<string, { province: string; city?: string; district?: string }> = {
  // 华北
  '110000': { province: '北京市', city: '北京市' },
  '110100': { province: '北京市', city: '北京市', district: '市辖区' },
  '110101': { province: '北京市', city: '北京市', district: '东城区' },
  '110102': { province: '北京市', city: '北京市', district: '西城区' },
  '110105': { province: '北京市', city: '北京市', district: '朝阳区' },
  '110106': { province: '北京市', city: '北京市', district: '丰台区' },
  '110107': { province: '北京市', city: '北京市', district: '石景山区' },
  '110108': { province: '北京市', city: '北京市', district: '海淀区' },
  '110109': { province: '北京市', city: '北京市', district: '门头沟区' },
  '110111': { province: '北京市', city: '北京市', district: '房山区' },
  '110112': { province: '北京市', city: '北京市', district: '通州区' },
  '110113': { province: '北京市', city: '北京市', district: '顺义区' },
  '110114': { province: '北京市', city: '北京市', district: '昌平区' },
  '110115': { province: '北京市', city: '北京市', district: '大兴区' },
  '110116': { province: '北京市', city: '北京市', district: '怀柔区' },
  '110117': { province: '北京市', city: '北京市', district: '平谷区' },
  '120000': { province: '天津市', city: '天津市' },
  '120101': { province: '天津市', city: '天津市', district: '和平区' },
  '120102': { province: '天津市', city: '天津市', district: '河东区' },
  '120103': { province: '天津市', city: '天津市', district: '河西区' },
  '120104': { province: '天津市', city: '天津市', district: '南开区' },
  '120105': { province: '天津市', city: '天津市', district: '河北区' },
  '120106': { province: '天津市', city: '天津市', district: '红桥区' },
  '120110': { province: '天津市', city: '天津市', district: '东丽区' },
  '120111': { province: '天津市', city: '天津市', district: '西青区' },
  '120112': { province: '天津市', city: '天津市', district: '津南区' },
  '120113': { province: '天津市', city: '天津市', district: '北辰区' },
  '120114': { province: '天津市', city: '天津市', district: '武清区' },
  '120115': { province: '天津市', city: '天津市', district: '宝坻区' },
  '120116': { province: '天津市', city: '天津市', district: '滨海新区' },
  '130000': { province: '河北省' },
  '130100': { province: '河北省', city: '石家庄市' },
  '130200': { province: '河北省', city: '唐山市' },
  '130300': { province: '河北省', city: '秦皇岛市' },
  '130400': { province: '河北省', city: '邯郸市' },
  '130500': { province: '河北省', city: '邢台市' },
  '130600': { province: '河北省', city: '保定市' },
  '130700': { province: '河北省', city: '张家口市' },
  '130800': { province: '河北省', city: '承德市' },
  '130900': { province: '河北省', city: '沧州市' },
  '131000': { province: '河北省', city: '廊坊市' },
  '131100': { province: '河北省', city: '衡水市' },
  '140000': { province: '山西省' },
  '140100': { province: '山西省', city: '太原市' },
  '140200': { province: '山西省', city: '大同市' },
  '140300': { province: '山西省', city: '阳泉市' },
  '140400': { province: '山西省', city: '长治市' },
  '140500': { province: '山西省', city: '晋城市' },
  '140600': { province: '山西省', city: '朔州市' },
  '140700': { province: '山西省', city: '晋中市' },
  '140800': { province: '山西省', city: '运城市' },
  '140900': { province: '山西省', city: '忻州市' },
  '141000': { province: '山西省', city: '临汾市' },
  '141100': { province: '山西省', city: '吕梁市' },
  '150000': { province: '内蒙古自治区' },
  '150100': { province: '内蒙古自治区', city: '呼和浩特市' },
  '150200': { province: '内蒙古自治区', city: '包头市' },
  '150300': { province: '内蒙古自治区', city: '乌海市' },
  '150400': { province: '内蒙古自治区', city: '赤峰市' },
  '150500': { province: '内蒙古自治区', city: '通辽市' },
  '150600': { province: '内蒙古自治区', city: '鄂尔多斯市' },
  '150700': { province: '内蒙古自治区', city: '呼伦贝尔市' },
  '150800': { province: '内蒙古自治区', city: '巴彦淖尔市' },
  '150900': { province: '内蒙古自治区', city: '乌兰察布市' },
  // 东北
  '210000': { province: '辽宁省' },
  '210100': { province: '辽宁省', city: '沈阳市' },
  '210200': { province: '辽宁省', city: '大连市' },
  '210300': { province: '辽宁省', city: '鞍山市' },
  '210400': { province: '辽宁省', city: '抚顺市' },
  '210500': { province: '辽宁省', city: '本溪市' },
  '210600': { province: '辽宁省', city: '丹东市' },
  '210700': { province: '辽宁省', city: '锦州市' },
  '210800': { province: '辽宁省', city: '营口市' },
  '210900': { province: '辽宁省', city: '阜新市' },
  '211000': { province: '辽宁省', city: '辽阳市' },
  '211100': { province: '辽宁省', city: '盘锦市' },
  '211200': { province: '辽宁省', city: '铁岭市' },
  '211300': { province: '辽宁省', city: '朝阳市' },
  '211400': { province: '辽宁省', city: '葫芦岛市' },
  '220000': { province: '吉林省' },
  '220100': { province: '吉林省', city: '长春市' },
  '220200': { province: '吉林省', city: '吉林市' },
  '220300': { province: '吉林省', city: '四平市' },
  '220400': { province: '吉林省', city: '辽源市' },
  '220500': { province: '吉林省', city: '通化市' },
  '220600': { province: '吉林省', city: '白山市' },
  '220700': { province: '吉林省', city: '松原市' },
  '220800': { province: '吉林省', city: '白城市' },
  '230000': { province: '黑龙江省' },
  '230100': { province: '黑龙江省', city: '哈尔滨市' },
  '230200': { province: '黑龙江省', city: '齐齐哈尔市' },
  '230300': { province: '黑龙江省', city: '鸡西市' },
  '230400': { province: '黑龙江省', city: '鹤岗市' },
  '230500': { province: '黑龙江省', city: '双鸭山市' },
  '230600': { province: '黑龙江省', city: '大庆市' },
  '230700': { province: '黑龙江省', city: '伊春市' },
  '230800': { province: '黑龙江省', city: '佳木斯市' },
  '230900': { province: '黑龙江省', city: '七台河市' },
  '231000': { province: '黑龙江省', city: '牡丹江市' },
  '231100': { province: '黑龙江省', city: '黑河市' },
  '231200': { province: '黑龙江省', city: '绥化市' },
  // 华东
  '310000': { province: '上海市', city: '上海市' },
  '310101': { province: '上海市', city: '上海市', district: '黄浦区' },
  '310104': { province: '上海市', city: '上海市', district: '徐汇区' },
  '310105': { province: '上海市', city: '上海市', district: '长宁区' },
  '310106': { province: '上海市', city: '上海市', district: '静安区' },
  '310107': { province: '上海市', city: '上海市', district: '普陀区' },
  '310109': { province: '上海市', city: '上海市', district: '虹口区' },
  '310110': { province: '上海市', city: '上海市', district: '杨浦区' },
  '310112': { province: '上海市', city: '上海市', district: '闵行区' },
  '310113': { province: '上海市', city: '上海市', district: '宝山区' },
  '310114': { province: '上海市', city: '上海市', district: '嘉定区' },
  '310115': { province: '上海市', city: '上海市', district: '浦东新区' },
  '310116': { province: '上海市', city: '上海市', district: '金山区' },
  '310117': { province: '上海市', city: '上海市', district: '松江区' },
  '310118': { province: '上海市', city: '上海市', district: '青浦区' },
  '310120': { province: '上海市', city: '上海市', district: '奉贤区' },
  '320000': { province: '江苏省' },
  '320100': { province: '江苏省', city: '南京市' },
  '320200': { province: '江苏省', city: '无锡市' },
  '320300': { province: '江苏省', city: '徐州市' },
  '320400': { province: '江苏省', city: '常州市' },
  '320500': { province: '江苏省', city: '苏州市' },
  '320600': { province: '江苏省', city: '南通市' },
  '320700': { province: '江苏省', city: '连云港市' },
  '320800': { province: '江苏省', city: '淮安市' },
  '320900': { province: '江苏省', city: '盐城市' },
  '321000': { province: '江苏省', city: '扬州市' },
  '321100': { province: '江苏省', city: '镇江市' },
  '321200': { province: '江苏省', city: '泰州市' },
  '321300': { province: '江苏省', city: '宿迁市' },
  '330000': { province: '浙江省' },
  '330100': { province: '浙江省', city: '杭州市' },
  '330200': { province: '浙江省', city: '宁波市' },
  '330300': { province: '浙江省', city: '温州市' },
  '330400': { province: '浙江省', city: '嘉兴市' },
  '330500': { province: '浙江省', city: '湖州市' },
  '330600': { province: '浙江省', city: '绍兴市' },
  '330700': { province: '浙江省', city: '金华市' },
  '330800': { province: '浙江省', city: '衢州市' },
  '330900': { province: '浙江省', city: '舟山市' },
  '331000': { province: '浙江省', city: '台州市' },
  '331100': { province: '浙江省', city: '丽水市' },
  '340000': { province: '安徽省' },
  '340100': { province: '安徽省', city: '合肥市' },
  '340200': { province: '安徽省', city: '芜湖市' },
  '340300': { province: '安徽省', city: '蚌埠市' },
  '340400': { province: '安徽省', city: '淮南市' },
  '340500': { province: '安徽省', city: '马鞍山市' },
  '340600': { province: '安徽省', city: '淮北市' },
  '340700': { province: '安徽省', city: '铜陵市' },
  '340800': { province: '安徽省', city: '安庆市' },
  '341000': { province: '安徽省', city: '黄山市' },
  '341100': { province: '安徽省', city: '滁州市' },
  '341200': { province: '安徽省', city: '阜阳市' },
  '341300': { province: '安徽省', city: '宿州市' },
  '341500': { province: '安徽省', city: '六安市' },
  '341600': { province: '安徽省', city: '亳州市' },
  '341700': { province: '安徽省', city: '池州市' },
  '341800': { province: '安徽省', city: '宣城市' },
  '350000': { province: '福建省' },
  '350100': { province: '福建省', city: '福州市' },
  '350200': { province: '福建省', city: '厦门市' },
  '350300': { province: '福建省', city: '莆田市' },
  '350400': { province: '福建省', city: '三明市' },
  '350500': { province: '福建省', city: '泉州市' },
  '350600': { province: '福建省', city: '漳州市' },
  '350700': { province: '福建省', city: '南平市' },
  '350800': { province: '福建省', city: '龙岩市' },
  '350900': { province: '福建省', city: '宁德市' },
  '360000': { province: '江西省' },
  '360100': { province: '江西省', city: '南昌市' },
  '360200': { province: '江西省', city: '景德镇市' },
  '360300': { province: '江西省', city: '萍乡市' },
  '360400': { province: '江西省', city: '九江市' },
  '360500': { province: '江西省', city: '新余市' },
  '360600': { province: '江西省', city: '鹰潭市' },
  '360700': { province: '江西省', city: '赣州市' },
  '360800': { province: '江西省', city: '吉安市' },
  '360900': { province: '江西省', city: '宜春市' },
  '361000': { province: '江西省', city: '抚州市' },
  '361100': { province: '江西省', city: '上饶市' },
  '370000': { province: '山东省' },
  '370100': { province: '山东省', city: '济南市' },
  '370200': { province: '山东省', city: '青岛市' },
  '370300': { province: '山东省', city: '淄博市' },
  '370400': { province: '山东省', city: '枣庄市' },
  '370500': { province: '山东省', city: '东营市' },
  '370600': { province: '山东省', city: '烟台市' },
  '370700': { province: '山东省', city: '潍坊市' },
  '370800': { province: '山东省', city: '济宁市' },
  '370900': { province: '山东省', city: '泰安市' },
  '371000': { province: '山东省', city: '威海市' },
  '371100': { province: '山东省', city: '日照市' },
  '371200': { province: '山东省', city: '临沂市' },
  '371300': { province: '山东省', city: '德州市' },
  '371400': { province: '山东省', city: '聊城市' },
  '371500': { province: '山东省', city: '滨州市' },
  '371600': { province: '山东省', city: '菏泽市' },
  // 华中
  '410000': { province: '河南省' },
  '410100': { province: '河南省', city: '郑州市' },
  '410200': { province: '河南省', city: '开封市' },
  '410300': { province: '河南省', city: '洛阳市' },
  '410400': { province: '河南省', city: '平顶山市' },
  '410500': { province: '河南省', city: '安阳市' },
  '410600': { province: '河南省', city: '鹤壁市' },
  '410700': { province: '河南省', city: '新乡市' },
  '410800': { province: '河南省', city: '焦作市' },
  '410900': { province: '河南省', city: '濮阳市' },
  '411000': { province: '河南省', city: '许昌市' },
  '411100': { province: '河南省', city: '漯河市' },
  '411200': { province: '河南省', city: '三门峡市' },
  '411300': { province: '河南省', city: '南阳市' },
  '411400': { province: '河南省', city: '商丘市' },
  '411500': { province: '河南省', city: '信阳市' },
  '411600': { province: '河南省', city: '周口市' },
  '411700': { province: '河南省', city: '驻马店市' },
  '420000': { province: '湖北省' },
  '420100': { province: '湖北省', city: '武汉市' },
  '420200': { province: '湖北省', city: '黄石市' },
  '420300': { province: '湖北省', city: '十堰市' },
  '420500': { province: '湖北省', city: '宜昌市' },
  '420600': { province: '湖北省', city: '襄阳市' },
  '420700': { province: '湖北省', city: '鄂州市' },
  '420800': { province: '湖北省', city: '荆门市' },
  '420900': { province: '湖北省', city: '孝感市' },
  '421000': { province: '湖北省', city: '荆州市' },
  '421100': { province: '湖北省', city: '黄冈市' },
  '421200': { province: '湖北省', city: '咸宁市' },
  '421300': { province: '湖北省', city: '随州市' },
  '430000': { province: '湖南省' },
  '430100': { province: '湖南省', city: '长沙市' },
  '430200': { province: '湖南省', city: '株洲市' },
  '430300': { province: '湖南省', city: '湘潭市' },
  '430400': { province: '湖南省', city: '衡阳市' },
  '430500': { province: '湖南省', city: '邵阳市' },
  '430600': { province: '湖南省', city: '岳阳市' },
  '430700': { province: '湖南省', city: '常德市' },
  '430800': { province: '湖南省', city: '张家界市' },
  '430900': { province: '湖南省', city: '益阳市' },
  '431000': { province: '湖南省', city: '郴州市' },
  '431100': { province: '湖南省', city: '永州市' },
  '431200': { province: '湖南省', city: '怀化市' },
  '431300': { province: '湖南省', city: '娄底市' },
  '433100': { province: '湖南省', city: '湘西土家族苗族自治州' },
  // 华南
  '440000': { province: '广东省' },
  '440100': { province: '广东省', city: '广州市' },
  '440200': { province: '广东省', city: '韶关市' },
  '440300': { province: '广东省', city: '深圳市' },
  '440400': { province: '广东省', city: '珠海市' },
  '440500': { province: '广东省', city: '汕头市' },
  '440600': { province: '广东省', city: '佛山市' },
  '440700': { province: '广东省', city: '江门市' },
  '440800': { province: '广东省', city: '湛江市' },
  '440900': { province: '广东省', city: '茂名市' },
  '441200': { province: '广东省', city: '肇庆市' },
  '441300': { province: '广东省', city: '惠州市' },
  '441400': { province: '广东省', city: '梅州市' },
  '441500': { province: '广东省', city: '汕尾市' },
  '441600': { province: '广东省', city: '河源市' },
  '441700': { province: '广东省', city: '阳江市' },
  '441800': { province: '广东省', city: '清远市' },
  '441900': { province: '广东省', city: '东莞市' },
  '442000': { province: '广东省', city: '中山市' },
  '445100': { province: '广东省', city: '潮州市' },
  '445200': { province: '广东省', city: '揭阳市' },
  '445300': { province: '广东省', city: '云浮市' },
  '450000': { province: '广西壮族自治区' },
  '450100': { province: '广西壮族自治区', city: '南宁市' },
  '450200': { province: '广西壮族自治区', city: '柳州市' },
  '450300': { province: '广西壮族自治区', city: '桂林市' },
  '450400': { province: '广西壮族自治区', city: '梧州市' },
  '450500': { province: '广西壮族自治区', city: '北海市' },
  '450600': { province: '广西壮族自治区', city: '防城港市' },
  '450700': { province: '广西壮族自治区', city: '钦州市' },
  '450800': { province: '广西壮族自治区', city: '贵港市' },
  '450900': { province: '广西壮族自治区', city: '玉林市' },
  '451000': { province: '广西壮族自治区', city: '百色市' },
  '451100': { province: '广西壮族自治区', city: '贺州市' },
  '451200': { province: '广西壮族自治区', city: '河池市' },
  '451300': { province: '广西壮族自治区', city: '来宾市' },
  '451400': { province: '广西壮族自治区', city: '崇左市' },
  '460000': { province: '海南省' },
  '460100': { province: '海南省', city: '海口市' },
  '460200': { province: '海南省', city: '三亚市' },
  '460300': { province: '海南省', city: '三沙市' },
  '460400': { province: '海南省', city: '儋州市' },
  // 西南
  '500000': { province: '重庆市', city: '重庆市' },
  '500101': { province: '重庆市', city: '重庆市', district: '万州区' },
  '500102': { province: '重庆市', city: '重庆市', district: '涪陵区' },
  '500103': { province: '重庆市', city: '重庆市', district: '渝中区' },
  '500104': { province: '重庆市', city: '重庆市', district: '大渡口区' },
  '500105': { province: '重庆市', city: '重庆市', district: '江北区' },
  '500106': { province: '重庆市', city: '重庆市', district: '沙坪坝区' },
  '500107': { province: '重庆市', city: '重庆市', district: '九龙坡区' },
  '500108': { province: '重庆市', city: '重庆市', district: '南岸区' },
  '500109': { province: '重庆市', city: '重庆市', district: '北碚区' },
  '500110': { province: '重庆市', city: '重庆市', district: '綦江区' },
  '500111': { province: '重庆市', city: '重庆市', district: '大足区' },
  '510000': { province: '四川省' },
  '510100': { province: '四川省', city: '成都市' },
  '510300': { province: '四川省', city: '自贡市' },
  '510400': { province: '四川省', city: '攀枝花市' },
  '510500': { province: '四川省', city: '泸州市' },
  '510600': { province: '四川省', city: '德阳市' },
  '510700': { province: '四川省', city: '绵阳市' },
  '510800': { province: '四川省', city: '广元市' },
  '510900': { province: '四川省', city: '遂宁市' },
  '511000': { province: '四川省', city: '内江市' },
  '511100': { province: '四川省', city: '乐山市' },
  '511300': { province: '四川省', city: '南充市' },
  '511400': { province: '四川省', city: '眉山市' },
  '511500': { province: '四川省', city: '宜宾市' },
  '511600': { province: '四川省', city: '广安市' },
  '511700': { province: '四川省', city: '达州市' },
  '511800': { province: '四川省', city: '雅安市' },
  '511900': { province: '四川省', city: '巴中市' },
  '512000': { province: '四川省', city: '资阳市' },
  '520000': { province: '贵州省' },
  '520100': { province: '贵州省', city: '贵阳市' },
  '520200': { province: '贵州省', city: '六盘水市' },
  '520300': { province: '贵州省', city: '遵义市' },
  '520400': { province: '贵州省', city: '安顺市' },
  '520500': { province: '贵州省', city: '毕节市' },
  '520600': { province: '贵州省', city: '铜仁市' },
  '522300': { province: '贵州省', city: '黔西南布依族苗族自治州' },
  '522600': { province: '贵州省', city: '黔东南苗族侗族自治州' },
  '522700': { province: '贵州省', city: '黔南布依族苗族自治州' },
  '530000': { province: '云南省' },
  '530100': { province: '云南省', city: '昆明市' },
  '530300': { province: '云南省', city: '曲靖市' },
  '530400': { province: '云南省', city: '玉溪市' },
  '530500': { province: '云南省', city: '保山市' },
  '530600': { province: '云南省', city: '昭通市' },
  '530700': { province: '云南省', city: '丽江市' },
  '530800': { province: '云南省', city: '普洱市' },
  '530900': { province: '云南省', city: '临沧市' },
  '532300': { province: '云南省', city: '楚雄彝族自治州' },
  '532500': { province: '云南省', city: '红河哈尼族彝族自治州' },
  '532600': { province: '云南省', city: '文山壮族苗族自治州' },
  '532800': { province: '云南省', city: '西双版纳傣族自治州' },
  '532900': { province: '云南省', city: '大理白族自治州' },
  '533100': { province: '云南省', city: '德宏傣族景颇族自治州' },
  '533300': { province: '云南省', city: '怒江傈僳族自治州' },
  '533400': { province: '云南省', city: '迪庆藏族自治州' },
  '540000': { province: '西藏自治区' },
  '540100': { province: '西藏自治区', city: '拉萨市' },
  '540200': { province: '西藏自治区', city: '日喀则市' },
  '540300': { province: '西藏自治区', city: '昌都市' },
  '540400': { province: '西藏自治区', city: '林芝市' },
  '540500': { province: '西藏自治区', city: '山南市' },
  '540600': { province: '西藏自治区', city: '那曲市' },
  '542500': { province: '西藏自治区', city: '阿里地区' },
  // 西北
  '610000': { province: '陕西省' },
  '610100': { province: '陕西省', city: '西安市' },
  '610200': { province: '陕西省', city: '铜川市' },
  '610300': { province: '陕西省', city: '宝鸡市' },
  '610400': { province: '陕西省', city: '咸阳市' },
  '610500': { province: '陕西省', city: '渭南市' },
  '610600': { province: '陕西省', city: '延安市' },
  '610700': { province: '陕西省', city: '汉中市' },
  '610800': { province: '陕西省', city: '榆林市' },
  '610900': { province: '陕西省', city: '安康市' },
  '611000': { province: '陕西省', city: '商洛市' },
  '620000': { province: '甘肃省' },
  '620100': { province: '甘肃省', city: '兰州市' },
  '620200': { province: '甘肃省', city: '嘉峪关市' },
  '620300': { province: '甘肃省', city: '金昌市' },
  '620400': { province: '甘肃省', city: '白银市' },
  '620500': { province: '甘肃省', city: '天水市' },
  '620600': { province: '甘肃省', city: '武威市' },
  '620700': { province: '甘肃省', city: '张掖市' },
  '620800': { province: '甘肃省', city: '平凉市' },
  '620900': { province: '甘肃省', city: '酒泉市' },
  '621000': { province: '甘肃省', city: '庆阳市' },
  '621100': { province: '甘肃省', city: '定西市' },
  '621200': { province: '甘肃省', city: '陇南市' },
  '622900': { province: '甘肃省', city: '临夏回族自治州' },
  '623000': { province: '甘肃省', city: '甘南藏族自治州' },
  '630000': { province: '青海省' },
  '630100': { province: '青海省', city: '西宁市' },
  '630200': { province: '青海省', city: '海东市' },
  '632200': { province: '青海省', city: '海北藏族自治州' },
  '632300': { province: '青海省', city: '黄南藏族自治州' },
  '632500': { province: '青海省', city: '海南藏族自治州' },
  '632600': { province: '青海省', city: '果洛藏族自治州' },
  '632700': { province: '青海省', city: '玉树藏族自治州' },
  '632800': { province: '青海省', city: '海西蒙古族藏族自治州' },
  '640000': { province: '宁夏回族自治区' },
  '640100': { province: '宁夏回族自治区', city: '银川市' },
  '640200': { province: '宁夏回族自治区', city: '石嘴山市' },
  '640300': { province: '宁夏回族自治区', city: '吴忠市' },
  '640400': { province: '宁夏回族自治区', city: '固原市' },
  '640500': { province: '宁夏回族自治区', city: '中卫市' },
  '650000': { province: '新疆维吾尔自治区' },
  '650100': { province: '新疆维吾尔自治区', city: '乌鲁木齐市' },
  '650200': { province: '新疆维吾尔自治区', city: '克拉玛依市' },
  '650400': { province: '新疆维吾尔自治区', city: '吐鲁番市' },
  '650500': { province: '新疆维吾尔自治区', city: '哈密市' },
  '652300': { province: '新疆维吾尔自治区', city: '昌吉回族自治州' },
  '652700': { province: '新疆维吾尔自治区', city: '博尔塔拉蒙古自治州' },
  '652800': { province: '新疆维吾尔自治区', city: '巴音郭楞蒙古自治州' },
  '652900': { province: '新疆维吾尔自治区', city: '阿克苏地区' },
  '653000': { province: '新疆维吾尔自治区', city: '克孜勒苏柯尔克孜自治州' },
  '653100': { province: '新疆维吾尔自治区', city: '喀什地区' },
  '653200': { province: '新疆维吾尔自治区', city: '和田地区' },
  '654000': { province: '新疆维吾尔自治区', city: '伊犁哈萨克自治州' },
  '654200': { province: '新疆维吾尔自治区', city: '塔城地区' },
  '654300': { province: '新疆维吾尔自治区', city: '阿勒泰地区' },
  // 港澳台
  '710000': { province: '台湾省' },
  '810000': { province: '香港特别行政区' },
  '820000': { province: '澳门特别行政区' },
}

// Zodiac signs with date ranges
const ZODIAC_SIGNS = [
  { name: '白羊座', symbol: '♈', start: [3, 21], end: [4, 19] },
  { name: '金牛座', symbol: '♉', start: [4, 20], end: [5, 20] },
  { name: '双子座', symbol: '♊', start: [5, 21], end: [6, 21] },
  { name: '巨蟹座', symbol: '♋', start: [6, 22], end: [7, 22] },
  { name: '狮子座', symbol: '♌', start: [7, 23], end: [8, 22] },
  { name: '处女座', symbol: '♍', start: [8, 23], end: [9, 22] },
  { name: '天秤座', symbol: '♎', start: [9, 23], end: [10, 23] },
  { name: '天蝎座', symbol: '♏', start: [10, 24], end: [11, 22] },
  { name: '射手座', symbol: '♐', start: [11, 23], end: [12, 21] },
  { name: '摩羯座', symbol: '♑', start: [12, 22], end: [1, 19] },
  { name: '水瓶座', symbol: '♒', start: [1, 20], end: [2, 18] },
  { name: '双鱼座', symbol: '♓', start: [2, 19], end: [3, 20] },
]

// 18-digit ID checksum calculation
const WEIGHT_FACTORS = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
const CHECK_CODES = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2']

interface ValidationResult {
  valid: boolean
  errors: string[]
}

interface ParsedInfo {
  region: { province: string; city?: string; district?: string }
  birthDate: string
  gender: '男' | '女'
  genderIcon: '♂' | '♀'
  age: number
  zodiac: { name: string; symbol: string }
  is18Digit: boolean
  checksum: boolean
}

function getZodiac(month: number, day: number): { name: string; symbol: string } {
  for (const sign of ZODIAC_SIGNS) {
    const [sm, sd] = sign.start
    const [em, ed] = sign.end
    if (sm <= em) {
      if (month === sm && day >= sd) return sign
      if (month === em && day <= ed) return sign
      if (month > sm && month < em) return sign
    } else {
      if (month >= sm || month <= em) {
        if (month === sm && day >= sd) return sign
        if (month === em && day <= ed) return sign
        if (month > sm || month < em) return sign
      }
    }
  }
  return ZODIAC_SIGNS[0]
}

function calculateAge(birthDate: Date): number {
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return Math.max(0, age)
}

function validateIdCard(id: string): ValidationResult {
  const errors: string[] = []
  const cleanId = id.trim().toUpperCase()

  if (!/^\d{15}$/.test(cleanId) && !/^\d{17}[\dX]$/.test(cleanId)) {
    errors.push('身份证号码格式不正确，应为15位或18位数字')
    return { valid: false, errors }
  }

  const is18Digit = cleanId.length === 18

  if (is18Digit) {
    // Validate birthdate (positions 6-14)
    const year = parseInt(cleanId.substring(6, 10), 10)
    const month = parseInt(cleanId.substring(10, 12), 10)
    const day = parseInt(cleanId.substring(12, 14), 10)

    if (year < 1900 || year > new Date().getFullYear()) {
      errors.push('出生年份超出有效范围')
    }
    if (month < 1 || month > 12) {
      errors.push('出生月份无效')
    }
    if (day < 1 || day > 31) {
      errors.push('出生日期无效')
    }

    // Validate date exists
    const birthDate = new Date(year, month - 1, day)
    if (birthDate.getMonth() !== month - 1 || birthDate.getDate() !== day) {
      errors.push('日期不存在（如2月30日）')
    }

    // Validate checksum
    let sum = 0
    for (let i = 0; i < 17; i++) {
      sum += parseInt(cleanId[i], 10) * WEIGHT_FACTORS[i]
    }
    const checkCode = CHECK_CODES[sum % 11]
    if (cleanId[17] !== checkCode) {
      errors.push(`校验码错误（应为 ${checkCode}）`)
    }
  } else {
    // 15-digit: validate birthdate
    const year = parseInt('19' + cleanId.substring(6, 8), 10)
    const month = parseInt(cleanId.substring(8, 10), 10)
    const day = parseInt(cleanId.substring(10, 12), 10)

    if (month < 1 || month > 12) {
      errors.push('出生月份无效')
    }
    if (day < 1 || day > 31) {
      errors.push('出生日期无效')
    }

    const birthDate = new Date(year, month - 1, day)
    if (birthDate.getMonth() !== month - 1 || birthDate.getDate() !== day) {
      errors.push('日期不存在')
    }
  }

  return { valid: errors.length === 0, errors }
}

function parseIdCard(id: string): ParsedInfo | null {
  const cleanId = id.trim().toUpperCase()
  const is18Digit = cleanId.length === 18

  // Region code
  const regionCode = cleanId.substring(0, 6)
  const region = REGION_CODES[regionCode] || { province: '未知' }

  // Birth date
  let year: number, month: number, day: number
  if (is18Digit) {
    year = parseInt(cleanId.substring(6, 10), 10)
    month = parseInt(cleanId.substring(10, 12), 10)
    day = parseInt(cleanId.substring(12, 14), 10)
  } else {
    year = parseInt('19' + cleanId.substring(6, 8), 10)
    month = parseInt(cleanId.substring(8, 10), 10)
    day = parseInt(cleanId.substring(10, 12), 10)
  }

  const birthDateObj = new Date(year, month - 1, day)
  const birthDate = `${year}年${String(month).padStart(2, '0')}月${String(day).padStart(2, '0')}日`

  // Gender: 17th digit (18-digit) or 14th digit (15-digit), odd = male, even = female
  const genderDigit = is18Digit ? parseInt(cleanId[16], 10) : parseInt(cleanId[14], 10)
  const gender = genderDigit % 2 === 1 ? '男' : '女'
  const genderIcon = gender === '男' ? '♂' : '♀'

  // Age
  const age = calculateAge(birthDateObj)

  // Zodiac
  const zodiac = getZodiac(month, day)

  // Checksum (only for 18-digit)
  let checksum = true
  if (is18Digit) {
    let sum = 0
    for (let i = 0; i < 17; i++) {
      sum += parseInt(cleanId[i], 10) * WEIGHT_FACTORS[i]
    }
    const checkCode = CHECK_CODES[sum % 11]
    checksum = cleanId[17] === checkCode
  }

  return {
    region,
    birthDate,
    gender,
    genderIcon,
    age,
    zodiac,
    is18Digit,
    checksum,
  }
}

export default function IdCardLookup() {
  const [idNumber, setIdNumber] = useState('')

  const validation = useMemo(() => {
    if (idNumber.length === 0) return null
    return validateIdCard(idNumber)
  }, [idNumber])

  const parsedInfo = useMemo(() => {
    if (!validation?.valid) return null
    return parseIdCard(idNumber)
  }, [idNumber, validation])

  return (
    <ToolLayout
      title="身份证信息查询"
      description="输入身份证号码，解析户籍所在地、出生日期、性别、年龄、生肖等信息"
    >
      <div className="id-card-lookup">
        <div className="input-section">
          <div className="input-wrapper">
            <label className="tool-label">身份证号码</label>
            <input
              type="text"
              className={`id-input ${validation ? (validation.valid ? 'valid' : 'invalid') : ''}`}
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value.toUpperCase())}
              placeholder="请输入15位或18位身份证号码"
              maxLength={18}
            />
            <div className="input-hints">
              <span className="hint">
                支持 15 位（旧版）或 18 位（新版）身份证
              </span>
              {validation && (
                <span className={`validation-status ${validation.valid ? 'success' : 'error'}`}>
                  {validation.valid ? (
                    <>
                      <Check size={14} /> 验证通过
                    </>
                  ) : (
                    <>
                      <X size={14} /> 验证失败
                    </>
                  )}
                </span>
              )}
            </div>
          </div>

        {validation && !validation.valid && (
            <div className="validation-errors">
              <AlertCircle size={16} />
              <div>
                {validation.errors.map((err, i) => (
                  <p key={i}>{err}</p>
                ))}
              </div>
            </div>
          )}

        <div className="format-info">
            <h4>身份证号码格式说明</h4>
            <div className="format-demo">
              <div className="format-row">
                <span className="segment region">地址码</span>
                <span className="segment birth">出生日期</span>
                <span className="segment order">顺序码</span>
                <span className="segment check">校验码</span>
              </div>
              <div className="format-row">
                <span className="segment region">6位</span>
                <span className="segment birth">8位</span>
                <span className="segment order">3位</span>
                <span className="segment check">1位</span>
              </div>
              <p className="format-example">
                18位: <code>110101</code> <code>19900101</code> <code>123</code> <code>X</code>
              </p>
              <p className="format-example">
                15位: <code>110101</code> <code>900101</code> <code>123</code>
              </p>
            </div>
          </div>
        </div>

        <div className="card-section">
          <div className={`id-card ${parsedInfo?.gender === '男' ? 'male' : 'female'}`}>
            <div className="card-header">
              <div className="card-logo">
                <User size={24} />
              </div>
              <span className="card-title">中华人民共和国</span>
              <span className="card-title-sub">居民身份证</span>
            </div>

            <div className="card-body">
              <div className="card-row">
                <div className="card-field">
                  <span className="field-label">姓名</span>
                  <span className="field-value placeholder">请输入姓名</span>
                </div>
                <div className={`card-field gender-field ${parsedInfo ? 'show' : ''}`}>
                  <span className="gender-icon">{parsedInfo?.genderIcon || '♂'}</span>
                </div>
              </div>

              <div className="card-row">
                <div className="card-field">
                  <span className="field-label">性别</span>
                  <span className="field-value">{parsedInfo?.gender || '-'}</span>
                </div>
                <div className="card-field">
                  <span className="field-label">民族</span>
                  <span className="field-value placeholder">汉</span>
                </div>
              </div>

              <div className="card-row">
                <div className="card-field wide">
                  <span className="field-label">出生</span>
                  <span className="field-value birth-value">{parsedInfo?.birthDate || '----年--月--日'}</span>
                </div>
              </div>

              <div className="card-row">
                <div className="card-field wide address-field">
                  <span className="field-label">住址</span>
                  <span className="field-value address-value">
                    {parsedInfo?.region.province || '------------------------'}
                  </span>
                </div>
              </div>

              <div className="card-row">
                <div className="card-field">
                  <span className="field-label">年龄</span>
                  <span className="field-value">{parsedInfo?.age !== undefined ? `${parsedInfo.age}岁` : '-'}</span>
                </div>
                <div className="card-field">
                  <span className="field-label">生肖</span>
                  <span className="field-value zodiac-value">
                    {parsedInfo ? `${parsedInfo.zodiac.symbol} ${parsedInfo.zodiac.name}` : '-'}
                  </span>
                </div>
              </div>

              <div className="card-row">
                <div className="card-field wide id-field">
                  <span className="field-label">公民身份号码</span>
                  <span className="field-value id-value">
                    {idNumber || '-------------------'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {parsedInfo && (
            <div className="info-cards">
              <div className="info-card">
                <MapPin size={18} />
                <div className="info-content">
                  <span className="info-label">户籍所在地</span>
                  <span className="info-value">
                    {parsedInfo.region.city || parsedInfo.region.province}
                    {parsedInfo.region.district && ` · ${parsedInfo.region.district}`}
                  </span>
                </div>
              </div>

              <div className="info-card">
                <Calendar size={18} />
                <div className="info-content">
                  <span className="info-label">出生日期</span>
                  <span className="info-value">{parsedInfo.birthDate}</span>
                </div>
              </div>

              <div className="info-card">
                <User size={18} />
                <div className="info-content">
                  <span className="info-label">性别</span>
                  <span className="info-value">
                    {parsedInfo.gender} {parsedInfo.genderIcon}
                  </span>
                </div>
              </div>

              <div className="info-card">
                <Shield size={18} />
                <div className="info-content">
                  <span className="info-label">校验码</span>
                  <span className={`info-value ${parsedInfo.checksum ? 'valid' : 'invalid'}`}>
                    {parsedInfo.checksum ? (
                      <><Check size={14} /> 校验通过</>
                    ) : (
                      <><X size={14} /> 校验失败</>
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .id-card-lookup {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          max-width: 1000px;
        }

        @media (max-width: 768px) {
          .id-card-lookup {
            grid-template-columns: 1fr;
          }
        }

        .input-section {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .input-wrapper {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .id-input {
          padding: 14px 16px;
          font-size: 18px;
          font-family: monospace;
          letter-spacing: 2px;
          border: 2px solid var(--border);
          border-radius: 8px;
          background: var(--input-bg);
          color: var(--text);
          transition: all 0.2s;
        }

        .id-input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px var(--primary-alpha);
        }

        .id-input.valid {
          border-color: #22c55e;
        }

        .id-input.invalid {
          border-color: #ef4444;
        }

        .input-hints {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
        }

        .hint {
          color: var(--text-secondary);
        }

        .validation-status {
          display: flex;
          align-items: center;
          gap: 4px;
          font-weight: 500;
        }

        .validation-status.success {
          color: #22c55e;
        }

        .validation-status.error {
          color: #ef4444;
        }

        .validation-errors {
          display: flex;
          gap: 10px;
          padding: 12px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 8px;
          color: #ef4444;
        }

        .validation-errors p {
          margin: 0;
          font-size: 13px;
        }

        .format-info {
          padding: 16px;
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 8px;
        }

        .format-info h4 {
          margin: 0 0 12px 0;
          font-size: 14px;
          color: var(--text-secondary);
        }

        .format-demo {
          font-size: 12px;
        }

        .format-row {
          display: flex;
          gap: 4px;
          margin-bottom: 4px;
        }

        .segment {
          flex: 1;
          padding: 6px 4px;
          text-align: center;
          border-radius: 4px;
          font-weight: 500;
        }

        .segment.region { background: rgba(59, 130, 246, 0.2); color: #3b82f6; }
        .segment.birth { background: rgba(168, 85, 247, 0.2); color: #a855f7; }
        .segment.order { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
        .segment.check { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }

        .format-example {
          margin: 12px 0 0 0;
          color: var(--text-secondary);
          font-family: monospace;
        }

        .format-example code {
          padding: 2px 4px;
          background: var(--input-bg);
          border-radius: 3px;
          color: var(--text);
        }

        /* ID Card Styles */
        .card-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .id-card {
          background: linear-gradient(135deg, #1e3a5f 0%, #0f2744 100%);
          border-radius: 12px;
          padding: 20px;
          color: #fff;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          position: relative;
          overflow: hidden;
        }

        .id-card::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -50%;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
          pointer-events: none;
        }

        .id-card.male {
          background: linear-gradient(135deg, #1e3a5f 0%, #0f2744 100%);
        }

        .id-card.female {
          background: linear-gradient(135deg, #5f1e3a 0%, #440f27 100%);
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(255,255,255,0.2);
        }

        .card-logo {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.2);
          border-radius: 6px;
        }

        .card-title {
          font-size: 14px;
          font-weight: 600;
        }

        .card-title-sub {
          font-size: 12px;
          color: rgba(255,255,255,0.7);
          margin-left: auto;
        }

        .card-body {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .card-row {
          display: flex;
          gap: 12px;
        }

        .card-field {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .card-field.wide {
          flex: 1;
        }

        .field-label {
          font-size: 11px;
          color: rgba(255,255,255,0.6);
        }

        .field-value {
          font-size: 14px;
          font-weight: 500;
          letter-spacing: 1px;
        }

        .field-value.placeholder {
          color: rgba(255,255,255,0.3);
        }

        .birth-value {
          font-size: 16px;
          font-weight: 600;
        }

        .address-value {
          font-size: 12px;
        }

        .zodiac-value {
          color: #fbbf24;
        }

        .id-value {
          font-size: 13px;
          font-family: monospace;
          letter-spacing: 2px;
        }

        .gender-field {
          flex: 0 0 40px;
          align-items: center;
          justify-content: center;
        }

        .gender-icon {
          font-size: 24px;
          opacity: 0.3;
          transition: opacity 0.3s;
        }

        .gender-field.show .gender-icon {
          opacity: 1;
        }

        .address-field {
          margin-top: 4px;
        }

        .id-field {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid rgba(255,255,255,0.1);
        }

        /* Info Cards */
        .info-cards {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .info-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 8px;
        }

        .info-card svg {
          color: var(--primary);
          flex-shrink: 0;
        }

        .info-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .info-label {
          font-size: 11px;
          color: var(--text-secondary);
        }

        .info-value {
          font-size: 13px;
          font-weight: 500;
          color: var(--text);
        }

        .info-value.valid {
          color: #22c55e;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .info-value.invalid {
          color: #ef4444;
          display: flex;
          align-items: center;
          gap: 4px;
        }
      `}</style>
    </ToolLayout>
  )
}
