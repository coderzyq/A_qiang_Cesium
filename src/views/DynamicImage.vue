<!--
 * @Description: cesium组件
 * @Author: coderqiang
 * @Date: 2023-06-06 21:23:53
 * @LastEditTime: 2023-08-21 22:40:47
 * @LastEditors: coderqiang
-->
<template>
    <div>
        <div class="edit">
            <el-button size="medium" @click="imageProperty">图片轨迹线</el-button>
        </div>
        <div id="cesiumContainer"></div>
    </div>
</template>

<script setup>
import * as Cesium from "cesium"
import "cesium/Source/Widgets/widgets.css"
import initCesium from "@/cesiumUtils/initCesium"
import { onMounted } from "vue";
import PolylineImageTrailMaterialProperty from "@/cesiumUtils/ImageMaterial"
let viewer = null;
//生命周期钩子
onMounted(async () => {
    viewer = await initCesium("cesiumContainer");
})
const imageProperty = () => {
    viewer.entities.add({
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
}


</script>

<style lang="less" scoped>
#cesiumContainer {
    width: 100vw;
    height: 100vh;
    margin: 0;
    padding: 0;
    overflow: hidden;
    position: relative;
}
.dynamic-trail-tools {
    position: absolute;
    border: 1px solid rgb(31, 30, 30);
    border-radius: 5px;
    background-color: rgba(66, 65, 66, 0.8);
    z-index: 9999;
    margin: 10px;
    padding: 10px;
}
.edit {
    position: absolute;
    top: 10px;
    left: 10px;
    padding: 10px;
    z-index: 1;
}

.plotting-tool {
    position: absolute;
    margin: 10px;
    padding: 10px;
    border: 1px solid rgb(39, 38, 38);
    border-radius: 5px;
    background-color: rgba(66, 65, 66, 0.8);
    z-index: 10;
}
</style>
