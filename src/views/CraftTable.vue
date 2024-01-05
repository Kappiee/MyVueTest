<template>
  <vxe-grid ref="xGrid" v-bind="gridOptions" v-on="gridEvents">
    <template #getDiffEvent>
      <vxe-button @click="expandEvent">全部展开</vxe-button>
      <vxe-button @click="collapseEvent">全部收起</vxe-button>
      <check-credibility-popup :part-id="gridOtherOptions.formData.partId" :grid-data="gridOtherOptions.tableInitData">
      </check-credibility-popup>
    </template>
  </vxe-grid>
</template>

<script lang="ts" setup>
import { useGetTableHeight, useGetColumns, useGetData, useGetPartType } from "@/composables/craftTable";
import { getMPartByIdlistApi } from "@/api/craftTable";
import CheckCredibilityPopup from "@/components/craftTable/CheckCredibilityPopup.vue";
import type { PartType } from '@/types/craftTable';

import { getGuID } from "@/common/utils";
import { getFormData } from "@/common/arasUtil";

import { reactive, ref, watch, nextTick, onMounted, onUnmounted, watchEffect } from "vue";
import XEUtils from "xe-utils";
import Sortable from "sortablejs";
import {
  VXETable,
  VxeGridInstance,
  VxeGridProps,
  VxeGridEvents,
  VxeTableDataRow,
  VxeGridConstructor
} from "vxe-table";



// #region 主表格配置

// 表格配置

const gridOtherOptions = {
  formData: {
    formId: "",
    partId: "",
  },
  treeConfig: {
    treeNode: "hs_name",
  },
  editConfig: {
    canEditName: ["hs_quantity"],
  },
  tableInitData: [] as VxeTableDataRow[],
  typeList: [] as PartType[],
};
const gridOptions = reactive({
  loading: true,
  border: true,
  class: "sortable-tree-demo",
  height: 0,
  size: "mini",
  id: "id",
  showOverflow: true,
  sortConfig: {
    defaultSort: {
      field: "sortOrder",
      order: "asc",
    },
  },
  loadingConfig: {
    spinner: "vxe-icon-loading",
    tip: "加载中...",
  },
  rowConfig: {
    useKey: true,
    isHover: true,
    isCurrent: true,
  },
  columnConfig: {
    useKey: true,
    resizable: true,
  },
  scrollY: {
    enabled: false,
  },
  editConfig: {
    trigger: "click",
    mode: "cell",
  },
  editRules: {
    hs_quantity: [
      {
        required: true,
        type: "number",
        message: "数量不能为空",
        trigger: "blur",
      },
      { pattern: /^[1-9]\d*$/, message: "数量必须为正整数", trigger: "blur" },
    ],
  },
  toolbarConfig: {
    slots: {
      buttons: "getDiffEvent",
    },
    perfect: true,
    refresh: {
      icon: "vxe-icon-refresh",
      iconLoading: "vxe-icon-refresh roll",
      queryMethod: async () => {
        gridOptions.data = [];
        gridOptions.loading = true;
        //获取表格列
        await getColumns();
        //获取该id的所有MBom数据
        await getData();
        gridOptions.loading = false;
      },
    },
  },
  menuConfig: {
    enabled: true,
    body: {
      options: [
        [
          //单选操作
          {
            code: "addEvent",
            name: "插入工艺虚拟件",
            visible: true,
            disabled: false,
          },
          {
            code: "splitEvent",
            name: "拆分零件",
            visible: true,
            disabled: false,
          },
          {
            code: "newProcessCardEvent",
            name: "插入工艺过程卡",
            visible: true,
            disabled: false,
          },
          {
            code: "viewProcessCardEvent",
            name: "查看工艺过程卡",
            visible: true,
            disabled: false,
          },

          {
            code: "deleteEvent",
            name: "删除行",
            prefixIcon: "vxe-icon-delete",
            visible: true,
            disabled: false,
          },
        ],
      ],
    },
  },
  treeConfig: {
    parentField: "parentId",
    rowField: "id",
    transform: true,
  },
  radioConfig: {
    trigger: "row",
    highlight: true,
  },
  data: [] as VxeTableDataRow[],
} as VxeGridProps);

// #endregion

// #region 获取数据
//获取零件类型对应关系
import { } from "@/composables/craftTable";
const getPartType = async () => {
  const { partTypeList } = await useGetPartType();
  gridOtherOptions.typeList = partTypeList
}

//获取columns
const getColumns = async () => {
  const { columns } = await useGetColumns(gridOtherOptions.treeConfig.treeNode, gridOtherOptions.editConfig.canEditName, gridOtherOptions.typeList);
  gridOptions.columns = columns
}

