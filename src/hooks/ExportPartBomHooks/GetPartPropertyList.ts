import axios from '@/common/ArasHttp';
import { onMounted, reactive } from 'vue';
import { VXETable } from 'vxe-table';
import { PartProperty } from '@/types/ExportPartBomTypes';
export function getPartPropertyList (userId = "30B991F927274FA3829655F50C99472E") {
    const PartPropertyData = reactive<PartProperty[]>([]);
    const GetPartPropertyList= async() =>{
        await axios.post(`/ExportPartBom/GetPartProperty?userId=${userId}`).then(({data}) => {
            if (!data?.result) {
                return;
            }
            if (data.code === 0 && data.result) {
                Object.assign(PartPropertyData,data.result);
                return
            }else{
                VXETable.modal.message({ content: '获取导出列表失败，请联系系统管理员', status: 'error' })
            }
        });
    }
    onMounted(async () => {
        await GetPartPropertyList();
    })
    return {
        PartPropertyData
    }
}