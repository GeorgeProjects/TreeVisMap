<template>
    <div id="polarPara">
        <el-row type="flex" align="middle" justify="space-around">
            <el-col :span="1"></el-col>
            <el-col :span="6" class="panel_para">
                <span>start</span>
            </el-col>
            <el-col :span="1"></el-col>
            <el-col :span="15" class="panel_control">
                <el-slider
                     @input="changeDSL__"
                     @change="changeCanvas"
                    v-model="StartAngle"/>
            </el-col>
            <el-col :span="1"></el-col>
        </el-row>
        
        
        <el-row type="flex" align="middle" justify="space-around">
            <el-col :span="1"></el-col>
            <el-col :span="6" class="panel_para">
                <span>central</span>
            </el-col>
            <el-col :span="1"></el-col>
            <el-col :span="15" class="panel_control">
                <el-slider
                     @input="changeDSL__"
                     @change="changeCanvas"
                    v-model="CentralAngle"/>
            </el-col>
            <el-col :span="1"></el-col>
        </el-row>
        
        <el-row type="flex" align="middle" justify="space-around">
            <el-col :span="1"></el-col>
            <el-col :span="6" class="panel_para">
                <span>inner r</span>
            </el-col>
            <el-col :span="1"></el-col>
            <el-col :span="15" class="panel_control">
                <el-slider
                    @input="changeDSL__"
                    @change="changeCanvas"
                    v-model="InnerRadius"/>
            </el-col>
            <el-col :span="1"></el-col>
        </el-row>

        <el-row type="flex" align="middle" justify="space-around">
            <el-col :span="1"></el-col>
            <el-col :span="6" class="panel_para">
                <span>direction</span>
            </el-col>
            <el-col :span="1"></el-col>
            <el-col :span="15" class="panel_control">
                <el-select v-model="Direction" size="mini" @change="changeDSL_">
                    <el-option
                        v-for="item in DirectionOptions"
                        :key="item"
                        :label="item"
                        :value="item"/>
                </el-select>
            </el-col>
            <el-col :span="1"></el-col>
        </el-row>

        <el-row type="flex" align="middle" justify="space-around">
            <el-col :span="1"></el-col>
            <el-col :span="6" class="panel_para">
                <span>polar axis</span>
            </el-col>
            <el-col :span="1"></el-col>
            <el-col :span="15" class="panel_control">
                <el-select v-model="PolarAxis" size="mini" @change="changeDSL_">
                    <el-option
                        v-for="item in PolarAxisOptions"
                        :key="item"
                        :label="item"
                        :value="item"/>
                </el-select>
            </el-col>
            <el-col :span="1"></el-col>
        </el-row>
        <el-row type="flex" align="middle" justify="space-around" class="outer-row">
            <el-col :span="1"></el-col>
            <el-col :span="6" class="panel_para">
                <span>center</span>
            </el-col>
            <el-col :span="1"></el-col>
            <el-col :span="15">
                <el-radio-group v-model="PolarAxisPara" @change="changeDSL_" size="mini">
                  <el-radio-button :label="PolarAxis==='x-axis'?'left':'top'"/>
                  <el-radio-button :label="PolarAxis==='x-axis'?'right':'bottom'"/>
                </el-radio-group>
            </el-col>
            <el-col :span="1"></el-col>
        </el-row>
    </div>
</template>

