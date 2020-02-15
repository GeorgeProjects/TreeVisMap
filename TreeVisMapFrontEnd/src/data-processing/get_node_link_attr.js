import { createVisualElement, computeVisualElementPos, computeAreaLabelPath} from '@/computation/visual_element_attr.js'
import { translatePath } from '@/computation/translate_path.js'
export function getNodeLinkAttr (areaData, dslContentObject, treeIndexWithDSL, treeViewPosLenObj, nodeArray) {
	  //  遍历得到全部nodeId的数组
    let nodeIdArray = []
    for (let nodeId in areaData) {
      nodeIdArray.push(nodeId)
    }
    // nodeIdArray = nodeIdArray.sort()
    nodeIdArray = nodeIdArray.sort(function(a, b) {
      var aNum = a.replace('index-', '')
      var bNum = b.replace('index-', '')
      return aNum - bNum
    })
    let currentRootID = nodeIdArray[0]
    //  将AreaData对象转换为AreaData数组，并且构建linkData的数组, 用于数据绑定的数组
   	let areaDataArray = []
    //  LinkData存储孩子父亲结点id对，用于生成父子间的link
    let linkDataArray = []
    for (let item in areaData) {
      areaDataArray.push(areaData[item])
      if (areaData[item].fatherID != null) {
        let linkdata = {'beginid': areaData[item].fatherID, 'endid': areaData[item].id}
        linkDataArray.push(linkdata)
      }
    }
    //  获取最原始的数据
    let nodeArrayObj = {}
    if (typeof(nodeArray) !== 'undefined') {
      for (let i = 0; i < nodeArray.length; i++) {
         let nodeObj = nodeArray[i]
         let nodeIndex = nodeObj.data.index
         nodeArrayObj[nodeIndex] = nodeObj.data
      }
    }
    //  计算areaDataArray中节点的数组
    let areaDataNodePosArray = computeAreaDataNodePosArray(areaDataArray)
    //  计算areaDataArray中节点的label对应的路径
    let areaLabelPathArray = computeAreaLabelPathArray(areaDataArray)
    //  计算areaDataArray中节点位置的范围
    let SubtreeDataPos = computeSubTreeDataPos(areaDataNodePosArray) 
    //  计算节点数组，每个节点对象中包含节点的属性
    for (let i = 0; i < areaDataArray.length; i++) {
      let areaDataObj = areaDataArray[i]
      let areaDataNodePosObj = areaDataNodePosArray[i]
      let areaLabelPathObj = areaLabelPathArray[i]
      computeNodeDataAttr(areaDataObj, areaDataNodePosObj, SubtreeDataPos, areaLabelPathObj)
    }
    for (let i = 0; i < linkDataArray.length; i++) {
      let linkdata = linkDataArray[i]
      linkdata.pathAttr = directLineData(linkdata)
    }
    computeNodeLabelDataAttr(areaDataArray)
    return [areaDataArray, linkDataArray]
	  //  计算areaDataArray中节点位置的数组
    function computeAreaDataNodePosArray(areaDataArray) {
      let areaDataNodePosArray = []
      for(let i = 0; i < areaDataArray.length; i++) {
        let nodeObj = areaDataArray[i]
        let nodeObjX = nodeObj.x + nodeObj.Rootx + nodeObj.RootWidth / 2
        let nodeObjY = nodeObj.y + nodeObj.Rooty + nodeObj.RootHeight / 2
        areaDataNodePosArray.push({x: nodeObjX, y: nodeObjY})
      }
      return areaDataNodePosArray
    }
    //  计算areaDataArray中节点的标签对应的路径
    function computeAreaLabelPathArray(areaDataArray) {
      let areaLabelPathArray = []
      for(let i = 0; i < areaDataArray.length; i++) {
        let nodeObj = areaDataArray[i]
        let nodeObjId = nodeObj.id
        let areaDataObjDSL = dslContentObject[treeIndexWithDSL[nodeObjId]]
        let textDx = 0, textDy = 0
        if ('TextDx' in areaDataObjDSL.Element) {
          textDx = areaDataObjDSL.Element.TextDx
        }
        if ('TextDy' in areaDataObjDSL.Element) {
          textDy = areaDataObjDSL.Element.TextDy
        }
        let areaLabelPathStartPosX = 0, areaLabelPathStartPosY = 0,
          areaLabelPathEndPosX = 0, areaLabelPathEndPosY = 0
        let areaLabelPathObj = {}
        if (areaDataObjDSL.CoordinateSystem.Category === 'cartesian') {
          if (nodeObj.RootWidth >= nodeObj.RootHeight) {
            //  计算水平的label path
            areaLabelPathObj = computeHorizontalLabelPath(nodeObj, textDy)
          } else {
            //  计算竖直的label path
            areaLabelPathObj = computeVerticalLabelPath(nodeObj, textDx)
          }
        } else if (areaDataObjDSL.CoordinateSystem.Category === 'polar') {
          if (areaDataObjDSL.CoordinateSystem.PolarAxis === 'x-axis') {
            //  如果极轴是x轴, 那么优先将labelPath设置成纵向，只有width大于height的1.5倍，才设置为横向
            if (nodeObj.RootWidth >= (nodeObj.RootHeight * 1.5)) {
              //  计算水平的label path
              areaLabelPathObj = computeHorizontalLabelPath(nodeObj, textDy)
            } else {
              //  计算竖直的label path
              areaLabelPathObj = computeVerticalLabelPath(nodeObj, textDx)
            }
          } else if (areaDataObjDSL.CoordinateSystem.PolarAxis === 'y-axis') {
            //  如果极轴是y轴，那么优先将labelPath设置为横向，只有height大于width的1.5倍，才设置为纵向
            if (nodeObj.RootHeight >= (nodeObj.RootWidth * 1.5)) {
              //  计算竖直的label path
              areaLabelPathObj = computeVerticalLabelPath(nodeObj, textDx)
            } else {
              //  计算水平的label path
              areaLabelPathObj = computeHorizontalLabelPath(nodeObj, textDy)
            }
          }
        } 
        let areaLabelPathStartPos = {x: areaLabelPathObj.areaLabelPathStartPosX, y: areaLabelPathObj.areaLabelPathStartPosY}
        let areaLabelPathEndPos = {x: areaLabelPathObj.areaLabelPathEndPosX, y: areaLabelPathObj.areaLabelPathEndPosY}
        areaLabelPathArray.push({start: areaLabelPathStartPos, end: areaLabelPathEndPos})
      }
      return areaLabelPathArray
      //  计算竖直的label path
      function computeVerticalLabelPath(nodeObj, textDx) {
        let areaLabelPathObj = {}
        areaLabelPathObj.areaLabelPathStartPosX = nodeObj.x + nodeObj.Rootx + nodeObj.RootWidth / 2 + textDx * nodeObj.RootWidth
        areaLabelPathObj.areaLabelPathEndPosX = nodeObj.x + nodeObj.Rootx + nodeObj.RootWidth / 2 + textDx * nodeObj.RootWidth
        areaLabelPathObj.areaLabelPathStartPosY = nodeObj.y + nodeObj.Rooty
        areaLabelPathObj.areaLabelPathEndPosY = nodeObj.y + nodeObj.Rooty + nodeObj.RootHeight
        return areaLabelPathObj
      }
      //  计算水平的label path
      function computeHorizontalLabelPath(nodeObj, textDy) {
        let areaLabelPathObj = {}
        areaLabelPathObj.areaLabelPathStartPosX = nodeObj.x + nodeObj.Rootx
        areaLabelPathObj.areaLabelPathEndPosX = nodeObj.x + nodeObj.Rootx + nodeObj.RootWidth
        areaLabelPathObj.areaLabelPathStartPosY = nodeObj.y + nodeObj.Rooty + nodeObj.RootHeight / 2 + textDy * nodeObj.RootHeight
        areaLabelPathObj.areaLabelPathEndPosY = nodeObj.y + nodeObj.Rooty + nodeObj.RootHeight / 2 + textDy * nodeObj.RootHeight
        return areaLabelPathObj
      }
    }
    //  计算节点标签的位置数组
    function computeNodeLabelDataAttr (areaDataArray) {
       let initMaxTextSize = 100, maxTextSize = 100, minTextSize = 2, hiddenFontSize = 0
       let totalR = treeViewPosLenObj.width>treeViewPosLenObj.height?treeViewPosLenObj.height/2:treeViewPosLenObj.width/2
       for (let i = 0;i < areaDataArray.length;i++) {
         let areaDataObj = areaDataArray[i]
         let rootHeight = areaDataObj.RootHeight
         let rootWidth = areaDataObj.RootWidth

         let areaDataObjId = areaDataObj.id
         let areaDataObjDSL = dslContentObject[treeIndexWithDSL[areaDataObjId]]
         let elementLabelAttr = areaDataObjDSL.Element.Label
         let elementLabelDx = 0
         if ('TextDx' in areaDataObjDSL.Element) {
           elementLabelDx = areaDataObjDSL.Element.TextDx
         }
         let elementLabelDy = 0
         if ('TextDy' in areaDataObjDSL.Element) {
           elementLabelDy = areaDataObjDSL.Element.TextDy
         } 
         if (areaDataObjDSL.CoordinateSystem.Category === 'polar') {
           if ('pos' in areaDataObj) {
              let labelR = areaDataObj.pos.r
              let labelRatio = labelR / totalR
              if (areaDataObjDSL.CoordinateSystem.PolarAxis === 'x-axis') {
                //  极轴是x轴的情况下，横向长度减小一半
                rootWidth = rootWidth / 2
                // 纵向长度的乘一定比例
                let lengthRatio = 2 * Math.PI * labelR / treeViewPosLenObj.height
                rootHeight = rootHeight * lengthRatio
              } else if (areaDataObjDSL.CoordinateSystem.PolarAxis === 'y-axis') {
                //  极轴是y轴，纵向长度减小一般
                rootHeight = rootHeight / 2
                //  横向长度乘一定比例
                let lengthRatio = 2 * Math.PI * labelR / treeViewPosLenObj.width
                rootWidth = rootWidth * lengthRatio
              }
           }
         }
         let maxLength = rootHeight<rootWidth?rootWidth:rootHeight
         let minLength = rootHeight>rootWidth?rootWidth:rootHeight
         //  判断根节点的宽度与长度的相对大小的关系
         if (areaDataObj.RootWidth >= areaDataObj.RootHeight) {
           //  dx会影响在path上具体的比例
           areaDataObj.labelPathPos = 50 + elementLabelDx * 50
         } else {
           //  dy会影响在path上具体的比例
           areaDataObj.labelPathPos = 50 + elementLabelDy * 50
         }
         let elementLabelValue = ""
         if ((typeof(elementLabelAttr) !== 'undefined') && (elementLabelAttr !== "hidden") 
               && (elementLabelAttr != null) && (elementLabelAttr !== 'null')
               && typeof(nodeArrayObj[areaDataObjId]) !== 'undefined') {
           if (elementLabelAttr in nodeArrayObj[areaDataObjId]) {
             elementLabelValue = nodeArrayObj[areaDataObjId][elementLabelAttr]
           }
         }
         areaDataObj.labelValue = elementLabelValue
         //  计算label的字体大小
         let fontSize = (minLength / 2) > maxTextSize ? maxTextSize : (minLength / 2)
         fontSize = fontSize > minTextSize ? fontSize : hiddenFontSize
         fontSize = fontSize > minTextSize ? fontSize : hiddenFontSize
         // 判断是否处于极坐标系的中间部分, 如果处于中间部分，那么就不显示节点上的label
         let maxLengthSideFontSize = Math.floor(maxLength / areaDataObj.labelValue.length)
         let minLengthSideFontSize = Math.floor(minLength / 2)
         let finalFontSize = maxLengthSideFontSize>minLengthSideFontSize?minLengthSideFontSize:maxLengthSideFontSize
         finalFontSize = finalFontSize>hiddenFontSize?finalFontSize:hiddenFontSize
         finalFontSize = finalFontSize>initMaxTextSize?initMaxTextSize:finalFontSize
         areaDataObj.fontSize = finalFontSize + 'px'
         //  计算旋转角度
         areaDataObj.rotation = 0
         if ('TextRotation' in areaDataObjDSL.Element) {
           areaDataObj.rotation = areaDataObjDSL.Element.TextRotation * 180
         }
         // 计算对齐的位置
         areaDataObj.textAnchor = 'middle'
         if ('TextAnchor' in areaDataObjDSL.Element) {
           areaDataObj.textAnchor = areaDataObjDSL.Element.TextAnchor
         }
         areaDataObj.tooltip = []
         if ('Tooltip' in areaDataObjDSL.Element) {
           areaDataObj.tooltip = areaDataObjDSL.Element.Tooltip
         }
         if (!('rotation' in areaDataObj)) {
           areaDataObj.rotation = 0
         }
       }
    }
    //  计算subtree data的范围
    function computeSubTreeDataPos(areaDataNodePosArray) {
      let _SubtreeDataPos = {xmin: 1000000, ymin: 1000000, xmax: 0, ymax: 0}
      for(let i = 0; i < areaDataNodePosArray.length; i++) {
        let nodePosObj = areaDataNodePosArray[i]
        let nodeObjX = nodePosObj.x
        let nodeObjY = nodePosObj.y
        if (_SubtreeDataPos.xmin > nodeObjX) {
          _SubtreeDataPos.xmin = nodeObjX
        }
        if (_SubtreeDataPos.xmax < nodeObjX) {
          _SubtreeDataPos.xmax = nodeObjX
        }
        if (_SubtreeDataPos.ymin > nodeObjY) {
          _SubtreeDataPos.ymin = nodeObjY
        }
        if (_SubtreeDataPos.ymax < nodeObjY) {
          _SubtreeDataPos.ymax = nodeObjY
        }
      }
      let SubtreeDataPos = {
        "x": _SubtreeDataPos.xmin,
        "y": _SubtreeDataPos.ymin,
        "TreeWidth": _SubtreeDataPos.xmax - _SubtreeDataPos.xmin,
        "TreeHeight": _SubtreeDataPos.ymax - _SubtreeDataPos.ymin
      }
      return SubtreeDataPos
    }

    //  结点绘制信息
    function computeNodeDataAttr(areaDataObj, areaDataNodePosObj, SubtreeDataPos, areaLabelPathObj) {
      let coordinateSystem = dslContentObject[treeIndexWithDSL[areaDataObj.id]].CoordinateSystem.Category
      let WidthScale = treeViewPosLenObj.width/areaData[currentRootID].Width
      let HeightScale = treeViewPosLenObj.height/areaData[currentRootID].Height 
      let movex = 0, movey = 0
      if (areaDataObj.fatherID != null) {
        movex = areaData[currentRootID].x //- areaData[areaDataObj.fatherID].SubtreesX 
        movey = areaData[currentRootID].y //- areaData[areaDataObj.fatherID].SubtreesY//
      }
      if (typeof(nodeArrayObj[areaDataObj.id]) !== 'undefined') {
        areaDataObj.data = nodeArrayObj[areaDataObj.id]
      }
      //  在节点对象中增加name属性
      let nodeObjName = ''
      if (typeof(nodeArrayObj[areaDataObj.id]) !== 'undefined') {
        nodeObjName = nodeArrayObj[areaDataObj.id].name
      }
      areaDataObj.name = nodeObjName
      // 在节点对象中增加value属性
      let nodeObjValue = 0
      if (typeof(nodeArrayObj[areaDataObj.id]) !== 'undefined') {
        nodeObjValue = nodeArrayObj[areaDataObj.id].value
      }
      areaDataObj.value = nodeObjValue
      let elementObj = dslContentObject[treeIndexWithDSL[areaDataObj.id]].Element
      let nodeObj = {'id': areaDataObj.id,
                     'x': (areaData[areaDataObj.id].x + movex) * WidthScale,
                     'y': (areaData[areaDataObj.id].y + movey) * HeightScale,
                     'Rootx': areaData[areaDataObj.id].Rootx * WidthScale,
                     'Rooty': areaData[areaDataObj.id].Rooty * HeightScale,
                     'RootWidth': areaData[areaDataObj.id].RootWidth * WidthScale,
                     'RootHeight': areaData[areaDataObj.id].RootHeight * HeightScale,
                     'isLeaf': areaData[areaDataObj.id].isLeaf,
                     'Width': areaData[areaDataObj.id].Width * WidthScale,
                     'Height': areaData[areaDataObj.id].Height * HeightScale,
                     'depth': areaData[areaDataObj.id].depth}
      if (isNaN(nodeObj.x) || isNaN(nodeObj.RootWidth)) {
      }
      let SubTreeData = {}
      SubTreeData['TreeWidth'] = treeViewPosLenObj.width
      SubTreeData['TreeHeight'] = self.treeHeight
      let currentNodeSystem = coordinateSystem
      let currentID = areaDataObj.id
      let currentNodeCoordinateSystemObj = dslContentObject[treeIndexWithDSL[currentID]].CoordinateSystem
        while (1) {
          if (currentNodeSystem === 'polar') {
            SubTreeData['TreeWidth'] = areaData[currentID].Width
            SubTreeData['TreeHeight'] = areaData[currentID].Height
            SubTreeData['x'] = areaData[currentID].x
            SubTreeData['y'] = areaData[currentID].y
            currentNodeCoordinateSystemObj = dslContentObject[treeIndexWithDSL[currentID]].CoordinateSystem
          }
          currentID = areaData[currentID].fatherID
          if(currentID === null)
            break
          currentNodeSystem = dslContentObject[treeIndexWithDSL[currentID]].CoordinateSystem.Category
        }
      // let CoordinateSystem = dslContentObject[treeIndexWithDSL[areaDataObj.id]].CoordinateSystem
      //  修改SubtreeDataPos的横向参数x和TreeWidth为整个canvas的长度
      SubtreeDataPos['x'] = SubTreeData['x']
      SubtreeDataPos['TreeWidth'] = SubTreeData['TreeWidth']
      //  调用createVisualElement
      let areaDataObjElement = createVisualElement (currentNodeCoordinateSystemObj, elementObj, nodeObj, SubTreeData, SubtreeDataPos)
      if (typeof(areaDataObjElement) !== 'undefined') {
        areaDataObj.element = areaDataObjElement
      }
      let areaDataObjPos = computeVisualElementPos (currentNodeCoordinateSystemObj, elementObj, nodeObj, SubTreeData, SubtreeDataPos, areaDataNodePosObj)
      if (typeof(areaDataObjPos) !== 'undefined') {
        areaDataObj.pos = areaDataObjPos
      }
      let areaLabelPath = computeAreaLabelPath(currentNodeCoordinateSystemObj, SubTreeData, areaLabelPathObj)
      if ((typeof(areaLabelPath) !== 'undefined') && (areaLabelPath != null)) {
        areaDataObj.labelPath = areaLabelPath
      }
    }
    //  生成link的path的d
    function directLineData(d) {
        let beginID = d.beginid
        let endID = d.endid
        let LinkTypeDSL = treeIndexWithDSL[beginID]
        let elementObj = dslContentObject[LinkTypeDSL].Element
        let linktype = elementObj.Link
        if ((linktype === 'hidden') || (typeof(linktype) === 'undefined')) {
          let endLinkTypeDSL = treeIndexWithDSL[endID]
          let endElementObj = dslContentObject[endLinkTypeDSL].Element
          linktype = endElementObj.Link
        }
        //  如果link的类型仍然为hidden，那么就不显示节点之间的连接
        if (linktype === 'hidden') {
          return
        }
        let beginx = areaData[beginID].pos.x, beginy = areaData[beginID].pos.y, 
            endx = areaData[endID].pos.x, endy = areaData[endID].pos.y
        //生成link的轨迹
        let LineData
        switch (linktype) {
          //直线连接
          case 'straight':{
            let PosData = []
            PosData.push([beginx,beginy])
            PosData.push([endx,endy])
            let lineGenerator = d3.line()
            LineData = lineGenerator(PosData)
            break
          }
          //直角连接 x轴先变化 折两次
          case 'curveStepX':{
            let PosData = []
            PosData.push([beginx,beginy])
            PosData.push([endx,endy])
            let lineGenerator = d3.line().curve(d3.curveStep)
            LineData = lineGenerator(PosData)
            break}
          //直角连接 y轴先变化 折两次
          case 'orthogonal':{
            let PosData = []
            PosData.push([beginx,beginy])
            PosData.push([beginx,(beginy+endy)/2])
            PosData.push([endx,(beginy+endy)/2])
            PosData.push([endx,endy])
            let lineGenerator = d3.line()
            LineData = lineGenerator(PosData)
            break}
          //直角连接 x轴先变化 折一次
          case 'curveStepAfter':{
            let PosData = []
            PosData.push([beginx,beginy])
            PosData.push([endx,endy])
            let lineGenerator = d3.line().curve(d3.curveStepAfter)
            LineData = lineGenerator(PosData)
            break}
          //直角连接 y轴先变化 折一次
          case 'curveStepBefore':{
            let PosData = []
            PosData.push([beginx,beginy])
            PosData.push([endx,endy])
            let lineGenerator = d3.line().curve(d3.curveStepBefore)
            LineData = lineGenerator(PosData)
            break}
          //贝塞尔曲线 竖直
          case 'curve':{
            let PosData = {source:[beginx,beginy],target:[endx,endy]}
            let lineGenerator = d3.linkVertical()
            LineData = lineGenerator(PosData)
            break}
          //贝塞尔曲线 水平
          case 'linkHorizontal':{
            let PosData = {source:[beginx,beginy],target:[endx,endy]}
            let lineGenerator = d3.linkHorizontal()
            LineData = lineGenerator(PosData)
            break}
          //圆弧单边
          case 'arccurve':{
            let beginEndLength = Math.pow((Math.pow((beginx-endx), 2) + Math.pow((beginy-endy), 2)), 1/2)
            let radius = beginEndLength / 2
            let positionX = (beginx + endx) / 2
            let positionY = (beginy + endy) / 2
            let arcGenerator = d3.arc()
              .innerRadius(radius)
              .outerRadius(radius);
            let initAngleSin = Math.round(positionY - beginy) / radius
            initAngleSin = initAngleSin > 1?1:initAngleSin
            initAngleSin = initAngleSin < -1?-1:initAngleSin
            let initAngle = Math.asin(initAngleSin)
            if (beginx <= positionX) {
              // let startAngle = -Math.PI / 2 - initAngle, endAngle = Math.PI / 2 - initAngle  
            } else {
              initAngle = Math.PI - initAngle
            }
            if (radius > 0.001) {
                let startAngle = 0 + initAngle, endAngle = Math.PI + initAngle
                let anticlockwise = true
                if (typeof(elementObj.ArcDirection) !== 'undefined') {
                  let ArcDirection = elementObj.ArcDirection
                  if (ArcDirection === 'bottom') {
                    anticlockwise = false
                  }
                }
                var path = d3.path();
                path.arc(positionX, positionY, radius, startAngle, endAngle, anticlockwise)
                LineData = path.toString()
            }
            break
          }
        }
        if ((linktype === 'curveStepAfter') || (linktype === 'curveStepBefore') || ((linktype === 'orthogonal'))) {
          console.log('LineData', LineData)
        }
        return LineData
    }        
}