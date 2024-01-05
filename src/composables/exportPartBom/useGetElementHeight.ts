import { onMounted,onUnmounted,ref } from "vue"

export const useGetElementHeight = (eleName : string) =>{
    const height = ref(0)

    const resizeObserver = ref<ResizeObserver|null>(null);
    const calHeight=()=> {
      const element = document.querySelector(eleName) as HTMLElement;//'.vxe-header--row'
      if (element) {
        resizeObserver.value = new ResizeObserver(entries => {
          for (const entry of entries) {
            const target = entry.target as HTMLElement;
            height.value = target.offsetHeight;
          }
        });

        resizeObserver.value.observe(element);
      }
    }
    // function getFullHeight(eleName:string) {
    //     const element = document.querySelector(eleName) as HTMLElement;
    //     if (element === null) {
    //         return 0
    //     }
    //     const style = window.getComputedStyle(element);
    //     const marginTop = parseFloat(style.marginTop);
    //     const marginBottom = parseFloat(style.marginBottom);
    //     const fullHeight = element.offsetHeight + marginTop + marginBottom;
    //     return fullHeight
    // }
    onMounted(() => {
        calHeight();
    });
    onUnmounted(() => {
      if (resizeObserver.value) {
        resizeObserver.value.disconnect();
      }
    });
    return {
        height
    }
}