import { getOriPartAndNumberApi } from "@/api/craftTable";
import { reactive, watchEffect } from "vue";
import type { PartQuantity } from "@/types/craftTable";
export const useGetOriPartAndNumber = async (partId:string) => {
    const partAndNumber = reactive<PartQuantity[]>([]);
    async function getOriPartAndNumber() {
        try {
            const partAndNumberApi = await getOriPartAndNumberApi(partId);
            Object.assign(partAndNumber, partAndNumberApi);
            
        } catch (err) {
            console.error(err);
        }
    }

    watchEffect(async () => {
        await getOriPartAndNumber();
    })


    return {
        partAndNumber
    }

};

