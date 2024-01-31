<!--
 * @Description: cesium组件
 * @Author: coderqiang
 * @Date: 2023-06-06 21:23:53
 * @LastEditTime: 2023-08-21 22:40:47
 * @LastEditors: coderqiang
-->
<template>
    <div>
        <!-- <div class="dynamic-trail-tools">
            <el-switch v-model="openRandom" size="large" active-text="已开启动态色" inactive-text="已关闭状态色" />
        </div> -->
        <div id="cesiumContainer">

            <!-- <div class="plotting-tool">
                <el-button size="mini" @click="startDraw()">开始创建</el-button>
            </div> -->
            <!-- <eagle-map v-if="showMapx"></eagle-map> -->
        </div>
        <div class="edit">
            <el-button size="mini" @click="terrainClip(true)">开始创建</el-button>
            <div style="margin-top: 5px">
                开挖高度：
                <el-input-number size="mini" controls-position="right" v-model="height" :step="10" :min="0" :max="30000"
                    @change="heightChange"></el-input-number>
            </div>
        </div>
        <!-- <button @click="startEdit">开始编辑</button>
            <button @click="moveEdit">移动</button>
            <button @click="transformEdit">旋转</button>
            <button @click="cancelEdit">取消编辑</button>
        </div> -->

    </div>
</template>

<script setup>
import * as Cesium from "cesium"
import "cesium/Source/Widgets/widgets.css"

import initCesium from "@/cesiumUtils/initCesium"
import createPolygon from "@/components/xx";
// import EditB3DM from "@/cesiumUtils/EditB3DM";
// import EchartsLayer from "@/cesiumUtils/migrate";
// import pathOption from "@/cesiumUtils/data";
// import { setFlyline } from "@/cesiumUtils/ariline"
import { ref, onMounted, watch, defineAsyncComponent, onErrorCaptured } from "vue";
// // import { parabolaFlowInit, flowInitDestory } from "@/cesiumUtils/flow";
// // import { lineFlowInit } from "@/cesiumUtils/generateRandomPosition"
// // import { CircleDiffuseMaterialProperty } from "@/cesiumUtils/breathCircle";
// // import { handlerFunc } from "@/cesiumUtils/xx"
// import ShuttleLineMaterialProperty from "@/cesiumUtils/ImageMaterial copy"
import TerrainExcavation from "@/material/TerrainExa";
// // import ElectricMaterialProperty4Ellipsoid from "@/material/DynamicBall copy"
import ElectricMaterialProperty4Ellipsoid from "@/material/DynamicBall"

// import EagleMap from "@/components/eagleMap.vue"
// const EagleMap = defineAsyncComponent(() => {
//     import("@/components/eagleMap.vue")
// } )

let viewer = null;
let terrainClipPlanObj = undefined;
// let showMapx = ref(false)
// const openRandom = ref(false)
// let color = ref(undefined);
// let timer = ref(undefined)
// // let editObj
// // let b3dm = ""
let height = 20
// let positions = Cesium.Cartesian3.fromDegreesArray([
//     110.0, 39.0, 111.0, 39.0, 111.0, 40.0, 110.0, 40.0, 110.0, 39
// ])
// onErrorCaptured(e => {
//     console.log("e", e);
// })
//生命周期钩子
onMounted(async () => {
    viewer = await initCesium("cesiumContainer");
    viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(116, 35, 100000)
    })
    // showMapx.value = true
    // const wall = viewer.entities.add({
    //     polyline: {
    //         clampToGround: true,
    //         positions: positions,
    //         material: new ShuttleLineMaterialProperty(2000, require("../cesiumUtils/range.png"), new Cesium.Color(0, 0, 1, 1.0)),
    //         width: 8
    //     }
    // })
    // viewer.flyTo(wall)
    // dynamicBall(viewer)
})
// watch(openRandom, (val) => {
//     if (val) {
//         timer = setInterval(() => {
//             const newColor = Cesium.Color.fromRandom()
//             color = newColor.withAlpha(1)
//         }, 1000)
//     } else {
//         clearInterval(timer)
//     }
// }
// )
const heightChange = (val) => {
    if (terrainClipPlanObj) {
        terrainClipPlanObj.height = val;
    }
}
const terrainClip = (bool) => {
    if (!terrainClipPlanObj) {
        terrainClipPlanObj = new TerrainExcavation(viewer, {
            height: height,
            splitNum: 1000,
            bottomImg: require("./gg.png"),
            wallImg: require("./gg.png"),
        });
    }
    if (bool) {
        console.log("开始地形开挖");
        terrainClipPlanObj.startCreate();
    } else {
        console.log("结束地形开挖");
        terrainClipPlanObj.clear();
    }
}

// 动态扩散球
const dynamicBall = (viewer) => {
    color = Cesium.Color.PURPLE
    viewer.entities.add({
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
    viewer.flyTo(viewer.entities)
}

// console.log(viewer)

//开始编辑
// const startEdit = () => {
//     console.log(viewer)
//     console.log("4444")
//     console.log(editObj)
// }

// //平移
// const moveEdit = () => {
//     editObj.editTranslation()
//     console.log("3333")
// }

// //旋转
// const transformEdit = () => {
//     // editObj.editRation()
//     console.log("2222")
// }
// //取消编辑
// const cancelEdit = () => {
//     // editObj.destroy()
//     console.log("1111")
// }

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
    top: 0;
    left: 0;
    padding: 10px;
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

@/material/dynamicMaskEllipsoid