import axios from 'axios'
import ArasUtil from '@/common/ArasUtil'

let baseUrl = process.env.VUE_APP_SERVICE_URL
if (process.env.NODE_ENV !== 'development') {
    baseUrl = window.location.origin + '/WYZX_8D/api'
}
axios.defaults.baseURL = baseUrl
axios.defaults.timeout = 15000000 // 请求超时时间 毫秒 

//拦截器 参数为请求配置对象
axios.interceptors.request.use(config => {

    // 添加用户ID与环境语言请求头
    if (process.env.NODE_ENV !== 'development') {
        const inn = top.aras.newIOMInnovator()
        config.headers.uid = inn.getUserID()
        config.headers.language = inn.getLanguageCode()
    }else{
        config.headers.language = 'zh-CN'
        config.headers.uid = '30B991F927274FA3829655F50C99472E' 
    }
    // 添加token
    config.headers['access-token'] = ArasUtil.getToken()

    // Post请求时 类型不是 multipart/form-data 则 设置为 application/json。并将参数转化为Json
    if (config.method === 'post' && config.headers['Content-Type'] !== 'multipart/form-data') {
        config.headers['Content-Type'] = 'application/json'
        config.params = JSON.stringify(config.params)
    }

    // 为GET请求添加一个时间戳参数，以防止浏览器缓存GET请求的结果。
    if (config.method === 'get') {
        if (config.params === undefined) {
            config.params = {
                v: (new Date()).valueOf()
            }
        }else{
            config.params.v = (new Date()).valueOf()
        }
    }
    return config
},(error) =>{
    return Promise.reject(error)
})

export default axios