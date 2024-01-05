import { reactive, watchEffect } from 'vue';
import { getTypeListApi } from '@/api/craftTable';
import type { PartType } from '@/types/craftTable';
export const useGetPartType = async () => {
    const partTypeList = reactive<PartType[]>([]);
    const getPartType = async () => {
        try {
            const partTypeListApi = await getTypeListApi();
            Object.assign(partTypeList, partTypeListApi);
        } catch (err) {
            console.error(err);
        }
    }
    watchEffect(async () => {
        await getPartType()
    })
    return {
        partTypeList
    }
}