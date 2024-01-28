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
import Panel from "@/views/Panel.vue";
import "cesium/Source/Widgets/widgets.css"
import initCesium from "@/cesiumUtils/initCesium"
import { onMounted } from "vue";
let viewer = null;
onMounted(async () => {
    viewer = await initCesium("cesiumContainer");
})
const dialogVisible = ref(false);
const btnClick = (id) => {
    console.log("initCesium", id);
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
