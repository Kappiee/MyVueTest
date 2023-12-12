import ArasConfig from '@/common/ArasConfig.js'

export default{
    //判断当前环境
    isDevelopment() {
        return process.env.NODE_ENV === 'development'
    },
    isProduction() {
        return process.env.NODE_ENV === 'production'
    },

    getApiUrl() {
        return this.isDevelopment() ? ArasConfig.data().localApiUrl : ArasConfig.data().productionApiUrl
    },

    //获取当前Item
    getCurrentItem() {
        if (top.document.querySelector('#main-tab .aras-tabs__tab_active')) {
            const formId = top.document.querySelector('#main-tab .aras-tabs__tab_active').getAttribute('data-id')
            const item = top.document.getElementById(formId).contentWindow.document.getElementById('instance').contentWindow.document.thisItem
            return item
        } else {
            return null
        }
    },

    //获取表单数据
    getFormData(){
        if (!this.isDevelopment) 
        {   
            ArasConfig.data().formData.formId = parent.thisItem.getProperty('id');
        }
        return ArasConfig.data().formData
    },

    //获取innovator
    getInnovator(){
        return top.aras.newIOMInovator();
    },


    // 获取ArasToken
    getToken() {
        if (this.isDevelopment()) {
            return ArasConfig.data().token
        } else {
            const key = `oidc.user:${window.location.origin}/${ArasConfig.data().innovatorServer}/OAuthServer/:InnovatorClient`
            const sessionKeys = Object.keys(sessionStorage)
            for (const sessionKey of sessionKeys) {
                if (sessionKey.toLowerCase() === key.toLowerCase()) {
                    const json = JSON.parse(sessionStorage.getItem(sessionKey))
                    return json.access_token
                }
            }
        }
    }

}