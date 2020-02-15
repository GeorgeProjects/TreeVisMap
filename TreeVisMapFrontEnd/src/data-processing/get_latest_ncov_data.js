//	处理需要的层次结构数据的接口
export function getLatestNCovData(overAllData, areaData) {
	// 计算每一天全球数据分布
	let dayRecordDataObj = getEachDayData(overAllData, areaData)
	changeAttrFormat(dayRecordDataObj)
	let dayRecordDataArray = changeObject2Array(dayRecordDataObj)
	return dayRecordDataArray[0]
}

function saveJSON(data, filename){
    if(!data) {
        console.error('No data')
        return;
    }
    if(!filename) filename = 'console.json'
    if(typeof data === "object"){
        data = JSON.stringify(data, undefined, 4)
    }
    var blob = new Blob([data], {type: 'text/json'}),
        e    = document.createEvent('MouseEvents'),
        a    = document.createElement('a')
    a.download = filename
    a.href = window.URL.createObjectURL(blob)
    a.dataset.downloadurl =  ['text/json', a.download, a.href].join(':')
    e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
    a.dispatchEvent(e)
}

function getEachDayData(overAllData, areaData) {
	let dayDate = new Date() // 当前时间
	let dayStartDate = new Date(new Date().setHours(0, 0, 0, 0)) // 当前天的起始时间
	let dayEndDate = new Date(new Date().setHours(0, 0, 0, 0))
	dayEndDate.setDate(dayEndDate.getDate() + 1)
	dayEndDate = new Date(+dayEndDate - 1)
	//	根据全部地区的数据以及区域数据
	let areaOriginalDataObj = getAreaDataObj(overAllData, areaData)
	let areaRecordDataObj = {}
	for (let area in areaOriginalDataObj) {
		let singleAreaOriginalDataArray = areaOriginalDataObj[area]
		areaRecordDataObj[area] = getEachDayAreaDistribution(area, singleAreaOriginalDataArray)
	}
	console.log('areaRecordDataObj', areaRecordDataObj)
	// 选择某一个省份，将按照区域划分的数据转换为按照时间划分
	let hubeiProvinceRecord = areaRecordDataObj['湖北省']
	let dayRecordDataObj = {}
	for (let day in hubeiProvinceRecord) {
		dayRecordDataObj[day] = {}
		for (let province in areaRecordDataObj) {
			dayRecordDataObj[day][province] = areaRecordDataObj[province][day]
		}
	}
	return dayRecordDataObj
}
//	修改对象中的属性名称
function changeAttrFormat (dayRecordDataObj) {
	//	两个之间存在顺序关系，必须先将中国的省份增加到children数组中
	changeProvince2Children(dayRecordDataObj)
	addChildrenAttr(dayRecordDataObj)
	for (let day in dayRecordDataObj) {
		changeAttrNameCities2Children(dayRecordDataObj[day])
	}
	for (let day in dayRecordDataObj) {
		formatAttrName(dayRecordDataObj[day])
	}
	for (let day in dayRecordDataObj) {
		computeSumValue(dayRecordDataObj[day])
	}
	// 将中国下的Province修改为Children
	function changeProvince2Children(dayRecordDataObj) {
		for (let day in dayRecordDataObj) {
			dayRecordDataObj[day]['中国'] = {
				'provinceName': '中国',
				'children':[]
			}
			for (let province in dayRecordDataObj[day]) {
				if (typeof(dayRecordDataObj[day][province]) !== 'undefined') {
					if (dayRecordDataObj[day][province].country === '中国') {
						dayRecordDataObj[day]['中国']['children'].push(dayRecordDataObj[day][province])
						//	将省份的数据转移到中国之后，删除掉现有的属性
						delete dayRecordDataObj[day][province]
					}
				}
			}
		}
	}
	//	修改第一层，将各个国家增加到children数组中
	function addChildrenAttr (dayRecordDataObj) {
		for (let day in dayRecordDataObj) {
			let singleDayRecordObj = dayRecordDataObj[day]
			//	修改第一层，将第一层的对象置于children数组中
			singleDayRecordObj.children = []
			singleDayRecordObj.provinceName = '全球'
			for (let item in singleDayRecordObj) {
				if ((typeof(singleDayRecordObj[item]) === 'object') && (item !== 'children')) {
					singleDayRecordObj.children.push(singleDayRecordObj[item])
					delete singleDayRecordObj[item]
				}
			}
		}
	}
	//	修改省份的层级，将cities属性值编程children
	function changeAttrNameCities2Children(singleDayRecordObj) {
		if ('children' in singleDayRecordObj) {
			for (let i = 0; i < singleDayRecordObj['children'].length; i++) {
				changeAttrNameCities2Children(singleDayRecordObj['children'][i])
			}
		} else if ('cities' in singleDayRecordObj) {
			singleDayRecordObj['children'] = singleDayRecordObj['cities']
			delete singleDayRecordObj['cities']
		}
	}
	//	删除多余的属性值，修改属性值的内容
	function formatAttrName(singleDayRecordObj) {
		let confirmedCountSum = 0
		let suspectedCountSum = 0
		let curedCountSum = 0
		let deadCountSum = 0
		if ('children' in singleDayRecordObj) { 
			for (let i = 0; i < singleDayRecordObj['children'].length; i++) {
				formatAttrName(singleDayRecordObj['children'][i])
				confirmedCountSum = confirmedCountSum + singleDayRecordObj['children'][i].confirmedCount
				suspectedCountSum = suspectedCountSum + singleDayRecordObj['children'][i].suspectedCount
				curedCountSum = curedCountSum + singleDayRecordObj['children'][i].curedCount
				deadCountSum = deadCountSum + singleDayRecordObj['children'][i].deadCount
			}
		}
		// 	计算累计的数量
		if (!('confirmedCount' in singleDayRecordObj)) {
			singleDayRecordObj['confirmedCount'] = confirmedCountSum
		}
		if (!('suspectedCount' in singleDayRecordObj)) {
			singleDayRecordObj['suspectedCount'] = suspectedCountSum
		}
		if (!('curedCount' in singleDayRecordObj)) {
			singleDayRecordObj['curedCount'] = curedCountSum
		}
		if (!('deadCount' in singleDayRecordObj)) {
			singleDayRecordObj['deadCount'] = deadCountSum
		}
		singleDayRecordObj['value'] = 0
		if (singleDayRecordObj['confirmedCount'] !== 0) {
			singleDayRecordObj['value'] = Math.log(singleDayRecordObj['confirmedCount'])
		}
		if (('cityName' in singleDayRecordObj) && (singleDayRecordObj['cityName'] !== "")) {
			if (singleDayRecordObj['cityName'].indexOf(singleDayRecordObj['confirmedCount']) !== -1) {
				singleDayRecordObj['cityName'] = singleDayRecordObj['cityName']
			} else {
				singleDayRecordObj['cityName'] = singleDayRecordObj['cityName'] + ' ' + singleDayRecordObj['confirmedCount']
			}
		} else if (!('cityName' in singleDayRecordObj)) {
			singleDayRecordObj['cityName'] = ""
		}
		//	增加对象的id
		if ('provinceName' in singleDayRecordObj) {
			singleDayRecordObj['name'] = singleDayRecordObj['provinceName']
		}
		if (('cityName' in singleDayRecordObj) && (singleDayRecordObj['cityName'] !== "")) {
			singleDayRecordObj['name'] = singleDayRecordObj['cityName'].replace(singleDayRecordObj['confirmedCount'], '').replace(' ', '')
		}
		delete singleDayRecordObj['comment']
		delete singleDayRecordObj['updateTime']
		delete singleDayRecordObj['createTime']
		delete singleDayRecordObj['modifyTime']
	}
	//	重新累加属性值
	function computeSumValue (singleDayRecordObj) {
		if ('children' in singleDayRecordObj) {
			let sumValue = 0
			if ('children' in singleDayRecordObj) { 
				for (let i = 0; i < singleDayRecordObj['children'].length; i++) {
					computeSumValue(singleDayRecordObj['children'][i])
					sumValue = sumValue + singleDayRecordObj['children'][i].value
				}
			}
			singleDayRecordObj['value'] = sumValue
		}
	}
}
//	将按照时间划分的对象转换为数组
function changeObject2Array(dayRecordDataObj) {
	let dayRecordDataArray = []
	for (let item in dayRecordDataObj) {
		dayRecordDataArray.push(dayRecordDataObj[item])
		dayRecordDataObj[item].day = item
	}
	return dayRecordDataArray
}

