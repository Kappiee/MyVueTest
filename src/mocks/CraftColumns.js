import Mock from 'mockjs'

Mock.mock('/ProcessMBom/GetColumns' + '?language=en', 'post', {
  'data': {
    "code": 0,
    "msg": "success",
    "result": [
        { title: '', width: 60, slots: { default: 'dragBtn', header: 'dragTip' } },
        { title: '', type: 'radio', width: 60, align: 'center' },
        {
            "title": "物料名称",
            "field": "hs_name",
            "treeNode": true,
            "width": "100"
        },
        {
            "title": "物料编码",
            "field": "hs_number",
            "width": "100"
        },
        {
            "title": "物料类型",
            "field": "hs_type",
            "width": null
        },
        {
            "title": "版本",
            "field": "hs_version",
            "width": null
        },
        {
            "title": "版次",
            "field": "hs_gengeration",
            "width": null
        },
        {
            "title": "数量",
            "field": "hs_quantity",
            "width": null,
            "editRender": { "name": "input" }
        },
        {
            "title": "单位",
            "field": "hs_unit",
            "width": null
        },
        {
            "title": "创建人",
            "field": "hs_createdby",
            "width": null
        },
        {
            "title": "创建时间",
            "field": "hs_createdon",
            "width": null
        },
        {
            "title": "状态",
            "field": "hs_state",
            "width": null
        }
    ]
}
})

