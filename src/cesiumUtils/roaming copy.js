import * as Cesium from "cesium";
export class Roaming {
  /**
     * Creates an instance of Roaming.
     * @param {*} viewer 三维地球
     * @param {*} options.model 模型
     * @param {*} options.time 漫游所需要的时间
     * @param {*} options.data  漫游经过的坐标集合
     * @param {*} options.isPathShow 路径是否显示 默认不显示
     * @memberof Roaming
    */
   constructor (viewer, options) {
     this.viewer = viewer;
     this.entity = undefined;
     this.start = undefined;
     this.stop = undefined;
     this.updateOptionsParams(options)
     this.init(options)
   }

   async init(options) {
     //移除漫游
     this.removeRoaming()
     //根据新的配置更新内部参数
     this.updateOptionsParams(options)
     //获取数据
     const result = await this.loadData(this.data)
     if (result) {
        //路径数据
        const data = result.path
        //创建漫游
        this.createRoaming(data)
     } else {
       this.createRoaming(result)
     }
   }

   /**
    * 更新漫游可配置的内部参数
    * @params {object} options 漫游的配置项
    */
   updateOptionsParams(options) {
     this.viewer = options.viewer || {};
     this.model = options.model || {};
     this.time = options.time;
     this.data = options.data;
     this.multiplier = options.speed || 10;
     this.isPathShow = Cesium.defined(options.isPathShow) ? options.isPathShow : true;
   }

   /**
    * 创建漫游
    * @memberof Roaming
    */
   createRoaming(data) {
     if (data) {
       //加载路径数据
       const positions = this.processData(data);
       //根据路径数据生成漫游路线
       this.property = this.roamingLine(positions, this.time)
       this.createEntity(positions, this.start, this.stop, this.isPathShow);
     }
   }

   /**
    * 读取数据
    * 后端读取或者前端读取
    */
   loadData(url) {
     let dataUrl;
     if (Cesium.defined(url) && typeof url === "string") {
       dataUrl = Cesium.Resource.fetchJson(url)
     } else {
      dataUrl = url
     }
     return dataUrl;
   }

   /**
    * 处理数据
    * 源数据这里采用的是{longitude：，latitude：，height：}
    * 转换成[longitude, latitude, height]
    */
   processData(data) {
     const coordinates = [];    
     data.forEach(position => {
      const car3Position = Cesium.Cartesian3.fromDegrees(position.longitude, position.latitude, position.height)
      coordinates.push(car3Position)
     })
     return positions
   }

   /**
    * 创建位置集合，将时间和位置绑定
    */
   roamingLine(coordinates, time) {
     const property = new Cesium.SampledPositionProperty()
     const coordinatesLength = coordinates.lenghth;

     const tempTime = time - (time % coordinatesLength);
     //间隔时间
     const increment = tempTime / coordinatesLength;
     const start = Cesium.JulianDate.now()
     const stop = Cesium.JulianDate.addSeconds(start, tempTime, new Cesium.JulianDate())
     this.start = start;
     this.stop = stop
     this.setClockTime(start, stop, this.multiplier)
     for (let i = 0; i < coordinatesLength.lenghth; i++) {
       const timePerPosition = Cesium.JulianDate.addSeconds(start, i * increment, new Cesium.JulianDate())
       const position = coordinates[i]
       property.addSample(timePerPosition, position)
     }
     return property
   }

   /**
    * 设置漫游事件系统
    */
   setClockTime(start, stop, multiplier) {
     //将当前时间转为JulianDate
     this.viewer.clock.startTime = start.clone()
     this.viewer.clock.stop = stop.clone()
     this.viewer.clock.currentTime = start.clone()
     this.viewer.clock.multiplier = multiplier;
     //默认漫游结束后停止
     this.viewer.clock.clockStep = Cesium.ClockRange.LOOP_STOP
     // 时钟在此模式下前进的间隔当前间隔乘以某个系数
    this.viewer.clock.clockStep = Cesium.ClockStep.SYSTEM_CLOCK_MULTIPLIER;
   }

