<template>
  <div class="data-upload">
    <div class="header">
        <span class = "title">Tree Visualization DSL</span>
    </div>
    <div class = "content">
      <el-upload class="upload-demo" 
      action="uploadDataUrl"
      :http-request="upload"
      :before-upload="beforeUpload"
      :show-file-list="false"
      :auto-upload="true"
      :disabled = "disable_upload"
      :file-list = "fileList">
        <el-tooltip v-for="(labelIcon) in labelIconsArray" class='labelIcon' effect="light" :content="labelIcon.desc" :class="{'labelClicked': labelIcon.active, 'non-margin': labelIcon.nonMargin}">
              <i class="icon iconfont" :class="[labelIcon.iconLabel]" @click="clickLabel(labelIcon.text)"></i>
        </el-tooltip>
      </el-upload>
      <span class = "file-desc">
        <span id = "file-name">
            <el-tooltip v-for="(labelIcon) in updateIconsArray" class='labelIcon' effect="light" :content="labelIcon.desc" :class="{'labelClicked': labelIcon.active, 'non-margin': labelIcon.nonMargin}">
                <i class="icon iconfont" :class="[labelIcon.iconLabel]" @click="clickLabel(labelIcon.text)"></i>
            </el-tooltip>
        </span> &nbsp;
      </span>
      <div id = "hierarchical-dsl">
        <span>
          <el-input
            type="textarea"
            autosize
            placeholder="Tree Visualization DSL"
            v-model="hierarchicalDSLStr">
          </el-input>
        </span>
      </div>
    </div>
  </div>
</template>

<script>
  import Vue from 'vue'
  import iconfont from '../assets/font/iconfont'
  import { mapMutations, mapState } from 'vuex'
  import {getHierarchicalDSL} from '@/data-processing/get_hierarchical_dsl.js'

  export default {
    name: 'DataUploadView',
    data() {
      return {
        labelIconsArray: [
          { 'text': 'upload', 'iconLabel': 'icon-upload', 'active': false, 'nonMargin': true, 'desc': 'upload dsl'},
          { 'text': 'save', 'iconLabel': 'icon-save', 'active': false, 'nonMargin': true, 'desc': 'save dsl'}
        ],
        updateIconsArray: [
          { 'text': 'update', 'iconLabel': 'icon-triangle-right', 'active': false, 'nonMargin': true, 'desc': 'update dsl'},
        ],
        fileName: "",
        fileSize: "",
        fileList: [],
        hierarchicalDSLStr: "",
        uploadDataUrl: 'http://127.0.0.1:22068/uploadGraph'
      }
    },
    watch: {
      hierarchicalDSL: function() {
        this.hierarchicalDSLStr = JSON.stringify(this.hierarchicalDSL, null, 1)
        $('#hierarchical-dsl textarea').val(this.hierarchicalDSLStr)
        this.update_text_area_height()
      }
    },
    computed: {
      //  判断当前的icon是否是upload的图标， 如果是upload的图标，那么支持用户上传数据；否则无法弹出上传数据的对话框
      disable_upload: function() {
        var labelIconsArray = this.labelIconsArray
        return (labelIconsArray[0].text !== 'upload')
      },
      ...mapState([
        'currentTree',
        'hierarchicalDSL'
      ])
    }, 
    methods: {
      clickLabel: function(label) {
        if (label === 'update') {
          this.update_tree_dsl()
        } else if (label === 'save') {
          console.log('save current dsl')
        }
      },
      upload: function() {
        let hierarchicalDataHeight = $('#hierarchical-dsl').height()
        $('#hierarchical-dsl textarea').css('min-height', hierarchicalDataHeight + 'px')
      },
      beforeUpload: function() {
        var self = this
        var reader = new FileReader() //新建一个FileReader
        reader.readAsText(file, "UTF-8") //读取文件
        reader.onload = function(evt) { //读取完文件之后会回来这里
          let fileString = evt.target.result // 读取文件内容
          self.hierarchicalDSLStr = fileString
          self.fileSize = d3.format(".3s")(file.size)
          self.fileName = file.name
          self.update_hierarchical_dsl_object()
        }
      },
      //  更新文本框中的数据
      update_hierarchical_dsl_object: function() {
          let self = this
          try {
            var hierarchicalObj = JSON.parse(self.hierarchicalDSLStr)
          } catch(e) {
            return
          }
          self.UPDATE_HIERARCHICAL_DSL(hierarchicalObj)       
      },
      update_text_area_height: function () {
        let hierarchicalDSLHeight = $('#hierarchical-dsl').height() - 2
        $('#hierarchical-dsl textarea').css('min-height', hierarchicalDSLHeight + 'px')
      },
      //  更新树的DSL
      update_tree_dsl: function () {
        let fileString = $('#hierarchical-dsl textarea').val()
        this.hierarchicalDSLStr = fileString
        this.update_hierarchical_dsl_object()
      },
      //  使用mapMutation将数组中的mutation与其他的方法结合到一起
      ...mapMutations([
        'UPDATE_HIERARCHICAL_DSL'
      ]),
    },
    props: {
      msg: String
    }
  }
</script>

<style lang="less" scoped>
  @padding-left: 0.5rem;
  @padding-right: 0.5rem;
  @padding-top: 0.5rem;
  @padding-bottom: 0.5rem;
  @header-height: 2rem;
  @labelIcon-marginLeft: 1rem;
  @font-size: 1.2rem;
  .data-upload {
    .header {
      position: absolute;
      top: @padding-top;
      height: @header-height;
      left: @padding-left;
      right: @padding-right;
      background-color: rgba(200, 200, 200, 0.5);
      text-align: center;
      font-size: @font-size;
      .title {
        line-height: 2rem;
      }
    }
    .content {
      position: absolute;
      top:  @header-height + @padding-top + @padding-top; 
      // 存在两个padding-top, header上存在一个padding-top， 另外header下方存在padding-top
      bottom: @padding-bottom;
      left: @padding-left;
      right: @padding-right;
      .file-desc {
        position: absolute;
        top: 0.01rem;
        right: @padding-right;
        font-style: italic;
      }
      .upload-demo {
        text-align: left;
      }
      #hierarchical-dsl {
        position: absolute;
        top: 2rem;
        left: 0%;
        right: 0%;
        bottom: 0%;
        overflow-y: auto;
        font-size: 1.2rem;
      }
    }
  }
  .labelIcon {
    margin-left: @labelIcon-marginLeft;
    font-size: @font-size;
    padding: 0.1rem;
    border-bottom: 0.2rem solid #ddd;
    cursor: pointer;
  }
  .labelClicked {
    border-bottom: 0.2rem solid steelblue !important;
  }
  .non-margin {
    margin-left: 0.1rem !important;
  }  
</style>