<template>
    <vxe-grid ref="xGrid" v-bind="gridOptions" v-on="gridEvents">
        <template #dragBtn>
            <span class="drag-btn">
                <i class="vxe-icon-sort"></i>
            </span>
        </template>
        <template #dragTip>
            <vxe-tooltip v-model="showHelpTip.showDraggableHelpTip" content="按住后可以上下拖动排序！" enterable>
                <i class="vxe-icon-question-circle-fill" @click="showHelpTip.showDraggableHelpTip = !showHelpTip.showDraggableHelpTip"></i>
            </vxe-tooltip>
        </template>
    </vxe-grid>
</template>

<script lang="ts" setup>

import { reactive, ref , watch ,onUnmounted, nextTick, onMounted } from 'vue'
import { VXETable, VxeGridInstance, VxeGridProps, VxeGridEvents } from 'vxe-table'
import XEUtils from 'xe-utils'
import axios from '@/common/ArasHttp'
import Sortable from 'sortablejs'
import ArasUtil from '@/common/ArasUtil'
// import '../mocks/CraftColumns'
// import '../mocks/InitCraftTableData';

// 表格配置
const gridOtherOptions = {
    formData:{
        formId:''
    },
    treeConfig: {
        treeNode: 'hs_name',
    },
    editConfig: {
        canEditName:["hs_quantity"]
    },
}
const gridOptions = reactive({
    border: true,
    class: 'sortable-tree-demo',
    id:'id',
    showOverflow: true,
    rowConfig: {
        useKey: true,
        isHover: true,
        isCurrent: true,
    },
    columnConfig: {
        resizable: true
    },
    scrollY: {
        enabled: false
    },
    editConfig: {
        trigger: 'click',
        mode: 'cell',
    },
    toolbarConfig: {
        buttons:[
            
                { code : 'expandEvent', name : '全部展开' },
                { code : 'collapseEvent', name : '全部收起' },
                { code : 'getDiffEvent', name : '检查责信度' },
            
        ],
        perfect : true,
        refresh: {
            icon: 'vxe-icon-refresh',
            iconLoading: 'vxe-icon-refresh roll',
            queryMethod: () => {
                getData()
            }
        },
    },
    menuConfig:{
        enabled: true,
        body: {
           options:[
            [
                //单选操作
                { code: 'addEvent', name: '插入工艺虚拟件', visible: true, disabled: false },
                { code: 'splitEvent', name: '拆分零件', visible: true, disabled: false },
                { code: 'newProcessCardEvent', name: '新建工艺过程卡', visible: true, disabled: false },
                { code: 'viewProcessCardEvent', name: '查看工艺过程卡', visible: true, disabled: false },
            
                { code: 'deleteEvent', name: '删除行', prefixIcon: 'vxe-icon-delete', visible: true, disabled: false },
            
           ]
        ]}
    },
    treeConfig: {
        childrenField: 'children',
        rowField: 'hs_name',
    },
    radioConfig: {
        trigger: 'row',
        highlight: true
    },
    columns: [],
    data: [],
} as VxeGridProps)




//表格变化时,生成json放入全局变量中
declare global{
    interface Window {
        globalMBomRow: any;
        thisItem: any;
    }
}


watch(() => gridOptions.data,() => {
  if (parent?.thisItem) {
    parent.thisItem.setProperty("hs_mbom",JSON.stringify(gridOptions.data))
  }
}, { deep: true });




// 表格拖拽
const xGrid = ref({} as VxeGridInstance)

