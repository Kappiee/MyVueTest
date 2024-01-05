<template>
  <vxe-button @click="getDiffEvent">检查责信度</vxe-button>
  <vxe-modal v-model="openDiffButton" width="600" v-bind="diffGridModel" show-footer>
    <template #default>
      <vxe-grid v-bind="diffGridOptions"> </vxe-grid>
    </template>
  </vxe-modal>
</template>
<script lang="ts">
export default {
  name: "check-credibility-popup",
}
</script>
<script lang="ts" setup>
import { ref, reactive, defineProps, onMounted } from "vue";
import { VXETable, VxeGridProps, VxeTableDataRow, VxeModalDefines } from "vxe-table";
import { useGetOriPartAndNumber } from "@/composables/craftTable";
import { PartQuantity, DiffDataAndColorModel, PartIdAndQuantity } from "@/types/craftTable";
const props = defineProps({
  partId: {
    type: String,
    required: true
  },
  gridData: {
    type: Array as () => VxeTableDataRow[],
    required: true
  },
});

const openDiffButton = ref(false);



const diffGridModel = reactive({
  title: "检查责信度",
  maskClosable: true,
  escClosable: true,
  showZoom: true,
  dblclickZoom: true,
  resize: true,
  draggable: true,
  height: 500,
} as VxeModalDefines.ModalOptions);

const diffGridOptions = reactive({
  size: "mini",
  loading: true,
  emptyText: "零件已全部使用",
  rowConfig: {
    useKey: true,
    isHover: true,
    isCurrent: true,
  },
  rowStyle: ({ row }) => {
    if (row.isPositive) {
      return {
        color: "red",
      };
    } else {
      return {
        color: "green",
      };
    }
  },
  columns: [
    { title: "零件编号", field: "partNumber" },
    { title: "差异数量", field: "quantity" },
  ],
  data: [],
} as VxeGridProps);


//按钮点击事件
const canOpenDiffBtn = ref(false);
const getDiffEvent = () => {
  if (canOpenDiffBtn.value) {
    diffGridOptions.loading = true;
    openDiffButton.value = true;
    SetDiffData();
    diffGridOptions.loading = false;
  } else {
    VXETable.modal.message({ content: "获取对比数据失败", status: "error" });
  }
};



//获取原始零件号和数量
let oriPartAndNumber: PartQuantity[];
const GetOriPartAndNumber = async () => {
  const { partAndNumber } = await useGetOriPartAndNumber(props.partId);
  oriPartAndNumber = partAndNumber;
  canOpenDiffBtn.value = true;
};



