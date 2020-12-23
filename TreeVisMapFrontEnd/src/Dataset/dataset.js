import { addDslDefaultSetting } from '@/dsl-processing/add_dsl_default_setting.js'
import { getGoTreeGrammarObj } from '@/communication/sendData.js'
import { queryTemplate } from '@/communication/sendData.js'

export function Dataset () {
	this.originalTreeDataStr = null
	this.originalTreeData = null
	this.nodeArrayWithValue = null
	this.selectedDSLObject = {} //hierarchicalData, treeIndexWithDSL, treeDSLContentObj
	this.allTreeObjIdArray = []
	//	
	this.layoutParas = {}
	this.attrObjArray = {}
	//
	this.originalTreeUnitData = null
	this.originalTreeUnitDataStr = null
	this.treeUnitNodeArrayWithValue = null
	//	用户拥有的原始数据
	this.allTreeDatasetArray = []
	this.allTreeTemplateArray = []	
}
//	定义rect的prototype, 即rect对象内部的方法
Dataset.prototype = {
	init: function() {
	},
	updateDataset: function (selectedTreeDataName) {
		let originalTreeDataStr = this.getOriginalTreeData(selectedTreeDataName)
		if (typeof(originalTreeDataStr) !== 'undefined') {
			//	更新默认的层次结构数据的String数值
			this.originalTreeDataStr = originalTreeDataStr
			let originalTreeData = {}
			try {
				if (typeof(originalTreeDataStr) === 'string') {
					originalTreeData = JSON.parse(originalTreeDataStr)
				} else {
					originalTreeData = originalTreeDataStr
				}
			} catch(e) {
		        console.log('catch JSON parse error in function updateDataset')
		    }
			//	默认更新层次结构数据时，在层次结构数据的节点上增加index
			this.addNodexIndex(originalTreeData)
			this.originalTreeData = originalTreeData
			//	更新具有属性值的节点数组
			this.nodeArrayWithValue = this.computeNodeArray(originalTreeData)
			this.allTreeObjIdArray = this.computeTreeObjIdArray(this.nodeArrayWithValue)
			this.nodeArrayWithValueObj = this.computeNodeArrayWithValueObj()
			//	更新layout参数中的hierarchicalData变量
			this.layoutParas.hierarchicalData = originalTreeData
		}
	},
	//	将节点数组装换为节点对象
	computeNodeArrayWithValueObj: function() {
		let nodeArrayWithValue = this.nodeArrayWithValue
		let nodeArrayWithValueObj = {}
		for (let i = 0; i < nodeArrayWithValue.length; i++) {
			nodeArrayWithValueObj[nodeArrayWithValue[i].data.index] = nodeArrayWithValue[i].data
			nodeArrayWithValueObj[nodeArrayWithValue[i].data.index]['depth'] = nodeArrayWithValue[i]['depth']
			nodeArrayWithValueObj[nodeArrayWithValue[i].data.index]['height'] = nodeArrayWithValue[i]['height']			
		}
		return nodeArrayWithValueObj
	},
    //  assign all nodes within nodeArrayWithValueObj as dslNameIndex, and return treeIndexWithDSL object
    computeAllNodeTreeIndexWithDSL: function(nodeArrayWithValueObj, dslNameIndex) {
      let treeIndexWithDSL = {}
      for (let item in nodeArrayWithValueObj) {
        treeIndexWithDSL[item] = dslNameIndex
      }
      return treeIndexWithDSL
    },
	getNodeArrayWithValueObj: function() {
		return this.nodeArrayWithValueObj
	},
	//	根据节点的index，返回当前层次结构数据中的这个子树
	findSelectedObjectById: function(findNodeIndex) {
      let originalTreeData = this.originalTreeData
      let findNodeObj = findNodeById(originalTreeData, findNodeIndex)
      return findNodeObj
      function findNodeById (parentNodeObj, findNodeIndex) {
        if (parentNodeObj.index === findNodeIndex) {
          return parentNodeObj
        } 
        if (typeof(parentNodeObj.children) !== 'undefined') {
          let findNodeObj = null
          for (let i = 0; i < parentNodeObj.children.length; i++) {
             findNodeObj = findNodeById(parentNodeObj.children[i], findNodeIndex)
             if ((findNodeObj != null) && (typeof(findNodeObj) !== 'undefined')) {
              return findNodeObj
             }
          }
        }
      }
    },
	// 	计算层次结构数据对象的index数组
	computeTreeObjIdArray: function(nodeArrayWithValue) {
		let allTreeObjIdArray = []
		for (let i = 0;i < nodeArrayWithValue.length;i++) {
			allTreeObjIdArray.push(nodeArrayWithValue[i].data.index)
		}
		return allTreeObjIdArray
	},
	getAllTreeObjIdArray: function () {
		return this.allTreeObjIdArray
	},
	//	更新TreeUnit的数据
	updateTreeUnitDataset: function (originalTreeUnitData) {
		//	更新默认的层次结构数据的String数值
		this.originalTreeUnitDataStr = JSON.stringify(originalTreeUnitData)
		//	默认更新层次结构数据时，在层次结构数据的节点上增加index
		this.addNodexIndex(originalTreeUnitData)
		this.originalTreeUnitData = originalTreeUnitData
		//	更新具有属性值的节点数组
		this.treeUnitNodeArrayWithValue = this.computeNodeArray(originalTreeUnitData)
	},
    //  get the TreeDSLContentObj according to the treeIndexWithDSL object
    getTreeDSLContentObj: function(treeIndexWithDSL) {
        let treeDSLContentObj = {}
        for(let item in treeIndexWithDSL) {
           let dslName = treeIndexWithDSL[item]
           treeDSLContentObj[dslName] = this.getTreeDSLObject(dslName)
        }
        return treeDSLContentObj
    },
    //
    loadTreeDSLContentObjFromServer: function(treeIndexWithDSL, loadDataCallBack) {
        let treeDSLContentObj = {}
        let deferObjArray = []
        let index = 0
        // the matching relationship between dsl name and dsl index
        let deferObjDic = {}
        let treeDSLList = []
        for (let item in treeIndexWithDSL) {
            if (treeDSLList.indexOf(treeIndexWithDSL[item]) === -1) {
                treeDSLList.push(treeIndexWithDSL[item])
            }
        }
        for(let i = 0;i < treeDSLList.length; i++) {
            let dslName = treeDSLList[i]
            deferObjArray.push($.Deferred())
        }
        $.when(...deferObjArray).then(function() {
            loadDataCallBack(treeDSLContentObj)
        })
        for(let i = 0;i < treeDSLList.length; i++) {
            let dslName = treeDSLList[i]
            if (typeof(treeDSLContentObj[dslName]) !== 'undefined') {
                deferObjArray[i].resolve()
            } else {
                this.loadTreeDSLObject(dslName, function(singleTreeDSLObj, dslName) {
                   treeDSLContentObj[dslName] = singleTreeDSLObj
                   let dslIndex = treeDSLList.indexOf(dslName)
                   deferObjArray[dslIndex].resolve()
                })
            }
        }
    },
	getTreeDataset: function() {
		let self = this
		let treeDataset = {}
		try{
			if (typeof(self.originalTreeDataStr) === 'string') {
				console.log('parse funtion')
				treeDataset = JSON.parse(self.originalTreeDataStr)
			} 
		} catch(e) {
	        console.log('catch JSON parse error in function getTreeDataset')
	    }
		if (typeof(self.originalTreeDataStr) === 'object') {
			treeDataset = self.originalTreeDataStr
		}
		return treeDataset
	},
	getTreeUnitDataset: function() {
		return this.originalTreeUnitData
	},
    loadTreeDSLObject: function(dslName, callbackFunc) {
        let formData = {'dslName': dslName}
        getGoTreeGrammarObj(formData, callbackFunc)
    },
	getTreeDSLObject: function(dslName) {
        if (dslName in this.selectedDSLObject) {
            return this.selectedDSLObject[dslName]
        } 
	},
	getNodeArray: function() {
		return this.nodeArrayWithValue
	},
	getTreeUnitNodeArray: function() {
		return this.treeUnitNodeArrayWithValue
	},
	//	更新布局的参数
	updateLayoutParas: function(layoutParas) {
		this.layoutParas = layoutParas
	},
	getLayoutParas: function() {
		return this.layoutParas
	},
	updateTreeUnitLayoutParas: function(treeUnitLayoutParas) {
		this.treeUnitLayoutParas = treeUnitLayoutParas
	},
	getTreeUnitLayoutParas: function() {
		return this.treeUnitLayoutParas
	},
	//	获取层次结构数据的节点数组
	computeNodeArray: function (data) {
		var nodes = d3.hierarchy(data)
		//	对于层次结构数据进行线性化得到的节点数组
		var nodesArray = []
		//	计算带有节点属性的节点数组
		this.computeValue(nodes, nodesArray)
		return nodesArray
	},
		//	广度优先遍历增加节点的index
	addNodexIndex: function (root) {
	  var queue = [];
	  var index = 0
	  queue.push(root);
	  while(queue.length !== 0){
	    var element = queue.shift();
	    if ((typeof(element) !== 'undefined') && (element != null)) {
		    element.index = 'index-' + index;
		    index = index + 1;
		    if (element.children !== undefined) {
		      for (var i=0; i<element.children.length; i++) {
		        queue.push(element.children[i]);
		      }
		    }
		}
	  }
	},
	//	传入层次结构数据，计算层次结构数据中节点的属性值
	computeValue: function (nodes, nodesArray) {
		let children = nodes.children
		nodesArray.push(nodes)
		if (typeof(children) !== 'undefined') {
			let value = 0
			for (let i = 0; i < children.length; i++) {
				this.computeValue(children[i], nodesArray)
				value = value + children[i].data.value
			}
			if (typeof(nodes.data.value) === 'undefined') {
				nodes.data.value = value
			}
		}
	},
	//	广度优先遍历
	addTopDownIndex: function (root) {
	  var queue = [];
	  var topDownNodeIndex = 0
	  queue.push(root);
	  while(queue.length !== 0){
	    var element = queue.shift();
	    element.topDownNodeIndex = topDownNodeIndex;
	    topDownNodeIndex = topDownNodeIndex + 1;
	    if (element.children !== undefined) {
	      for (var i=0; i<element.children.length; i++) {
	        queue.push(element.children[i]);
	      }
	    }
	  }
	},
	//	计算bottom-up的index数值，即节点位置的计算顺序，采用深度优先的遍历方法
	addBottomUpIndex: function (root) {
		let bottomUpNodeIndex = 0
		innerAddBottomUpIndex(root)
		function innerAddBottomUpIndex (root) {
			let children = root.children
			if (typeof(children) !== 'undefined') {
				for (let i = 0; i < children.length; i++) {
					innerAddBottomUpIndex(children[i])
				}
			} 
			root.bottomUpNodeIndex = bottomUpNodeIndex
			bottomUpNodeIndex = bottomUpNodeIndex + 1
		}
	},
	//	更新选择的DSL对象
	updateSingleSelectedDSLObject: function(realdslname, dslObject) {
		this.selectedDSLObject[realdslname] = dslObject
	},
	//	初始化选择的DSL对象
	initSelectedDSLObject: function(selectedDSLArray) {
		let self = this
		let filteredSelectedDSLArray = []
		for (let i = 0; i < self.allTreeTemplateArray.length; i++) {
			let templateName = self.allTreeTemplateArray[i].treename
			let dslObject = null
			try {
				dslObject = JSON.parse(JSON.stringify(self.allTreeTemplateArray[i].template))				
			} catch(e) {
	        	console.log('catch JSON parse error in function initSelectedDSLObject')
	   		}
	   		if (dslObject != null) {
	   			if (selectedDSLArray.indexOf(templateName) !== -1) {
					self.selectedDSLObject[templateName] = dslObject
					filteredSelectedDSLArray.push(templateName)
				}
	   		}
		}
		return filteredSelectedDSLArray
	},
	//	更新选择的DSL对象
	updateSelectedDSLObject: function(dslName, dslObject) {
		this.selectedDSLObject[dslName] = dslObject
	},
	//	更新DSLcontent对象
	updateTreeDSLContentObject: function(dslName, dslObject) {
		let treeDSLContentObj = this.layoutParas.treeDSLContentObj
		if (typeof(treeDSLContentObj) !== 'undefined') {
			if (typeof(treeDSLContentObj[dslName]) !== 'undefined') {
				treeDSLContentObj[dslName] = dslObject
			}
		}
	},
	getAllSelectedDSLObject: function() {
		return this.selectedDSLObject
	},
	getSelectedDSLObject: function(dslName) {
		return this.selectedDSLObject[dslName]
	},
	//	判断某个DSL对象是否存在
	isDSLObjectExist: function(dslName) {
		if (typeof(this.selectedDSLObject[dslName]) === 'undefined') {
			return false
		} else {
            return true
		}
	},
	//  提取全部的属性名称
    extractAttrArray: function() {
      let hierarchicalData = this.originalTreeData
      let attrObjArray = [
        {
          attrName: 'height',
          attrType: 'number'
        },
        {
          attrName: 'width',
          attrType: 'number'
        },
        {
          attrName: 'rdepth',
          attrType: 'number'
        },
        {
          attrName: 'depth',
          attrType: 'number'  
        },
        {
          attrName: 'index',
          attrType: 'string'
        }
      ]
      // TODO
      // for (let attrName in hierarchicalData) {
      //   if ((attrName !== 'children') && (attrName !== 'index')) {
      //     let value = hierarchicalData[attrName]
      //     let attrType = typeof(value)
      //     if (attrType !== 'object') {
      //     	if (attrObjArray.map(function(e) { return e.attrName; }).indexOf(attrName) === -1) {
	     //      	attrObjArray.push({
		    //        attrName: attrName,
		    //        attrType: attrType
		    //     })
	     //    }
      //     }
          
      //   }
      // }
      return attrObjArray
    },
    //	根据文件名获取数据对象
    getOriginalTreeData: function (selectedTreeDataName) {
    	for (let i = 0;i < this.allTreeDatasetArray.length;i++) {
    		if (this.allTreeDatasetArray[i].filename === selectedTreeDataName) {
    			return this.allTreeDatasetArray[i].treedata
    		}
    	}
    },
    getOriginalTreeTemplate: function(selectedTreeTemplateName) {
    	let self = this
    	for (let i = 0;i < self.allTreeTemplateArray.length;i++) {
    		if (self.allTreeTemplateArray[i].treename === selectedTreeTemplateName) {
    			let originalTreeTemplate = {}
    			try {
    				originalTreeTemplate = JSON.parse(JSON.stringify(self.allTreeTemplateArray[i].template))
    			} catch(e) {
	        		console.log('catch JSON parse error in function getOriginalTreeTemplate')
	   			}
    			return originalTreeTemplate
    		}
    	}
    },
    removeOriginalTreeTemplate: function (removeTreeTemplateName) {
    	for (let i = 0;i < this.allTreeTemplateArray.length;i++) {
    		if (this.allTreeTemplateArray[i].treename === removeTreeTemplateName) {
    			let removedTemplateObj = this.allTreeTemplateArray.splice(i, 1)
    			return removedTemplateObj[0]
    		}
    	}
    	return null
    },
    getTreeDatasetArray: function () {
    	return this.allTreeDatasetArray
    },
    getTreeTemplateArray: function () {
    	return this.allTreeTemplateArray
    },
    //	根据树可视化的名称获取DSL对象
    getUserTreeTemplateArray: function () {
    	let userTemplateObjArray = this.allTreeTemplateArray.filter(d => (d.username !== 'root'))
    	let userTemplateArray = []
    	for (let i = 0;i < userTemplateObjArray.length;i++) {
    		try {
    			userTemplateArray.push(JSON.parse(JSON.stringify(userTemplateObjArray[i])))
    		} catch(e) {
	        	console.log('catch JSON parse error in function getUserTreeTemplateArray')
	   		}
    	}
    	return userTemplateArray
    },
    getSystemTreeTemplateArray: function() {
    	let systemTemplateObjArray = this.allTreeTemplateArray.filter(d => (d.username === 'root'))
    	let systemTemplateArray = []
    	for (let i = 0;i < systemTemplateObjArray.length;i++) {
    		try {
    			systemTemplateArray.push(JSON.parse(JSON.stringify(systemTemplateObjArray[i])))
    		} catch(e) {
	        	console.log('catch JSON parse error in function getSystemTreeTemplateArray')
	   		}
    	}
    	return systemTemplateArray
    },
    addTreeTemplateArray: function (treeTemplateArray) {
    	for (let i = 0; i < treeTemplateArray.length; i++) {
    		let templateObj = {}
    		try {
    			if (typeof(treeTemplateArray[i].template) === 'string') {
    				templateObj = JSON.parse(treeTemplateArray[i].template)
    			} else {
    				templateObj = JSON.parse(JSON.stringify(treeTemplateArray[i].template))
    			}
    		} catch(e) {
	        	console.log('catch JSON parse error in function addTreeTemplateArray')
	   		} 
	   		treeTemplateArray[i].template = templateObj
    		addDslDefaultSetting(treeTemplateArray[i].template)
    		let treeTemplateObj = treeTemplateArray[i]        	
    		let treeTemplateIndex = this.allTreeTemplateArray.findIndex(d => (d.treename === treeTemplateObj.treename));//&& (d.username === treeTemplateObj.username)
    		if (treeTemplateIndex === -1) {
    			this.allTreeTemplateArray.push(treeTemplateObj)
    		} else {
    			console.log('treeTemplateObj.treename', treeTemplateObj.treename)
    		}
    	}
    },
    //	在层次结构数据中增加一个数据集的数组
    addTreeDatasetArray: function (treeDatasetArray) {
    	for (let i = 0; i < treeDatasetArray.length; i++) {
    		let treeDatasetObj = treeDatasetArray[i]
    		let treeDatasetIndex = this.allTreeDatasetArray.findIndex(d => (d.filename === treeDatasetObj.filename)); //&& (d.username === treeDatasetObj.username)
    		if (treeDatasetIndex === -1) {
    			this.allTreeDatasetArray.push(treeDatasetArray[i])
    		}
    	}
    },
    //	在层次结构数据中增加一个数据集
    addTreeDataset: function (treeDatasetObj) {
    	let treeDatasetIndex = this.allTreeDatasetArray.findIndex(d => (d.filename === treeDatasetObj.filename)); //&& (d.username === treeDatasetObj.username)
    	if (treeDatasetIndex === -1) {
    		this.allTreeDatasetArray.push(treeDatasetObj)
    	}
    },
    isTemplateExisted: function (treename) {
    	for (let i = 0;i < this.allTreeTemplateArray.length; i++) {
    		if (this.allTreeTemplateArray[i].treename === treename) {
    			return true
    		}
    	}
    	return false
    },
    removeAllUserTemplate: function () {
    	for (let i = 0;i < this.allTreeTemplateArray.length; i++) {
    		if (this.allTreeTemplateArray[i].username !== 'root') {
    			this.allTreeTemplateArray.splice(i, 1)
    			i = i - 1
    		}
    	}
    },
    removeAllUserDataset: function () {
    	for (let i = 0;i < this.allTreeDatasetArray.length; i++) {
    		if (this.allTreeDatasetArray[i].username !== 'root') {
    			this.allTreeDatasetArray.splice(i, 1)
    			i = i - 1
    		}
    	}
    },
    //	更新当前选择节点中的DSL数组
	getCurrentTreeDSLArray: function(focusedTreeObjArray) {
		let currentTreeDSLArray = []
		let layoutParas = this.getLayoutParas()
		let treeIndexWithDSL = layoutParas.treeIndexWithDSL
		for(let item in treeIndexWithDSL) {
			//   确保是当前选中的节点
			if (focusedTreeObjArray.indexOf(item) !== -1) {
				let dslName = treeIndexWithDSL[item]
				if (currentTreeDSLArray.indexOf(dslName) === -1) {
		            currentTreeDSLArray.push(dslName)
		        }
			}
		}
		return currentTreeDSLArray
	},
	//	更新树可视化布局的参数
	updateLayoutParas: function(focusedTreeObjArray, dslItem) {
		let layoutParas = this.getLayoutParas()
		if (typeof (layoutParas.treeIndexWithDSL) === "undefined") {
			layoutParas.treeIndexWithDSL = {}
		}
		let treeIndexWithDSL = layoutParas.treeIndexWithDSL
		for (let i = 0; i < focusedTreeObjArray.length; i++) {
		    let treeNodeObjIndex = focusedTreeObjArray[i]
		    treeIndexWithDSL[treeNodeObjIndex] = dslItem
		}
		//	修改treeDSLContentObj对象中的DSL
		let treeDSLContentObj = {}
		for(let item in treeIndexWithDSL) {
			let dslName = treeIndexWithDSL[item]
			treeDSLContentObj[dslName] = this.getTreeDSLObject(dslName)
		}
		layoutParas.treeDSLContentObj = treeDSLContentObj
	},
	// 更新treeUnitDSLArray数组中的元素
	updateTreeUnitDSLArray: function (currentTreeDSLArray, _treeUnitDSLArray) {
		let layoutParas = this.getLayoutParas()
		let treeUnitDSLArray = []
		try {
			treeUnitDSLArray = JSON.parse(JSON.stringify(_treeUnitDSLArray))
	    } catch(e) {
	        console.log('catch JSON parse error in function updateTreeUnitDSLArray')
	    }
		let treeDSLContentObj = layoutParas.treeDSLContentObj
		for (let i = 0; i < currentTreeDSLArray.length; i++) {
    		let item = currentTreeDSLArray[i]
    		if (treeUnitDSLArray.filter(function(d) {return d.name === item}).length === 0) {
    			let itemVisible = false
	    		if (self.treeUnitDSLName === item) {
	    			itemVisible = true
	    		}
	    		treeUnitDSLArray.push(
	    			{
	    				name: item, 
	    				dslObj: treeDSLContentObj[item], 
	    				visible: itemVisible
	    			}
	    		)
    		}
    	}
    	return treeUnitDSLArray
	},
    /**
     * [judge whether the link should diaply on the top]
     * @param  {[type]}  dslContentObject [description]
     * @return {Boolean}                  [description]
     */
    getLinkDisplayTop: function(dslContentObject) {
      let linkDisplayTop = true
      for (let dslName in dslContentObject) {
        let dslObjElement = dslContentObject[dslName].Element
        if (dslObjElement.Link == 'hidden') {
          linkDisplayTop = false
          continue
        } 
        if (dslObjElement.LinkDisplay == 'bottom') {
          linkDisplayTop = false
          continue
        }
        if (typeof(dslObjElement.LinkDisplay) === 'undefined') {
          linkDisplayTop = false
          continue
        }
      }
      return linkDisplayTop
    }
}