//获取数据
const getData = async () => {
  const { data } = await useGetData(gridOtherOptions.formData.formId, gridOtherOptions.formData.partId);
  gridOptions.data = data
}





// #endregion

// #region 按钮方法
//表格事件
const toolbarButtonClickEvent: VxeGridEvents.ToolbarButtonClick = ({
  $grid,
  code,
}) => {
  buttonEvent($grid, code);
};

const menuClickEvent: VxeGridEvents.MenuClick = ({ $grid, menu }) => {
  let code = menu.code;
  buttonEvent($grid, code === void 0 ? "" : code);
};

const buttonEvent = ($grid: VxeGridConstructor, code: string) => {
  if (code === "addEvent") {
    //新增虚拟件
    const rwo = $grid.getRadioRecord();
    if (!rwo) {
        return VXETable.modal.message({
          content: "请选择要插入的零件！",
          status: "error",
        });
      }
    if ((top as any).aras) {
      const aras = (top as any).aras;
      const param = {
        aras: aras,
        itemtypeName: "hs_process_material",
        multiselect: true,
        userMethodColumnCfgs: {
          hs_type: {
            filterValue: "40",
            isFilterFixed: true,
          },
        },
        callback:async function (dlgRes: {
          itemID: string
        }[]) {
          if (dlgRes !== void 0 && dlgRes.length > 0) {
            {
              const selectedRow = $grid.getRadioRecord();
              const  mPartList  =  await getMPartByIdlistApi(dlgRes.toString());
              mPartList.forEach(mPart => {
                  const newRecordRow = {
                    hs_name: mPart.name,
                    hs_number: mPart.number,
                    hs_quantity: 1,
                    hs_type: gridOtherOptions?.typeList?.find(
                      (v) =>
                        v.value == mPart.type
                    )?.label,
                    id: getGuID(),
                    parentId: selectedRow?.parentId,
                    sortOrder: selectedRow?.sortOrder,
                  };
                  //操作data表格，将新行插入到当前行的下方
                  $grid.insertNextAt(newRecordRow, selectedRow);
                
              });
            }
          }
        },
      };
      var wndWidth = screen.width * 0.5;
      var wndHeight = screen.height * 0.5;
      var options = {
        dialogHeight: wndHeight,
        dialogWidth: wndWidth,
        resizable: true,
      };
      var wnd = aras.getMainWindow();
      wnd = wnd === top ? wnd.main : top;
      aras.modalDialogHelper.show("SearchDialog", wnd, param, options);
    } else {
      //获取当前选中的行
      const selectedRow = $grid.getRadioRecord();
      //创建一个新行，数量为1
      const newRecordRow = {
        hs_name: "testName",
        hs_number: "testNumber",
        hs_quantity: 1,
        hs_type: "虚拟件",
        id: getGuID(),
        parentId: selectedRow?.parentId,
        sortOrder: selectedRow?.sortOrder,
      };
      //操作data表格，将新行插入到当前行的下方
      $grid.insertNextAt(newRecordRow, selectedRow);
    }

  } else if (code === "splitEvent") {
    //获取当前选中的行
    const selectedRow = $grid.getRadioRecord();
    if (!selectedRow) {
      return VXETable.modal.message({
        content: "请选择要拆分的零件！",
        status: "error",
      });
    }
    //判断当前行的数量是否大于1
    if (selectedRow.hs_quantity <= 1) {
      return VXETable.modal.message({
        content: "当前零件数量小于等于1,不允许拆分!",
        status: "error",
      });
    }
    //创建一个新行，数量为1
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      };
    };
    const newRecordRow = copyRow(selectedRow);
    selectedRow.hs_quantity = selectedRow.hs_quantity - 1;
    //操作data表格，将新行插入到当前行的下方
    $grid.insertNextAt(newRecordRow, selectedRow);
  
  } else if (code === "deleteEvent") {
    if ($grid) {
      $grid.removeRadioRow();
    }

  } else if (code === "newProcessCardEvent") {
    const rwo = $grid.getRadioRecord();
    if ((top as any).aras) {
      const aras = (top as any).aras;
      const param = {
        aras: aras,
        itemtypeName: "hs_process_card",
        multiselect: false,
        callback: function (dlgRes: {itemID:string}) {
          if (dlgRes !== void 0) {
            let itemId = dlgRes.itemID;
            if (itemId) {
              if (!rwo) {
                return VXETable.modal.message({
                  content: "请选择要插入的零件！",
                  status: "error",
                });
              }
              rwo.hs_process_card = itemId;
            }
          }
        },
      };
      const wndWidth = screen.width * 0.5;
      const wndHeight = screen.height * 0.5;
      const options = {
        dialogHeight: wndHeight,
        dialogWidth: wndWidth,
        resizable: true,
      };
      let wnd = aras?.getMainWindow();
      wnd = wnd === top ? wnd.main : top;
      aras.modalDialogHelper.show("SearchDialog", wnd, param, options);
    } else {
      rwo.hs_process_card = "testId"
    }
  } else if (code === "viewProcessCardEvent") {
    const rwo = $grid.getRadioRecord();
    if (!rwo) {
      return VXETable.modal.message({
        content: "请选择要查看的零件！",
        status: "error",
      });
    }
    const id = rwo.hs_process_card;
    showItem("hs_process_card", id);
  } else if (code === "upEvent") {
    const row = $grid.getRadioRecord();
    if (gridOptions.data) {
      const someLevelRow = gridOptions.data.filter(
        (v) => v.parentId == row.parentId
      );
      // sort by X_ROW_KEY
      someLevelRow.sort((a, b) => b._X_ROW_KEY.localeCompare(a._X_ROW_KEY)); // 降序
      // get Next Row
      const nextRow = someLevelRow.find((v) => v._X_ROW_KEY < row._X_ROW_KEY); // 降序后，第一个比当前行小的行
      // change Row
      if (nextRow) {
        const nextRowSortOrder = nextRow._X_ROW_KEY;
        nextRow._X_ROW_KEY = row._X_ROW_KEY;
        row._X_ROW_KEY = nextRowSortOrder;
      }
      //
    }
  } else if (code === "downEvent") {
    const row = $grid.getRadioRecord();
    if (gridOptions.data) {
      const someLevelRow = gridOptions.data.filter(
        (v) => v.parentId == row.parentId
      );
      // sort by X_ROW_KEY
      someLevelRow.sort((a, b) => a._X_ROW_KEY.localeCompare(b._X_ROW_KEY)); // 降序
      // get Next Row
      const nextRow = someLevelRow.find((v) => v._X_ROW_KEY > row._X_ROW_KEY); // 降序后，第一个比当前行小的行
      // change Row
      if (nextRow) {
        const nextRowSortOrder = nextRow._X_ROW_KEY;
        nextRow._X_ROW_KEY = row._X_ROW_KEY;
        row._X_ROW_KEY = nextRowSortOrder;
      }
    }
  }
};
const expandEvent = () => {
  const $grid = xGrid.value;
  if ($grid) {
    $grid.setAllTreeExpand(true);
  }
};

