export default {
 data() {
    return {
        height: 0,
    }
 },
 methods: {
    calHeight(h = 0) {
        this.$nextTick(() => {
            const height = document.body.clientHeight
            let formHeight = 0
            if (document.querySelector('.form-filter') != null) {
                formHeight = document.querySelector('.form-filter').clientHeight + 10
            }
            let toobarHeight = 50
            if (document.querySelector('.vxe-toolbar') != null) {
                toobarHeight = document.querySelector('.vxe-toolbar').clientHeight + 15
            }
            this.height = height - (formHeight + toobarHeight + 45)
            if (height > 0) {
                this.height -=h
            }
        })
    }
 },
}