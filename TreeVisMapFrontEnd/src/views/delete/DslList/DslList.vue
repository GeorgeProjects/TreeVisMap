<template>
	<div id="treedsl-container">
		<el-carousel indicator-position="outside" :autoplay="false">
		    <el-carousel-item v-for="(dslRow, index) in dslArrangement" :key="getPanelKey(index)" v-if="showPanel">
		      <div class="treedsls" :style="DSLsStyleObject">
		      	<div class="single-treedsl" 
		      		 v-for="dslItem in dslRow"
		      		 :id="dslItem"
               		 :class="{ selected: (currentTreeDSLArray.indexOf(dslItem) != -1) }"
		      		 :style="singleDSLStyleObject">
		      		<SinglePreviewFigure
		      			:key="dslItem"
		      			:dslId="dslItem"
		      			:getTreeDSLObj="getTreeDSLObj"
		      			:operation="operation"
		      			:defaultOperationFunc="updateSelectedTreeDSL"
		      			:removeTemplateFromDsllist="removeSelectedDSL"
		      			:addTemplate2Library="addTemplate2Library"
		      			:replaceExistedTree="updateSelectedTreeDSL">
		      			{{dslItem}}
		      		</SinglePreviewFigure>
		      		<!-- <div class="remove-button-container"
		      			:style="deleteButtonContainerStyleObj">
			      		<el-button
			      			:style="buttonStyleObj"
			      			@click.stop="removeSelectedDSL(dslItem)"
			      			icon="el-icon-close" circle>
			      		</el-button>
		      		</div> -->
		      	</div>
		      </div>
		    </el-carousel-item>
		</el-carousel>
	</div>
</template>

