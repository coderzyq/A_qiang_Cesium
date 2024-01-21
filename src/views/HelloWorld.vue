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
            <Panel @changeRouter="changeRouter"></Panel>
        </div>
        <cesiumViewer />
        <router-link :to="key" />
    </div>
</template>

<script setup>
import Panel from "@/views/Panel.vue";
import cesiumViewer from "@/views/cesiumViewer.vue";
import { ref } from "vue"
import { useRouter, useRoute } from "vue-router";
const router = useRouter()
const route = useRoute()
const key = ref("")
const changeRouter = (path) => {
    console.log("changeRouter", path);
    key.value = path
    router.push({ path })
    console.log(route);
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
