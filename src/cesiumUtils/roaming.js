import * as Cesium from "cesium";
export class Roaming {
  /**
     * Creates an instance of Roaming.
     * @param {*} viewer 需要传入
     * @param {*} options.model 模型的相关配置 需要传入
     * @param {*} options.time 漫游时间  需要传入
     * @param {*} options.data  点集合 需要传入
     * @param {*} options.isPathShow 路径是否显示 默认显示
     * @memberof Roaming
     * @example
     *  const options = {
            data: '', // url 或者直接数据，格式和以前一样
            [[118.0934604649,36.4962917382,0.0000000000],
            [118.0994790303,36.4968896092,0.0000000000],
            [118.1073213755,36.4948705851,0.0000000000],
            [118.1117433365,36.4988055865,0.0000000000],
            [118.1175428690,36.5152126572,0.0000000000],
            [118.1236262685,36.5237527465,0.0000000000]]
            view: { pitch: '', range: '' }, // 默认不传
            model: {
                url: ''// 和cesium中model的配置一致
            },
            isPathShow: true, // 漫游路径是否显示
            speed: '', // 默认可不传
            time: 500// 此次漫游所需要的总时间，单位：秒
        };
     */
  constructor(viewer, options) {
    this.viewer = viewer;
    this.updateOptionsParams(options);
    this.entity = undefined;
    this.start = undefined;
    this.stop = undefined;
    this.isPlay = true; // 鼠标控制漫游是否播放的变量
    this.addRoamingHandler(); // 添加鼠标事件管理器
    this.init(options);
  }

  init(options) {
    this.removeRoaming();
    // 根据新的配置更新内部参数
    this.updateOptionsParams(options);
    const result = this.loadData(this.data);
    if (result && (typeof result === 'object' || typeof result === 'function') && typeof result.then === 'function') { // 判断是否为promise
      result.then((sections) => {
        // 路径数据
        const data = sections.path;
        this.createRoaming(data);
      });
    } else {
      this.createRoaming(result);
    }
  }

  /**
     * 更新漫游可配置的内部参数
     * @param {object} options 漫游的配置项
     */
  updateOptionsParams(options) {
    this.view = options.view || {};
    this.model = options.model || {};
    this.time = options.time;
    this.data = options.data;
    this.multiplier = options.speed || 10;
    this.isPathShow = Cesium.defined(options.isPathShow) ? options.isPathShow : true;
    this.multiplier = options.speed || 10;
  }

  /**
     * 创建漫游
     * @param {array} data
     * @memberof Roaming
     */
  createRoaming(data) {
    if (data && Array.isArray(data)) {
      // 加载路径数据
      const positions = this.processData(data);
      // 根据基础路径生成漫游路线
      this.property = this.computeRoamingLineProperty(positions, this.time);
      this.createEntity(this.property, this.start, this.stop, this.isPathShow);
      // TODO 默认是否添加鼠标控制
      this.controlMouseEvent();
    }
  }

  /**
     * 载入数据
     * @param {string|array} url
     * @return {*}
     * @memberof Roam
     */
  loadData(url) {
    let data;
    if (Cesium.defined(url) && typeof url === 'string') { // 如果传入的是字符串，默认是json路径，加载json数据
      data = Cesium.Resource.fetchJson(url); // 不应该用其私有方法
    } else {
      data = url;
    }
    return data;
  }

  /**
     * 处理读取到的数据
     * @param {array} data
     */
  processData(data) {
    const positions = [];
    data.forEach((position) => {
      const car3Position = Cesium.Cartesian3.fromDegrees(position[0], position[1], position[2]); // 给定默认值
      positions.push(car3Position);
    });
    return positions;
  }

  /**
     * 创建位置集合
     * @param {cartesian3} coordinates 点集合
     * @param {*} time 漫游时间
     * @returns
     */
  computeRoamingLineProperty(coordinates, time) {
    const property = new Cesium.SampledPositionProperty();
    const coordinatesLength = coordinates.length;
    const tempTime = time - (time % coordinatesLength);
    const increment = tempTime / coordinatesLength;
    const start = Cesium.JulianDate.now();
    const stop = Cesium.JulianDate.addSeconds(start, tempTime, new Cesium.JulianDate());
    this.start = start;
    this.stop = stop;
    this.setClockTime(start, stop, this.multiplier);
    for (let i = 0; i < coordinatesLength; i += 1) {
      const time1 = Cesium.JulianDate.addSeconds(start, i * increment, new Cesium.JulianDate());
      const position = coordinates[i];
      property.addSample(time1, position);
    }
    return property;
  }

