import { getColumnsApi } from "@/api/craftTable";
import { PartType } from "@/types/craftTable";
import { reactive, watchEffect } from "vue";
import { VxeColumnProps, VxeColumnPropTypes } from "vxe-table";
export const useGetColumns = async (treeNode: string, canEditName: Array<string>, typeList: PartType[]) => {
    const columns = reactive<VxeColumnProps[]>([]);
    async function getColumns() {
        try {
            const data = await getColumnsApi();
            data.unshift({
                title: "序号",
                type: "seq",
                width: 60,
                align: "center",
            });
            //添加拖动按钮
            // res.data.result.unshift({ title: '', width: 60, align: 'center', slots: { default: 'dragBtn', header: 'dragTip' } })
            //添加树形结构
            const treeNodeItem = data.find(
                (item: VxeColumnProps) => item.field === treeNode
            );
            if (treeNodeItem) {
                treeNodeItem.treeNode = true;
            }
            //添加可编辑列
            data.forEach((item: VxeColumnProps) => {
                for (const cell in canEditName) {
                    if (item.field === canEditName[cell]) {
                        item.editRender = {
                            name: "input",
                        };
                    }
                }
            });
            //添加工艺过程卡列的formatter
            data.forEach((item: VxeColumnProps) => {
                if (item.field == "hs_process_card") {
                    item.type = "html";
                    item.formatter = formatProcessCard;
                } else if (item.field == "hs_createdon") {
                    item.formatter = formatCreatedOn;
                } else if (item.field == "hs_type") {
                    item.formatter = formatType;
                } else if (item.field == "sortOrder") {
                    item.formatter = formatSortOrder;
                }
            });
            Object.assign(columns, data);
        } catch (err) {
            console.error(err);
        }
    }


    const formatProcessCard: VxeColumnPropTypes.Formatter = ({
        cellValue,
        row
    }) => {
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
              }" >查看工艺过程卡</a>`;
        }
        return "";
    };

    const formatCreatedOn: VxeColumnPropTypes.Formatter = ({ cellValue }) => {
        if (cellValue) {
            //创建时间默认加8小时
            const date = new Date(cellValue);
            date.setHours(date.getHours() + 8);
            return date.toLocaleString();
        }
        return "";
    };

    const formatType: VxeColumnPropTypes.Formatter = ({ cellValue }) => {
        if (cellValue) {
            const label = typeList.find((v) => v.value === cellValue)?.label;
            if (label === void 0) {
                return cellValue;
            }
            return label;
        }
        return "";
    };

    const formatSortOrder: VxeColumnPropTypes.Formatter = ({ cellValue }) => {
        if (cellValue) {
            return parseInt(cellValue);
        }
        return 0;
    };


    watchEffect(async () => {
        await getColumns();
    })


    return {
        columns
    }

};