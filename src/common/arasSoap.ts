import axios from "axios";
import { getUrl, getToken, getInnovatorServer } from "./arasUtil";

const http = axios.create();

export const applyItem = (query: string) => {
  const body = `<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/">
                    <SOAP-ENV:Body>
                        <ApplyItem>
                            <Item>
                                ${query}
                            </Item>
                        </ApplyItem>
                    </SOAP-ENV:Body>
                </SOAP-ENV:Envelope>`;
  const url = getUrl();
  return http
    .post(`${url}/${getInnovatorServer()}/Server/InnovatorServer.aspx`, body, {
      headers: {
        SOAPAction: "ApplyItem",
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "text/xml;charset=UTF-8",
      },
    })
    .then((res) => {
      const parser = new DOMParser();
      const dom = parser.parseFromString(res.data, "text/xml");
      const result = dom.querySelectorAll("Result>Item");
      return result;
    });
};
export const applyMethod = () => {
  console.log("applyMethod");
};
export const applySql = () => {
  console.log("applySql");
};
