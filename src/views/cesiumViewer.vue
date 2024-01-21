<template>
    <div id="cesiumContainer"></div>
</template>

<script setup>
import "cesium/Source/Widgets/widgets.css"
import initCesium from "@/cesiumUtils/initCesium"
import { onMounted } from "vue";
let viewer = null;
onMounted(async () => {
    viewer = await initCesium("cesiumContainer");
})
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
</style>