<template>
  <div class="panel-wrap" :class="{ hide: !dialogVisible }">
    <header class="panel-header">
      <span>{{ props.title }}</span>
      <span class="close-btn" @click="toggle">×</span>
    </header>
    <div class="demo-collapse">
      <el-collapse v-model="activeNames" @change="handleChange" accordion>
        <div v-for="(btn, index) in btns" :key="index">
          <el-collapse-item :title="btn.label" :name="btn.name">
            <div v-for="(item, index) in btn.contents" @click="btnClick(item)" style="margin: 10px;">
              <el-button size="default">{{ item.label }}</el-button>
              <el-slider v-if="item.id === 'bufferAnalysis'" v-model="valueStep" :step="50" :max="800" />
              <el-slider v-else-if="item.id === 'polygonExa'" v-model="valueExa" :step="1" :max="40" />
            </div>
          </el-collapse-item>
        </div>

      </el-collapse>
    </div>
    <footer class="panel-footer">
      <!-- <span>{{ props.title }}</span> -->
    </footer>
    <aside class="bar" @click="toggle">
      <span :class="{ 'slide-in': dialogVisible }">＞</span>
    </aside>
  </div>
</template>

<script setup>
const emit = defineEmits(["addTiles", "update:visible", "btnClick"])
import { ref, reactive, watchEffect } from 'vue';
import { useStore, mapState } from "vuex"
const store = useStore()
const props = defineProps({
  title: {
    type: String,
    default: "菜单",
  },
  width: {
    type: String,
    default: "30%",
  },
  visible: {
    type: Boolean,
    default: false,
  },
})
const activeNames = ref(['1'])
const dialogVisible = ref(true);
watchEffect(() => {
  dialogVisible.value = props.visible;
});
const btns = reactive([
  {
    label: "分屏对比",
    name: "splitViewer",
    contents: [
      { id: "startSync", label: "开启分屏" },
      { id: "cancelSync", label: "取消分屏" },
    ]
  },
  {
    label: "操作3dtiles",
    name: "3dtiles",
    contents: [
      { id: "initTiles", label: "开始编辑" },
      { id: "rotation", label: "旋转" },
      { id: "transition", label: "平移", },
      { id: "destroyTiles", label: "关闭编辑", }
    ]
  },
  {
    label: "动态轨迹线",
    name: "imageTrail",
    contents: [
      { id: "dynamcTrail", label: "动态轨迹线" },
      { id: "removeTrail", label: "清除轨迹线" }
    ]
  },
  {
    label: "二维特效",
    name: "2dEffect",
    contents: [
      { id: "scanCircle", label: "扫描圆" },
      { id: "scanRadar", label: "二维雷达" },
      { id: "expandCircle", label: "扩散圆" },
      { id: "breathCircle", label: "呼吸圆" },
      { id: "disappearCircle", label: "消隐圆" },
      { id: "gifBillboard", label: "加载gif图片" },
      { id: "removeEffect", label: "清除效果" }
    ]
  },
  {
    label: "三维特效",
    name: "3dEffect",
    contents: [
      { id: "electricMaterialEllipsoid", label: "电弧球" },
      { id: "maskMaterialEllipsoid", label: "遮罩球" },
      { id: "3dScanRadar", label: "三维雷达" },
      { id: "breathCircle", label: "呼吸圆" },
      { id: "disappearCircle", label: "消隐圆" },
      { id: "dynamicfrustum", label: "动态视锥体" },
      { id: "removeEffect", label: "清除效果" }
    ]
  },
  {
    label: "后处理",
    name: "postProcessing",
    contents: [
      { id: "getWorldCoordinates", label: "求取世界坐标" },
      { id: "shaderParamsUpdate", label: "着色器参数更新" },
      { id: "limit-earth", label: "范围限制-地球" },
      { id: "limit-radius", label: "范围限制-半径" },
      { id: "limit-rectangle", label: "范围限制-矩形" },
      { id: "fogByDistance", label: "根据相机距离雾化" },
      { id: "fogByCenter", label: "距离中心雾化" },
      { id: "fogLinear", label: "高度雾-线性高度" },
      { id: "fogExponent", label: "高度雾-指数高度" },
      { id: "snow", label: "积雪" },
      { id: "removeEffect", label: "清除效果" },
    ]
  },
  {
    label: "Globe类",
    name: "globalMaterial",
    contents: [
      { id: "elevationContour", label: "局部等高线" },
      { id: "slopeRamp", label: "局部坡度" },
      { id: "aspectRamp", label: "局部坡向" },
      { id: "elevationRamp", label: "局部高程" },
      { id: "discard", label: "裁剪" },
      { id: "globalMaterialRemove", label: "清除全局材质" },
    ]
  },
  {
    label: "阴影贴图",
    name: "shadowMap",
    contents: [
      { id: "enableCamera", label: "可视化镜头" },
      { id: "visibilityAnalysis", label: "可见性分析" },
      { id: "videoShadowMap", label: "视频阴影贴图" },
      { id: "disableShadowMap", label: "关闭阴影贴图" }
    ]
  },
  {
    label: "离屏渲染",
    name: "offScreenRender",
    contents: [
      {id: "flyToEnd", label: '镜头飞到终点'},
      {id: "fbo", label: '可视化FBO'},
      {id: 'fbo_canvas', label: '可视化FBO-Canvas'},
      {id: 'fbo_canvas_render', label: "可视化FBO-Canvas-实时渲染"},
      {id: "custom_camera_offScreenReder", label: "自定义相机离屏渲染"},
      {id: 'hidden_context', label: "隐藏不必要的内容"},
      {id: "roomIn", label: "室内查看"},
      {id: "pickDepth", label: "深度图解析" }
    ]
  },
  {
    label: "无人机漫游",
    name: "uavRoamingFly",
    contents: [
      { id: "startRoaming", label: "开始漫游" },
      { id: "pauseRoaming", label: "暂停漫游" },
      { id: "routePoint", label: "航线点位" },
      { id: "cancelRoaming", label: "取消漫游" },
    ]
  },
  {
    label: "地理分析",
    name: "geoAnalysis",
    contents: [
      { id: "bufferAnalysis", label: "缓冲区分析" },
      { id: "polygonExa", label: "多边形挖掘" },
      { id: "terrainAnalysis", label: "地形分析" },
      { id: "slopeAnalysis", label: "坡度分析" },
      { id: "breakAnalysis", label: "通视分析" },
      { id: "viewAnalysis", label: "可视域分析" },
      { id: "heightAnalysis", label: "高程分析" },
      { id: "removeAnalysis", label: "清除效果" },
    ]
  },
  {
    label: "地下管网",
    name: "underGroundPipeNet",
    contents: [
      { id: "exagg", label: "多边形裁剪" },
      { id: "pipeVisible", label: "管网显示" },
      { id: "pipeHidden", label: "管网隐藏" },
    ]
  },
  {
    label: "天气",
    name: "weaterEffect",
    contents: [
      {
        id: "rainProcessStage",
        label: "雨天(pps)",
      },
      {
        id: "snowProcessStage",
        label: "雪天(pps)",
      },
      {
        id: "fogProcessStage",
        label: "雾天(pps)",
      },
      {
        id: "clouds",
        label: "多云",
      },
    ],
  },
  {
    label: "粒子效果",
    name: "particleSystem",
    contents: [
      { id: "fire", label: "模拟火焰", },
      { id: "carExhaust", label: "汽车尾气" },
      { id: "firefighting", label: "消防救灾" },
      { id: "remove", label: "清除效果" },
    ],
  }
]);
const valueStep = ref(50)
const valueExa = ref(10)
const btnClick = (item) => {
  if (item.id == "bufferAnalysis") {
    item.step = valueStep.value
  } else {
    item.step = valueExa.value
  }
  emit("btnClick", { ...item })
}
const toggle = () => {
  dialogVisible.value = !dialogVisible.value;
  emit("update:visible", dialogVisible.value);
};
const handleChange = (val) => {
  if (val) {
    store.commit("EXCHANGE_LINK", val)
  } else {
  }
}


