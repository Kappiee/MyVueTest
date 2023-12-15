<template>
   
        <div>
            <vxe-modal v-model="openDiffButtun" width="600" v-bind="diffGridModel" show-footer >
                <template #default>
                    <vxe-grid
                    v-bind="diffGridOptions">
                    </vxe-grid>
                </template>
            </vxe-modal>
        </div>

        <vxe-grid ref="xGrid" v-bind="gridOptions" v-on="gridEvents">
            <template #dragBtn>
                <span class="drag-btn">
                    <i class="vxe-icon-sort"></i>
                </span>
            </template>
            <template #dragTip>
                <vxe-tooltip v-model="showHelpTip.showDraggableHelpTip" content="按住后可以上下拖动排序！" enterable>
                    <i class="vxe-icon-question-circle-fill"
                        @click="showHelpTip.showDraggableHelpTip = !showHelpTip.showDraggableHelpTip"></i>
                </vxe-tooltip>
            </template>
        </vxe-grid>
</template>

<script lang="ts" setup>

import { reactive, ref, watch, onUnmounted, nextTick, onMounted } from 'vue'
import { VXETable, VxeGridInstance, VxeGridProps, VxeGridEvents, VxeTableDataRow, VxeModalDefines, VxeColumnPropTypes, config } from 'vxe-table'
import XEUtils from 'xe-utils'
import axios from '@/common/ArasHttp'
import Sortable from 'sortablejs'
import ArasUtil from '@/common/ArasUtil'
import ArasMethod from '@/common/ArasMethod'
// import {tableHeightMixin} from '@/mixin/tableHeightMixin'

// import '../mocks/CraftColumns'
// import '../mocks/InitCraftTableData';


// #region 主表格配置与方法

// 表格配置
const gridOtherOptions = {
    formData: {
        formId: ''
    },
    treeConfig: {
        treeNode: 'hs_name',
    },
    editConfig: {
        canEditName: ["hs_quantity", "hs_name"]
    },
    tableInitData:[] as VxeTableDataRow[] ,
}
const gridOptions = reactive({
    loading: true,
    border: true,
    class: 'sortable-tree-demo',
    height: 500,
    size: 'mini',
    id: 'id',
    showOverflow: true,
    loadingConfig: {
        spinner: 'vxe-icon-loading',
        tip: '加载中...',
    },
    rowConfig: {
        useKey: true,
        isHover: true,
        isCurrent: true,
    },
    columnConfig: {
        useKey: true,
        resizable: true
    },
    scrollY: {
        enabled: false
    },
    editConfig: {
        trigger: 'click',
        mode: 'cell',
    },
    editRules: {
        hs_quantity: [
            { required: true, type:'number', message: '数量不能为空', trigger: 'blur' },
            { pattern: /^[1-9]\d*$/, message: '数量必须为正整数', trigger: 'blur' }
        ],
        hs_name: [
            { required: true, message: '名称不能为空', trigger: 'blur' },
            //如果改行是虚拟件，才能进行更改
            // { validator: (event) => {
            //     let cellValueCopy = event.cellValue;
            //     let isProcessVirtualPart = event.row.hs_type === '工艺虚拟件';
            //     if (isProcessVirtualPart === false) {
            //         event.cellValue = event.row.hs_name;
            //     }
            //     console.log("rule", event);
            //     // if (selectedRow?.hs_type != '工艺虚拟件') {
            //     //     return
            //     // }
            // }, trigger: 'blur' }
        ],
    },
    toolbarConfig: {
        buttons: [
            { code: 'expandEvent', name: '全部展开' },
            { code: 'collapseEvent', name: '全部收起' },
            { code: 'getDiffEvent', name: '检查责信度' },
        ],
        perfect: true,
        refresh: {
            icon: 'vxe-icon-refresh',
            iconLoading: 'vxe-icon-refresh roll',
            queryMethod: () => {
                //获取表单数据
                gridOtherOptions.formData = ArasUtil.getFormData()
                //获取表格列    
                getColums()
                //获取该id的所有MBom数据
                getData()
                gridOptions.loading = false;

                //获取原始零件和数量
                GetOriPartAndNumber()
            }
        }
    },
    menuConfig: {
        enabled: true,
        body: {
            options: [
                [
                    //单选操作
                    { code: 'addEvent', name: '插入工艺虚拟件', visible: true, disabled: false },
                    { code: 'splitEvent', name: '拆分零件', visible: true, disabled: false },
                    { code: 'newProcessCardEvent', name: '新建工艺过程卡', visible: true, disabled: false },
                    { code: 'viewProcessCardEvent', name: '查看工艺过程卡', visible: true, disabled: false },

                    { code: 'deleteEvent', name: '删除行', prefixIcon: 'vxe-icon-delete', visible: true, disabled: false },
                ]
            ]
        }
    },
    treeConfig: {
        parentField: 'parentId',
        rowField: 'id',
        transform: true,
    },
    radioConfig: {
        trigger: 'row',
        highlight: true
    },
    columns: [],
    data: [],
} as VxeGridProps)

