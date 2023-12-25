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
            <!-- <template #dragBtn>
                <span class="drag-btn">
                    <i class="vxe-icon-sort"></i>
                </span>
            </template> -->
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
import XEUtils, { ceil } from 'xe-utils'
import axios from '@/common/ArasHttp'
import Sortable from 'sortablejs'
import ArasUtil from '@/common/ArasUtil'
import ArasMethod from '@/common/ArasMethod'



// #region 主表格配置

// 表格配置
const gridOtherOptions = {
    formData: {
        formId: '',
        partId: ''
    },
    treeConfig: {
        treeNode: 'hs_name',
    },
    editConfig: {
        canEditName: ["hs_quantity"]
    },
    tableInitData:[] as VxeTableDataRow[] ,
    typeList:[] as {
        value: string,
        label: string
    }[]
}
const gridOptions = reactive({
    loading: true,
    border: true,
    class: 'sortable-tree-demo',
    height: 500,
    size: 'mini',
    id: 'id',
    showOverflow: true,
    sortConfig: {
        defaultSort: {
            field: 'sortOrder',
            order: 'asc'
        }
    },
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
            { pattern: /^[1-9]\d*$/, message: '数量必须为正整数', trigger: 'blur' },
            // { validator: ({rule, row,cellValue})=>{
            //     debugger;
            //     //如果cellValue不是正整数，则返回123
            //     if (!/^[1-9]\d*$/.test(cellValue)) {
            //         console.log(rule, row,cellValue)
            //         row.hs_quantity=1
            //     }
                
            // }, trigger: 'change' }
        ]
    },
    toolbarConfig: {
        buttons: [
            { code: 'expandEvent', name: '全部展开' },
            { code: 'collapseEvent', name: '全部收起' },
            { code: 'getDiffEvent', name: '检查责信度' },
            // { code: 'upEvent', name: '上移一层' },
            // { code: 'downEvent', name: '下移一层' },
            // { code: 'leftEvent', name: '左移一层' },
            // { code: 'rightEvent', name: '右移一层' },
        ],
        perfect: true,
        refresh: {
            icon: 'vxe-icon-refresh',
            iconLoading: 'vxe-icon-refresh roll',
            queryMethod: () => {
                gridOptions.data = []
                gridOptions.loading = true;
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
                    { code: 'newProcessCardEvent', name: '插入工艺过程卡', visible: true, disabled: false },
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
    emptyText: '零件已全部使用',
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
            id: gridOtherOptions.formData.partId
        }
    ).then(({data}) => {
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
        diffGridOptions.loading = true
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

    // diffGridOptions.data = diffData.filter(v=>v.quantity>0&&v.partNumber!='编号自动生成')
    diffGridOptions.data = diffData.filter(v=>v.quantity>0)
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



// #region 请求接口方法
//获取数据
const getColums = () => {
    axios.post('/ProcessMBom/GetColumns'
    ).then((res: any) => {
        if (!res.data?.result) {
            return;
        }
        //添加单选按钮
        // res.data.result.unshift({ title: '', type: 'radio', width: 60, align: 'center' })
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
            }else if (item.field =="hs_createdon") {
                item.formatter = formatCreatedOn;
            }else if (item.field =="hs_type") {
                item.formatter = formatType;
            }else if (item.field =="sortOrder") {
                item.formatter = formatSortOrder;
            }
        })

        //获取到数据后，加载到表格中
        gridOptions.columns = res.data.result;
    }).catch((err: any) => {
        console.error(err);
    })
}