<script>
  import GoTreeSketchFigure from './GoTreeSketchFigure.vue';
  import SinglePreviewFigure from './SinglePreviewFigure.vue';
  import { Drag, Drop } from 'vue-drag-drop';
  import { mapState, mapMutations, mapActions } from 'vuex';
  import { addTreeTemplate } from '@/communication/sendData.js'

  export default {
	name: 'DSLList',
	components: {
		GoTreeSketchFigure, SinglePreviewFigure, Drag, Drop
	},
	data() {
	  return {
	  	treeDSLNum: 5,
	  	dslArrangement: [],
	  	showPanel: false,
	  	singleDSLStyleObject: {},
	  	deleteButtonContainerStyleObj: {},
	  	infoButtonContainerStyleObj: {},
	  	buttonStyleObj: {},
	  	DSLsStyleObject: {},
	  	singleDSLHorizontalSpace: 0,
	  	operation: ['replace', 'save2gallery', 'download', 'dsllist-remove']
	  }
	},
	watch: {
		selectedDSLArray: {
			// 更新选择的层次结构数据DSL
			handler: function() {
				this.updateDSLArrangement()
			},
			deep: true
		},
		// previewTreeObj: function() {
		// 	// if ((this.dslListSelectedDSLName != null) && (this.selectedPreviewNodeId != null)) {
		// 	// 	console.log('dslListSelectedDSLName', this.dslListSelectedDSLName)
		// 	// 	this.updateSelectedTreeDSL(this.dslListSelectedDSLName)				
		// 	// } else {
		// 	// 	this.updateCurrentDSLArray()
		// 	// }
		// 	let currentTreeDSLArray = sysDatasetObj.getCurrentTreeDSLArray(this.focusedTreeObjArray)
		// 	// 更新当前选择的DSL数组
		// 	this.UPDATE_CURRENT_TREE_DSL_ARRAY(currentTreeDSLArray)
		// },
		dslListSelectedDSLName: function() {
			if (this.dslListSelectedDSLName != null) {
				this.updateSelectedTreeDSL(this.dslListSelectedDSLName)				
			}
		},
		dslListSelectedDSLState: function() {
			if ((this.dslListSelectedDSLName != null) && (this.selectedPreviewNodeId != null)) {
				console.log('dslListSelectedDSLName', this.dslListSelectedDSLName)
				this.updateSelectedTreeDSL(this.dslListSelectedDSLName)				
			}
		}//,
		// treeUnitDSLName: function() {
		// 	if (this.dslListSelectedDSLName == null) {
		// 		this.updateSelectedTreeDSL(this.treeUnitDSLName)
		// 	}
		// }
	},
	created: function () {
	},
	beforeMount: function() {	
	},
	mounted: function() {
		this.updateDSLArrangement()
		//	在获取DSL的排布之后，显示具体的DSL面板
		this.showPanel = true
	},
	computed: {
		...mapState([
		  // 全部需要展示的层次结构数据类型
		  'treeUnitDSLArray',
	      'selectedDSLArray',
	      'focusedTreeObjArray',
	      'previewTreeObj',
	      'selectedDataset',
	      'treeUnitDSLName',
	      'dslListSelectedDSLName',
	      'dslListSelectedDSLState',
	      'selectedPreviewNodeId',
	      'currentTreeDSLArray',
	      'userInfoName'
	    ])
	},
	methods: {
		//	获取slide panel上的每一个panel的key值
		getPanelKey: function(index) {
			return 'row-' + index
		},
		//  获取TreeDSL对象
	    getTreeDSLObj: function(dslItem) {
	      let dslObj = sysDatasetObj.getSelectedDSLObject(dslItem)
	      return dslObj
	    },
	    getTreeTemplateInfo: function(templateJsonObj, treename, username) {
			let self = this
			let dateStr = new Date().toISOString().split('T')[0]
			return {
				treename: treename,
				username: username,
				template: templateJsonObj,
				date: dateStr
			}
		},
	    addTemplate2Library: function(dslItem) {
	    	let userInfoName = this.userInfoName
	    	let dslObj = this.getTreeDSLObj(dslItem)
	    	let templateJsonObj = JSON.stringify(dslObj)
	    	let treeTemplateInfoObj = this.getTreeTemplateInfo(templateJsonObj, dslItem, userInfoName)
	    	let isTemplateExisted = sysDatasetObj.isTemplateExisted(dslItem)
	    	if (isTemplateExisted) {
	    		// 	如果当前的template已经在用户的library中存在，那么需要提醒用户
	    		this.promptMessage('error', 'this template is existed')
	    	} else {
	    		// 	首先需要将template添加到library中
	    		sysDatasetObj.addTreeTemplateArray([treeTemplateInfoObj])
	    		// 	如果当前用户已经登录，那么需要将template上传到服务器的用户的账号中
	    		if (userInfoName !== 'Login') {
	    			addTreeTemplate(treeTemplateInfoObj, this.addTreeTemplateCallback)
	    		}
	    	}
	    },
	    addTreeTemplateCallback: function() {
			this.promptMessage(resData.type, resData.message)
	    },
	    promptMessage: function(type, message) {
			this.$message({
              type: type,
              message: message
            })
		},
		//	设置删除图标的位置
		initDeleteInfoIconStyleObj: function() {
			//	设置single DSL的div的top以及right的位置
			let singleDSLDivHeight = +(this.singleDSLStyleObject.height.replace('px', ''))
			let singleDSLDivWidth = +(this.singleDSLStyleObject.width.replace('px', ''))
			let singleDSLDivMarginTop = +this.singleDSLStyleObject.marginTop.replace('px')
			let removeButtonPadding = singleDSLDivWidth / 30,
				removeButtonFontSize = singleDSLDivWidth / 12
			let removeButtonRight = -(removeButtonPadding + removeButtonFontSize / 2)
			let removeButtonTop = -(singleDSLDivHeight + removeButtonPadding + removeButtonFontSize / 2)
			this.deleteButtonContainerStyleObj = {
				right: removeButtonRight + 'px',
				top: removeButtonTop + 'px'
			}
			this.infoButtonContainerStyleObj = {
				right: (-removeButtonRight) + 'px',
				top: removeButtonTop + 'px'
			}
			this.buttonStyleObj = {
				fontSize: removeButtonFontSize + 'px',
				padding: removeButtonPadding + 'px',
			}
			// console.log('margin-top', $('.single-treedsl').css('margin-top'))
			// let singleTreeDSLMarginTop = +($('.single-treedsl').css('margin-top').replace('px'))	
			// // console.log('singleTreeDSLHeight', singleTreeDSLHeight, 'singleTreeDSLMarginTop', singleTreeDSLMarginTop)		
		},
		//	更新DSL Arrangement视图
		updateDSLArrangement: function() {
			this.initDSLNum()
			this.initDSLArrangement()
			this.setContainerPadding()
			this.initDeleteInfoIconStyleObj()
		},
		//	mounted之后需要计算每一行内能够容纳多少个treedsl, DSLContainer的高度是一个固定的数值, 需要按照DSLContainer的高度计算一个宽度值
		initDSLNum: function() {
			let treeDSLContainerHeight = $('#treedsl-container').height()
			let treeDSLContainerWidth = $('#treedsl-container').width()
			let marginTopBottom = 0.08
			let marginLeftRight = 0.1
			//	计算singleTreeDSL的高度以及纵向的margin
			let singleTreeDSLHeight = treeDSLContainerHeight * (1 - 2 * marginTopBottom)
			let singleTreeDSLMarginTopBottom = treeDSLContainerHeight * marginTopBottom
			//	计算singleTreeDSL的宽度以及横向的margin 
			let singleTreeDSLWidth = singleTreeDSLHeight * 0.877
			let singleTreeDSLMarginLeftRight = singleTreeDSLWidth * marginLeftRight
			this.singleDSLHorizontalSpace = singleTreeDSLWidth + singleTreeDSLMarginLeftRight * 2
			//	计算可以支持横向排布多少个单个TreeDSL
			let treeDSLNum = treeDSLContainerWidth / this.singleDSLHorizontalSpace
			if ((treeDSLNum % 1) > 0.9) {
				treeDSLNum = Math.round(treeDSLNum)
			}
			treeDSLNum = Math.floor(treeDSLNum)
			this.treeDSLNum = treeDSLNum
			this.singleDSLStyleObject = {
				height: singleTreeDSLHeight + 'px',
				width: singleTreeDSLWidth + 'px',
				marginLeft: singleTreeDSLMarginLeftRight + 'px',
				marginRight: singleTreeDSLMarginLeftRight + 'px',
				marginTop: singleTreeDSLMarginTopBottom + 'px',
				marginBottom: singleTreeDSLMarginTopBottom + 'px'
			}			
		},
		//	初始化对于DSL的排布
		initDSLArrangement: function() {
			let selectedDSLArray = this.selectedDSLArray
			let treeDSLNum = this.treeDSLNum
			let dslArrangement = []
			for (let i = 0; i < selectedDSLArray.length; i++) {
				if ((i % treeDSLNum) === 0) {
					dslArrangement.push([])
				}
				dslArrangement[dslArrangement.length - 1].push(selectedDSLArray[i])
			}
			this.dslArrangement = dslArrangement
		},
		//	设置DSL container的padding数值
		setContainerPadding: function() {
			let treeDSLContainerWidth = $('#treedsl-container').width()
			let treeDSLNum = this.treeDSLNum
			//	再次计算累加的DSL长度，计算左右的padding数值
			let wholeOccupySpace = this.singleDSLHorizontalSpace * treeDSLNum
			//	如果所占据的宽度较小，那么设置左右的padding数值
			if (treeDSLContainerWidth > wholeOccupySpace) {
				let paddingLeftRight = (treeDSLContainerWidth - wholeOccupySpace) / 2
				this.DSLsStyleObject = {
					paddingLeft: paddingLeftRight + 'px',
					paddingRight: paddingLeftRight + 'px'
				}
			}
		},
		//	用户点击删除DSL的按钮对于选择的DSL进行删除
		removeSelectedDSL: function(dslItem) {
			console.log('removeSelectedDSL', dslItem)
			let dslItemIndex = this.selectedDSLArray.indexOf(dslItem)
			this.selectedDSLArray.splice(dslItemIndex, 1)
		},
		//  更新当前选择的TreeDSL
		updateSelectedTreeDSL: function(dslItem) {
			let self = this
			// let layoutParas = sysDatasetObj.getLayoutParas()
			// if (typeof (layoutParas.treeIndexWithDSL) === "undefined") {
			// 	layoutParas.treeIndexWithDSL = {}
			// }
			// let treeIndexWithDSL = layoutParas.treeIndexWithDSL

			// //	更新渲染树可视化形式的参数
			// changeSingleDSLIndex(focusedTreeObjArray, treeIndexWithDSL, dslItem)
			// //	修改treeDSLContentObj对象中的DSL
			// let treeDSLContentObj = {}
			// for(let item in treeIndexWithDSL) {
			// 	let dslName = treeIndexWithDSL[item]
			// 	treeDSLContentObj[dslName] = sysDatasetObj.getTreeDSLObject(dslName)
			// }
			// layoutParas.treeDSLContentObj = treeDSLContentObj
			//	更新树可视化的布局参数
			sysDatasetObj.updateLayoutParas(this.focusedTreeObjArray, dslItem)
			//	更新当前选择的DSL数组，仅仅作用在当前视图
			let currentTreeDSLArray = sysDatasetObj.getCurrentTreeDSLArray(this.focusedTreeObjArray)
			this.UPDATE_CURRENT_TREE_DSL_ARRAY(currentTreeDSLArray)
			// 更新TreeUnit视图上显示的DSL数组
			let treeUnitDSLArray = sysDatasetObj.updateTreeUnitDSLArray(this.currentTreeDSLArray, this.treeUnitDSLArray)
			this.UPDATE_TREEUNIT_DSL_ARRAY(treeUnitDSLArray)
			//	更新TreeUnit视图的显示
			setTimeout(function() {
		    	self.UPDATE_TREEUNIT_DSL_NAME(dslItem)
		    }, 100)
			// this.updateTreeUnitDSLArray(dslItem)
			//	更新TreeUnit视图
		    // this.UPDATE_TREE_UNIT_LAYOUT_STATE()
			//	更新TreeCanvas中的视图
			setTimeout(function() {
				self.UPDATE_TREE_CANVAS_LAYOUT_STATE()
			}, 300)	
			// else {
			// 	// currentTreeDSLArray.splice(dslItemIndex, 1)
			// 	// this.UPDATE_CURRENT_TREE_DSL_ARRAY(currentTreeDSLArray)	
			// }
		    //	更新TreeUnit视图
			// let treeUnitDataset = sysDatasetObj.getTreeUnitDataset()
		 //    let treeUnitFormData = {
		 //       hierarchicalData: treeUnitDataset,
		 //       treeIndexWithDSL: treeIndexWithDSL,
		 //       treeDSLContentObj: treeDSLContentObj,
		 //    }
		 //    sysDatasetObj.updateTreeUnitLayoutParas(treeUnitFormData)
		    // 改变一个节点的DSL index
		    // function changeSingleDSLIndex(treeNodeObjArray, treeIndexWithDSL, dslItem) {
		    //     for (let i = 0; i < treeNodeObjArray.length; i++) {
		    //       let treeNodeObjIndex = treeNodeObjArray[i]
		    //       treeIndexWithDSL[treeNodeObjIndex] = dslItem
		    //     }
		    // }
		},
		// updateTreeUnitDSLArray: function(selectedDSLName) {
		// 	let self = this
	 //    	let treeUnitDSLArray = this.treeUnitDSLArray
	 //    	let currentTreeDSLArray = this.currentTreeDSLArray
	 //    	let treeUnitDSLArray = sysDatasetObj.updateTreeUnitDSLArray(currentTreeDSLArray, treeUnitDSLArray)
	 //    	this.UPDATE_TREEUNIT_DSL_ARRAY(treeUnitDSLArray)
	 //    	setTimeout(function() {
		//     	self.UPDATE_TREEUNIT_DSL_NAME(selectedDSLName)
		//     }, 100)
	 //    },
		//	计算属于hybrid类型的DSL的节点数量
		getHybridNodeObjArrayNum: function() {
			return 0
		},
		...mapActions([
	      'getLayoutValue'
	    ]),
	    ...mapMutations([
	    	'UPDATE_TREEUNIT_DSL_ARRAY',
	    	'UPDATE_TREEUNIT_DSL_NAME',
	    	'UPDATE_TREE_CANVAS_LAYOUT_STATE',
	    	'UPDATE_TREE_UNIT_LAYOUT_STATE',
	    	'UPDATE_DSLLIST_SELECTED_DSL_NAME',
	    	'UPDATE_CURRENT_TREE_DSL_ARRAY', 
	    	'UPDATE_TREE_DSL_DIALOG_STATE'
     	])
 	}
  }
