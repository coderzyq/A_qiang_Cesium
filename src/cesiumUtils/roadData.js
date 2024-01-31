/*
 * @Description: 
 * @Author: coderqiang
 * @Date: 2023-06-18 16:26:38
 * @LastEditTime: 2023-06-18 16:32:47
 * @LastEditors: coderqiang
 */
import { LineFlickerMaterialProperty } from "./LineFlickerMaterialProperty";
import * as Cesium from "cesium";

const roadFlow = (viewer) => {
    Cesium.GeoJsonDataSource.load("").then((dataSource) => {
        viewer.dataSource.add(dataSource);
        const entities = dataSource.entities.values;
        //聚集
        viewer.zoomTo(entities);
        for (let i = 0; i < entities.length; i++) {
            let entity = entities[i];
            entity.polyline.width = 3.0;
            //设置材质
            entity.polyline.material = new Cesium.LineFlickerMaterialProperty({
                color: Cesium.Color.YELLOW,
                speed: 20 * Math.random()
            })
        }
    })
}