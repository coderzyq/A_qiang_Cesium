<!--
 * @Description: 'App.vue入口文件'
 * @Author: A_qiang
 * @Date: 2023-06-06 21:17:52
 * @LastEditTime: 2023-01-21 19:14:02
 * @LastEditors: A_qiang
-->
<template>
  <div>
    <HelloWorld/>
  </div>
</template>

<script setup>
import HelloWorld from "@/views/HelloWorld.vue";
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
