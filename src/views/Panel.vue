<template>
  <div class="demo-collapse">
    <el-collapse v-model="activeNames" @change="handleChange" accordion>
      <el-collapse-item title="操作3dtiles" name="tiles">
        <div>
          <el-button size="default">开始编辑</el-button>
          <el-button size="default">旋转</el-button>
          <el-button size="default">平移</el-button>
          <el-button size="default">关闭编辑</el-button>
        </div>
      </el-collapse-item>
      <el-collapse-item title="动态轨迹线" name="image">
        <div>
          <el-button size="default">图片轨迹线</el-button>
          <el-button size="default">清除图片轨迹线</el-button>
        </div>
      </el-collapse-item>
      <el-collapse-item title="二维特效" name="2d-effect">
        <div>
          <el-button size="default">二维雷达</el-button>
          <el-button size="default">扫描圆</el-button>
          <el-button size="default">扫描圆</el-button>
        </div>
        <div>
          <el-button size="default">扩散圆</el-button>
          <el-button size="default">消隐圆</el-button>
          <el-button size="default">清除效果</el-button>
        </div>

      </el-collapse-item>
      <el-collapse-item title="三维特效" name="3d-effect">
        <div>
          <el-button size="default">三维雷达</el-button>
          <el-button size="default">电弧球</el-button>
          <el-button size="default">扫描圆</el-button>
        </div>
        <div>
          <el-button size="default">扩散圆</el-button>
          <el-button size="default">消隐圆</el-button>
          <el-button size="default">清除效果</el-button>
        </div>
      </el-collapse-item>
      <el-collapse-item title="地理分析" name="geo-analysis">
        <div>
          <el-button size="default">缓冲区分析</el-button>
          <div class="slider-demo-block">
            <el-slider v-model="valueStep" :step="50" :max="800" />
          </div>
        </div>
        <div>
          <el-button size="default">地形分析</el-button>
          <el-button size="default">坡度分析</el-button>
        </div>
        <div>
          <el-button size="default">通视分析</el-button>
          <el-button size="default">可视域分析</el-button>
          <el-button size="default">清除效果</el-button>
        </div>
      </el-collapse-item>
      <el-collapse-item title="天气特效" name="weaterEffect">
        <div>
          <el-button size="default">雾天</el-button>
          <el-button size="default">雨天</el-button>
          <el-button size="default">晴天</el-button>
        </div>
        <div>
          <el-button size="default">雪天</el-button>
          <el-button size="default">多云</el-button>
          <el-button size="default">清除效果</el-button>
        </div>
      </el-collapse-item>
      <el-collapse-item title="粒子效果" name="particleSystem">
        <div>
          <el-button size="default">雾天</el-button>
          <el-button size="default">雨天</el-button>
          <el-button size="default">晴天</el-button>
        </div>
        <div>
          <el-button size="default">雪天</el-button>
          <el-button size="default">多云</el-button>
          <el-button size="default">清除效果</el-button>
        </div>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const activeNames = ref(['1'])
const handleChange = (val) => {
  console.log(val)
}
const valueStep = ref(0)
</script>

<style lang="less" scoped>
.demo-collapse {
  background-color: aqua;
}
</style>