function changeObjFormat (singleDayRecordObj) {
	console.log('singleDayRecordObj', singleDayRecordObj)
	
	//	将cities属性值编程children
	changeAttrNameCities2Children(singleDayRecordObj)
	// 	在所有对象的属性值上增加id
	console.log(JSON.parse(JSON.stringify(singleDayRecordObj)))
	//	重新累加value数值
	computeSumValue(singleDayRecordObj)
	// //	修改cityName，增加value数值
	//	增加depth属性值
	// singleDayRecordObj = add_depth(singleDayRecordObj)
	return singleDayRecordObj
}

//  向传入的层次结构数据treeData中的节点上增加depth属性
function add_depth (treeData) {
    //  初始的根节点的depth属性为0, 并且下层的节点依次增加1
    let initDepth = 0
    inner_add_depth(treeData, initDepth)
    return treeData
    function inner_add_depth(treeData, depth){
        treeData.depth = depth
        let children = treeData.children
        if(typeof(children) !== 'undefined') {
            depth = depth + 1
            for(let cI = 0;cI < children.length;cI++) {
              let child = children[cI]
              inner_add_depth(child, depth)
            }
        }
    }
}

function computeSumValue (singleDayRecordObj) {
	if ('children' in singleDayRecordObj) {
		let sumValue = 0
		if ('children' in singleDayRecordObj) { 
			for (let i = 0; i < singleDayRecordObj['children'].length; i++) {
				computeSumValue(singleDayRecordObj['children'][i])
				sumValue = sumValue + singleDayRecordObj['children'][i].value
			}
		}
		singleDayRecordObj['value'] = sumValue
	}
}