//设置高度
const setHeight = () => {
    const totalHeight = document.documentElement.clientHeight;
    if (document.querySelector('.vxe-toolbar') != null) {
        const toolbarElement = document.querySelector('.vxe-toolbar');
        const toobarHeight = toolbarElement ? toolbarElement.clientHeight + 15 : 0;
        gridOptions.height = totalHeight - toobarHeight
        diffGridModel.height = (totalHeight - toobarHeight)*2/3
    }
}


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
                if ((prevRow[options.children] && prevRow[options.children].length > 0 && $grid.isTreeExpandByRow(prevRow) && columnIndex !== 0) || (prevRow[options.children] && prevRow[options.children].length === 0 && columnIndex !== 0)) {
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
const toolbarButtonClickEvent: VxeGridEvents.ToolbarButtonClick = ({ $grid, code }) => {
    buttonEvent($grid, code);
}

const menuClickEvent: VxeGridEvents.MenuClick = ({ $grid, menu }) => {
    let code = menu.code;
    buttonEvent($grid, code === void 0?"":code);

}

const buttonEvent = ($grid: any, code: string) => {
    console.log(code);
    if (code === 'addEvent') {
        //新增虚拟件
        //获取当前选中的行
        const selectedRow = $grid.getRadioRecord()
        //创建一个新行，数量为1
        const newRecordRow = {
                hs_name: "虚拟件名称",
                hs_number: "编号自动生成",
                hs_quantity: 1,
                hs_type: "工艺虚拟件",
                id: getGuID(),
                parentId: selectedRow?.parentId,
                sortOrder: selectedRow?.sortOrder,
            }
        //操作data表格，将新行插入到当前行的下方
        $grid.insertNextAt(newRecordRow, selectedRow)


    } else if (code === 'splitEvent') {
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
        const copyRow: any = (selectedRow: any) => {
            return {
                hs_createdby: selectedRow?.hs_createdby,
                hs_createdon: selectedRow?.hs_createdon,
                hs_generation: selectedRow?.hs_generation,
                hs_name: selectedRow?.hs_name,
                hs_number: selectedRow?.hs_number,
                hs_process_card: selectedRow?.hs_process_card,
                hs_quantity: 1,
                hs_state: selectedRow?.hs_state,
                hs_type: selectedRow?.hs_type,
                hs_unit: selectedRow?.hs_unit,
                hs_version: selectedRow?.hs_version,
                id: selectedRow?.id,
                parentId: selectedRow?.parentId,
                partId: selectedRow?.partId,
                sortOrder: selectedRow?.sortOrder,
            }

        }
        const newRecordRow = copyRow(selectedRow)
        selectedRow.hs_quantity = selectedRow.hs_quantity - 1;
        //操作data表格，将新行插入到当前行的下方
        $grid.insertNextAt(newRecordRow, selectedRow)



    } else if (code === 'getDiffEvent') {
        getDiffEvent()
    } else if (code === 'deleteEvent') {
        if ($grid) {
            $grid.removeRadioRow()
        }
    } else if (code === 'expandEvent') {
        if ($grid) {
            $grid.setAllTreeExpand(true)
        }
    } else if (code === 'collapseEvent') {
        if ($grid) {
            $grid.clearTreeExpand(true)
        }
    } else if (code === 'newProcessCardEvent') {
        const rwo = $grid.getRadioRecord()
        var param = {
            aras:top?.aras,
            itemtypeName: "hs_process_card",
            multiselect: false,
            callback:function (dlgRes:any) {
                if (dlgRes !== void 0) {
                    debugger;
                    let itemId = dlgRes.itemID;
                    if (itemId) {
                        if (!rwo) {
                            return VXETable.modal.message({ content: '请选择要插入的零件！', status: 'error' })
                        }
                        rwo.hs_process_card = itemId
                        console.log("wanc")
                    }
                    console.log(itemId)
                }
            }
        };
        var wndWidth = screen.width * 0.7;
        var wndHeight = screen.height * 0.7;
        var options = {
          dialogHeight: wndHeight,
          dialogWidth: wndWidth,
          resizable: true,
        };
        var wnd = top?.aras.getMainWindow();
        wnd = wnd === top ? wnd.main : top;
        top?.aras.modalDialogHelper.show("SearchDialog", wnd, param, options);
       

    } else if (code === 'viewProcessCardEvent') {
        const rwo = $grid.getRadioRecord()
        if (!rwo) {
            return VXETable.modal.message({ content: '请选择要查看的零件！', status: 'error' })
        }
        const id = rwo.hs_process_card
        ArasMethod.showItem('hs_process_card',id)
    }
}


// const fullValidEvent = async () => {
//   const $table = xGrid.value
//   if ($table) {
//     const errMap = await $table.validate(true)
//     if (errMap) {
//       const msgList: string[] = []
//       Object.values(errMap).forEach((errList: any) => {
//         errList.forEach((params: any) => {
//           const { rowIndex, column, rules } = params
//           rules.forEach((rule: any) => {
//             msgList.push(`第 ${rowIndex + 1} 行 ${column.title} 校验错误：${rule.message}`)
//           })
//         })
//       })
//       VXETable.modal.message({
//         status: 'error',
//         slots: {
//           default () {
//             return (
//               <div class="red" style="max-height: 400px;overflow: auto;">
//                 {
//                   msgList.map(msg => <div>{ msg }</div>)
//                 }
//               </div>
//             )
//           }
//         }
//       })
//     }
// }


//右键菜单时，选中改行
const cellMenuEvent: VxeGridEvents.CellMenu = ({ $grid, row }) => {
    $grid.setRadioRow(row);
}
const gridEvents = {
    toolbarButtonClick: toolbarButtonClickEvent,
    menuClick: menuClickEvent,
    cellMenu: cellMenuEvent
}


// #endregion


// #region 检查责信度配置与方法

const openDiffButtun = ref(false)

const canOpenDiffBtn = ref(false);

const diffGridModel = reactive({
    title: "检查责信度",
    maskClosable: true,
    escClosable: true,
    showZoom: true,
    dblclickZoom: true,
    resize: true,
    draggable: true,
    height: 200,

} as VxeModalDefines.ModalOptions)

const diffGridOptions = reactive({
    size: "mini",
    loading: true,
    rowConfig: {
        useKey: true,
        isHover: true,
        isCurrent: true,
    },
    rowStyle: ({row}) => {
        if (row.isPositive) {
            return {
                color: 'red'
                }
        }else{
            return {
                color: 'green'
                }
        }
        },
    columns: [
        { title:"零件编号", field: "partNumber" },
        { title:"差异数量", field: "quantity" }
    ],
    data: []
} as VxeGridProps)

class DiffDataModel {
    partNumber: string = ''
    quantity: number = 1
}
class DiffDataAndColorModel extends DiffDataModel {
    isPositive: boolean = false
}

let oriPartAndNumber :DiffDataModel[];
let currentPartAndNumber :DiffDataModel[]=[];

const GetOriPartAndNumber = () => {
    axios.post('/ProcessMBom/GetOriPartAndNumber',
        {
            id: gridOtherOptions.formData.formId
        }
    ).then(({data}) => {
        console.log("GetOriPartAndNumber", data);
        if (!data?.result) {
            return;
        }
        if (data.code === 0 && data.result) {
            data.result.forEach((item:any) => {
                item.quantity = parseInt(item.quantity)
            });
            oriPartAndNumber = data.result;
            canOpenDiffBtn.value = true;
        }
    }).catch((err: any) => {
        console.error(err);
    })
}
const getDiffEvent = () =>{
    if (canOpenDiffBtn.value) {
        openDiffButtun.value = true
        SetDiffData()
        diffGridOptions.loading = false
    }else{
        VXETable.modal.message({ content: '获取对比数据失败', status: 'error' })
    }
}

const SetDiffData = () => {
    //获取表格数据中的零件名称和零件数量
    currentPartAndNumber = getQuantityList(gridOtherOptions.tableInitData)
    //对比 OriPartAndNumber 和 gridOtherOptions.tableInitData, 生成diffGridOptions.data
    //比oriPartAndNumber多的零件颜色标红，比oriPartAndNumber少的零件颜色标绿
    let diffData: DiffDataAndColorModel[] = []
    
    let oriPartAndNumberPartIdList = oriPartAndNumber.map(v=>v.partNumber)
    let currentPartAndNumberPartIdList = currentPartAndNumber.map(v=>v.partNumber)
    //列出比oriPartAndNumber少的零件号
    let negativeNumberList =  oriPartAndNumber.filter(v=>currentPartAndNumberPartIdList.includes(v.partNumber)===false)
    diffData = diffData.concat(negativeNumberList.map(v=>{
        return {
            partNumber:v.partNumber,
            quantity:v.quantity,
            isPositive:false
        }
    })) 
    //列出比oriPartAndNumber多的零件号
    let positiveNumberList =  currentPartAndNumber.filter(v=>oriPartAndNumberPartIdList.includes(v.partNumber)===false)
    diffData = diffData.concat(positiveNumberList.map(v=>{
        return {
            partNumber:v.partNumber,
            quantity:v.quantity,
            isPositive:true
        }
    })) 
    //其余零件则是共有零件，数量相减
    let commonNumberList =  currentPartAndNumber.filter(v=>oriPartAndNumberPartIdList.includes(v.partNumber))
    diffData = diffData.concat(commonNumberList.map(v=>{
        let currentNumber = v.quantity
        let oriNumber = oriPartAndNumber.find(v2=>v2.partNumber === v.partNumber)?.quantity
        oriNumber = oriNumber?oriNumber:0
        if (currentNumber > oriNumber) {
            return {
                partNumber:v.partNumber,
                quantity:currentNumber - oriNumber,
                isPositive:true
            }
        }
        else
        {
            return {
                partNumber:v.partNumber,
                quantity:oriNumber - currentNumber,
                isPositive:false
            }
        }
    }))

    diffGridOptions.data = diffData.filter(v=>v.quantity>0&&v.partNumber!='编号自动生成')

}
//传入Data获取每个id和对应的数量，规则为 子零件的数量*父阶的数量*父阶的数量...
const getQuantityList = (data: VxeTableDataRow[]) => {
    let quantityList: {
        id: string,
        quantity: number
    }[] = []
    //获取所有的id
    if (data && data.length > 0) {
        data.forEach((item) => {
            let quantity: {
                id: string,
                quantity: number
            } = {
                id: '',
                quantity: 1
            }
            quantity.id = item.hs_number
            item.hs_quantity = item.hs_quantity ? parseInt(item.hs_quantity) : 0
            //获取该id的所有父阶
            if (item.parentId) {
                const parentList = getParentList(item.parentId, data)
                quantity.quantity = item.hs_quantity * getQuantity(parentList)
            } else {
                quantity.quantity = item.hs_quantity
            }
            quantityList.push(quantity)
        })
    }
    //将相同Id的数量相加，并去重
    let idlist:string[] = quantityList.map((item:any) => item.id)
    let resQuantityList:DiffDataModel[] = []
    if (idlist) {
        idlist.forEach(v => {
            resQuantityList.push({
                partNumber: v,
                quantity: quantityList.filter((item:any) => item.id === v).reduce((total:any, currentValue:any) => total + currentValue.quantity, 0)
            })
        });
    }

    return resQuantityList

}
//传入id，获取该id所对应的所有父阶
const getParentList = (id: any, data: any) => {
    const parentList: any[] = []
    const getParent = (id: any) => {
        const parent = data.find((item: any) => item.id === id)
        if (parent) {
            parentList.push(parent)
            if (parent.parentId) {
                getParent(parent.parentId)
            }
        }
    }
    getParent(id)
    return parentList
}
//传入含有quantity的数组，获取该数组的总数量
const getQuantity = (data: any[]) => {
    let quantity = 0
    if (data && data.length > 0) {
        data.forEach((item) => {
            quantity += parseInt(item.hs_quantity)
        })
    }
    return quantity
}


// #endregion



// #region 公用方法

function getGuID() {
    return 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'.replace(/[x]/g, function(c) {
        var r = Math.random() * 16 | 0;
        return r.toString(16).toUpperCase();
    });
}

