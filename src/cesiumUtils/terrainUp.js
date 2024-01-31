// this.handleFocus(Cmap, 30000)

const handleFocus = async (viewer, extrudedHeight, jsonFile) => {
    const surfaceHeight = 10
    let flyTargetId
    //加载geojson数据
    let responese = await fetch(jsonFile)
    let res = await responese.json()
    let areaGeometry, borderGeometry = []
    if (res.data) {
        for (let area of res.data.features) {
            if (area.properties.name) {
                areaGeometry = area.geometry
                break
            }
            borderGeometry.push(area.geometry)
        }
    }
    let index1 = 0, index2 = 0;
    let areaPolygonData = [], areaPolylineData = []
    if (areaGeometry.type == "MultiPolygon") {
        for (let data of areaGeometry.coordinates) {
            areaPolygonData[index1] = []
            data[0].forEach(item => {
                areaPolylineData[index1].splice(areaPolylineData[index1].length, 3, ...item)
            })
            index1 += 1
        }
    } else if (areaGeometry.type === "Polygon") {
        areaPolygonData[0] = []
        areaGeometry.coordinates[0].forEach(item => {
            areaPolygonData[0].splice(areaPolygonData[0].length, 3, ...item)
        })
    }
    for (let bg of borderGeometry) {
        if (bg.type === "MultiPolygon") {
            for (let data of bg.coordinates) {
                
            }
        }
    }

}

handleFocus(map, extrudedHeight) {
    const surfaceHeight = 10
    let flyTargetId
    //加载某省和省内各市的geojson数据
    let req1 = axios.get("/mapRes/china.json")
    let req2 = axios.get("/mapRes/shannxiDetail.json")
    let areaGeometry, borderGeometry = []
    Promise.all([req1, req2]).then(res => {
        if (res[0].data) {
            for (let area of res[0].data.features) {
                if (area.properties.name === '陕西省') {
                    areaGeometry = area.geometry
                    break
                }
            }
        }
        if (res[1].data) {
            for (let area of res[1].data.features) {
                borderGeometry.push(area.geometry)
            }
        }
        let index1 = 0,
            index2 = 0
        let areaPolygonData = [],
            areaPolylineData = []
        if (areaGeometry.type === "MultiPolygon") {
            for (let data of areaGeometry.coordinates) {
                areaPolygonData[index1] = []
                data[0].forEach(item => {
                    areaPolygonData[index1].splice(areaPolygonData[index1].length, 3, ...item)
                })
                index1 += 1
            }
        } else if (areaGeometry.type === "Polygon") {
            areaPolygonData[0] = []
            areaGeometry.coordinates[0].forEach(item => {
                areaPolygonData[0].splice(areaPolygonData[0].length, 3, ...item)
            })
        }
        for (let bg of borderGeometry) {
            if (bg.type === "MultiPolygon") {
                for (let data of bg.coordinates) {
                    areaPolylineData[index2] = []
                    data[0].forEach(item => {
                        areaPolylineData[index2].splice(areaPolylineData[index2].length, 3, item[0], item[1], extrudedHeight + surfaceHeight)
                    })
                    index2 += 1
                }
            } else if (bg.type === "Polygon") {
                areaPolylineData[index2] = []
                bg.coordinates[0].forEach(item => {
                    areaPolylineData[index2].splice(areaPolylineData[index2].length, 3, item[0], item[1], extrudedHeight + surfaceHeight)
                })
                index2 += 1
            }
        }
        for (let index in areaPolygonData) {
            let surfaceMaterial = new Cesium.Color(19 / 255.0, 25 / 255.0, 41 / 255.0, 1)
            areaEntities.entities.add({
                polygon: {
                    hierarchy: Cesium.Cartesian3.fromDegreesArray(areaPolygonData[index]),
                    material: new Cesium.Color(68 / 255.0, 222 / 255.0, 255 / 255.0, 1),
                    extrudedHeight: extrudedHeight
                }
            })
            if (index == 0) {
                surfaceMaterial = new Cesium.ImageMaterialProperty({
                    image: require("../../assets/img/map/night_area.png"),    //随便找一张地型贴图
                    repeat: new Cesium.Cartesian2(1, 1)
                })
            }
            let temp = areaEntities.entities.add({
                polygon: {
                    hierarchy: Cesium.Cartesian3.fromDegreesArray(areaPolygonData[index]),
                    material: surfaceMaterial,
                    height: extrudedHeight + surfaceHeight,
                }
            })
            if (index == 0) {
                flyTargetId = temp._id
            }
        }
        for (let border of areaPolylineData) {
            areaEntities.entities.add({
                polyline: {
                    positions: Cesium.Cartesian3.fromDegreesArrayHeights(border),
                    width: 2,
                    material: new Cesium.Color(2 / 255.0, 197 / 255.0, 249 / 255.0, 1)
                }
            })
        }
        this.setMask(map, flyTargetId)
    })
}

// 设置遮罩效果
setMask (map, flyTargetId) {
    areaEntities.entities.add({
        polygon: {
            hierarchy: Cesium.Cartesian3.fromDegreesArray([60, 0, 60, 90, 160, 90, 160, 0]),
            material: new Cesium.Color(15 / 255.0, 38 / 255.0, 84 / 255.0, 0.7)
        },
    })
    map.dataSources.add(areaEntities)
    for (let e of areaEntities.entities.values) {
        if (e._id === flyTargetId) {
            map.flyTo(e)
            break
        }
    }
}
