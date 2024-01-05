import {  ref, watchEffect } from "vue"
import { useGetElementHeight } from "./useGetElementHeight"

export function useGetTableHeight() {
  const tableHeight = ref(0);
  const headerHeight = useGetElementHeight('.vxe-header--row').height
  const buttonHeight = useGetElementHeight('.vxe-button').height
  function calHeight() {
    //获取widow可视区域的高度
    const windowViewHeight = document.documentElement.clientHeight
    tableHeight.value = windowViewHeight
    if (headerHeight.value > 0) {
      tableHeight.value -= headerHeight.value
    }
    if (buttonHeight.value > 0) {
      tableHeight.value -= buttonHeight.value
    }
  }
  
  watchEffect(() => {
    calHeight()
  })

  return {
    tableHeight
  }


}