// #endregion



// #region 监视器

//表格变化时,生成json放入全局变量中
declare global{
    interface Window {
        thisItem: any;
        aras: any;
    }
}
watch(() => gridOptions.data, () => {
    let transformData = gridOptions.data
    if (gridOptions.data) {
        console.log("gridOptions.data", gridOptions.data);
        console.log("xGrid.value.getRecordset", xGrid.value.getRecordset());
        const partChange = xGrid.value.getRecordset();
        const insertRecords = partChange.insertRecords;
        const removeRecords = partChange.removeRecords;
        if (insertRecords.length > 0) {
            transformData = [...gridOptions.data, ...insertRecords]
        }
        if (removeRecords.length > 0) {
            //移除，并移除其子零件
            let removeList: any[] = []
            removeRecords.forEach((item: any) => {
                const childrenList = getChildrenList(item.id, gridOptions.data);
                removeList.push(...childrenList);
                removeList.push(item)
            })
            const removeIdList = removeList.map((item: any) => item.id)
            transformData = gridOptions.data.filter((item: any) => !removeIdList.includes(item.id))
        }
        console.log("hs_mbom", transformData);
        if (gridOtherOptions.tableInitData && transformData) {
            gridOtherOptions.tableInitData  = transformData;
        }
        if (parent?.thisItem) {
            transformData = transformData?.sort((a: any, b: any) => a._X_ROW_KEY - b._X_ROW_KEY)
            parent.thisItem.setProperty("hs_mbom", JSON.stringify(transformData))
            console.log("hs_mbom", transformData);
        }
    }
    
}, { deep: true });

