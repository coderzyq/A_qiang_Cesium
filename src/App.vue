<!--
 * @Description: 'App.vue入口文件'
 * @Author: A_qiang
 * @Date: 2023-06-06 21:17:52
 * @LastEditTime: 2023-01-21 19:14:02
 * @LastEditors: A_qiang
-->
<template>
  <div>
    <cesiumViewer/>
    <router-link :to="link" />
  </div>
</template>

<script setup>
import { useStore } from "vuex"
import {ref, watch} from 'vue';
import { useRouter, useRoute } from "vue-router";
import cesiumViewer from "@/views/CesiumViewer.vue";
const router = useRouter()
const route = useRoute()
const store = useStore()
const link = ref("index")
router.push({
  path: link.value
})
//监听
watch(
  () => store.getters.format,
  (newval) => {
    router.push({
      path: newval
    })
  }
)

</script>
<style lang="less">
* {
  margin: 0;
  padding: 0;
}

html,
body,
#app {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  margin: 0;
  padding: 0;
}
</style>
