/**
 * @class Ext.menu.ContextMenu
 * @description 右键菜单面板
 */
import "./style.css";
import * as Cesium from "cesium";
import { ElMessage } from "element-plus";
import {
  getCameraParams,
  copyContext,
  getCartesian3FromPX,
  getScreenshot,
} from "../cesiumUtil.js";
import MeasureTool from "../MeasureTool.js";
export default class ContextMenu {
  constructor(viewer, cesiumId) {
    this.contextMenuItems = [];
    this.viewer = viewer;
    this.treeRoot = null;
    this.cesiumId = cesiumId;
    this.preventDefaultContextMenu();
    this.rightClickEvent();
  }

  // 阻止浏览器默认右键菜单
  preventDefaultContextMenu() {
    // 确保canvas存在
    if (this.viewer?.canvas) {
      window.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        return false;
      });
    }
  }

  //右击事件
  rightClickEvent() {
    this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas);
    this.handler.setInputAction((movement) => {
      this.closeContextMenu();
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    this.handler.setInputAction((movement) => {
      //获取鼠标点击位置
      this.clickScreenPosition = movement.position;
      this.setContextMenuPosition(this.clickScreenPosition);
      this.openContexMemu();
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  }

  //回调事件
  callback() {}

  //创建菜单面板Tree
  createTreeNode(node) {
    const container = document.createElement("div");
    container.className = "tree-node";
    if (node.id) {
      container.id = node.id;
    }
    const content = document.createElement("div");
    content.className = "node-content";

    // 初始化节点状态
    node.isExpanded = node.isExpanded || false;

    if (node.children) {
      content.classList.add("has-children");
      content.innerHTML = `
                    <span class="toggle-icon">${
                      node.isExpanded ? "−" : "+"
                    }</span>
                    ${node.name}
                `;

      const childrenContainer = document.createElement("div");
      childrenContainer.className = "children";

      // 根据状态设置初始高度
      if (node.isExpanded) {
        childrenContainer.style.height = "auto";
      } else {
        childrenContainer.style.height = "0px";
      }

      // 递归创建子节点
      node.children.forEach((child) => {
        childrenContainer.appendChild(this.createTreeNode(child));
      });

      container.appendChild(content);
      container.appendChild(childrenContainer);

      // 添加点击事件切换展开/折叠 - 修复状态问题
      content.addEventListener("click", (e) => {
        e.stopPropagation();

        // 切换状态
        node.isExpanded = !node.isExpanded;

        if (node.isExpanded) {
          // 先设置为auto获取实际高度
          childrenContainer.style.height = "auto";
          const height = childrenContainer.scrollHeight + "px";

          // 重置高度以进行动画
          childrenContainer.style.height = "0px";

          // 触发重绘
          void childrenContainer.offsetHeight;

          // 应用动画高度
          childrenContainer.style.height = height;
          content.querySelector(".toggle-icon").textContent = "−";
        } else {
          childrenContainer.style.height =
            childrenContainer.scrollHeight + "px";

          // 触发重绘
          void childrenContainer.offsetHeight;

          childrenContainer.style.height = "0px";
          content.querySelector(".toggle-icon").textContent = "+";
        }
      });

      // 动画结束后设置最终高度
      childrenContainer.addEventListener("transitionend", () => {
        if (node.isExpanded) {
          childrenContainer.style.height = "auto";
        }
      });
    } else {
      content.innerHTML = `<span class="toggle-icon">•</span> ${node.name}`;
      container.appendChild(content);
      if (node.id) {
        content.id = node.id;
      }
      //绑定callback到click事件
      if (typeof node.callback === "function") {
        content.addEventListener("click", (e) => {
          e.stopPropagation();
          node.callback();
          this.closeContextMenu();
        });
      }
    }
    return container;
  }

  //渲染整个树
  renderTree(treeData) {
    if (treeData.length > 0) {
      this.treeRoot = document.createElement("div");
      this.treeRoot.className = "tree-container";
      this.treeRoot.style.display = "none";
      document.body.appendChild(this.treeRoot);
      this.treeRoot.innerHTML = "";
      treeData.forEach((node) => {
        this.treeRoot.appendChild(this.createTreeNode(node));
      });
    }
  }
  //默认菜单
  defaultContextMenu() {
    let contextString = "";
    this.contextMenuItems = [
      {
        name: "查看当前视角",
        id: "currentView",
        callback: () => {
          const { lon, lat, height, heading, pitch, roll } = getCameraParams(
            this.viewer
          );
          contextString = `{lon: ${lon.toFixed(6)}, lat: ${lat.toFixed(
            6
          )}, height: ${height.toFixed(6)}, heading: ${heading.toFixed(
            6
          )}, pitch: ${pitch.toFixed(6)}, roll: ${roll.toFixed(6)}}`;
          copyContext(contextString);
        },
      },
      {
        name: "获取点击点的位置",
        id: "getClickPosition",
        callback: () => {
          const { lng, lat, alt } = getCartesian3FromPX(
            this.viewer,
            this.clickScreenPosition
          );
          contextString = `lng: ${lng}, lat: ${lat}, height: ${alt}`;
          copyContext(contextString);
          // this.handler.setInputAction((movement) => {
          //   this.closeContextMenu();
          // }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
        },
      },
      {
        name: "视角切换",
        id: "changeView",
        children: [
          {
            name: "允许进入地下",
            id: "allowUnderground",
            callback: () => {
              ElMessage({
                message: "正在开发中",
                type: "warning",
              });
            },
          },
          {
            name: "地形服务",
            id: "terrainService",
            callback: () => {
              ElMessage({
                message: "正在开发中",
                type: "warning",
              });
            },
          },
          {
            name: "高级设置",
            id: "advancedSetting",
            children: [
              {
                name: "视角高度",
                id: "viewHeight",
                callback: () => {},
              },
              { name: "视角角度", id: "viewAngle", callback: () => {} },
              { name: "视角范围", id: "viewRange", callback: () => {} },
            ],
          },
        ],
      },
      {
        name: "绕此处环绕飞行",
        id: "flyAround",
        callback: () => {
          ElMessage({
            message: "正在开发中",
            type: "warning",
          });
        },
      },
      {
        name: "图上量算",
        id: "measure",
        children: [
          {
            name: "空间距离",
            id: "distanceMeasure",
            callback: () => {
              const measureTool = new MeasureTool(this.viewer);
              measureTool.measureLineSpace(this.viewer);
            },
          },
          {
            name: "地表距离",
            id: "areaMeasure",
            callback: () => {
              ElMessage({
                message: "正在开发中",
                type: "warning",
              });
            },
          },
          {
            name: "地表面积",
            id: "heightMeasure",
            callback: () => {
              ElMessage({
                message: "正在开发中",
                type: "warning",
              });
            },
          },
          {
            name: "三角测量",
            id: "lineMeasure",
            callback: () => {
              ElMessage({
                message: "正在开发中",
                type: "warning",
              });
            },
          },
          {
            name: "高度差",
            id: "heightDifference",
            callback: () => {
              ElMessage({
                message: "正在开发中",
                type: "warning",
              });
            },
          },
          {
            name: "三角测量",
            id: "triangleMeasure",
            callback: () => {
              ElMessage({
                message: "正在开发中",
                type: "warning",
              });
            },
          },
          {
            name: "清除结果",
            id: "clearResult",
            callback: () => {
              ElMessage({
                message: "正在开发中",
                type: "warning",
              });
            },
          },
        ],
      },
      {
        name: "移动到此处",
        id: "moveToHere",
        callback: () => {
          ElMessage({
            message: "正在开发中",
            type: "warning",
          });
        },
      },
      {
        name: "地形服务",
        children: [
          {
            name: "开启深度检测",
            id: "depthTest",
            callback: () => {
              this.viewer.scene.globe.depthTestAgainstTerrain = true;
            },
          },
          {
            name: "关闭深度检测",
            id: "closeDepthTest",
            callback: () => {
              this.viewer.scene.globe.depthTestAgainstTerrain = false;
            },
          },
          {
            name: "显示地形三角网",
            id: "showTerrainTriangles",
            callback: () => {
              this.viewer.scene.globe._surface.tileProvider._debug.wireframe = true;
            },
          },
          {
            name: "隐藏地形三角网",
            id: "hideTerrainTriangles",
            callback: () => {
              this.viewer.scene.globe._surface.tileProvider._debug.wireframe = false;
            },
          },
          {
            name: "显示地形",
            id: "showTerrain",
            callback: async () => {
              this.viewer.terrainProvider =
                await Cesium.createWorldTerrainAsync({
                  requestVertexNormals: true, //请求地形照明数据
                  requestWaterMsk: true, // 请求水体效果所需要的海岸线数据
                });
            },
          },
          {
            name: "隐藏地形",
            id: "hideTerrain",
            callback: () => {
              this.viewer.terrainProvider =
                new Cesium.EllipsoidTerrainProvider();
            },
          },
        ],
      },
      {
        name: "第一视角站到此处",
        id: "firstView",
        callback: () => {
          ElMessage({
            message: "正在开发中",
            type: "warning",
          });
        },
      },
      {
        name: "特效效果",
        id: "effect",
        children: [
          {
            name: "天气效果",
            id: "weatherEffect",
            callback: () => {
              console.log("object");
              ElMessage({
                message: "正在开发中",
                type: "warning",
              });
            },
          },
          {
            name: "光照效果",
            id: "lightEffect",
            callback: () => {
              ElMessage({
                message: "正在开发中",
                type: "warning",
              });
            },
          },
          {
            name: "时间效果",
            id: "timeEffect",
            callback: () => {
              ElMessage({
                message: "正在开发中",
                type: "warning",
              });
            },
          },
          {
            name: "特效效果",
            id: "effectEffect",
            callback: () => {
              ElMessage({
                message: "正在开发中",
                type: "warning",
              });
            },
          },
        ],
      },
      {
        name: "开启键盘漫游",
        id: "keyboardRoam",
        callback: () => {
          ElMessage({
            message: "正在开发中",
            type: "warning",
          });
        },
      },
      {
        name: "场景出图",
        id: "screenshot",
        callback: () => {
          getScreenshot(this.viewer);
        },
      },
      {
        name: "场景设置",
        id: "sceneSetting",
        children: [
          { name: "地图样式", id: "mapStyle", callback: () => {} },
          { name: "图层管理", id: "layerManagement", callback: () => {} },
          {
            name: "坐标系设置",
            id: "coordinateSystemSetting",
            callback: () => {
              ElMessage({
                message: "正在开发中",
                type: "warning",
              });
            },
          },
        ],
      },
    ];
    this.renderTree(this.contextMenuItems);
    return this.contextMenuItems;
  }

  //定制菜单
  customContextMenu() {
    this.contextMenuItems = [];
    return this.contextMenuItems;
  }

  //绑定菜单
  bindContextMenu() {
    // this.leftClickMenu();
  }

  //解除绑定的右键菜单
  unbindContextMenu() {
    this.contextMenuItems = [];
  }

  //打开右键菜单
  openContexMemu() {
    this.treeRoot.style.display = "block";
  }

  //关闭右键菜单栏
  closeContextMenu() {
    this.treeRoot.style.display = "none";
  }

  //菜单栏点击事件
  leftClickMenu() {
    this.treeRoot.addEventListener("click", (e) => {
      //阻止事件冒泡
      e.stopPropagation();
      //获取点击的目标元素
      const target = e.target;
      const menuItem = this.findMenuItemById(target.id);
    });
  }

  //根据id找打菜单项
  findMenuItemById(id, items = this.contextMenuItems) {
    for (const item of items) {
      if (item.id === id) {
        return item;
      }
      if (item.children) {
        const found = this.findMenuItemById(id, item.children);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }

  //自定义菜单位置
  setContextMenuPosition(clickPosition) {
    //使用getBoundingClientRect()获取元素的实际尺寸
    const treeContainerWidth =
      this.treeRoot.getBoundingClientRect().width || 300;
    const treeContainerHeight =
      this.treeRoot.getBoundingClientRect().height || 400;

    const canvasHeight = this.viewer.scene.canvas.height;
    const canvasWidth = this.viewer.scene.canvas.width;
    // 在方法开始处添加
    this.treeRoot.style.top = "";
    this.treeRoot.style.bottom = "";
    this.treeRoot.style.left = "";
    this.treeRoot.style.right = "";
    if (clickPosition.x > canvasWidth - treeContainerWidth - 10) {
      this.treeRoot.style.right = canvasWidth - clickPosition.x + "px";
      if (clickPosition.y > canvasHeight - treeContainerHeight - 10) {
        this.treeRoot.style.bottom = canvasHeight - clickPosition.y + "px";
      } else {
        this.treeRoot.style.top = clickPosition.y + "px";
      }
    } else {
      this.treeRoot.style.left = clickPosition.x + "px";
      if (clickPosition.y > canvasHeight - treeContainerHeight - 10) {
        this.treeRoot.style.bottom = canvasHeight - clickPosition.y + "px";
      } else {
        this.treeRoot.style.top = clickPosition.y + "px";
      }
    }
  }
}
