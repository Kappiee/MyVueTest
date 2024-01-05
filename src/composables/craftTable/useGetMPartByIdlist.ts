import { getMPartByIdlistApi } from "@/api/craftTable";
import { reactive, watchEffect } from "vue";
import type { MPart } from "@/types/craftTable";
export const useGetMPartByIdlist = (idlist:string) => {
    const mPartList = reactive<MPart[]>([]);
    async function getMPartByIdlist() {
        try {
            const mPartListApi = await getMPartByIdlistApi(idlist);
            console.log("mPartListApi", mPartListApi)
            Object.assign(mPartList, mPartListApi);
            
        } catch (err) {
            console.error(err);
        }
    }

    watchEffect(() => {
      getMPartByIdlist();
    })


    return {
        mPartList
    }

};

