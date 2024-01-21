<!--
 * @Description: 
 * @Author: A_qiang
 * @Date: 2023-06-06 21:17:52
 * @LastEditTime: 2023-01-21 19:14:02
 * @LastEditors: A_qiang
-->
<template>
    <div>
        <div class="edit">
            <Panel @addTiles="addTiles"></Panel>
        </div>
        <cesiumViewer />
    </div>
</template>

<script setup>
import Panel from "@/views/Panel.vue";
import cesiumViewer from "@/views/cesiumViewer.vue";
const addTiles = () => {
    console.log("addTiles");
}
</script>
<style lang="less">
.edit {
    position: absolute;
    top: 10px;
    left: 10px;
    padding: 10px;
    z-index: 1;
    border-radius: 5px;
}
</style>
