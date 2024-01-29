<!--
 * @Description: 
 * @Author: A_qiang
 * @Date: 2023-06-06 21:17:52
 * @LastEditTime: 2023-01-21 19:14:02
 * @LastEditors: A_qiang
-->
<template>
    <div id="container">
        <div id="cesiumContainer"></div>
        <Panel v-model:visible="dialogVisible" @btnClick="btnClick"></Panel>
    </div>
</template>

<script setup>
import { ref } from "vue"
import { onMounted } from "vue";
import Panel from "@/views/Panel.vue";
import * as Cesium from "cesium"
import "cesium/Source/Widgets/widgets.css"
import initCesium from "@/cesiumUtils/initCesium"
import EditB3DM from "@/cesiumUtils/EditB3DM";
import PolylineImageTrailMaterialProperty from "@/cesiumUtils/ImageMaterial"
import DynamicMaskEllipsoid from "@/material/dynamicMaskEllipsoid"
import ElectricMaterialProperty4Ellipsoid from "@/material/electricMaterialProperty4Ellipsoid"
let viewer = null;
let tilesetModel = null
onMounted(async () => {
    viewer = await initCesium("cesiumContainer");
    tilesetModel = new Cesium.Cesium3DTileset({
        url: "/3dtiles/data/tileset.json"
    });
    viewer.scene.primitives.add(tilesetModel);
})
const dialogVisible = ref(false);
let editB3dm = null
let trailPolyline = null
//动态轨迹线（图片）
const imageProperty = (viewer) => {
    trailPolyline = viewer.entities.add({
        polyline: {
            clampToGround: true,
            //轨迹线的分布位置
            positions: Cesium.Cartesian3.fromDegreesArray([
                137, 36, 138, 36, 138, 37, 137, 37, 137, 38, 138, 38
            ]),
            material: new PolylineImageTrailMaterialProperty({
                //图片的颜色
                color: Cesium.Color.RED,
                //轨迹运行的速率
                speed: 10,
                //随意一张图片
                image: require("@/assets/smile.jpg"),
                //将轨迹分成一行50个图片
                repeat: { x: 40, y: 1 },
            }),
            width: 20,
        }
    })
    return trailPolyline
}
// 动态遮罩球
const maskMaterialEllipsoid = (viewer) => {
    viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(-107.0, 40.0, 300000.0),
        ellipsoid: {
            radii: new Cesium.Cartesian3(50000.0, 50000.0, 50000.0),
            material: new DynamicMaskEllipsoid({
                color: new Cesium.Color(1, 0, 0, 1),
                speed: 5.0,
            })
        }
    })
    viewer.flyTo(viewer.entities)
}
//电弧球
const electricMaterialProperty4Ellipsoid = (viewer) => {
    const newColor = Cesium.Color.fromRandom()
    let color = newColor.withAlpha(1)
    const electricEntity = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(-107.0, 40.0, 300000.0),
        ellipsoid: {
            radii: new Cesium.Cartesian3(100000.0, 100000.0, 100000.0),
            material: new ElectricMaterialProperty4Ellipsoid({
                color: new Cesium.CallbackProperty(() => {
                    return color
                }, false),
                // color: new Cesium.Color(1, 0, 0, 1),
                speed: 5.0,
            })
        }
    })
    viewer.flyTo(electricEntity)
}
const btnClick = (params) => {
    const { id, step } = params;
    console.log(id, step);
    switch (id) {
        case "initTiles":
            viewer.flyTo(tilesetModel)
            editB3dm = new EditB3DM(viewer, tilesetModel, 1, 1)
            break;
        case "rotation":
            editB3dm.editRotation()
            break;
        case "transition":
            editB3dm.editTranslation()
            break;
        case "destroyTiles":
            editB3dm.destroy()
            break;
        case "dynamcTrail":
            trailPolyline = imageProperty(viewer)
            viewer.camera.flyTo({
                destination: Cesium.Rectangle.fromDegrees(135, 35, 139, 40)
            })
            break;
        case "removeTrail":
            viewer.entities.remove(trailPolyline)
            break;
        case "electricMaterialEllipsoid":
            electricMaterialProperty4Ellipsoid(viewer)
            break;
        case "maskMaterialEllipsoid":
            maskMaterialEllipsoid(viewer)
            break;
        case "removeEffect":
            viewer.entities.removeAll()
            break;
    }
}
</script>
<style lang="less">
#container {
    width: 100vw;
    height: 100vh;

    #cesiumContainer {
        width: 100vw;
        height: 100vh;
        margin: 0;
        padding: 0;
        overflow: hidden;
    }
}
</style>