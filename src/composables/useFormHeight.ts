import { ref } from "vue";

export default function()  {
    const height = ref(0)
    function calHeight(h = 0) {
            const clientHeight = document.body.clientHeight
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
            height.value = clientHeight - (formHeight + toolbarHeight + 45)
            if (clientHeight > 0) {
                height.value -=h
            }
    }
    return {
        height,
        calHeight
    }
}