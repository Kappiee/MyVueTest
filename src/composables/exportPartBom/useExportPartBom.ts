import axios from '@/common/arasHttp';
import { VXETable,VxeTableDataRow } from 'vxe-table';
import { PartProperty } from '@/types/exportPartBom';
export async function useExportPartBom(data:VxeTableDataRow[], partId : string,userId = "30B991F927274FA3829655F50C99472E") {
    if (!data) {
        return;
    }
    const selectData = data.filter((item:VxeTableDataRow) => item.isExport === true);
    if (selectData.length === 0) {
        VXETable.modal.message({ content: '请选择导出属性', status: 'error' })
        return;
    }
    const selectDataName: PartProperty[] = data.map((item: VxeTableDataRow) => ({ name: item.name,label:item.label, isExport: item.isExport }));
    const params = {
        propertyList: selectDataName,
        partId
    };
    await axios.post(`/ExportPartBom/ExportPartBom?userId=${userId}`, params,{responseType:'blob'} ).then((res) => {
        debugger;
        const data = res.data;
        if (data.code === -1 && data.msg) {
            console.error(data.msg);
            VXETable.modal.message({ content: '导出失败，请联系系统管理员', status: 'error' })
        }else{
            // 创建 Blob 对象
            const blob = new Blob([data], { type: 'Application/vnd.ms-Excel' });

            // 创建下载链接
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'PartBom导出.xlsx'; // 设置下载文件的名称
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }
    });
}