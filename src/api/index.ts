import axios from '@/api/axios';

export interface loginResponse {
    at: string;
    rt: string;
    user: { apikey: string };
    region: string;
}

export const userLogin = (phoneNumber: string, password: string, countryCode: string) => {
    let data: { password: string; countryCode: string; email?: string; phoneNumber?: string } = {
        password: password,
        countryCode: countryCode
    }
    if (phoneNumber.includes('@')) {
        data.email = phoneNumber;
    }
    else
        data.phoneNumber = phoneNumber;
    return axios.post<any, loginResponse>("/v2/user/login", data)
}


export interface regionResponse {
    region: string;
}

export const getRegionInfo = (countryCode: string) => {
    return axios.get<any, regionResponse>(`/get-region`, { params: { countryCode } });
}

export interface roomListItem {
    id: string,	//N	房间 id
    name: string,	//N	房间名称
    index: number
}

export interface familyListItem {
    id: string,	//N	家庭 id
    apikey: string,	//N	用户 apikey
    name: string,	//N	家庭名称
    index: number,	//N	家庭排序号 可能存在负数
    roomList?: Array<roomListItem>	//Y	房间列表
}

export interface familyResponse {
    familyList: Array<familyListItem>,
    currentFamilyId: string
}

export const getFamilyAndRoomInfo = () => {
    return axios.get<any, familyResponse>("/v2/family");
}

export interface itemData {
    name: string,
    family: { roomid: string },
    extra: { uiid: number, ui: string }, //ui--- UI 的名称，uiid---UI 的 ID
    deviceid: string,
    showBrand: boolean,
    online: boolean,
    brandLogo: string,
    brandName: string,
    params: {
        switches: Array<{ outlet: number, switch: "on" | "off" }>,
        online: boolean
    }
    // name	String	N	设备名称
    // deviceid	String	N	设备 ID
    // apikey	String	N	设备所属用户的 apikey
    // extra	Object	N	factoryDevice 的 extra 字段中的内容
    // brandName	String	N	品牌名称
    // brandLogo	String	N	品牌 Logo url
    // showBrand	Boolean	N	是否显示品牌
    // productModel	String	N	产品型号名称
    // devGroups	Array < Object > Y	设备所属的群组信息列表
    // tags	Object	Y	标签对象，里面是存储的是自定义字符串，服务器只负责透传
    // devConfig	Object	Y	设备端配置信息，来源于 factorydevices 表的 deviceConfig。
    // settings	Object	Y	用户设置，参见【修改设备配置】接口说明
    // family	Object	N	设备的家庭设置
    // sharedBy	Object	Y	如果设备是别人分享过来的，就会有该属性。
    // shareTo	Array < Object > Y	被分享用户的列表，表示用户把设备分享给了哪些人。
    // devicekey	String	N	设备的出厂 apikey
    // online	Boolean	N	在线状态
    // params	Object	Y	设备的状态属性
    // gsmInfoData	Object	Y	GSM 设备的卡状态对象
}

export interface thingListItem {
    itemType?: number,
    index?: number,
    itemData: itemData
}

export interface familyDeviceListResponse {
    thingList: Array<thingListItem>,
    total: number
}

export const getFamilyDeviceList = (familyId: string) => {
    return axios.get<any, familyDeviceListResponse>(`/v2/device/thing`, {
        params: {
            familyId,
            num: 0
        }
    });
}

export interface longLinkInfo {
    IP: string,//N	长连接服务器外网 IP
    port: number,//N	长连接服务器外网端口
    domain: string,//N	长连接服务器域名。客户端建立长连接时使用该域名
    error: number,//N	成功返回 error:0
    reason: string,//N	成功返回 ok
}

export const getLongLinkInfo = (url: string) => {
    return axios.get<any, longLinkInfo>(url);
}
