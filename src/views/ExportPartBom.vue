<template>
    <VxeGrid ref="partBomGrid" v-bind="options" />
    <vxe-button class="button" status="success" content="导出PartBom" @click="ExportPartBomClickEvent" :loading="buttonLoading"></vxe-button>
</template>
<script setup lang="ts">
import { VxeGrid,VxeGridProps } from "vxe-table";
import { reactive,onMounted,ref,watchEffect } from "vue";
import { useRoute } from 'vue-router';


import {getPartPropertyList,getTableHeight,ExportPartBom} from "@/hooks/ExportPartBomHooks";
// 获取表格数据
const {PartPropertyData} = getPartPropertyList();
// 计算表格高度
const {tableHeight} = getTableHeight();

// 下载事件
let partId : string;
const buttonLoading = ref(false);
const ExportPartBomClickEvent = async() =>{
    if (options.data) {
        buttonLoading.value = true;
        await ExportPartBom(options.data,partId);
        buttonLoading.value = false;
    }
}

const options = reactive({
    height:0,
    border: true,
    size: "mini",
    emptyText: "加载中...",
    rowConfig:{
        isHover:true,
    },
    columnConfig:{
        useKey:true,
    },
    checkboxConfig:{
        strict:true,
        checkField:"isExport",
        trigger:"row",
    },
    data: PartPropertyData,
    columns: [
        {type: "seq", width: 60, align: "center", headerAlign: "center"},
        {type: "checkbox", width: 60, align: "center", headerAlign: "center"},
        {field: "label", title: "属性", align: "center", headerAlign: "center"},
        {field: "name", title: "Name", width: 80, align: "left", headerAlign: "center",visible:false},
        {field: "isExport", title: "Export", width: 80, align: "left", headerAlign: "center",visible:false},
    ]
} as VxeGridProps);

//增加一个监听，当header变化时，重新计算表格高度
watchEffect(() => {
    options.height = tableHeight.value;
})

onMounted(() => {
    // 获取partId
    const route  = useRoute();
    partId = route.query.partId?.toString() ?? "";
    
})
</script>
<style scoped>
    *{
        height: 100%;
        box-sizing: border-box;
    }
    .button{
        margin-top: 10px;
    }
</style>