import { getInnovatorServer } from './ArasUtil'
export default{
    //判断当前环境
    isDevelopment(){
        return process.env.NODE_ENV === 'development'
    },
    isProduction(){
        return process.env.NODE_ENV === 'production'
    },

    //获取innovatorserver
    getInnovatorServer(){
        return "InnovatorServer"
    },

    //获取测试环境路径
    getDevelopmentUrl(){
        return 'http://192.168.110.43'
    },

    //获取当前Item
    getCurrentItem(){
        if (top.document.querySelector('#main-tab .aras-tabs__tab_active')) {
            const formId = top.document.querySelector('#main-tab .aras-tabs__tab_active').getAttribute('data-id')
            const item = top.document.getElementById(formId).contentWindow.document.getElementById('instance').contentWindow.document.thisItem
            return item
        }else{
            return null
        }
    },

    // 获取ArasToken
    getToken(){
        debugger;
        if (this.isDevelopment()) {
            return ''
        }else{
            const key = `oidc.user:${window.location.origin}/${getInnovatorServer()}/OAuthServer/:InnovatorClient`
            const sessionKeys = Object.keys(sessionStorage)
            for(const sessionKey of sessionKeys){
                if (sessionKey.toLowerCase() === key.toLowerCase()) {
                    const json = JSON.parse(sessionStorage.getItem(sessionKey))
                    return json.access_token
                }
            }
        }
    }

}