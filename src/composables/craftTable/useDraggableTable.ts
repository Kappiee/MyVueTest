import { onUnmounted, nextTick, reactive, watchEffect } from "vue";
import {
    VXETable,
    VxeTableDataRow,
    VxeGridInstance
} from "vxe-table";
import XEUtils from "xe-utils";
import Sortable from "sortablejs";
import { SortableEvent } from "sortablejs";
import type { CustomSortableEvent } from "@/types/sortableJs";
export const useDraggableTable = (oriData: VxeTableDataRow[], gridValue: VxeGridInstance) => {
    let sortable: Sortable;
    const data = reactive<VxeTableDataRow[]>([]);
    const $grid = gridValue;
    const treeDrop = () => {

        let mouseBeforePositionX: number;
        let mouseAfterPositionX: number;
        sortable = Sortable.create(
            $grid.$el.querySelector(
                ".body--wrapper>.vxe-table--body tbody"
            ) as HTMLElement,
            {
                handle: ".vxe-body--row",
                onStart: (sortableEvent: any) => {
                    mouseBeforePositionX = sortableEvent.originalEvent.clientX;
                },
                onEnd: (sortableEvent: any) => {
                    //获取鼠标最后的位置
                    mouseAfterPositionX = sortableEvent.originalEvent.clientX;
                    //判断鼠标是否右移50px
                    let toChild = false;
                    if (mouseAfterPositionX > mouseBeforePositionX + 50) {
                        toChild = true;
                    }

                    const tableTreeData = oriData as VxeTableDataRow[];

                    const options = { children: "_X_ROW_CHILD" };
                    //新位置dom
                    const targetTrElem = sortableEvent.item;
                    //新位置的父dom
                    const wrapperElem = targetTrElem.parentNode as HTMLElement;

                    //通过判断上一个位置的dom，来判断是否是移动到相邻节点，子节点
                    const prevTrElem = targetTrElem.previousElementSibling as HTMLElement;

                    //新位置的node
                    const targetRowNode = $grid.getRowNode(targetTrElem);

                    // 新位置的node为空时，
                    if (!targetRowNode) {
                        return;
                    }

                    // 新位置的行信息
                    const selfRow = targetRowNode.item;

                    // tableTreeData的原始对象
                    const selfNode = XEUtils.findTree(
                        tableTreeData,
                        (row) => row === selfRow,
                        options
                    );

                    // 判断移动后的上一个位置节点是否有节点
                    if (prevTrElem) {
                        const prevRowNode = $grid.getRowNode(prevTrElem);
                        if (!prevRowNode) {
                            return;
                        }
                        const prevRow = prevRowNode.item;

                        // 判断是否是自己给自己拖动
                        if (
                            XEUtils.findTree(
                                selfRow[options.children],
                                (row) => prevRow === row,
                                options
                            )
                        ) {
                            const oldIndex = sortableEvent.oldIndex as number;
                            const oldTrElem = wrapperElem.children[oldIndex];
                            // 重新插入到旧位置
                            wrapperElem.insertBefore(targetTrElem, oldTrElem);
                            return VXETable.modal.message({
                                content: "不允许自己给自己拖动！",
                                status: "error",
                            });
                        }

                        // tableTreeData的原始对象
                        const currRow = selfNode.items.splice(selfNode.index, 1)[0];

                        const index = tableTreeData.findIndex((v) => v.id === prevRow.id);
                        XEUtils.remove(tableTreeData, (item) => item.id === currRow.id);

                        // 移动到子节点
                        if (toChild) {
                            // XEUtils.remove(tableTreeData, item => item.id === currRow.id)
                            XEUtils.remove(
                                prevRow[options.children],
                                (item) => item.id === currRow.id
                            );
                            prevRow[options.children].splice(0, 0, currRow);
                            currRow.parentId = prevRow.id;
                            tableTreeData.splice(0, 0, currRow);
                        } else {
                            // 判断preNode的节点是否展开，如果展开，则移动到子节点
                            if (
                                prevRow[options.children] &&
                                prevRow[options.children].length > 0 &&
                                $grid.isTreeExpandByRow(prevRow)
                            ) {
                                prevRow[options.children].splice(0, 0, currRow);
                                currRow.parentId = prevRow.id;
                                tableTreeData.splice(0, 0, currRow);
                            } else {
                                // 移动到相邻节点
                                currRow.parentId = prevRow.parentId;
                                tableTreeData.splice(index + 1, 0, currRow);
                            }
                        }
                    } else {
                        // 移动到第一行
                        //被移除的数组
                        const currRow = selfNode.items.splice(selfNode.index, 1)[0];
                        // selfNode._X_ROW_CHILD = null
                        //删除数组内currRow
                        XEUtils.remove(tableTreeData, (item) => item === currRow);
                        //被移除的数组父阶为null
                        currRow.parentId = null;
                        //将移除的数组放到第一个
                        tableTreeData.unshift(currRow);
                    }

                    // 折叠选中行
                    // $grid.setTreeExpand(selfRow, false)
                    // 如果变动了树层级，需要刷新数据
                    Object.assign(data, tableTreeData);
                    // Object.assign(oriData, tableTreeData);
                },
            }
        );
    };
    let initTime: number;
    nextTick(() => {
        // 加载完成之后在绑定拖动事件
        console.log('watchEffect')
        treeDrop();
    });

    onUnmounted(() => {
        clearTimeout(initTime);
        if (sortable) {
            sortable.destroy();
        }
    });

    return {
        data
    }

}