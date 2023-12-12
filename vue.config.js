module.exports = {
    productionSourceMap :false,
    lintOnSave:false,
    publicPath: process.env.NODE_ENV === 'production'? '/InnovatorServer/Client/scripts/hs_wenyuanVue/' : '/',

}