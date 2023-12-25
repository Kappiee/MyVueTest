import ArasConfig from "./src/common/ArasConfig"
module.exports = {
    productionSourceMap :false,
    lintOnSave:false,
    publicPath: process.env.NODE_ENV === 'production'? '/'+ArasConfig.data().innovatorServer+'/Client/scripts/hs_wenyuanVue/' : '/',

}