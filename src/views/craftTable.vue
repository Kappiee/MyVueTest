<template>
    <vxe-grid ref="xGrid" v-bind="gridOptions" v-on="gridEvents">
        <template #dragBtn>
            <span class="drag-btn">
                <i class="vxe-icon-sort"></i>
            </span>
        </template>
        <template #dragTip>
            <vxe-tooltip v-model="demo2.showHelpTip" content="按住后可以上下拖动排序！" enterable>
                <i class="vxe-icon-question-circle-fill" @click="demo2.showHelpTip = !demo2.showHelpTip"></i>
            </vxe-tooltip>
        </template>
    </vxe-grid>
</template>

<script lang="ts" setup>

import { reactive, ref, onUnmounted, nextTick } from 'vue'
import { VXETable, VxeGridInstance, VxeGridProps,VxeTableEvents,VxeGridEvents } from 'vxe-table'
import XEUtils from 'xe-utils'
import Sortable from 'sortablejs'

const demo2 = reactive({
    showHelpTip: false
})

const xGrid = ref({} as VxeGridInstance)


const gridOptions = reactive({
    border: true,
    class: 'sortable-tree-demo',
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
        trigger: 'dblclick',
        mode: 'cell',
    },
    toolbarConfig: {
        buttons:[
            
                { code : 'expandEvent', name : '全部展开' },
                { code : 'collapseEvent', name : '全部收起' },
                { code : 'getDiffEvent', name : '检查责信度' },
                { code : 'saveEvent', name : '保存' },
            
        ],
        perfect : true,
        refresh: {
            icon: 'vxe-icon-refresh',
            iconLoading: 'vxe-icon-refresh roll'
        }, 
        zoom: {
            iconIn: 'vxe-icon-fullscreen',
            iconOut: 'vxe-icon-minimize'
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
        childrenField: 'children'
    },
    radioConfig: {
        trigger: 'row',
        highlight: true
    },
    columns: [
        { title: '', width: 60, slots: { default: 'dragBtn', header: 'dragTip' } },
        { title: '', type: 'radio', width: 60, align: 'center' },
        { title: 'Name', field: 'name', treeNode: true },
        { title: 'Size', field: 'size' },
        { title: 'Count', field: 'count',editRender: { name: 'input' } },
        { title: 'Type', field: 'type' },
        { title: 'Date', field: 'date' }
    ],
    data: [
        { id: 1000, name: 'test abc1', type: 'mp3', size: 1024, count: 2, date: '2020-08-01' , children: []},
        {
            id: 1005,
            name: 'Test2',
            type: 'mp4',
            size: 25, 
            count: 2,
            date: '2021-04-01',
            children: [
                { id: 24300, name: 'Test3', type: 'avi', size: 1024, count: 2, date: '2020-03-01', children: [] },
                { id: 20045, name: 'test abc4', type: 'html', size: 600, count: 2, date: '2021-04-01' , children: []},
                {
                    id: 10053,
                    name: 'test abc96',
                    type: 'avi',
                    size: 25, 
                    count: 2,
                    date: '2021-04-01',
                    children: [
                        { id: 24330, name: 'test abc5', type: 'txt', size: 25, count: 2, date: '2021-10-01', children: [] },
                        { id: 21011, name: 'Test6', type: 'pdf', size: 512, count: 2, date: '2020-01-01', children: [] },
                        { id: 22200, name: 'Test7', type: 'js', size: 1024, count: 2, date: '2021-06-01', children: [] }
                    ]
                }
            ]
        },
        { id: 23666, name: 'Test8', type: 'xlsx', size: 2048, count: 2, date: '2020-11-01', children: [] },
        { id: 24555, name: 'test abc9', type: 'avi', size: 224, count: 2, date: '2020-10-01', children: [] }
    ]
} as VxeGridProps)

let sortable: any

const treeDrop = () => {
    const $grid = xGrid.value
    sortable = Sortable.create($grid.$el.querySelector('.body--wrapper>.vxe-table--body tbody') as HTMLElement, {
        handle: '.drag-btn',
        onEnd: (sortableEvent: any) => {
            //获得目标行的列的index
            const targetIndex = sortableEvent.newIndex as number
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
            //旧位置的dom
            const prevTrElem = targetTrElem.previousElementSibling as HTMLElement

            //表格数据
            const tableTreeData = gridOptions.data as any[]

            //新位置的node
            const targetRowNode = $grid.getRowNode(targetTrElem)


            //旧的位置的index
            const oldIndex = sortableEvent.oldIndex as number

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
                if ((prevRow[options.children] && prevRow[options.children].length > 0 && $grid.isTreeExpandByRow(prevRow))||(prevRow[options.children] && prevRow[options.children].length === 0 && columnIndex!==0 ) ) {
                    toChild = true;
                }


                if (toChild) {
                    prevRow[options.children].splice(0, 0, currRow);
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


const toolbarButtonClickEvent: VxeGridEvents.ToolbarButtonClick = ({$grid,code}) => {
    buttonEvent($grid,code);
}

const menuClickEvent: VxeGridEvents.MenuClick = ({$grid,code})=>{
    buttonEvent($grid,code);
}

const buttonEvent = ($grid : any,code: string) =>{
    console.log($grid);
    if(code === 'addEvent'){
        //新增虚拟件
        console.log('插入工艺虚拟件')
        $grid.insert({ id:"123123" ,name: 'xxx'})
    }else if(code === 'splitEvent'){
        console.log('拆分零件')

    }else if(code === 'getDiffEvent'){
        console.log('检查责信度')

    }else if(code === 'deleteEvent'){
        console.log('删除零件')

    }else if(code === 'saveEvent'){
        console.log('保存')

    }else if(code === 'cancelEvent'){
        console.log('取消')

    }else if(code === 'expandEvent'){
        console.log('全部展开')
        
    }else if(code === 'collapseEvent'){
        console.log('全部收起')
        
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

const gridEvents ={
    toolbarButtonClick: toolbarButtonClickEvent,
    menuClick: menuClickEvent,
    cellMenu: cellMenuEvent
}
    

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