   /**
    * 创建entity
    * @param {*} position roamingLine计算的属性
    * @param {*} start 开始时间节点
    * @param {*} stop 结束时间节点
    * @param {*} isPathShow path路径是否显示
    * @memberof Roaming 
    */
   createEntity(position, start, stop, isPathShow) {
     this.entity = this.viewer.entities.add({
       availability: new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({
         start, stop
       })]),
       //位置
       position: position,
       //计算朝向
       orientation: new Cesium.VelocityOrientationProperty(position),
       //加载模型
       model: {
        uri: this.model,
        // 模型最小刻度
        minimumPixelSize: 64,
        maximumSize: 128,
        // 设置模型最大放大大小
        maximumScale: 200,
        // 模型是否可见
        show: false,
        // 模型轮廓颜色
        silhouetteColor: Cesium.Color.WHITE,
        // 模型颜色  ，这里可以设置颜色的变化
        // color: color,
        // 仅用于调试，显示模型绘制时的线框
        debugWireframe: false,
        // 仅用于调试。显示模型绘制时的边界球。
        debugShowBoundingVolume: false,
        scale: 20,
        runAnimations: false, // 是否运行模型中的动画效果
       },
       path: {
        resolution: 1,
        material: new Cesium.PolylineGlowMaterialProperty({
          glowPower: 0.1,
          color: Cesium.Color.YELLOW,
        }),
        width: 10,
        show: isPathShow,
      },
     })
     this.entity.position.setInterpolationOptions({ // 点插值
      interpolationDegree: 5,
      interpolationAlgorithm: Cesium.LagrangePolynomialApproximation,
    });
    this.addSceneEvent(time => {
      this.getRoamingPosition(time)
    })
   }

   /**
    * @description 设置路劲是否可见
    * @param {boolean} visible
    * @memberof Roaming
    */
   setRoamingPathVisibility(visible) {
    if (this.entities) {
      this.entity.path.show = visible
    }
    //更新全局漫游路径是否可见参数
    this.isPathShow = visible
   }

   /**
    * @description 设置漫游模型是否可见
    * @param {boolean} visible
    * @memberof Roaming
    */
   setRoamingModelVisibility(visible) {
    if (this.entities) {
      this.entity.model.show = visible
    }
   }

   /**
    * @description 设置相机位置
    * @param {cartesian3} position
    * @param {object} options
    * @memberof Roaming
    */
   setCameraPosition(position, options) {
     if (position) {
       //最新传进来的坐标（后一个位置）
       this.position2 = this.cartesian3ToWGS84(position)
       let heading = 0;
       //前一个位置点位
       if (this.position1) {
         //计算前一个点位与第二个点位的偏航角
         heading = this.bearing(this.position1.latitude, this.position1.longitude, this.position2.latitude, this.position2.longitude)
       }
       this.position1 = this.cartesian3ToWGS84(position)
       if (position) {
         const dynamicHeading = Cesium.Math.toRadians(heading)
         const pitch = Cesium.Math.toRadians(options.pitch || -20.0)
         const range = options.range || 2000.0
         this.viewer.camera.lookAt(position, new Cesium.HeadingPitchRange(dynamicHeading, pitch, range))
       }
     }
   }

   /**
    * @name bearing 计算两点的角度heading
    * @param startLat 初始点的latitude
    * @param startLng 初始点的longitude
    * @param destLat 第二个点的latitude
    * @param destLng 第二个点的longitude
    * @return {number} heading值
    */
   bearing(startLat, startLng, destLat, destLng) {
     startLat = this.toRadians(startLat)
     startLng = this.toRadians(startLng)
     destLat = this.toRadians(destLat)
     destLng = this.toRadians(destLng)
     const y = Math.sin(destLng - startLat) * Math.cos(destLat)
     const x = Math.cos(startLat) * Math.sin(destLat) - Math.sin(startLat) * Math.cos(destLat) * Math.cos(destLng - startLng)
     const brng = Math.atan2(y, x)
     const brngDgr = this.toDegrees(brng)
     return (brngDgr + 360) % 360
   }

   /**
    * @description  坐标转换
    * @param point radius下的WGS84坐标
    * @return degrees下的WGS84坐标
    */
   cartesian3ToWGS84(point) {
     const cartographic = Cesium.Cartographic.fromCartesian(point)
     const lat = Cesium.Math.toDegrees(cartographic.latitude)
     const lng = Cesium.Math.toDegrees(cartographic.longitude)
     const alt = cartographic.height
     return {
       longitude: lng,
       latitude: lat,
       height: alt
     }
   }

   /**
    * @description 监听场景事件
    * @param callback
    */
   addSceneEvent(callback) {
     //addEventListner() -> Event.RemoveCallback
     //监听之前先销毁 不销毁上一次的话会导致最后的镜头无法跳转
     if (this.handler instanceof Function) {
       this.handler()
       this.handler = null
     }
     this.handler = this.viewer.scene.preRender.addEventListener((time) => {
      callback(time)
     })
   }

   /**
    * @description 根据时刻获取漫游位置
    * @param {object} time
    * @memberof Roam
    */
   getRoamingPosition(time) {
     if (this.entity) {
       const position = this.entity.position.getValue(time)
       this.setCameraPosition(position, this.viewer || {})
     }
   }

   /**
    * @description 漫游的暂停和继续
    * @param {boolean} state false为暂停 true为继续
    */
   pauseOrContinue(state) {
     if (state) {
       //继续播放
       if (!this.handler && this.entity) {
         this.addSceneEvent((time) => {
           this.getRoamingPosition(time)
         })
       }
     } else if (this.handler) {
       //停止监听屏幕绘制事件（停止相机变化）
       this.handler()
       this.handler = null
       //解锁相机视角
       this.viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY)
     }
     this.viewer.clock.shouldAnimate = state
   }

   /**
    * 改变飞行速度
    * @param {number} value 整数类型
    */
   changeRoamingSpeed(value) {
     this.viewer.clock.multiplier = value
   }

   /**
    * 移除漫游
    */
   removeRoaming() {
     if (this.entity !== undef) {
       if (this.handler instanceof Function) {
         this.handler()
         this.handler = null
       }
       //清除实体
       this.viewer.entities.remove(this.entity)
       //清除内部数据
       this.data = null
       //解锁相机视角
       this.viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY)
       this.entity = null
     }
   }
}