const showHelpTip = reactive({
    showDraggableHelpTip: false
})
// SortableJs拖拽
let sortable: any
const treeDrop = () => {
    const $grid = xGrid.value
    sortable = Sortable.create($grid.$el.querySelector('.body--wrapper>.vxe-table--body tbody') as HTMLElement, {
        handle: '.drag-btn',
        onEnd: (sortableEvent: any) => {
            //获取鼠标最后的位置
            const mousePositionX = sortableEvent.originalEvent.clientX
            const mousePosition = sortableEvent.originalEvent.clientY

            // 获取鼠标所在的元素
            const elementUnderMouse = document.elementFromPoint(mousePositionX, mousePosition)

            // 获取元素在表格中的列索引
            let columnIndex = -1
            if (elementUnderMouse) {
                const cellElement = elementUnderMouse.closest('td')
                if (cellElement) {
                    columnIndex = cellElement.cellIndex
                }
            }

            const options = { children: 'children' }
            //新位置dom
            const targetTrElem = sortableEvent.item
            //新位置的父dom
            const wrapperElem = targetTrElem.parentNode as HTMLElement
            


            // //新位置的index,判断是向上移动还是向下移动, 向上移动取上一个dom, 向下移动取下一个dom
            // const newIndex = sortableEvent.newIndex as number
            //旧的位置的index
            const oldIndex = sortableEvent.oldIndex as number

            //向下移动
            var prevTrElem = targetTrElem.previousElementSibling as HTMLElement
            // if (newIndex < oldIndex) {
            //     //向上移动
            //     prevTrElem = targetTrElem.nextElementSibling as HTMLElement
            // }

   

            //表格数据
            const tableTreeData = gridOptions.data as any[]

            //新位置的node
            const targetRowNode = $grid.getRowNode(targetTrElem)

            // 新位置的node为空时，
            if (!targetRowNode) {
                return
            }

            // 新位置的行信息
            const selfRow = targetRowNode.item

            // 新位置的node（全）
            const selfNode = XEUtils.findTree(tableTreeData, row => row === selfRow, options)
            
            if (prevTrElem) {
                // 移动到节点
                const prevRowNode = $grid.getRowNode(prevTrElem)
                if (!prevRowNode) {
                    return
                }
                // 旧位置的行信息
                const prevRow = prevRowNode.item
                // 旧位置的node（全）
                const prevNode = XEUtils.findTree(tableTreeData, row => row === prevRow, options)

                if (XEUtils.findTree(selfRow[options.children], row => prevRow === row, options)) {
                    // 错误的移动
                    const oldTrElem = wrapperElem.children[oldIndex]
                    wrapperElem.insertBefore(targetTrElem, oldTrElem)
                    return VXETable.modal.message({ content: '不允许自己给自己拖动！', status: 'error' })
                }
                const currRow = selfNode.items.splice(selfNode.index, 1)[0]

                let toChild = false;
                if ((prevRow[options.children] && prevRow[options.children].length > 0 && $grid.isTreeExpandByRow(prevRow)&& columnIndex!==0)||(prevRow[options.children] && prevRow[options.children].length === 0 && columnIndex!==0 ) ) {
                    toChild = true;
                }


                if (toChild) {
                    prevRow[options.children].splice(0, 0, currRow);
                    //移动后判断父阶是否展开, 未展开则展开
                    // if (!$grid.isTreeExpandByRow(prevRow)) {
                    //     $grid.setTreeExpand(prevRow, true);
                    // }
                } else {
                    // 移动到相邻节点
                    prevNode.items.splice(prevNode.index + (selfNode.index < prevNode.index ? 0 : 1), 0, currRow)
                }
            } else {
                // 移动到第一行
                const currRow = selfNode.items.splice(selfNode.index, 1)[0]
                tableTreeData.unshift(currRow)
            }
            // 如果变动了树层级，需要刷新数据
            gridOptions.data = [...tableTreeData]
        }
    })
}



//表格事件
const toolbarButtonClickEvent: VxeGridEvents.ToolbarButtonClick = ({$grid,code}) => {
    buttonEvent($grid,code);
}

const menuClickEvent: VxeGridEvents.MenuClick = ({$grid,menu})=>{
    buttonEvent($grid,menu.code);
    
}

const buttonEvent = ($grid : any,code: any) =>{
    console.log(code);
    if(code === 'addEvent'){
        //新增虚拟件
        console.log('插入工艺虚拟件')
        $grid.insert({ id:"123123" ,name: 'xxx'})
    }else if(code === 'splitEvent'){
        //获取当前选中的行
        const selectedRow = $grid.getRadioRecord()
        if (!selectedRow) {
            return VXETable.modal.message({ content: '请选择要拆分的零件！', status: 'error' })
        }
        //判断当前行的数量是否大于1
        if (selectedRow.hs_quantity <= 1) {
            return VXETable.modal.message({ content: '当前零件数量小于等于1,不允许拆分!', status: 'error' })
        }
        //创建一个新行，数量为1
        //深拷贝selectedRow对象
        const record = {...selectedRow}
        record._X_ROW_KEY = null;
        console.log(selectedRow);
        console.log(record);
        // const { row: newRow } =  $grid.insertNextAt(record, selectedRow)
        //  $grid.setEditRow(newRow)


    }else if(code === 'getDiffEvent'){
        console.log('检查责信度')

    }else if(code === 'deleteEvent'){
        if ($grid) {
            const row = $grid.getRadioRecord()
            $grid.remove(row)
        }
    }else if(code === 'saveEvent'){
        console.log('保存')

    }else if(code === 'cancelEvent'){
        console.log('取消')

    }else if(code === 'expandEvent'){
        if ($grid) {
            $grid.setAllTreeExpand(true)
        }
    }else if(code === 'collapseEvent'){
        if ($grid) {
            $grid.clearTreeExpand(true)
        }
    }else if(code === 'newProcessCardEvent'){
        console.log('新建工艺过程卡')
        
    }else if(code === 'viewProcessCardEvent'){
        console.log('查看工艺过程卡')
        
    }
}

 //右键菜单时，选中改行