const collapseEvent = () => {
  const $grid = xGrid.value;
  if ($grid) {
    $grid.clearTreeExpand();
  }
};

const showItem = (itemtype: string, itemid: string, viewMode = 'tab view', isOpenInTearOff = false) => {
  if ((top as any).aras) {
    const aras = (top as any).aras;
    var item = aras.newIOMInnovator().newItem(itemtype, "get");
    item.setID(itemid);
    item = item.apply();
    if (item.getItemCount() == 1) {
      aras.uiShowItemEx(item.node, viewMode, isOpenInTearOff);
    } else {
      aras.AlertError('权限不足！');
    }
  } else {
    VXETable.modal.message({
      content: itemtype + itemid,
      status: "success",
    });
  }

}
//右键菜单时，选中改行
const cellMenuEvent: VxeGridEvents.CellMenu = ({ $grid, row }) => {
  $grid.setRadioRow(row);
};
const gridEvents = {
  toolbarButtonClick: toolbarButtonClickEvent,
  menuClick: menuClickEvent,
  cellMenu: cellMenuEvent,
};
// #endregion


// #region 拖拽方法方法
// 表格拖拽
const xGrid = ref({} as VxeGridInstance)

// SortableJs拖拽,Dom操作和Vue数据保持一致
let sortable: Sortable

