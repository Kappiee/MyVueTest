import {ref, watchEffect } from "vue";

export const useGetTableHeight = (h = 0) =>  {
    const height = ref(0)
    function calHeight(h: number) {
            const windowViewHeight = document.documentElement.clientHeight
            let formHeight = 0
            const formFilter = document.querySelector('.form-filter')
            if (formFilter !== null) {
                formHeight = formFilter.clientHeight + 10
            }
            let toolbarHeight = 50
            const vxeToolbar = document.querySelector('.vxe-toolbar')
            if (vxeToolbar !== null) {
                toolbarHeight = vxeToolbar.clientHeight + 15
            }
            height.value = windowViewHeight - (formHeight + toolbarHeight)
            if (windowViewHeight > 0) {
                height.value -=h
            }
    }
    watchEffect(() => {
        calHeight(h)
    })
    return {
        height
    }
}