//	将数据分为不同的天的全国的分布
function getEachDayAreaDistribution(area, singleAreaOriginalDataArray) {
	let startDate = new Date('2020/1/24')// 1月24号
	let currentDate = new Date()
	let date = currentDate
	let areaObj = {}
	let ChinaProvince = 
	["湖北省", "广东省", "浙江省", "北京市", 
	 "上海市", "湖南省", "安徽省", "重庆市", 
	 "四川省", "山东省", "广西壮族自治区", "福建省", 
	 "江苏省", "河南省", "海南省", "天津市", 
	 "江西省", "陕西省", "贵州省", "辽宁省", 
	 "香港", "黑龙江省", "澳门", "新疆维吾尔自治区", 
	 "甘肃省", "云南省", "台湾", "山西省", 
	 "吉林省", "河北省", "宁夏回族自治区", "内蒙古自治区", 
	 "青海省", "西藏自治区"]
	while(date >= startDate) {
		let dayEndDate = new Date(date.setHours(0, 0, 0, 0))
		dayEndDate.setDate(dayEndDate.getDate() + 1)
		dayEndDate = new Date(+dayEndDate - 1)
		let dayString = dayEndDate.format("yyyy-MM-dd")
		//	从dayEndDate这个时间点开始找到最新的情况
		let latestRecord = {
			provinceName: area,
			provinceShortName: area,
			confirmedCount: 0,
			suspectedCount: 0,
			curedCount: 0,
			deadCount: 0,
			comment: '',
			cities: [],
			country: ChinaProvince.indexOf(area) !== -1?'中国':area
		}
		for (let i = 0; i < singleAreaOriginalDataArray.length; i++) {
			if (singleAreaOriginalDataArray[i].updateTime <= (+dayEndDate)) {
				latestRecord = singleAreaOriginalDataArray[i]
				break
			}
		}
		areaObj[dayString] = latestRecord
		date.setDate(date.getDate() - 1)
	}
	return areaObj
}
//	按照area.json的城市名称将sari.json中的数据进行分组
function getAreaDataObj (overAllData, areaData) {
	let dataArray = overAllData.results
	let areaNameArray = areaData.results
	let areaDataObj = {}
	for (let i = 0; i < areaNameArray.length; i++) {
		let areaName = areaNameArray[i]
		areaDataObj[areaName] = []
	}
	for (let i = 0; i < dataArray.length; i++) {
		let areaName = dataArray[i].provinceName
		areaDataObj[areaName].push(dataArray[i])
	}
	return areaDataObj
}