//获取表格数据中的零件名称和零件数量
let currentPartAndNumber: PartQuantity[] = [];
const SetDiffData = () => {
  //获取表格数据中的零件名称和零件数量
  currentPartAndNumber = getQuantityList(props.gridData);
  //对比 OriPartAndNumber 和 gridOtherOptions.tableInitData, 生成diffGridOptions.data
  //比oriPartAndNumber多的零件颜色标红，比oriPartAndNumber少的零件颜色标绿
  let diffData: DiffDataAndColorModel[] = [];

  let oriPartAndNumberPartIdList = oriPartAndNumber.map((v) => v.partNumber);
  let currentPartAndNumberPartIdList = currentPartAndNumber.map(
    (v) => v.partNumber
  );
  //列出比oriPartAndNumber少的零件号
  let negativeNumberList = oriPartAndNumber.filter(
    (v) => currentPartAndNumberPartIdList.includes(v.partNumber) === false
  );
  diffData = diffData.concat(
    negativeNumberList.map((v) => {
      return {
        partNumber: v.partNumber,
        quantity: v.quantity,
        isPositive: false,
      };
    })
  );
  //列出比oriPartAndNumber多的零件号
  let positiveNumberList = currentPartAndNumber.filter(
    (v) => oriPartAndNumberPartIdList.includes(v.partNumber) === false
  );
  diffData = diffData.concat(
    positiveNumberList.map((v) => {
      return {
        partNumber: v.partNumber,
        quantity: v.quantity,
        isPositive: true,
      };
    })
  );
  //其余零件则是共有零件，数量相减
  let commonNumberList = currentPartAndNumber.filter((v) =>
    oriPartAndNumberPartIdList.includes(v.partNumber)
  );
  diffData = diffData.concat(
    commonNumberList.map((v) => {
      let currentNumber = v.quantity;
      let oriNumber = oriPartAndNumber.find(
        (v2) => v2.partNumber === v.partNumber
      )?.quantity;
      oriNumber = oriNumber ? oriNumber : 0;
      if (currentNumber > oriNumber) {
        return {
          partNumber: v.partNumber,
          quantity: currentNumber - oriNumber,
          isPositive: true,
        };
      } else {
        return {
          partNumber: v.partNumber,
          quantity: oriNumber - currentNumber,
          isPositive: false,
        };
      }
    })
  );

  const array = diffData.filter(v => v.quantity > 0 && v.partNumber.substring(0, 2) != "40" && v.partNumber)
  //去重 diffGridOptions.data
  let idlist: string[] = array.map((item: DiffDataAndColorModel) => item.partNumber)
  let resDiffData: DiffDataAndColorModel[] = []
  if (idlist) {
    idlist.forEach(v => {
      if (!resDiffData.find(v2 => v2.partNumber === v)) {
        resDiffData.push(array.find((item: DiffDataAndColorModel) => item.partNumber === v) as DiffDataAndColorModel)
      }

    });
  }
  diffGridOptions.data = resDiffData
};
//传入Data获取每个id和对应的数量，规则为 子零件的数量*父阶的数量*父阶的数量...
const getQuantityList = (data: VxeTableDataRow[]) => {
  let quantityList: PartIdAndQuantity[] = [];
  //获取所有的id
  if (data && data.length > 0) {
    data.forEach((item) => {
      let quantity: PartIdAndQuantity = {
        partId: "",
        quantity: 1,
      };
      quantity.partId = item.hs_number;
      item.hs_quantity = item.hs_quantity ? parseInt(item.hs_quantity) : 0;
      //获取该id的所有父阶
      if (item.parentId) {
        const parentList = getParentList(item.parentId, data);
        quantity.quantity = item.hs_quantity * getQuantity(parentList);
      } else {
        quantity.quantity = item.hs_quantity;
      }
      if (quantity.partId) {
        quantityList.push(quantity);
      }
      
    });
  }
  //将相同Id的数量相加，并去重
  let idlist: string[] = quantityList.map((item: PartIdAndQuantity) => item.partId);
  let resQuantityList: PartQuantity[] = [];
  if (idlist) {
    idlist.forEach((v) => {
      resQuantityList.push({
        partNumber: v,
        quantity: quantityList
          .filter((item) => item.partId === v)
          .reduce(
            (total, currentValue) => total + currentValue.quantity,
            0
          ),
      });
    });
  }

  return resQuantityList;
};
//传入id，获取该id所对应的所有父阶
const getParentList = (id: string, data: VxeTableDataRow[]) => {
  const parentList: VxeTableDataRow[] = [];
  const getParent = (id: string) => {
    const parent = data.find((item: VxeTableDataRow) => item.id === id);
    if (parent) {
      parentList.push(parent);
      if (parent.parentId) {
        getParent(parent.parentId);
      }
    }
  };
  getParent(id);
  return parentList;
};
//传入含有quantity的数组，获取该数组的总数量
const getQuantity = (data:VxeTableDataRow[]) => {
  let quantity = 1;
  if (data && data.length > 0) {
    data.forEach((item) => {
      quantity *= parseInt(item.hs_quantity.toString());
    });
  }
  return quantity;
};

onMounted(() => {
  GetOriPartAndNumber();

});

</script>

<style lang="">
    
</style>