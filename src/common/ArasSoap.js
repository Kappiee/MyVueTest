import axios from 'axios';
import ArasUtil from './ArasUtil';

let http = axios.create()

export default {
    applyItem: (query) => {
        let body = `<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/">
                        <SOAP-ENV:Body>
                            <ApplyItem>
                                <Item>
                                    ${query}
                                </Item>
                            </ApplyItem>
                        </SOAP-ENV:Body>
                    </SOAP-ENV:Envelope>`
        return new Promise(async resolve => {
            let url = ''
            if (ArasUtil.isDevelopment()) {
                url = getDevelopmentUrl()
            }else{
                url = window.location.origin
            }
            let res = await http.post(`${url}/${getInnovatorServer()}/Server/InnovatorServer.aspx`, body,{
                Headers: {
                    'SOAPAction': 'ApplyItem',
                    'Authorization': `Bearer ${getToken()}`,
                    'Content-Type': 'text/xml;charset=UTF-8',
                }
            })
            let parser = new DOMParser()
            let dom = parser.parseFromString(res.data, 'text/xml')
            let result = dom.querySelectorAll('Result>Item')
            resolve(result)
        })
    },
    applyMethod:()=>{

    },
    applySql:()=>{

    },

}