<script>
export default {
    name: "polar-para",
    props: {
        CoordDsl: Object,
        changeDSL: Function,
        changeCanvas: Function
    },
    data() {
        return {
            DirectionOptions: [
                'clockwise',
                'anticlockwise'
            ],
            PolarAxisOptions: [
                'y-axis',
                'x-axis'
            ],
            CentralAngle: 100,
            StartAngle: 0,
            InnerRadius: 0,
            CenterPara: 0,
            Direction: '',
            PolarAxis: '',
            PolarAxisPara: 'top'
        }
    },
    mounted: function() {
        // console.log('polar-para', this.CoordDsl)
    },
    created: function () {
        if (!('Direction' in this.CoordDsl)) {
            this.CoordDsl.Direction = this.DirectionOptions[0]
            this.Direction = this.DirectionOptions[0]
        } else {
            this.Direction = this.CoordDsl.Direction
        }
        if (!('CentralAngle' in this.CoordDsl)) {
            this.CoordDsl.CentralAngle = 1
            this.CentralAngle = Math.floor(this.CoordDsl.CentralAngle * 100)
        } else {
            this.CentralAngle = this.CoordDsl.CentralAngle * 100
        }
        if (!('StartAngle' in this.CoordDsl)) {
            this.CoordDsl.StartAngle = 1
            this.StartAngle = Math.floor(this.CoordDsl.StartAngle * 100)
        } else {
            this.StartAngle = this.CoordDsl.StartAngle * 100
        }
        if (!('InnerRadius' in this.CoordDsl)) {
            this.CoordDsl.InnerRadius = 1
            this.InnerRadius = Math.floor(this.CoordDsl.InnerRadius * 100)
        } else {
            this.InnerRadius = this.CoordDsl.InnerRadius * 100
        }
        if (!('PolarAxis' in this.CoordDsl)) {
            this.CoordDsl.PolarAxis = this.PolarAxisOptions[0]
        } else {
            this.PolarAxis = this.CoordDsl.PolarAxis
        }
        if (!('PolarCenter' in this.CoordDsl)) {
            this.CoordDsl.PolarCenter = this.PolarAxisPara
        } else {
            this.PolarAxisPara = this.CoordDsl.PolarCenter
        } 
    },
    methods: {
        changeDSL_: function () {
            this.CoordDsl.PolarAxis = this.PolarAxis
            this.CoordDsl.PolarCenter = this.PolarAxisPara
            this.CoordDsl.Direction = this.Direction
            console.log('this.PolarAxis', this.PolarAxis, 'this.PolarAxisPara', this.PolarAxisPara)
            if (this.PolarAxis === 'x-axis' && (this.PolarAxisPara === 'top' || this.PolarAxisPara === 'bottom')) {
                this.CoordDsl.PolarCenter = 'left'
                this.PolarAxisPara = 'left'
            }
            if (this.PolarAxis === 'y-axis' && (this.PolarAxisPara === 'left' || this.PolarAxisPara === 'right')) {
                this.CoordDsl.PolarCenter = 'top'
                this.PolarAxisPara = 'top'
            }
            console.log('this.CoordDsl', this.CoordDsl)
            this.changeDSL()
            this.changeCanvas()
        },
        changeDSL__() {
            this.CoordDsl.CentralAngle = this.CentralAngle / 100.0
            this.CoordDsl.StartAngle = this.StartAngle / 100.0
            this.CoordDsl.InnerRadius = this.InnerRadius / 100.0
            this.changeDSL()
        }
    }
}
</script>
<style lang="less">
    #polarPara {
        .el-row {
            margin-bottom: 5px;
        }
    }
    .el-input--mini .el-input__inner {
        height: 22px !important;
        line-height: 22px !important;
    }
    .el-input--mini .el-input__icon {
        line-height: 22px !important;
    }
    .el-select-dropdown__item {
        height: 20px !important;
        line-height: 20px !important;
        font-size: 10px !important;
    }
    .el-slider__button {
        width: 12px !important;
        height: 12px !important;
    }
    .el-slider__runway {
        margin: 8px 0 !important;
    }
</style>
<style scoped>
.panel_para {
	/* background: antiquewhite;
	border: 1px solid rgb(148, 144, 144);
	border-radius: 0.2rem; */
    font-size: 0.8rem;
    vertical-align: middle;
    line-height: 1.2rem;
    height: 1rem;
}

/* .panel_control {
    height: 2rem;
	background: antiquewhite;
	border: 1px solid rgb(148, 144, 144);
	border-radius: 0.2rem;
} */

</style>