</script>

<style lang="less" scoped>
@color: #fff;
@maxWidth: 310px;
@minWidth: 310px;
@width: 320px;
@backgroundColor: rgba(20, 55, 95, 0.3);

.panel-wrap {
  font-size: 14px;
  position: fixed;
  top: 20%;
  transform: translateY(-20%);
  background: @backgroundColor;
  transition: left 0.24s ease-in-out;
  border: 1px solid border-box;
  width: @width;
  border-radius: 10px;

  &.hide {
    left: -330px
  }

  .panel-header {
    padding: 0 0 0 10px;
    line-height: 40px;
    color: @color;
    display: flex;
    justify-content: space-between;
    background-color: @backgroundColor;

    .close-btn {
      display: inline-block;
      cursor: pointer;
      width: 30px;
      height: 30px;
      font-size: 30px;
      padding: 0 5px;
    }
  }

  .panel-footer {
    border: 10px solid @backgroundColor;
    border-bottom-left-radius: 10px;
    border-bottom-right-radius: 10px;
  }

  .bar {
    width: 30px;
    height: 40px;
    font-size: 30px;
    text-align: center;
    line-height: 40px;
    border-top-right-radius: 10px;
    border-bottom-right-radius: 10px;
    position: absolute;
    right: -30px;
    top: 50%;
    transform: translateY(-50%);
    color: @color;
    background: rgba(70, 131, 180);
    cursor: pointer;
    opacity: 0.4;
    transition: all 0.25s ease-in-out;

    span {
      transition: all 0.25s ease-in-out;

      &.slide-in {
        display: inline-block;
        transform: rotate(0.5turn);
      }
    }

    &:hover {
      opacity: 1;
    }
  }
}

:deep(.demo-collapse) {
  background-color: @backgroundColor !important;
  max-width: @maxWidth;
  min-width: @minWidth;
}

:deep(.el-collapse) {
  border-top: 1px solid rgba(70, 131, 180, 0.596);
  border-bottom: 1px solid rgba(70, 131, 180, 0.596);
}

:deep(.el-collapse-item) {
  color: @color;
  background-color: @backgroundColor !important;
  font-size: 16px;
  width: @width;
}

:deep(.el-collapse-item__header) {
  color: @color;
  background-color: @backgroundColor !important;
  font-size: 16px;
  max-width: @maxWidth;

  border: 0px;
  padding: 0 0 0 10px;
  border-bottom: 1px solid transparent;
}

:deep(.el-collapse-item__wrap) {
  color: @color;
  background-color: @backgroundColor !important;
  font-size: 16px;
  min-width: @minWidth;
  max-width: @maxWidth;
  border-bottom: 1px solid transparent;
}

:deep(.el-collapse-item__content) {
  color: @color;
  min-width: @minWidth;
  max-width: @maxWidth;
  background-color: @backgroundColor;
  padding: 5px;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
}

:deep(.el-slider) {
  width: 290px;
}
</style>
