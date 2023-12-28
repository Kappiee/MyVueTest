import { onMounted,ref,nextTick,onUnmounted } from "vue"

export function getTableHeight(){
    const tableHeight = ref(0);
    function calHeight() {
        const vxeButton = document.querySelector('.vxe-button')
        const vxeHeader = document.querySelector('.vxe-header--row')
        //获取widow可视区域的高度
        const windowViewHeight = document.documentElement.clientHeight
        tableHeight.value = windowViewHeight
        if (vxeButton !== null ) {
            tableHeight.value -= getFullHeight('.vxe-button') 
        } 
        if (vxeHeader !== null) {
            tableHeight.value -=  getFullHeight('.vxe-header--row')
        }
    }
    function getFullHeight(eleName:string) {
        const element = document.querySelector(eleName) as HTMLElement;
        if (element === null) {
            return 0
        }
        const style = window.getComputedStyle(element);
        const marginTop = parseFloat(style.marginTop);
        const marginBottom = parseFloat(style.marginBottom);
        const fullHeight = element.offsetHeight + marginTop + marginBottom;
        return fullHeight
    }
    
   


    const resizeObserver = ref<ResizeObserver|null>(null);

    onMounted(() => {
        nextTick(() => {
            calHeight()
        })
      const element = document.querySelector('.vxe-header--row') as HTMLElement;
      if (element) {
        resizeObserver.value = new ResizeObserver(entries => {
          for (const entry of entries) {
            const target = entry.target as HTMLElement;
            const height = target.offsetHeight;
            tableHeight.value -= height
          }
        });

        resizeObserver.value.observe(element);
      }
    });

    onUnmounted(() => {
      if (resizeObserver.value) {
        resizeObserver.value.disconnect();
      }
    });

    return {
        tableHeight
    }

    
}