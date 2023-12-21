import ArasUtil from '@/common/ArasUtil.js'
export default {


    inn:()=>{
        if (ArasUtil.isDevelopment()) {
            return top?.aras?.newIOMInnovator()
        }
    },

    
    userId:()=>{
        if (ArasUtil.isDevelopment()) {
            return inn?.getUserID()
        }
    },
    
    showItem(itemtype, itemid, viewMode='tab view', isOpenInTearOff=false) {
        var item = top?.aras?.newIOMInnovator().newItem(itemtype, "get");
        item.setID(itemid);
        item = item.apply();
        if (item.getItemCount() == 1) {
            top.aras.uiShowItemEx(item.node, viewMode, isOpenInTearOff);
        } else {
            top.aras.AlertError('权限不足！');
        }
    },
    
    openNewItem(itemtype)
    {
        return top?.aras?.uiNewItemEx(itemtype)
    },

    //未完成
    SelectItem(itemtype)
    {
        var param = {};
        var wndWidth = screen.width * 0.7;
        var wndHeight = screen.height * 0.7;
        var options = {
          dialogHeight: wndHeight,
          dialogWidth: wndWidth,
          resizable: true,
        };
        param.aras = top.aras;
        param.itemtypeName = itemtype;
        param.multiselect = false;
        var wnd = top.aras.getMainWindow();
        wnd = wnd === top ? wnd.main : top;
        param.callback = function (dlgRes) {
            if (dlgRes !== void 0) {
                let itemId = dlgRes.itemID;
                console.log(itemId)
            }
        }
        top.aras.modalDialogHelper.show("SearchDialog", wnd, param, options);
    }
   

}