//传入id，获取该id所对应的所有子阶
const getChildrenList = (id: any, data: any) => {
    const childrenList: any[] = []
    const getChildren = (id: any) => {
        const children = data.filter((item: any) => item.parentId === id)
        if (children && children.length > 0) {
            childrenList.push(...children)
            children.forEach((item: any) => {
                getChildren(item.id)
            })
        }
    }
    getChildren(id)
    return childrenList
}

// #endregion



// #region 生命周期

onMounted(() => {
    //获取表单数据
    gridOtherOptions.formData = ArasUtil.getFormData()
    //获取表格列    
    getColums()
    //获取该id的所有MBom数据
    getData()
    gridOptions.loading = false;

    //获取原始零件和数量
    GetOriPartAndNumber()
})
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
        // res.data.result.unshift({ title: '', width: 60, align: 'center', slots: { default: 'dragBtn', header: 'dragTip' } })
        //添加树形结构
        res.data.result.find((item: any) => item.field === gridOtherOptions.treeConfig?.treeNode).treeNode = true;
        //添加可编辑列
        res.data.result.forEach((item: any) => {
            for (let cell in gridOtherOptions.editConfig.canEditName) {
                if (item.field === gridOtherOptions.editConfig.canEditName[cell]) {
                    item.editRender = {
                        name: 'input'
                    }
                }
            }
        })
        //添加工艺过程卡列的formatter
        res.data.result.forEach((item: any) => {
            if (item.field == "hs_process_card") {
                item.type = 'html';
                item.formatter = formatProcessCard;
            }
        })

        console.log("GetColumns", res.data.result);
        //获取到数据后，加载到表格中
        gridOptions.columns = res.data.result;
    }).catch((err: any) => {
        console.log(err);
    })
}

const formatProcessCard: VxeColumnPropTypes.Formatter = ({ cellValue, row, column })=>{
    if (cellValue) {
        console.log("formatProcessCard", cellValue, row, column);
        return `<a href="javascript:void(0)" onclick="{
            console.log('openProcessCard', '${row.hs_process_card}');
            var item = top?.aras?.newIOMInnovator().newItem('hs_process_card', 'get');
            item.setID('${row.hs_process_card}');
            item = item.apply();
            if (item.getItemCount() == 1) {
                top.aras.uiShowItemEx(item.node, 'tab view', false);
            } else {
                top.aras.AlertError('权限不足！');
            }
        }" >查看工艺过程卡</a>`
        
        
    }
    return ""
}

const getInitData = () => {
    axios.post('/ProcessMBom/GetInitData',
        {
            id: gridOtherOptions.formData.formId
        }
    ).then((res: any) => {
        console.log("GetInitData", res);
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
        console.log("GetData", res);
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


let initTime: any
nextTick(() => {
    //设置高度
    setHeight()

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

// #endregion



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