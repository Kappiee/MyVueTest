import { getDataApi,getInitDataApi } from "@/api/craftTable";
import { reactive, watchEffect } from "vue";
import { VxeTableDataRow } from "vxe-table";
export const useGetData = async (formId:string,partId:string) => {
    const data = reactive<VxeTableDataRow[]>([]);
    async function getData() {
        try {
            let dataApi = await getDataApi(formId);
            if(dataApi.length!=0){
                dataApi= await getInitDataApi(partId);
            }
            Object.assign(data, dataApi);
            
        } catch (err) {
            console.error(err);
        }
    }

    watchEffect(async () => {
        await getData();
    })


    return {
        data
    }

};