</script>

<style lang="less">
	@slide-control_width: 3%;
	#treedsl-title {
		
	}
	#treedsl-container {
		font-family: 'Avenir', Helvetica, Arial, sans-serif;
		width: 100%;
		height: 100%;
		.el-carousel {
			position: absolute;
			width: 100%;
			height: 100%;
			.el-carousel__container {
				position: absolute;
				height: 100%;
				width: 100%;
				.treedsls {
					position: absolute;
					left: 0px;
					top: 0%;
					right: 0px;
					height: 100%;
					display: flex;
					flex-direction: row;
					.single-treedsl {
						.remove-button-container {
							position: relative;
							float: right;
							visibility: hidden;
						}
						.info-button-container {
							position: relative;
							float: left;
						}
						.el-button.is-circle {
							padding: 6px;
						}
						&:hover {
							.remove-button-container {
								visibility: visible;
							}
							box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);
						}
					}
					.single-treedsl[class~=selected] {
						box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);	
					}
				}
			}
		}
		.el-carousel__item {
		}

		.el-carousel__arrow--left {
			left: 5px;
		}

		.el-carousel__arrow--right {
			right: 5px;
		}

		.el-carousel__indicators {
			position: absolute;
			width: 100%;
			left: 0%;
			bottom: 0%;
			.el-carousel__indicator {
				padding: 3px 4px;
			}
		}
	}
</style>