const formatProcessCard: VxeColumnPropTypes.Formatter = ({ cellValue, row, column })=>{
    if (cellValue) {
        return `<a href="javascript:void(0)" onclick="{
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

const formatCreatedOn: VxeColumnPropTypes.Formatter = ({ cellValue })=>{
    if (cellValue) {
        //创建时间默认加8小时
        const date = new Date(cellValue);
        date.setHours(date.getHours() + 8);
        return date.toLocaleString()    
    }
    return ""
}

const formatType: VxeColumnPropTypes.Formatter = ({ cellValue})=>{
    if (cellValue) {
        const typeList = gridOtherOptions?.typeList??[];
        const label = typeList.find(v=>v.value === cellValue)?.label
        if (label === void 0) {
            return cellValue
        }
        return label
    }
    return ""
}
const formatSortOrder: VxeColumnPropTypes.Formatter = ({ cellValue})=>{
    if (cellValue) {
        return parseInt(cellValue)
    }
    return 0
}

const getInitData = () => {
    axios.post('/ProcessMBom/GetInitData',
        {
            id: gridOtherOptions.formData.partId
        }
    ).then((res: any) => {
        if (!res.data?.result) {
            return;
        }
        //获取到数据后，加载到表格中
        gridOptions.data = res.data.result;
    }).catch((err: any) => {
        console.error(err);
    })
}

const getData = () => {
    axios.post('/ProcessMBom/GetData',
        {
            id: gridOtherOptions.formData.formId
        }
    ).then((res: any) => {
        if (!res.data?.result) {
            return;
        }
        if (res.data.code === 0) {
            gridOptions.data = res.data.result;
            if (res.data.result.length === 0) {
                getInitData()
            }
        }

    }).catch((err: any) => {
        console.error(err);
    })
}

const getTypeList = () =>{
    axios.post('/ProcessMBom/GetPartTypeList'
    ).then((res: any) => {
        if (!res.data?.result) {
            return;
        }
        if (res.data.code === 0) {
            gridOtherOptions.typeList = res.data.result;
        }

    }).catch((err: any) => {
        console.error(err);
    })

}
// #endregion




// #region 按钮方法
//表格事件
const toolbarButtonClickEvent: VxeGridEvents.ToolbarButtonClick = ({ $grid, code }) => {
    buttonEvent($grid, code);
}

const menuClickEvent: VxeGridEvents.MenuClick = ({ $grid, menu }) => {
    let code = menu.code;
    buttonEvent($grid, code === void 0?"":code);

}

const buttonEvent = ($grid: any, code: string) => {
    if (code === 'addEvent') {
        //新增虚拟件

        const rwo = $grid.getRadioRecord()

        const param = {
            aras:top?.aras,
            itemtypeName: "hs_process_material",
            multiselect: false,
            userMethodColumnCfgs : {
                'hs_type': {
                    filterValue: '40',
                    isFilterFixed: true,
                },
            },
            callback:function (dlgRes:any) {
                if (dlgRes !== void 0) {
                    let itemId = dlgRes.itemID;
                    let item = dlgRes.item;
                    if (itemId) {
                        if (!rwo) {
                            return VXETable.modal.message({ content: '请选择要插入的零件！', status: 'error' })
                        }
                        //获取当前选中的行
                        const selectedRow = $grid.getRadioRecord()
                        //创建一个新行，数量为1
                        const newRecordRow = {
                                hs_name: item.getElementsByTagName("hs_name")[0].innerHTML,
                                hs_number: item.getElementsByTagName("hs_number")[0].innerHTML,
                                hs_quantity: 1,
                                hs_type: gridOtherOptions?.typeList?.find(v=>v.value == item.getElementsByTagName("hs_type")[0].innerHTML)?.label,
                                id: getGuID(),
                                parentId: selectedRow?.parentId,
                                sortOrder: selectedRow?.sortOrder,
                            }
                        //操作data表格，将新行插入到当前行的下方
                        $grid.insertNextAt(newRecordRow, selectedRow)

                    }
                }
            }
        };
        var wndWidth = screen.width * 0.5;
        var wndHeight = screen.height * 0.5;
        var options = {
          dialogHeight: wndHeight,
          dialogWidth: wndWidth,
          resizable: true,
        };
        var wnd = top?.aras.getMainWindow();
        wnd = wnd === top ? wnd.main : top;
        top?.aras.modalDialogHelper.show("SearchDialog", wnd, param, options);
       





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
        let param = {
            aras:top?.aras,
            itemtypeName: "hs_process_card",
            multiselect: false,
            callback:function (dlgRes:any) {
                if (dlgRes !== void 0) {
                    let itemId = dlgRes.itemID;
                    if (itemId) {
                        if (!rwo) {
                            return VXETable.modal.message({ content: '请选择要插入的零件！', status: 'error' })
                        }
                        rwo.hs_process_card = itemId
                    }
                }
            }
        };
        var wndWidth = screen.width * 0.5;
        var wndHeight = screen.height * 0.5;
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
    } else if (code === 'upEvent'){
        const row = $grid.getRadioRecord();
        if(gridOptions.data){
            const someLevelRow = gridOptions.data.filter(v=>v.parentId == row.parentId);
            // sort by X_ROW_KEY
            someLevelRow.sort((a,b)=>b._X_ROW_KEY.localeCompare(a._X_ROW_KEY));// 降序
            // get Next Row
            const nextRow = someLevelRow.find(v=>v._X_ROW_KEY < row._X_ROW_KEY);// 降序后，第一个比当前行小的行
            // change Row
            if(nextRow){
                const nextRowSortOrder = nextRow._X_ROW_KEY;
                nextRow._X_ROW_KEY = row._X_ROW_KEY;
                row._X_ROW_KEY = nextRowSortOrder;
            }
            // 


        }

    }else if (code === 'downEvent'){
        const row = $grid.getRadioRecord();
        if(gridOptions.data){
            const someLevelRow = gridOptions.data.filter(v=>v.parentId == row.parentId);
            // sort by X_ROW_KEY
            someLevelRow.sort((a,b)=>a._X_ROW_KEY.localeCompare(b._X_ROW_KEY));// 降序
            // get Next Row
            const nextRow = someLevelRow.find(v=>v._X_ROW_KEY > row._X_ROW_KEY);// 降序后，第一个比当前行小的行
            // change Row
            if(nextRow){
                const nextRowSortOrder = nextRow._X_ROW_KEY;
                nextRow._X_ROW_KEY = row._X_ROW_KEY;
                row._X_ROW_KEY = nextRowSortOrder;
            }
        }

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




// #region 拖拽方法方法
// 表格拖拽
const xGrid = ref({} as VxeGridInstance)

const showHelpTip = reactive({
    showDraggableHelpTip: false
})
// SortableJs拖拽,Dom操作和Vue数据保持一致
let sortable: any
const treeDrop = () => {
    const $grid = xGrid.value
    let mouseBeforePositionX : number;
    let mouseAfterPositionX : number;

    sortable = Sortable.create($grid.$el.querySelector('.body--wrapper>.vxe-table--body tbody') as HTMLElement, {
        handle: '.vxe-body--row',
        onStart:(sortableEvent: any)=>{
            mouseBeforePositionX = sortableEvent.originalEvent.clientX
        },
        onEnd: (sortableEvent: any) => {
            //获取鼠标最后的位置
            mouseAfterPositionX = sortableEvent.originalEvent.clientX
            //判断鼠标是否右移50px
            let toChild = false;
            if(mouseAfterPositionX>mouseBeforePositionX+50){
                toChild = true;
            }

            const tableTreeData = gridOptions.data as any[]

            const options = { children: '_X_ROW_CHILD' }
            //新位置dom
            const targetTrElem = sortableEvent.item
            //新位置的父dom
            const wrapperElem = targetTrElem.parentNode as HTMLElement

 

            //通过判断上一个位置的dom，来判断是否是移动到相邻节点，子节点
            var prevTrElem = targetTrElem.previousElementSibling as HTMLElement

            //新位置的node
            const targetRowNode = $grid.getRowNode(targetTrElem)

            // 新位置的node为空时，
            if (!targetRowNode) {
                return
            }

            // 新位置的行信息
            const selfRow = targetRowNode.item

            // tableTreeDatad的原始对象
            const selfNode = XEUtils.findTree(tableTreeData, row => row === selfRow, options)

            // 判断移动后的上一个位置节点是否有节点
            if (prevTrElem) {
                const prevRowNode = $grid.getRowNode(prevTrElem)
                if (!prevRowNode) {
                    return
                }
                const prevRow = prevRowNode.item

                // 判断是否是自己给自己拖动
                if (XEUtils.findTree(selfRow[options.children], row => prevRow === row, options)) {
                    const oldIndex = sortableEvent.oldIndex as number
                    const oldTrElem = wrapperElem.children[oldIndex]
                    // 重新插入到旧位置
                    wrapperElem.insertBefore(targetTrElem, oldTrElem)
                    return VXETable.modal.message({ content: '不允许自己给自己拖动！', status: 'error' })
                }

                // tableTreeDatad的原始对象
                const currRow = selfNode.items.splice(selfNode.index, 1)[0]
                

               const index = tableTreeData.findIndex(v=>v.id === prevRow.id)
               XEUtils.remove(tableTreeData, item => item.id === currRow.id)
               
                // 移动到子节点
                if (toChild) {
                    // XEUtils.remove(tableTreeData, item => item.id === currRow.id)
                    XEUtils.remove(prevRow[options.children], item => item.id === currRow.id)
                    prevRow[options.children].splice(0, 0, currRow);
                    currRow.parentId = prevRow.id
                    tableTreeData.splice(0, 0, currRow)

                } else {
                    // 判断preNode的节点是否展开，如果展开，则移动到子节点
                    if (prevRow[options.children] &&prevRow[options.children].length>0 && $grid.isTreeExpandByRow(prevRow)) {
                        prevRow[options.children].splice(0, 0, currRow);
                        currRow.parentId = prevRow.id
                        tableTreeData.splice(0, 0, currRow)
                    } else {
                        // 移动到相邻节点
                        currRow.parentId = prevRow.parentId
                        tableTreeData.splice(index+1, 0, currRow)
                    }     
                    
                }

            } else {
                // 移动到第一行
                //被移除的数组
                const currRow = selfNode.items.splice(selfNode.index, 1)[0]
                // selfNode._X_ROW_CHILD = null
                //删除数组内currRow
                XEUtils.remove(tableTreeData, item => item === currRow)
                //被移除的数组父阶为null
                currRow.parentId = null
                //将移除的数组放到第一个
                tableTreeData.unshift(currRow)
                
            }

            // 折叠选中行
            // $grid.setTreeExpand(selfRow, false)
            // 如果变动了树层级，需要刷新数据
            gridOptions.data = [...tableTreeData]
        }
    })
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
        if (gridOtherOptions.tableInitData && transformData) {
            gridOtherOptions.tableInitData  = transformData
        }
        console.log(transformData)
        if (parent?.thisItem) {
            transformData = transformData?.sort((a: any, b: any) => a._X_ROW_KEY - b._X_ROW_KEY)
            parent.thisItem.setProperty("hs_mbom", JSON.stringify(transformData))
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
    getTypeList()
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