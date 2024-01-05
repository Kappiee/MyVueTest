import { arasConfig ,arasItemData} from "@/common/arasConfig";

//判断当前环境
export const isDevelopment = () => {
  return process.env.NODE_ENV === "development";
};
export const isProduction = () => {
  return process.env.NODE_ENV === "production";
};

export const getApiUrl = () => {
  return isDevelopment() ? arasConfig.localApiUrl : arasConfig.productionApiUrl;
};

export const getUrl = () => {
  return isDevelopment() ? arasConfig.testUrl : window.location.origin;
};

export const getInnovatorServer = () => {
  return arasConfig.innovatorServer;
};

export const getCurrentItem = () => {
  const tabActiveNode = top?.document.querySelector(
    "#main-tab .aras-tabs__tab_active"
  );
  if (!tabActiveNode) {
    return null;
  }

  const formId = tabActiveNode.getAttribute("data-id");
  if (!formId) {
    return null;
  }

  const formDocument = top?.document.getElementById(
    formId
  ) as HTMLIFrameElement;
  if (!formDocument?.contentWindow?.document) {
    return null;
  }

  const itemDocument = formDocument.contentWindow.document.getElementById(
    "instance"
  ) as HTMLIFrameElement;
  if (!itemDocument?.contentWindow?.document) {
    return null;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (itemDocument.contentWindow.document as any).thisItem || null;
};

//获取innovator
export const getInnovator = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (top as any).aras?.newIOMInnovator();
};

// 获取ArasToken
export const getToken = () => {
  if (isDevelopment()) {
    return arasConfig.token;
  } else {
    const key = `oidc.user:${window.location.origin}/${arasConfig.innovatorServer}/OAuthServer/:InnovatorClient`;
    const sessionKeys = Object.keys(sessionStorage);
    for (const sessionKey of sessionKeys) {
      if (sessionKey.toLowerCase() === key.toLowerCase()) {
        const json = JSON.parse(sessionStorage.getItem(sessionKey) ?? "");
        return json.access_token;
      }
    }
  }
};


//获取表单数据
export const getFormData = () =>{
  if (isProduction()) 
  {   
      arasItemData.hsProcessRouteData.formId = (parent as any).thisItem.getProperty('id');
      arasItemData.hsProcessRouteData.partId = (parent as any).thisItem.getProperty('hs_ebom');
  }
  return arasItemData
}