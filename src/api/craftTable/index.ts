
import axios from "@/common/arasHttp";
import type  {ApiResult} from "@/api/types";
import type {VxeColumnProps,VxeTableDataRow} from "vxe-table";
import type {PartType,PartQuantity,MPart} from "@/types/craftTable";

async function fetchData<T>(url: string, data: any): Promise<T> {
    try {
        const response = await axios.post<ApiResult>(url, data);
        if (!response.data || response.data.code !== 0) {
            throw new Error(response.data.msg || 'Unknown error occurred');
        }
        return response.data.result as T;
    } catch (err: unknown) {
        if (err instanceof Error) {
            throw err;
        } else {
            throw new Error("Unknown error occurred");
        }
    }
}


export const getColumnsApi = async () => {
    return fetchData<VxeColumnProps[]>("/ProcessMBom/GetColumns", {});
};

export const getInitDataApi = async (partId: string) => {
    return fetchData<VxeTableDataRow[]>("/ProcessMBom/GetInitData", {id: partId});
};

export const getDataApi = async (formId: string) => {
    return fetchData<VxeTableDataRow[]>("/ProcessMBom/GetData", {id: formId});
};

export const getTypeListApi = async () => {
    return fetchData<PartType[]>("/ProcessMBom/GetPartTypeList", {});
};

export const getOriPartAndNumberApi = async (partId:string) => {
    return fetchData<PartQuantity[]>("/ProcessMBom/GetOriPartAndNumber", {id: partId});
};

export const getMPartByIdlistApi = async (mPartId:string) => {
    return fetchData<MPart[]>("/ProcessMBom/GetMPartByIdlist", {idlist: mPartId});
}