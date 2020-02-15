import { Circle } from '@/element/circle.js';
import { Ellipse } from '@/element/ellipse.js';
import { Rect } from '@/element/rect.js';
import { Triangle } from '@/element/triangle.js';
import { Polar } from '@/coordinatesystem/polar.js';
import { Cartesian } from '@/coordinatesystem/cartesian.js';
//  import的对象是object时，那么不需要增加大括号，直接使用对象引入
import DSLDefinitionObj from '@/dsl/definition.js'; 
/**
 * computeAttr方法支持计算节点的高度与宽度的属性值，
 * 相比较 computeHeight 与 computeWidth 两个方法，computeAttr没有区分计算中的width与height
 */
/**
 * create the visual elements of tree. The elements are constructred through the path
 * polarAxis是极坐标系的极轴, 即表示sector宽度的轴
 */
import { translatePath } from '@/computation/translate_path.js'
export function createVisualElement (coordinateSystem, elementObj, nodeObj, SubTreeData, SubtreeDataPos) {
    let nodeType = elementObj.Node
    let sizeOption = elementObj.SizeOption
    //  创建对应的coordinate system
    // var coordinateSystemObj = _createCoordinateSystem(coordinateSystem, polarCenter, polarAxis)
    //  rect 对应的是存在extent的视觉元素
    let centerPos = {x: nodeObj.x + nodeObj.Rootx + nodeObj.RootWidth/2, y: nodeObj.y + nodeObj.Rooty + nodeObj.RootHeight/2}
    //  获取整个subtree的中心位置
    let subtreePos = {x: SubTreeData.x + SubTreeData.TreeWidth / 2, y: SubTreeData.y + SubTreeData.TreeHeight / 2}
    //  当节点的类型为hidden时，将节点的类型设置为circle，节点的大小设置为0
    let hiddenRadius = 0
    //  rect 对应的是只映射位置的视觉元素
    //  radius需要重新设置，这里的radius是node的大小
    // let radius = SubTreeData.TreeWidth>SubTreeData.TreeHeight? SubTreeData.TreeHeight/80 : SubTreeData.TreeWidth/80
    let radius = nodeObj.RootWidth>nodeObj.RootHeight?nodeObj.RootHeight/2:nodeObj.RootWidth/2
    if (sizeOption === 'static') {
      radius = elementObj.StaticSize
    }
    if (coordinateSystem.Category === "cartesian") {
      //  根据不同的节点类型计算具体的path路径
      if (nodeType === "rectangle") {
        let rectNodePosArray = [
          {x: nodeObj.x + nodeObj.Rootx,                          y: nodeObj.y + nodeObj.Rooty}, 
          {x: nodeObj.x + nodeObj.Rootx,                          y: nodeObj.y + nodeObj.Rooty + nodeObj.RootHeight}, 
          {x: nodeObj.x + nodeObj.Rootx + nodeObj.RootWidth,      y: nodeObj.y + nodeObj.Rooty + nodeObj.RootHeight}, 
          {x: nodeObj.x + nodeObj.Rootx + nodeObj.RootWidth,      y: nodeObj.y + nodeObj.Rooty}, 
          {x: nodeObj.x + nodeObj.Rootx,                          y: nodeObj.y + nodeObj.Rooty}
        ]
        //  通过设定参数 初始化 cartesian coordinate system
        let cartesianCoordObj = new Cartesian()
        let elementPath = cartesianCoordObj.generatePath(rectNodePosArray)
        if (elementPath.indexOf('NaN') !== -1) {
          console.log('elementPath', elementPath)
        }
        return elementPath
      } else if (nodeType === "triangle") {
        let tx = nodeObj.x + nodeObj.Rootx, 
            ty = nodeObj.y + nodeObj.Rooty, 
            tw = nodeObj.RootWidth,
            th = nodeObj.RootHeight
        let direction = 'top'
        if (typeof(elementObj.Direction) !== 'undefined') {
          direction = elementObj.Direction
        }
        let TriangleNode = new Triangle(tx, ty, tw, th, direction)
        let triangleNodePosArray = TriangleNode.getNodePosArray()
        let cartesianCoordObj = new Cartesian()
        let elementPath = cartesianCoordObj.generatePath(triangleNodePosArray) 
        return elementPath
      } else if (nodeType === "circle") {
        let CircleNode = new Circle(centerPos, radius)
        return translatePath(CircleNode.generatePath(), centerPos["x"], centerPos["y"])
      } else if (nodeType === "ellipse") {
        let radiusX = nodeObj.RootWidth / 2
        let radiusY = nodeObj.RootHeight / 2
        let EllipseNode = new Ellipse(centerPos, radiusX, radiusY) 
        let elementPath = EllipseNode.generatePath()
        return elementPath
      } else if (nodeType === "hidden") {
        let CircleNode = new Circle(centerPos, hiddenRadius)
        let elementPath = translatePath(CircleNode.generatePath(), centerPos["x"], centerPos["y"])
        return elementPath
      }
    } else if (coordinateSystem.Category === "polar") {
      //  通过设定参数 初始化 polar coordinate system
      //  指定 极坐标系 的极轴
      let polarAxis = "y-axis"
      if (typeof(coordinateSystem.PolarAxis) !== 'undefined') {
        polarAxis = coordinateSystem.PolarAxis
      }
      //  指定 极坐标系 的中心点        
      let polarCenterPara = "top"
      if (polarAxis === "x-axis") {
        polarCenterPara = "left"
      }
      if(typeof(coordinateSystem.PolarCenter) !== 'undefined') {
        polarCenterPara = coordinateSystem.PolarCenter
      }
      //  指定 极坐标系 的中心半径        
      let polarInnerRadius = 0
      if(typeof(coordinateSystem.InnerRadius) !== 'undefined') {
        polarInnerRadius = coordinateSystem.InnerRadius
      }
      let polarStartAngle = 0
      if (typeof(coordinateSystem.StartAngle) !== 'undefined') {
          polarStartAngle = coordinateSystem.StartAngle
      }
      //  指定 极坐标系 的中心角度
      let polarCenterAngle = 1
      if(typeof(coordinateSystem.CentralAngle) !== 'undefined') {
        polarCenterAngle = coordinateSystem.CentralAngle
      }
      //  计算 极坐标系 的中心节点的位置
      let polarDirection = "clockwise"
      if(typeof(coordinateSystem.Direction) !== 'undefined')
        polarDirection = coordinateSystem.Direction
      //  计算 极坐标系 的中心的环形的长度
      let polarCoordObj = new Polar(polarAxis, polarInnerRadius, polarStartAngle, polarCenterAngle, polarCenterPara, polarDirection)
      if (nodeType === "rectangle") {
        let rectNodePosArray = [
          {x: nodeObj.x + nodeObj.Rootx,                          y: nodeObj.y + nodeObj.Rooty}, 
          {x: nodeObj.x + nodeObj.Rootx,                          y: nodeObj.y + nodeObj.Rooty + nodeObj.RootHeight}, 
          {x: nodeObj.x + nodeObj.Rootx + nodeObj.RootWidth,      y: nodeObj.y + nodeObj.Rooty + nodeObj.RootHeight}, 
          {x: nodeObj.x + nodeObj.Rootx + nodeObj.RootWidth,      y: nodeObj.y + nodeObj.Rooty}, 
          {x: nodeObj.x + nodeObj.Rootx,                          y: nodeObj.y + nodeObj.Rooty}
        ]
        polarCoordObj.updateData(SubTreeData)
        let elementPath = translatePath(polarCoordObj.generatePath(rectNodePosArray, SubTreeData), subtreePos["x"], subtreePos["y"])
        // console.log('nodeObj', nodeObj)
        return elementPath
      } else if (nodeType === "circle") {
        //  将极坐标轴建立在只有节点中心的部分，只把中心节点放置在正中心，其他还是按照之前的方法计算
        if (nodeObj.id === 'index-0') {
          polarCoordObj.updateData(SubtreeDataPos)   
        } else {
          polarCoordObj.updateData(SubTreeData)   
        }
        //  根据节点当前的坐标，计算节点在极坐标系下的坐标
        let cartesianPos = polarCoordObj.calPosition(centerPos)
        //  将极坐标下的树中的节点变换到视图的中心位置处
        cartesianPos["x"] = cartesianPos["x"] + subtreePos["x"]
        cartesianPos["y"] = cartesianPos["y"] + subtreePos["y"]
        //  初始化circle的节点
        let CircleNode = new Circle(centerPos, radius)
        //  将节点移动到对应的位置处
        let elementPath = translatePath(CircleNode.generatePath(), cartesianPos["x"], cartesianPos["y"])
        return elementPath
      } else if (nodeType === "triangle") {
        //  将极坐标轴建立在只有节点中心的部分，只把中心节点放置在正中心，其他还是按照之前的方法计算
        if (nodeObj.id === 'index-0') {
          polarCoordObj.updateData(SubtreeDataPos)   
        } else {
          polarCoordObj.updateData(SubTreeData)   
        }
        //  根据节点当前的坐标，计算节点在极坐标系下的坐标
        let cartesianPos = polarCoordObj.calPosition(centerPos)
        //  将极坐标下的树中的节点变换到视图的中心位置处
        cartesianPos["x"] = cartesianPos["x"] + subtreePos["x"]
        cartesianPos["y"] = cartesianPos["y"] + subtreePos["y"]

        let tx = cartesianPos["x"] - nodeObj.RootWidth/2, 
            ty = cartesianPos["y"] - nodeObj.RootHeight/2, 
            tw = nodeObj.RootWidth,
            th = nodeObj.RootHeight
        let direction = 'top'
        if (typeof(elementObj.Direction) !== 'undefined') {
          direction = elementObj.Direction
        }
        let TriangleNode = new Triangle(tx, ty, tw, th, direction)
        let triangleNodePosArray = TriangleNode.getNodePosArray()
        let cartesianCoordObj = new Cartesian()
        let elementPath = cartesianCoordObj.generatePath(triangleNodePosArray)
        return elementPath
      } else if (nodeType === 'ellipse') {
        //  计算椭圆形的位置
        if (nodeObj.id === 'index-0') {
          polarCoordObj.updateData(SubtreeDataPos)   
        } else {
          polarCoordObj.updateData(SubTreeData)   
        }
        //  根据节点当前的坐标，计算节点在极坐标系下的坐标
        let cartesianPos = polarCoordObj.calPosition(centerPos)
        //  将极坐标下的树中的节点变换到视图的中心位置处
        cartesianPos["x"] = cartesianPos["x"] + subtreePos["x"]
        cartesianPos["y"] = cartesianPos["y"] + subtreePos["y"]
        //  计算椭圆形的中心
        let radiusX = nodeObj.RootWidth / 2
        let radiusY = nodeObj.RootHeight / 2
        let EllipseNode = new Ellipse(cartesianPos, radiusX, radiusY)
        let elementPath = EllipseNode.generatePath()
        return elementPath
        // return translatePath(EllipseNode.generatePath(), cartesianPos["x"], cartesianPos["y"])
      } else if (nodeType === "hidden") {
        //  将极坐标轴建立在只有节点中心的部分
        polarCoordObj.updateData(SubtreeDataPos)  
        let cartesianPos = polarCoordObj.calPosition(centerPos)
        //  初始化隐藏的circle的节点
        let CircleNode = new Circle(centerPos, hiddenRadius)
        //  将极坐标下的树中的节点变换到视图的中心位置处
        cartesianPos["x"] = cartesianPos["x"] + subtreePos["x"]
        cartesianPos["y"] = cartesianPos["y"] + subtreePos["y"]
        //  将节点移动到对应的位置处
        let elementPath = translatePath(CircleNode.generatePath(), cartesianPos["x"], cartesianPos["y"])
        return elementPath
      }
    } 
}
/**
 * 计算areaData数组中节点的位置
 */