const treeDrop = () => {
  const $grid = xGrid.value
  let mouseBeforePositionX: number;
  let mouseAfterPositionX: number;
  sortable = Sortable.create($grid.$el.querySelector('.body--wrapper>.vxe-table--body tbody') as HTMLElement, {
    handle: '.vxe-body--row',
    onStart: (sortableEvent: any) => {
      mouseBeforePositionX = sortableEvent.originalEvent.clientX
    },
    onEnd: (sortableEvent: any) => {
      //获取鼠标最后的位置
      mouseAfterPositionX = sortableEvent.originalEvent.clientX
      //判断鼠标是否右移50px
      let toChild = false;
      if (mouseAfterPositionX > mouseBeforePositionX + 50) {
        toChild = true;
      }

      const tableTreeData = gridOtherOptions.tableInitData as VxeTableDataRow[]

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

      // tableTreeData的原始对象
      const selfNode = XEUtils.findTree(tableTreeData, row => row._X_ROW_KEY === selfRow._X_ROW_KEY, options)

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

        // tableTreeData的原始对象
        const currRow = selfNode.items.splice(selfNode.index, 1)[0]


        const index = tableTreeData.findIndex(v => v._X_ROW_KEY === prevRow._X_ROW_KEY)
        XEUtils.remove(tableTreeData, item => item._X_ROW_KEY === currRow._X_ROW_KEY)

        // 移动到子节点
        if (toChild) {
          // XEUtils.remove(tableTreeData, item => item.id === currRow.id)
          XEUtils.remove(prevRow[options.children], item => item._X_ROW_KEY === currRow._X_ROW_KEY)
          prevRow[options.children].splice(0, 0, currRow);
          currRow.parentId = prevRow.id
          tableTreeData.splice(0, 0, currRow)

        } else {
          // 判断preNode的节点是否展开，如果展开，则移动到子节点
          if (prevRow[options.children] && prevRow[options.children].length > 0 && $grid.isTreeExpandByRow(prevRow)) {
            prevRow[options.children].splice(0, 0, currRow);
            currRow.parentId = prevRow.id
            tableTreeData.splice(0, 0, currRow)
          } else {
            // 移动到相邻节点
            currRow.parentId = prevRow.parentId
            tableTreeData.splice(index + 1, 0, currRow)
          }

        }

      } else {
        // 移动到第一行
        //被移除的数组
        const currRow = selfNode.items.splice(selfNode.index, 1)[0]
        // selfNode._X_ROW_CHILD = null
        //删除数组内currRow
        XEUtils.remove(tableTreeData, item => item._X_ROW_KEY === currRow._X_ROW_KEY)
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
watchEffect(() => {
  nextTick(() => {
    // 加载完成之后在绑定拖动事件
    initTime = setTimeout(() => {
      treeDrop()
    }, 500)
  })
})
let initTime: number


onUnmounted(() => {
  clearTimeout(initTime)
  if (sortable) {
    sortable.destroy()
  }
})

// #endregion


// #region 监视器

//表格变化时,生成json放入全局变量中
watch(
  () => gridOptions.data,
  () => {
    let transformData = gridOptions.data;
    if (gridOptions.data) {
      const partChange = xGrid.value.getRecordset();
      const insertRecords = partChange.insertRecords;
      const removeRecords = partChange.removeRecords;
      if (insertRecords.length > 0) {
        transformData = [...gridOptions.data, ...insertRecords];
      }
      if (removeRecords.length > 0) {
        //移除，并移除其子零件
        let removeList: any[] = [];
        removeRecords.forEach((item: any) => {
          const childrenList = getChildrenList(item.id, gridOptions.data as VxeTableDataRow[]);
          removeList.push(...childrenList);
          removeList.push(item);
        });
        const removeIdList = removeList.map((item: any) => item.id);
        transformData = gridOptions.data.filter(
          (item: any) => !removeIdList.includes(item.id)
        );
      }
      if (gridOtherOptions.tableInitData && transformData) {
        gridOtherOptions.tableInitData = transformData;
      }
      if ((parent as any).thisItem) {
        transformData = transformData?.sort(
          (a: any, b: any) => a._X_ROW_KEY - b._X_ROW_KEY
        );
        (parent as any).thisItem.setProperty("hs_mbom", JSON.stringify(transformData));
      }
    }
  },
  { deep: true }
);

//传入id，获取该id所对应的所有子阶
const getChildrenList = (id: string, data: VxeTableDataRow[]) => {
  const childrenList: VxeTableDataRow[] = [];
  const getChildren = (id: string) => {
    const children = data.filter((item: VxeTableDataRow) => item.parentId === id);
    if (children && children.length > 0) {
      childrenList.push(...children);
      children.forEach((item: VxeTableDataRow) => {
        getChildren(item.id);
      });
    }
  };
  getChildren(id);
  return childrenList;
};

// #endregion

// #region 生命周期


onMounted(async () => {
  //获取表单信息
  const resArasItemData = getFormData();
  debugger;
  gridOtherOptions.formData.formId = resArasItemData.hsProcessRouteData.formId;
  gridOtherOptions.formData.partId = resArasItemData.hsProcessRouteData.partId;
  //获取零件类型对应关系
  await getPartType();
  //获取表格列
  await getColumns();
  //获取该id的所有MBom数据
  await getData();
  //获得表格高度
  let { height } = useGetTableHeight();
  gridOptions.height = height.value;
  gridOptions.loading = false;

});

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
</style>@/composables/craftTable/useTableHeight