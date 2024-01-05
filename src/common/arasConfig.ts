import { reactive } from "vue";
export const arasConfig = reactive({
  token: "",
  innovatorServer: "innovatorServer",
  localApiUrl: "http://localhost:55798",
  testUrl: "http://192.168.110.43",
  productionApiUrl: window.location.origin + "/WYZX_8D",
});
export const arasItemData = reactive({
  hsProcessRouteData: {
    formId: "0BC78B170A2443AB8353569A9DA2BAD1",
    partId: "2E00DD06AB40408389A66126457EF747",
  },
});