  /**
     * 设置漫游事件系统
     * @param {*} start
     * @param {*} stop
     * @param {*} multiplier
     * @memberof Roaming
     */
  setClockTime(start, stop, multiplier) {
    // 将当前日期转为JulianDate
    this.viewer.clock.startTime = start.clone();
    this.viewer.clock.stopTime = stop.clone();
    this.viewer.clock.currentTime = start.clone();
    this.viewer.clock.multiplier = multiplier;
    // 默认循环漫游
    this.viewer.clock.clockRange = Cesium.ClockRange.CLAMPED;
    // 时钟在此模式下前进的间隔当前间隔乘以某个系数
    this.viewer.clock.clockStep = Cesium.ClockStep.SYSTEM_CLOCK_MULTIPLIER;
  }

  /**
     * 创建entity
     * @param {*} position computeRoamingLineProperty计算的属性
     * @param {*} start 开始时间节点
     * @param {*} stop 结束时间节点
     * @param {*} isPathShow path路径是否显示
     * @memberof Roaming
     */
  createEntity(position, start, stop, isPathShow) {
    this.entity = this.viewer.entities.add({
      availability: new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({
        start,
        stop,
      })]),
      // 位置
      position: position,
      // 计算朝向
      orientation: new Cesium.VelocityOrientationProperty(position),
      // 加载模型
      // model: { // 模型路径
      //   uri: this.model.url,
      //   // 模型最小刻度
      //   minimumPixelSize: 64,
      //   maximumSize: 128,
      //   // 设置模型最大放大大小
      //   maximumScale: 200,
      //   // 模型是否可见
      //   show: true,
      //   // 模型轮廓颜色
      //   silhouetteColor: Cesium.Color.WHITE,
      //   // 模型颜色  ，这里可以设置颜色的变化
      //   // color: color,
      //   // 仅用于调试，显示模型绘制时的线框
      //   debugWireframe: false,
      //   // 仅用于调试。显示模型绘制时的边界球。
      //   debugShowBoundingVolume: false,
      //   scale: 20,
      //   runAnimations: true, // 是否运行模型中的动画效果
      //   ...this.model,
      // },
      path: {
        resolution: 1,
        material: new Cesium.PolylineGlowMaterialProperty({
          glowPower: 0.1,
          color: Cesium.Color.YELLOW,
        }),
        width: 10,
        show: isPathShow,
      },
    });
    this.entity.position.setInterpolationOptions({ // 点插值
      interpolationDegree: 1,
      interpolationAlgorithm: Cesium.LagrangePolynomialApproximation,
    });
    this.addSceneEvent((time) => {
      this.getRoamingPosition(time);
    });
  }

  /**
     * 设置漫游路径是否可见
     * @param {boolean} visible
     * @memberof Roaming
     */
  setRoamingPathVisibility(visible) {
    if (this.entity) {
      this.entity.path.show = visible;
    }
    // 更新全局漫游路径是否可见参数
    this.isPathShow = visible;
  }

  /**
     * 设置漫游模型是否可见
     * @param {boolean} visible
     * @memberof Roaming
     */
  setRoamingModelVisibility(visible) {
    if (this.entity) {
      this.entity.model.show = visible;
    }
  }

  /**
     * 设置相机位置
     * @param {cartesian3} position
     * @param {object} options
     * @memberof Roaming
     */
  setCameraPosition(position, options) {
    if (position) {
      // 最新传进来的坐标（后一个位置）
      this.position2 = this.cartesian3ToWGS84(position);
      let heading = 0;
      // 前一个位置点位
      if (this.position1) {
        // 计算前一个点位与第二个点位的偏航角
        heading = this.bearing(this.position1.latitude, this.position1.longitude,
          this.position2.latitude, this.position2.longitude);
      }
      this.position1 = this.cartesian3ToWGS84(position);
      if (position) {
        const dynamicHeading = Cesium.Math.toRadians(heading);
        const pitch = Cesium.Math.toRadians(options.pitch || -40.0);
        const range = options.range || 2500.0;
        this.viewer.camera.lookAt(position, new Cesium.HeadingPitchRange(dynamicHeading, pitch, range));
      }
    }
  }

  /**
   * @name bearing 计算两点的角度 heading
   * @param startLat 初始点的latitude
   * @param startLng 初始点的longitude
   * @param destLat 第二个点的latitude
   * @param destLng 第二个点的latitude
   * @return {number} heading值
   */
  bearing(startLat, startLng, destLat, destLng) {
    startLat = Cesium.Math.toRadians(startLat);
    startLng = Cesium.Math.toRadians(startLng);
    destLat = Cesium.Math.toRadians(destLat);
    destLng = Cesium.Math.toRadians(destLng);
    const y = Math.sin(destLng - startLng) * Math.cos(destLat);
    const x = Math.cos(startLat) * Math.sin(destLat) - Math.sin(startLat) * Math.cos(destLat) * Math.cos(destLng - startLng);
    const brng = Math.atan2(y, x);
    const brngDgr = Cesium.Math.toDegrees(brng);
    return (brngDgr + 360) % 360;
  }

  /**
   * cartographic 转Degrees下地理坐标
   * @param point radius下的WGS84坐标
   * @return degrees下的WGS84坐标
   */
  cartesian3ToWGS84(point) {
    const cartographic = Cesium.Cartographic.fromCartesian(point);
    const lat = Cesium.Math.toDegrees(cartographic.latitude);
    const lng = Cesium.Math.toDegrees(cartographic.longitude);
    const alt = cartographic.height;
    return {
      longitude: lng,
      latitude: lat,
      height: alt,
    };
  }

  /**
     * 监听场景渲染事件
     * @param callback
     */
  addSceneEvent(callback) {
    // addEventListener() → Event.RemoveCallback
    // 监听之前先销毁
    if (this.handler instanceof Function) {
      this.handler();
      this.handler = null;
    }
    this.handler = this.viewer.scene.preRender.addEventListener((scene, time) => {
      callback(time);
    });
  }

  /**
     * 根据时刻获取漫游位置
     * @param {object} time
     * @memberof Roaming
     */
  getRoamingPosition(time) {
    if (this.entity) {
      const position = this.entity.position.getValue(time);
      this.setCameraPosition(position, this.view || {});
    }
  }

  /**
     * 添加屏幕事件管理器
     * @memberof Roaming
     */
  addRoamingHandler() {
    if (!this.roamingHandler) {
      this.roamingHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
    }
  }

  /**
     * 监听鼠标事件
     */
  controlMouseEvent() {
    // 防止重复注册
    this.cancelMouseEvent();
    this.addRoamingHandler();
    // 左键单击停止；
    this.roamingHandler.setInputAction(() => {
      // 暂停漫游
      // this.pauseOrContinue(!this.isPlay);
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    // 右键单击继续
    this.roamingHandler.setInputAction(() => {
      // 开启漫游
      // this.pauseOrContinue(this.isPlay);
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  }

  /**
     * 取消鼠标事件
     */
  cancelMouseEvent() {
    // TODO 销毁后需要重新new 需要判断它是否存在
    if (this.roamingHandler && !this.roamingHandler.isDestroyed()) {
      this.roamingHandler.destroy();
      this.roamingHandler = null;
    }
  }

  /**
     * 漫游的暂停和继续
     * @param {boolean} state false为暂停，ture为继续
     */
  pauseOrContinue(state) {
    if (state) {
      // 继续播放
      if (!this.handler && this.entity) {
        this.addSceneEvent((time) => {
          this.getRoamingPosition(time);
        });
      }
    } else if (this.handler) {
      // 停止监听屏幕绘制事件(停止相机变化)
      this.handler();
      this.handler = null;
      // 解锁相机视角
      this.viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
    }
    this.viewer.clock.shouldAnimate = state;
  }

  /**
     * 改变飞行的速度
     * @param {*} value  整数类型
     */
  changeRoamingSpeed(value) {
    this.viewer.clock.multiplier = value;
  }

  /**
     * 移除漫游
     */
  removeRoaming() {
    if (this.entity !== undefined) {
      if (this.handler instanceof Function) {
        this.handler();
        this.handler = null;
      }
      // 清空实体
      this.viewer.entities.remove(this.entity);
      // 清空内部数据
      this.data = null;
      // 销毁鼠标事件
      this.cancelMouseEvent();
      // 解锁相机视角
      this.viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
      this.entity = null;
    }
  }
}