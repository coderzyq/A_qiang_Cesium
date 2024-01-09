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
            <el-button size="medium" @click="editObj">开始编辑</el-button>
            <el-button size="medium" @click="rotation">旋转</el-button>
            <el-button size="medium" @click="translation">平移</el-button>
            <el-button size="medium" @click="destroy">关闭编辑</el-button>
        </div>
        <div id="cesiumContainer"></div>
    </div>
</template>

<script setup>
import * as Cesium from "cesium"
import "cesium/Source/Widgets/widgets.css"
import initCesium from "@/cesiumUtils/initCesium"
import { onMounted } from "vue";
import EditB3DM from "@/cesiumUtils/EditB3DM"
let viewer = null;
let tilesetModel = null
let b3dm = null;
//生命周期钩子
onMounted(async () => {
    viewer = await initCesium("cesiumContainer");
    tilesetModel = new Cesium.Cesium3DTileset({
        url: "/3dtiles/data/tileset.json"
    });
    viewer.scene.primitives.add(tilesetModel);
    viewer.flyTo(tilesetModel)
})
const editObj = () => {
    b3dm = new EditB3DM(viewer, tilesetModel, 1, 1)
    return b3dm
}
const rotation = () => {
    b3dm.editRtation()
}
const translation = () => {
    b3dm.editTranslation()
}
const destroy = () => {
    b3dm.destroy()
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

@/cesiumUtils/EditB3DM