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

let viewer = null;
let tilesetModel = null
onMounted(async () => {
    viewer = await initCesium("cesiumContainer");
    tilesetModel  = new Cesium.Cesium3DTileset({
        url: "/3dtiles/data/tileset.json"
    });
    viewer.scene.primitives.add(tilesetModel);
})
const dialogVisible = ref(false);
let editB3dm = null
const btnClick = (params) => {
    const { id, step } = params;
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