export function computeVisualElementPos(coordinateSystem, elementObj, nodeObj, SubTreeData, SubtreeDataPos, areaDataNodePosObj) {
  let nodeType = elementObj.Node
  let subtreePos = {x: SubTreeData.x + SubTreeData.TreeWidth / 2, y: SubTreeData.y + SubTreeData.TreeHeight / 2}
  if (coordinateSystem.Category === "cartesian") {
    return areaDataNodePosObj
  } else if(coordinateSystem.Category === "polar") {
    //  通过设定参数 初始化 polar coordinate system
    //  指定 极坐标系 的极轴
    let polarAxis = "y-axis"
    if (typeof(coordinateSystem.PolarAxis) !== 'undefined') {
      polarAxis = coordinateSystem.PolarAxis
    }
    //  指定 极坐标系 的中心点        
    let polarCenterPara = "top"
    if (polarAxis === "x-axis") {
      polarCenterPara = "left"
    }
    if(typeof(coordinateSystem.PolarCenter) !== 'undefined') {
      polarCenterPara = coordinateSystem.PolarCenter
    }
    //  指定 极坐标系 的中心半径        
    let polarInnerRadius = 0
    if(typeof(coordinateSystem.InnerRadius) !== 'undefined') {
      polarInnerRadius = coordinateSystem.InnerRadius
    }
    let polarStartAngle = 0
    if (typeof(coordinateSystem.StartAngle) !== 'undefined') {
        polarStartAngle = coordinateSystem.StartAngle
    }
    //  指定 极坐标系 的中心角度
    let polarCenterAngle = 1
    if(typeof(coordinateSystem.CentralAngle) !== 'undefined') {
      polarCenterAngle = coordinateSystem.CentralAngle
    }
    //  计算 极坐标系 的中心节点的位置
    let polarDirection = "clockwise"
    if(typeof(coordinateSystem.Direction) !== 'undefined')
      polarDirection = coordinateSystem.Direction
    //  计算 极坐标系 的中心的环形的长度
    let polarCoordObj = new Polar(polarAxis, polarInnerRadius, polarStartAngle, polarCenterAngle, polarCenterPara, polarDirection)
    polarCoordObj.updateData(SubTreeData)
    let areaDataPos = polarCoordObj.calPosition(areaDataNodePosObj)
    let radius = Math.pow((Math.pow((areaDataPos.x), 2)+Math.pow((areaDataPos.y), 2)), 1/2)
    if (nodeType === "rectangle") {
      //  将极坐标轴建立在只有节点中心的部分
      polarCoordObj.updateData(SubTreeData)        
      //  根据节点当前的坐标，计算节点在极坐标系下的坐标
      let cartesianPos = polarCoordObj.calPosition(areaDataNodePosObj)
      cartesianPos["x"] = cartesianPos["x"] + subtreePos["x"]
      cartesianPos["y"] = cartesianPos["y"] + subtreePos["y"]
      cartesianPos["r"] = radius
      return cartesianPos
    } else if ((nodeType === "circle") || (nodeType === "triangle") || (nodeType === 'ellipse') || (nodeType === "hidden")) {
      //  将极坐标轴建立在只有节点中心的部分
      if (nodeObj.id === 'index-0') {
        polarCoordObj.updateData(SubtreeDataPos)   
      } else {
        polarCoordObj.updateData(SubTreeData)   
      }
      let cartesianPos = polarCoordObj.calPosition(areaDataNodePosObj)
      cartesianPos["x"] = cartesianPos["x"] + subtreePos["x"]
      cartesianPos["y"] = cartesianPos["y"] + subtreePos["y"]
      cartesianPos["r"] = radius
      return cartesianPos
    } 
  }
}
/**
 * 计算areaData中的label的路径
 */