const cellMenuEvent: VxeGridEvents.CellMenu = ({$grid,row})=>{
    $grid.setRadioRow(row);
}


//获取数据
const getColums = () => {
    axios.post('/ProcessMBom/GetColumns'
    ).then((res: any) => {
        if (!res.data?.result) {
            return;
        }
        //添加单选按钮
        res.data.result.unshift({ title: '', type: 'radio', width: 60, align: 'center' })
        //添加序号列
        res.data.result.unshift({ title: '序号', type: 'seq', width: 60, align: 'center' })
        //添加拖动按钮
        res.data.result.unshift({ title: '', width: 60, align: 'center', slots: { default: 'dragBtn', header: 'dragTip' } })
        //添加树形结构
        res.data.result.find((item: any) => item.field === gridOtherOptions.treeConfig?.treeNode).treeNode = true;
        //添加可编辑列
        res.data.result.forEach((item: any) => {
            for(let cell in gridOtherOptions.editConfig.canEditName){
                if(item.field === gridOtherOptions.editConfig.canEditName[cell]){
                    item.editRender = {
                        name: 'input'
                    }
                }
            }
        })
        
        //获取到数据后，加载到表格中
        gridOptions.columns = res.data.result;
    }).catch((err: any) => {
        console.log(err);
    })
}

const getInitData = () => {
    axios.post('/ProcessMBom/GetInitData', 
        {
            id: gridOtherOptions.formData.formId
        }
    ).then((res: any) => {
        console.log("GetInitData",res);
        if (!res.data?.result) {
            return;
        }
        //获取到数据后，加载到表格中
        gridOptions.data = res.data.result;
    }).catch((err: any) => {
        console.log(err);
    })
}

const getData = () => {
    axios.post('/ProcessMBom/GetData', 
        {
            id: gridOtherOptions.formData.formId
        }
    ).then((res: any) => {
        console.log("GetData",res);
        if (!res.data?.result) {
            return;
        }
        if (res.data.code === 0) {
            gridOptions.data = res.data.result;
            if (res.data.result.length === 0) {
                console.log("未获取到MBom数据");
                getInitData()
            }
        }
        
    }).catch((err: any) => {
        console.log(err);
    })
}


//方法
//将树形结构的数据转换成一维数组对象, 并赋予层级level
const treeToArr = (treeData: any,level = 0) => {
    let arr: any[] = [];
    treeData.forEach((item: any) => {
        item.level =level
        arr.push(item);
        if (item.children && item.children.length > 0) {
            arr = arr.concat(treeToArr(item.children,++level));
        }
    })
    return arr;
}




const gridEvents = {
    toolbarButtonClick: toolbarButtonClickEvent,
    menuClick: menuClickEvent,
    cellMenu: cellMenuEvent
}

//生命周期
onMounted(() => {
    //获取表单数据
    gridOtherOptions.formData = ArasUtil.getFormData()
    //获取表格列    
    getColums()
    //获取该id的所有MBom数据
    getData()
    
})

let initTime: any
nextTick(() => {
    // 加载完成之后在绑定拖动事件
    initTime = setTimeout(() => {
        treeDrop()
    }, 500)
})

onUnmounted(() => {
    clearTimeout(initTime)
    if (sortable) {
        sortable.destroy()
    }
})

</script>
<style scoped>
.sortable-tree-demo .drag-btn {
    cursor: move;
    font-size: 12px;
}
.toolbar {
    margin: 20%;
}

.sortable-tree-demo .vxe-body--row.sortable-ghost,
.sortable-tree-demo .vxe-body--row.sortable-chosen {
    background-color: #dfecfb;
}

</style>