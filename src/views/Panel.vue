<template>
  <div class="demo-collapse">
    <el-collapse v-model="activeNames" @change="handleChange" accordion>
      <el-collapse-item title="操作3dtiles" name="3dtiles">
        <div class="effect">
          <el-button size="default" @click="addTiles">开始编辑</el-button>
          <el-button size="default" @click="rotation">旋转</el-button>
          <el-button size="default" @click="transition">平移</el-button>
        </div>
        <div class="effect">
          <el-button size="default" @click="destroyTiles">关闭编辑</el-button>
        </div>
      </el-collapse-item>
      <el-collapse-item title="动态轨迹线" name="imageTrail">
        <div class="effect">
          <el-button size="default" @click="addImageTrail">图片轨迹线</el-button>
          <el-button size="default" @click="removeImageTrail">清除图片轨迹线</el-button>
        </div>
      </el-collapse-item>
      <el-collapse-item title="二维特效" name="2dEffect">
        <div class="effect">
          <el-button size="default">扫描圆</el-button>
          <el-button size="default">扫描圆</el-button>
          <el-button size="default">二维雷达</el-button>
        </div>
        <div class="effect">
          <el-button size="default">扩散圆</el-button>
          <el-button size="default">消隐圆</el-button>
          <el-button size="default">清除效果</el-button>
        </div>

      </el-collapse-item>
      <el-collapse-item title="三维特效" name="3dEffect">
        <div class="effect">
          <el-button size="default">电弧球</el-button>
          <el-button size="default">扫描圆</el-button>
          <el-button size="default">三维雷达</el-button>
        </div>
        <div class="effect">
          <el-button size="default">扩散圆</el-button>
          <el-button size="default">消隐圆</el-button>
          <el-button size="default">清除效果</el-button>
        </div>
      </el-collapse-item>
      <el-collapse-item title="地理分析" name="geoAnalysis">
        <div>
          <el-button size="default">缓冲区分析</el-button>
          <div class="slider-demo-block">
            <el-slider v-model="valueStep" :step="50" :max="800" />
          </div>
        </div>
        <div class="effect">
          <el-button size="default">地形分析</el-button>
          <el-button size="default">坡度分析</el-button>
        </div>
        <div class="effect">
          <el-button size="default">通视分析</el-button>
          <el-button size="default">可视域分析</el-button>
          <el-button size="default">清除效果</el-button>
        </div>
      </el-collapse-item>
      <el-collapse-item title="天气特效" name="weaterEffect">
        <div class="effect">
          <el-button size="default">雾天</el-button>
          <el-button size="default">雨天</el-button>
          <el-button size="default">晴天</el-button>
        </div>
        <div class="effect">
          <el-button size="default">雪天</el-button>
          <el-button size="default">多云</el-button>
          <el-button size="default">清除效果</el-button>
        </div>
      </el-collapse-item>
      <el-collapse-item title="粒子效果" name="particleSystem">
        <div class="effect">
          <el-button size="default">模拟火焰</el-button>
          <el-button size="default">汽车尾气</el-button>
          <el-button size="default">消防救火</el-button>
        </div>
        <div class="effect">
          <el-button size="default">雪天</el-button>
          <el-button size="default">多云</el-button>
          <el-button size="default">清除效果</el-button>
        </div>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script setup>
const emit = defineEmits(["changeRouter"])
import { ref } from 'vue'
const activeNames = ref(['1'])
const handleChange = (val) => {
  console.log(val)
  if (val) {
    emit("changeRouter", val)
    
  } else {
  }
}
const addTiles = () => {

}
const rotation = () => {

}
const transition = () => {

}
const destroyTiles = () => {

}
const addImageTrail = () => {

}
const removeImageTrail = () => {

}

const valueStep = ref(0)
</script>

<style lang="less" scoped>
// @color: #606266;
@color: #fff;
@maxWidth: 370px;
@minWidth: 320px;
@backgroundColor: rgba(20, 61, 101, 0.61);

.tiles {
  display: flex;
  // justify-content: space-between;
  align-items: flex-start;
  flex-direction: row;
  flex-wrap: wrap;
  // justify-content: space-evenly;
}

.effect {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-direction: row;
  flex-wrap: wrap;
  padding: 5px 25px;
  // justify-content: space-evenly;
}

::v-deep .demo-collapse {
  background-color: @backgroundColor !important;
  max-width: @maxWidth;
  min-width: @minWidth;
  border-radius: 25px;
}

::v-deep .el-collapse-item__header {
  border-radius: 5px;
  color: @color;
  background-color: @backgroundColor !important;
  font-size: 16px;
  min-width: @minWidth;
  max-width: @maxWidth;
  // position: relative;
}

::v-deep .el-collapse-item__wrap {
  color: @color;
  background-color: @backgroundColor !important;
  font-size: 16px;
  min-width: @minWidth;
  max-width: @maxWidth;
  // position: relative;
}

::v-deep .el-collapse-item__content {
  // text-align: left;
  color: @color;
  min-width: @minWidth;
  max-width: @maxWidth;
  background-color: @backgroundColor;
  padding: 10px;
}</style>