export function computeAreaLabelPath(coordinateSystem, SubTreeData, areaLabelPathObj) {
  let LineData = null
  let lineGenerator = d3.line()
  let subtreePos = {x: SubTreeData.x + SubTreeData.TreeWidth / 2, y: SubTreeData.y + SubTreeData.TreeHeight / 2}
  if (coordinateSystem.Category === "cartesian") {
    let areaLabelPathStartPos = areaLabelPathObj.start
    let areaLabelPathEndPos = areaLabelPathObj.end
    let PosData = []
    PosData.push([areaLabelPathStartPos.x, areaLabelPathStartPos.y])
    PosData.push([areaLabelPathEndPos.x, areaLabelPathEndPos.y])
    LineData = lineGenerator(PosData)
    return LineData
  } else if(coordinateSystem.Category === "polar") {
    //  通过设定参数 初始化 polar coordinate system
    //  指定 极坐标系 的极轴
    let polarAxis = "y-axis"
    if (typeof(coordinateSystem.PolarAxis) !== 'undefined') {
      polarAxis = coordinateSystem.PolarAxis
    }
    //  指定 极坐标系 的中心点        
    let polarCenterPara = "top"
    if (polarAxis === "x-axis") {
      polarCenterPara = "left"
    }
    if(typeof(coordinateSystem.PolarCenter) !== 'undefined') {
      polarCenterPara = coordinateSystem.PolarCenter
    }
    //  指定 极坐标系 的中心半径        
    let polarInnerRadius = 0
    if(typeof(coordinateSystem.InnerRadius) !== 'undefined') {
      polarInnerRadius = coordinateSystem.InnerRadius
    }
    let polarStartAngle = 0
    if (typeof(coordinateSystem.StartAngle) !== 'undefined') {
        polarStartAngle = coordinateSystem.StartAngle
    }
    //  指定 极坐标系 的中心角度
    let polarCenterAngle = 1
    if(typeof(coordinateSystem.CentralAngle) !== 'undefined') {
      polarCenterAngle = coordinateSystem.CentralAngle
    }
    //  计算 极坐标系 的中心节点的位置
    let polarDirection = "clockwise"
    if(typeof(coordinateSystem.Direction) !== 'undefined')
      polarDirection = coordinateSystem.Direction
    //  计算 极坐标系 的中心的环形的长度
    let polarCoordObj = new Polar(polarAxis, polarInnerRadius, polarStartAngle, polarCenterAngle, polarCenterPara, polarDirection)
    polarCoordObj.updateData(SubTreeData)
    let originX = polarCoordObj.x, originY = polarCoordObj.y
    //  计算在树可视化中label的路径
    let areaLabelPathStartPos = areaLabelPathObj.start
    let areaLabelPathEndPos = areaLabelPathObj.end
    let carBeginx = areaLabelPathStartPos.x, carBeginy = areaLabelPathStartPos.y,
      carEndx = areaLabelPathEndPos.x, carEndy = areaLabelPathEndPos.y
    areaLabelPathStartPos = polarCoordObj.calPosition(areaLabelPathStartPos)
    let beginx = areaLabelPathStartPos.x, beginy = areaLabelPathStartPos.y
    areaLabelPathEndPos = polarCoordObj.calPosition(areaLabelPathEndPos)
    let endx = areaLabelPathEndPos.x, endy = areaLabelPathEndPos.y
    if (polarAxis === "y-axis") {
      if (carBeginx === carEndx) {
        let PosData = []
        if (beginx > endx) {
          PosData.push([endx, endy])
          PosData.push([beginx, beginy])
        } else {
          PosData.push([beginx, beginy])
          PosData.push([endx, endy])
        }
        LineData = translatePath(lineGenerator(PosData), subtreePos["x"], subtreePos["y"])
        return LineData
      }
    } else if (polarAxis === "x-axis") {
      if (carBeginy === carEndy) {
        let PosData = []
        if (beginx > endx) {
          PosData.push([endx, endy])
          PosData.push([beginx, beginy])
        } else {
          PosData.push([beginx, beginy])
          PosData.push([endx, endy])
        }
        LineData = translatePath(lineGenerator(PosData), subtreePos["x"], subtreePos["y"])
        return LineData
      }
    }
    let polarOriginX = 0, polarOriginY = 0
    let radius = Math.pow((Math.pow((beginx - polarOriginX), 2)+Math.pow((beginy - polarOriginY), 2)), 1/2)
    let radius2 = Math.pow((Math.pow((endx - polarOriginX), 2)+Math.pow((endy - polarOriginY), 2)), 1/2)
    //  计算arc path的路径
    let arcGenerator = d3.arc()
      .innerRadius(radius)
      .outerRadius(radius);
    //  计算起始的角度
    let initAngleSin = Math.round(polarOriginY - beginy) / radius
    initAngleSin = initAngleSin>1?1:initAngleSin
    initAngleSin = initAngleSin<-1?-1:initAngleSin
    let initAngle = Math.asin(initAngleSin)
    if (beginx <= polarOriginX) {
      // let startAngle = -Math.PI / 2 - initAngle, endAngle = Math.PI / 2 - initAngle  
    } else {
      initAngle = Math.PI - initAngle
    }
    if (isNaN(initAngle)) {
      console.log('initAngleSin', initAngleSin)
    }
    //  计算终止的角度
    let endAngleSin = Math.round(polarOriginY - endy) / radius
    endAngleSin = endAngleSin>1?1:endAngleSin
    endAngleSin = endAngleSin<-1?-1:endAngleSin
    let endAngle = Math.asin(endAngleSin)
    if (endx <= polarOriginX) {
      // let startAngle = -Math.PI / 2 - initAngle, endAngle = Math.PI / 2 - initAngle  
    } else {
      endAngle = Math.PI - endAngle
    }
    //  计算节点之间的连线
    if (radius > 0.001) {
        let anticlockwise = true
        if (coordinateSystem.Direction === 'clockwise') {
          anticlockwise = false
        }
        var path = d3.path();
        path.arc(polarOriginX, polarOriginY, radius, initAngle, endAngle, anticlockwise)
        if (path.toString().indexOf('NaN') !== -1) {
          console.log('polarOriginX', polarOriginX, 'polarOriginY', polarOriginY, 'radius', radius, 'initAngle', initAngle, 'endAngle', endAngle)
        }
        LineData = translatePath(path.toString(), subtreePos["x"], subtreePos["y"])
        return LineData
    }
  }
}
/**
 * get the center axis of the polar coord system
 */
