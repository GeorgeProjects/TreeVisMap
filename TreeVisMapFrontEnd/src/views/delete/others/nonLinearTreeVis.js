    renderPartitionLink: function(treelayout, treeIndexWithDSL, dslContentObject) {
      let self = this
      let nodeIdArray = []
      let treeLayoutArray = []
      for (let nodeId in treelayout) {
        nodeIdArray.push(nodeId)
      }
      // nodeIdArray = nodeIdArray.sort()
      nodeIdArray = nodeIdArray.sort(function(a, b) {
        var aNum = a.replace('index-', '')
        var bNum = b.replace('index-', '')
        return aNum - bNum
      })
      let partitionLinkObj = self.partitionLinkObj
      for (let item in partitionLinkObj) {
        let partitionLinkAttrObj = partitionLinkObj[item]
        partitionLinkObj[item] = getParitionLinkObj(partitionLinkAttrObj.beginGId, partitionLinkAttrObj.linkNodeId, partitionLinkAttrObj.endGId, partitionLinkAttrObj.linkNodeId,treeIndexWithDSL,dslContentObject)
      }
      let renderingSubtreeId = nodeIdArray[0]
      let renderingSubtreeGId = renderingSubtreeId + '-g'
      //  选择当前所有的g, 得到所有的g的数组
      let currentExistGIdArray = []
      d3.select('#' + self.treeCanvasId)
        .selectAll('.' + self.singleTreeG)
        .each(function(d, i) {
          let currentGId = d3.select(this).attr('id')
          //  找到除新增子树之外的其他的的G的id
          if (currentGId !== renderingSubtreeGId) {
            currentExistGIdArray.push(currentGId)
          }
        })
      //  根据g的数组判断当前存在的节点
      for (let i = 0; i < currentExistGIdArray.length; i++) {
        let currentExistGId = currentExistGIdArray[i]
        let currentExistSubtreeIndex = currentExistGId.replace('-g', '')
        //  当前寻找的节点的id
        let findCurrentNodeId = 'rootnode' + currentExistSubtreeIndex
        if(d3.select('#' + renderingSubtreeGId)
          .select('#' + findCurrentNodeId).empty()) {
          //  如果没有与当前增加的子树中的节点相对应的节点，那么就不会再增加连边
        } else {
          //  第一个节点所在的G的id是renderingSubtreeGId，具体节点的id是findCurrentNodeId
          let firstNodeSubtreeGId = renderingSubtreeGId
          let firstNodeId = findCurrentNodeId
          //  第二个节点是所在的G的id是currentExistGId，具体的节点的id是findCurrentNodeId
          let secondNodeSubtreeGId = currentExistGId
          let secondNodeId = findCurrentNodeId
          let partitionLinkAttrObj = getParitionLinkObj(firstNodeSubtreeGId, firstNodeId, secondNodeSubtreeGId, secondNodeId,treeIndexWithDSL, dslContentObject)
          //  在partitionLink的数组中增加连接边
          self.partitionLinkObj[secondNodeId] = partitionLinkAttrObj
        }
      }
      //  还有一个反方向的节点寻找，已知该子树的根节点，在其他group中的所有节点中进行寻找。
      let renderingSubtreeRootId = 'rootnode' + renderingSubtreeId
      //  从svg的范围内寻找节点
      d3.select('#' + self.treeCanvasId)
        .selectAll('#' + renderingSubtreeRootId)
        .each(function(d, i) {
          let parentGId = d3.select(this)
            .select(function() {
             return this.parentNode; 
            }).attr('id');
          if (parentGId !== renderingSubtreeGId) {
            //  如果这个节点不是处于当前绘制的G的范围内，那么
            //  第一个节点所在的G的id是renderingSubtreeGId，具体节点的id是findCurrentNodeId
            let firstNodeSubtreeGId = renderingSubtreeGId
            let firstNodeId = renderingSubtreeRootId
            //  第二个节点是所在的G的id是currentExistGId，具体的节点的id是findCurrentNodeId
            let secondNodeSubtreeGId = parentGId
            let secondNodeId = renderingSubtreeRootId
            //  获取两个节点之间的连接边
            let partitionLinkAttrObj = getParitionLinkObj(firstNodeSubtreeGId, firstNodeId, secondNodeSubtreeGId, secondNodeId,treeIndexWithDSL, dslContentObject)
            //  在两个节点之间增加节点的连接边
            self.partitionLinkObj[secondNodeId] = partitionLinkAttrObj
          }
        })
      //  将找到的全部的partition的link增加到数组中
      d3.select('#' + self.treeCanvasId)
          .selectAll('.partition-link-g').remove()
      //  从partitionLinkObj中提取partitionLinkArray
      let partitionLinkArray = []
      for (let item in self.partitionLinkObj) {
        partitionLinkArray.push(self.partitionLinkObj[item])
      }
      appendPartitionLink(partitionLinkArray)

      //  获取连接边的对象
      function getParitionLinkObj(firstNodeSubtreeGId, firstNodeId, secondNodeSubtreeGId, secondNodeId, treeIndexWithDSL, dslContentObject) {
        let firstNodeSubtreeGParas = self.posLenCollectionObj[firstNodeSubtreeGId]
        let secondNodeSubtreeGParas = self.posLenCollectionObj[secondNodeSubtreeGId]
        let treeCanvasId = self.treeCanvasId
        //  第一个节点的参数
        let firstNodeSubtreeGPosLenObj = self.posLenCollectionObj[firstNodeSubtreeGId]
        // let firstNodeBindData = d3.select('#' + treeCanvasId) 
        //   .select('#' + firstNodeSubtreeGId)
        //   .select('#' + firstNodeId).data()[0]
        console.log('areaDataObj', self.areaDataCollection[firstNodeSubtreeGId])
        let firstNodeIndex = firstNodeId.replace('rootnode', '')
        let firstNodeBindData = self.areaDataCollection[firstNodeSubtreeGId][firstNodeIndex]
        //  第二个节点的参数
        let secondNodeSubtreeGPosLenObj = self.posLenCollectionObj[secondNodeSubtreeGId]
        // let secondNodeBindData = d3.select('#' + treeCanvasId)
          // .select('#' + secondNodeSubtreeGId)
          // .select('#' + secondNodeId).data()[0]
        let secondNodeIndex = secondNodeId.replace('rootnode', '')
        let secondNodeBindData = self.areaDataCollection[secondNodeSubtreeGId][secondNodeIndex]
        //  绘制节点之间的连线
        let partitionLinkG = d3.select('#' + treeCanvasId)
          .append('g')
          .attr('class', 'partition-link-g')
        var beginX = firstNodeSubtreeGPosLenObj.x + firstNodeBindData.x + firstNodeBindData.RootWidth / 2
        var beginY = firstNodeSubtreeGPosLenObj.y + firstNodeBindData.y + firstNodeBindData.RootHeight / 2
        var endX = secondNodeSubtreeGPosLenObj.x + secondNodeBindData.x + secondNodeBindData.RootWidth / 2
        var endY = secondNodeSubtreeGPosLenObj.y + secondNodeBindData.y + secondNodeBindData.RootHeight / 2
        // let begin = CalPolarCenter
        //  QINMEI
        if(dslContentObject[treeIndexWithDSL[firstNodeIndex]].CoordinateSystem.Category === 'polar'){
          let polarCenterAngle = 1
          if(typeof(dslContentObject[treeIndexWithDSL[firstNodeIndex]].CoordinateSystem.Theta) !== 'undefined'){
            polarCenterAngle = dslContentObject[treeIndexWithDSL[firstNodeIndex]].CoordinateSystem.Theta
          }
          let nodeObj = d3.select('#' + self.treeCanvasId)
            .select('#' + firstNodeSubtreeGId)
            .select('#' + firstNodeId)
            .node().getBBox()
          //  计算parentG的绝对位置
          let parentGPos = self.posLenCollectionObj[firstNodeSubtreeGId]
          let absolutePos = getAbsolutePos(nodeObj, parentGPos, polarCenterAngle)
          beginX = absolutePos.x
          beginY = absolutePos.y
        }
        if(dslContentObject[treeIndexWithDSL[firstNodeIndex]].CoordinateSystem.Category === 'polar'){
          let polarCenterAngle = 1
          if(typeof(dslContentObject[treeIndexWithDSL[firstNodeIndex]].CoordinateSystem.Theta) !== 'undefined'){
            polarCenterAngle = dslContentObject[treeIndexWithDSL[firstNodeIndex]].CoordinateSystem.Theta
          }
          let nodeObj = d3.select('#' + self.treeCanvasId)
            .select('#' + secondNodeSubtreeGId)
            .select('#' + secondNodeId)
            .node().getBBox()
          console.log('nodeObj', nodeObj)
          let parentGPos = self.posLenCollectionObj[secondNodeSubtreeGId]
          let absolutePos = getAbsolutePos(nodeObj, parentGPos, polarCenterAngle)
          endX = absolutePos.x
          endY = absolutePos.y
        }
        let linkAttrObj = {
          'beginGId': firstNodeSubtreeGId,
          'endGId': secondNodeSubtreeGId,
          'linkNodeId': firstNodeId,
          'beginX': beginX, 
          'beginY': beginY, 
          'endX': endX, 
          'endY': endY
        }
        return linkAttrObj
      }
      //  计算节点的相对位置
      function getAbsolutePos(nodeObj, parentGPos, polarCenterAngle) {
        //  计算节点的相对位置
        let nodeObjCenterPosX = nodeObj.x + nodeObj.width / 2
        let nodeObjCenterPosY = nodeObj.y + nodeObj.height / 2
        let x = parentGPos.x
        let y = parentGPos.y
        let width = parentGPos.width
        let height = parentGPos.height
        let rRange
                x = x + width/2
                y = y + height/2
        //  计算parentG的绝对位置
        let parentGCenterPosX = x
        let parentGCenterPosY = y
        return {x: parentGCenterPosX + nodeObjCenterPosX, 
                y: parentGCenterPosY + nodeObjCenterPosY}
      }
      //  增加partition之间的连接边
      function appendPartitionLink (partitionLinkArray) {
        //  调整PartitionG的数量
        let treeCanvasId = self.treeCanvasId
        let partitionLinkG = d3.select('#' + treeCanvasId)
          .selectAll('.partition-link-g')
          .data(partitionLinkArray, function(d){
            if (typeof(d) !== 'undefined') {
              return d.linkNodeId
            }
          })
          .enter()
          .append('g')
          .attr('class', 'partition-link-g')
          .attr('id', function(d, i){
            return 'partition-link-g-' + d.linkNodeId
          })
        partitionLinkG.exit().remove()
        // let nodeArray = [{
        //   x:1, y:1, width:1, height: 1, linkNodeId: 1
        // }]
        // d3.selectAll('.partition-link-g')
        //   .data(nodeArray, function(d, i){
        //     return d.linkNodeId
        //   })
        //  对于每一个partitionG的内部的元素进行更新
        partitionLinkG.each(function(d) {
          let beginX = +d.beginX
          let beginY = +d.beginY
          let endX = +d.endX
          let endY = +d.endY
          let partitionLinkGId = 'partition-link-g-' + d.linkNodeId  
          let beginEndLinkPathId = 'partition-link-path-' + d.beginGId + '-' + d.endGId
          //  更新节点之间的连接边
          if (d3.select('#' + partitionLinkGId)
              .select('#' + beginEndLinkPathId)
              .empty()) {
            partitionLinkG.append('path')
              .attr('id', beginEndLinkPathId)
              .attr('class', 'partition-link-path')
              .attr('d', function(d, i) {
                let PosData = {source:[beginX,beginY],target:[endX,endY]}
                let lineGenerator = d3.linkVertical()
                let LineData = lineGenerator(PosData)
                return LineData
              })
          } else {
            partitionLinkG.select('#' + beginEndLinkPathId)
              .transition()
              .duration(this.DURATION)
              .attr('d', function(d, i) {
                console.log('beginX', beginX, 'beginY', beginY, 'endX', endX, 'endY', endY)
                let PosData = {source:[beginX,beginY],target:[endX,endY]}
                let lineGenerator = d3.linkVertical()
                let LineData = lineGenerator(PosData)
                return LineData
              })
          }   
          //  更新begin节点
          let beginNodeCircleId = 'partition-link-circle-'+ d.beginGId + '-' + d.linkNodeId
          if (d3.select('#' + partitionLinkGId)
              .select('#' + beginNodeCircleId)
              .empty()) {
            partitionLinkG.append('circle')
              .attr('class', 'partition-link-circle')
              .attr('id', beginNodeCircleId)
              .attr('cx', beginX)
              .attr('cy', beginY)
          } else {
            partitionLinkG.select('#' + beginNodeCircleId)
              .transition()
              .duration(this.DURATION)
              .attr('cx', beginX)
              .attr('cy', beginY)
          }
          //  更新end节点
          let endNodeCircleId = 'partition-link-circle-'+ d.endGId + '-' + d.linkNodeId
          if (d3.select('#' + partitionLinkGId)
              .select('#'+endNodeCircleId)
              .empty()) { 
            partitionLinkG.append('circle')
              .attr('class', 'partition-link-circle')
              .attr('id', endNodeCircleId)
              .attr('cx', endX)
              .attr('cy', endY)
          } else {
            partitionLinkG.select('#' + endNodeCircleId)
              .transition()
              .duration(this.DURATION)
              .attr('cx', endX)
              .attr('cy', endY)
          }
        })
      }
    },
    // 绘制Squarified Treemap的树可视化形式
    drawSquarifyTreemap: function (Root, linkArray, treeWidth, treeHeight, NonLinearRootID) {
      let self = this

      let color = d3.scaleSequential(d3.interpolatePuBu)
        .domain([0, Root.height])

      var treemap = d3.treemap()
        .size([treeWidth, treeHeight])
        .padding(3)
        .round(true)
      
      treemap(Root)

      var cell = d3.select('#' + 'NonLinear'+NonLinearRootID)
          .selectAll("g")
          .data(Root.descendants())
          .enter().append("g")
          .attr("class", "cell")
          .attr("transform", function(d) {
            return "translate(" + (d.x0) + "," + (d.y0) + ")"
            })

      cell.append("rect")
          .attr("width", function (d) {
            return d.x1 - d.x0
            })
          .attr("height", function (d) {
            return d.y1 - d.y0
            })
          .style("fill", function (d) {
            return 'white'
            // return color(d.height)
            })
          .attr("stroke", function (d) {
            return 'grey'
            })
          .attr("stroke-width", function (d) {
            return '1'
            })
      /*
      cell.append("text")
      .attr("x", function(d) { return (d.x1 - d.x0) / 2; })
      .attr("y", function(d) { return (d.y1 - d.y0) / 2; })
      .attr("font-size", "8px")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .text(function(d) {
        return d.data.data.name
      })
      */
    },
    // 绘制VoronoiTreemap的树可视化形式
    drawVoronoiTreemap: function (Root, linkArray, treeWidth, treeHeight, NonLinearRootID) {
      // console.log(voronoiTreemap)
      let self = this

      let color = d3.scaleSequential(d3.interpolatePuBu)
        .domain([0, Root.height])
      
      let vTreemap = voronoiTreemap().clip([[0, 0], [0, treeHeight], [treeWidth, treeHeight], [treeWidth, 0]]); // sets the clipping polygon
      vTreemap(Root); // computes the weighted Voronoi tessellation of the d3-hierarchy; assigns a 'polygon' property to each node of the hierarchy

      d3.select('#' + 'NonLinear'+NonLinearRootID)
        .selectAll('path')
        .data(Root.descendants())
        .enter()
        .append('path')
        .attr('d', function(d) {
          return d3.line()(d.polygon) + 'z'
        })
        .attr('fill', function (d) {
          return 'white'
        })
        .style('stroke', function (d) {
          return 'grey'
        })
        .style('stroke-width', function (d) {
          return self.LINK_STROKE * (d.height + 1)
        })

      /*
      let labels = d3.select('#' + this.treeGId)
        .selectAll("g")
        .data(root.descendants())
        .enter()
        .append("g")
        .attr("transform", function(d){
          if (d.polygon.site) {
            return "translate("+[d.polygon.site.x, d.polygon.site.y]+")"
          } else {
            return "translate(0,0)"
          }
        })
        .style("font-size", "12px")

      labels.append("text")
        .text(function(d){
          if (d.polygon.site) {
            return d.data.data.name
          }
          else return ''
        })
      */
    },
    // 绘制Circle Packing的树可视化形式
    drawCirclePacking: function (Root, linkArray, treeWidth, treeHeight, NonLinearRootID) {
      // console.log(linkArray)

      let color = d3.scaleSequential(d3.interpolatePuBu)
        .domain([0, Root.height])

      let pack = d3.pack()
        .size([treeWidth - 2, treeHeight - 2])
        .padding(3)

      pack(Root)

      let node = d3.select('#' + 'NonLinear'+NonLinearRootID)
        .selectAll('g')
        .data(Root.descendants())
        .enter().append('g')
        .attr('transform', function (d) { return 'translate(' + d.x + ',' + d.y + ')' })
        .attr('class', function (d) { return 'node' + (!d.children ? ' node--leaf' : d.depth ? '' : ' node--root') })
        .each(function (d) { d.node = this })

      node.append('circle')
        .attr('id', function (d) { return 'node-' + d.id })
        .attr('r', function (d) { return d.r })
        .style('fill', function (d) { return color(d.depth) })

      var leaf = node.filter(function (d) { return !d.children })

      leaf.append('clipPath')
        .attr('id', function (d) { return 'clip-' + d.id })
        .append('use')
        .attr('xlink:href', function (d) { return '#node-' + d.id + '' })

      /*
      leaf.append('text')
        .attr('clip-path', function (d) { return 'url(#clip-' + d.id + ')' })
        .selectAll('tspan')
        .data(function (d) { return d.data.data.name })
        .enter().append('tspan')
        .attr('x', 0)
        .attr('y', function (d, i, nodes) { return 13 + (i - nodes.length / 2 - 0.5) * 10 })
        .text(function (d) { return d })
        .attr('font-size', '10px')
      */
    },
    // 绘制Force-Direct的树可视化形式
    drawForceLayout: function (nodeArray, linkArray, treeWidth, treeHeight, NonLinearRootID) {
      let simulation = d3.forceSimulation(nodeArray)
        .force('link', d3.forceLink(linkArray).distance(20))
        .force('charge', d3.forceManyBody())
        .force('center', d3.forceCenter(treeWidth / 2, treeHeight / 2))

      let treeG = d3.select('#' + 'NonLinear'+NonLinearRootID)
        .append('g')
        .attr('class', 'force-tree')

      let treeNodeElement = treeG.selectAll('.tree-node')
        .data(nodeArray, function (d, i) {
          return d.data.name + '-' + d.depth
        })
        .enter()
        .append('circle')
        .attr('class', 'tree-node')
        .attr('id', function (d, i) {
          return d.data.name
        })
        .attr('r', this.NODE_RADIUS + 'px')
        .attr('fill', 'grey')

      let treeLinkElement = treeG.selectAll('.tree-link')
        .data(linkArray, function (d, i) {
          return i
        })
        .enter()
        .append('line')
        .attr('class', 'tree-link')
        .attr('id', function (d, i) {
          return i
        })
        .style('stroke', 'grey')
        .style('stroke-width', this.LINK_STROKE + 'px')

      // console.log(nodeArray)
      simulation.on('tick', this.updateLayout)
    },