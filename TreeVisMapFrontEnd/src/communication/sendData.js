//	根据层次结构数据计算节点的数组
import axios from 'axios'

export function sendLoginData (formData, loginCallback) {
    axios({
      methods: 'get',
      url: '/user/signin',
      params: formData,
      timeout: 10000
    })
    .then((res) => {
     	loginCallback(res.data)
    })
}

export function sendSignupData (formData, signupCallback) {
    axios({
      methods: 'get',
      url: '/user/signup',
      params: formData,
      timeout: 10000
    })
    .then((res) => {
     	signupCallback(res.data)
    })
}

export function addTreeDataset (dataObj, addDataCallback) {
    console.log('addTreeDataset')
    axios({
      methods: 'get',
      url: '/dataset/add',
      params: dataObj,
      timeout: 10000
    })
    .then((res) => {
       addDataCallback(res.data)
    })
}

export function removeTreeDataset (dataObj, removeDataCallback) {
    axios({
      methods: 'get',
      url: '/dataset/remove',
      params: dataObj,
      timeout: 10000
    })
    .then((res) => {
       removeDataCallback(res.data)
    })
}

export function addTreeTemplate (templateObj, addTemplateCallback) {
    axios({
      methods: 'get',
      url: '/template/add',
      params: templateObj,
      timeout: 10000
    })
    .then((res) => {
       addTemplateCallback(res.data)
    })
}

export function removeTreeTemplate (templateObj) {
    let removedTemplateObj = {
      treename: templateObj.treename,
      username: templateObj.username,
      date: templateObj.date
    }
    console.log('removeTreeTemplate', removedTemplateObj, 'templateObj', templateObj)
    axios({
      methods: 'get',
      url: '/template/remove',
      params: removedTemplateObj,
      timeout: 10000
    })
    .then((res) => {
      console.log('remove the tree template')
    })
}

export function queryDataset (formData, queryDatasetCallback, queryDatasetDefer) {
    axios({
      methods: 'get',
      url: '/dataset/query',
      params: formData,
      timeout: 10000
    })
    .then((res) => {
     	queryDatasetCallback(res.data, queryDatasetDefer)
    })
}

export function queryTemplate (formData, queryTemplateCallback, queryTemplateDefer) {
    axios({
      methods: 'get',
      url: '/template/query',
      params: formData,
      timeout: 10000
    })
    .then((res) => {
     	queryTemplateCallback(res.data, queryTemplateDefer)
    })
}