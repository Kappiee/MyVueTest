import { onMounted, onUnmounted,ref} from "vue";

export const getTableHeaderHeight = () => {
    const resizeObserver = ref<ResizeObserver|null>(null);
    const HeaderHeight = ref(0);
    onMounted(() => {
      const element = document.querySelector('.vxe-header--row') as HTMLElement;
      if (element) {
        resizeObserver.value = new ResizeObserver(entries => {
          for (const entry of entries) {
            const target = entry.target as HTMLElement;
            HeaderHeight.value =  target.offsetHeight
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
        HeaderHeight
    }
}
