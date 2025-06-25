import { registerMap } from 'echarts'
import type { GeoJSON } from 'echarts/types/src/coord/geo/geoTypes'

// 引入地图数据
import chinaMapData from './chinaMap.json'

// 注册地图
// export const registerChinaMap = async () => {
//   const response = await fetch('https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json')
//   const chinaMapData = await response.json()
//   console.log(chinaMapData)
//   registerMap('china', chinaMapData)
// }
// 注册地图
export const registerChinaMap = () => {
  registerMap('china', chinaMapData as GeoJSON)
}