function _getPolarCenter(polarCenterPara, SubTreeData) {
  if (polarCenterPara === 'top') {
    return {x: SubTreeData.x + SubTreeData.TreeWidth / 2, y: SubTreeData.y}
  } else if (polarCenterPara === 'bottom') {
    return {x: SubTreeData.x + SubTreeData.TreeWidth / 2, y: SubTreeData.y + SubTreeData.TreeHeight}
  } else if (polarCenterPara === 'left') {
    return {x: SubTreeData.x, y: SubTreeData.y + SubTreeData.TreeHeight / 2}
  } else if (polarCenterPara === 'right') {
    return {x: SubTreeData.x + SubTreeData.TreeWidth, y: SubTreeData.y + SubTreeData.TreeHeight / 2}  
  }
}
/**
 * reorder all the nodes in the node array according to dfs
 */
export function reorderNodeArray (nodeArray) {
  let originalNodeArray = nodeArray.sort(function(a, b) {
    return a.data.originalNodeIndex - b.data.originalNodeIndex
  })
  return originalNodeArray
}
/**
 * initialize the links between the nodes
 */
export function initializeLinks (type) {
}
/**
 * compute the absolute position of the nodes
 */
export function computeAbsoluteNodePosition(posAttrName, nodeArray, DSLObj) {
  if (typeof(DSLObj) !== 'undefined') {
    for (let i = 0; i < nodeArray.length; i++) {
      let nodeObj = nodeArray[i]
      let parentNodeObj = nodeObj.parent
      if (parentNodeObj != null) {
        nodeObj.visualAttr[posAttrName] = parentNodeObj.visualAttr[posAttrName] + nodeObj.visualAttr[posAttrName]
      }
    }
  }
  return nodeArray
}
/**
 * create coordinate system
 */
function _createCoordinateSystem (type, polarCenter, polarAxis) {
  if (type === 'polar') {
    return new Polar(polarCenter, polarAxis)
  } else if (type === 'cartesian') {
    return new Cartesian()
  }
}
