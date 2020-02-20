import { getLayoutValue } from '@/data-processing/get_layout_value.js'
import { getTreeLayout } from '@/data-processing/get_tree_layout.js'
import { addDefaultCoordElement } from '@/data-processing/add_default_coord_element.js'
import { getNodeLinkAttr } from '@/data-processing/get_node_link_attr.js'

export function getTreeDistanceMatrix (maxDslAmountIndex, callbackFunc) {
	let positionArrays = []
	let deferObjArray = []
	for (let dslNameIndex = 0; dslNameIndex < maxDslAmountIndex; dslNameIndex++) {
		deferObjArray.push($.Deferred())
	}
	$.when(...deferObjArray).then(function () {
		let treeDistanceMatrix = computeNodeDistance(positionArrays)
		callbackFunc(treeDistanceMatrix)
	})
	for (let dslNameIndex = 0; dslNameIndex < maxDslAmountIndex; dslNameIndex++) {
		//	计算树布局的距离矩阵
		let layoutParas = sysDatasetObj.getLayoutParas()
		let nodeArrayWithValueObj = sysDatasetObj.getNodeArrayWithValueObj()
		let treeIndexWithDSL = computeAllNodeTreeIndexWithDSL(nodeArrayWithValueObj, dslNameIndex)
		layoutParas.treeIndexWithDSL = treeIndexWithDSL
		layoutParas.treeDSLContentObj = getTreeDSLContentObj(treeIndexWithDSL)
		computeAreaDataObj(layoutParas, positionArrays, deferObjArray, dslNameIndex)
	}
}
function computeNodeDistance(positionArrays) {
  let distanceArray = []
  console.log('positionArrays', positionArrays)
  for (let i = 0; i < positionArrays.length; i++) {
    let temp = []
    for (let j = 0; j < positionArrays.length; j++) {
      if (j < i) temp.push(distanceArray[j][i])
      if (j == i) temp.push(0)
      if (j > i) {
        temp.push(distance(positionArrays[i], positionArrays[j]))
      }
    }
    distanceArray.push(temp)
  }
  return distanceArray
  function distance(positionArray_a, positionArray_b) {
    let len = positionArray_a.length
    let ans = 0
    // let pow = Array(len)
    // for (let i = 0; i < len;i++) {
    //   if (a[i].fatherID == null) pow[i] = 1
    //   else {
    //     pow[i] = pow[parseFloat(a[i].fatherID.splice('-')[1])] + 1
    //   }
    // }
    for (let i = 0; i < len;i++) {
      ans += Math.sqrt(Math.pow((positionArray_a[i].pos.x - positionArray_b[i].pos.x),2) + 
      		Math.pow((positionArray_a[i].pos.y - positionArray_b[i].pos.y),2))
    }
    return ans
  }
}
function computeAllNodeTreeIndexWithDSL(nodeArrayWithValueObj, dslNameIndex) {
  let treeIndexWithDSL = {}
  for (let item in nodeArrayWithValueObj) {
    treeIndexWithDSL[item] = dslNameIndex
  }
  return treeIndexWithDSL
}

function getTreeDSLContentObj(treeIndexWithDSL) {
   let treeDSLContentObj = {}
   for(let item in treeIndexWithDSL) {
    let dslName = treeIndexWithDSL[item]
    treeDSLContentObj[dslName] = sysDatasetObj.getTreeDSLObject(dslName)
   }
   return treeDSLContentObj
 }

 //  计算树可视化的对象所占据的区域
function computeAreaDataObj(layoutParas, positionArrays, deferObjArray, dslNameIndex) {
  let nodeArray = sysDatasetObj.getNodeArray()
  let assignedAllNodesBoolean = assignedAllNodes(nodeArray, layoutParas.treeIndexWithDSL)
  if (assignedAllNodesBoolean) {
    getLayoutValue(layoutParas).then(function(treeLayout) {
      let areaDataArray = renderTreeVisResults(treeLayout, nodeArray, layoutParas)
      positionArrays[dslNameIndex] = areaDataArray
      deferObjArray[dslNameIndex].resolve()
    })
  }
  //  计算树可视化结果中的节点位置的布局
  function renderTreeVisResults (treelayout, nodeArray, layoutParas) {
    let treeIndexWithDSL = layoutParas.treeIndexWithDSL
    let dslContentObject = layoutParas.treeDSLContentObj
    let treeViewPosLenObj = {
      x: 0, y: 0, width: 10, height: 10
    }
    let areaData = getTreeLayout(treeIndexWithDSL, dslContentObject, treelayout, nodeArray, treeViewPosLenObj)
    let dslContentObjectWithDefault = addDefaultCoordElement(dslContentObject)
    let [areaDataArray, linkDataArray] = getNodeLinkAttr(areaData, dslContentObjectWithDefault, treeIndexWithDSL, treeViewPosLenObj, nodeArray)
    return areaDataArray
  }
  //  是否在DSL中指定了全部节点
  function assignedAllNodes(nodeArray, treeIndexWithDSL) {
    let nodeIndexArray = []
    for(let i = 0;i < nodeArray.length;i++) {
      nodeIndexArray.push(nodeArray[i].data.index)
    }
    let dslIndexArray = []
    for(let item in treeIndexWithDSL) {
      dslIndexArray.push(item)
    }
    if ((nodeIndexArray.length === dslIndexArray.length) 
        && (nodeIndexArray.length !== 0) && (dslIndexArray.length !== 0)) {
      return true
    }
    return false
  }
}