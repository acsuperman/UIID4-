import axios from '@/api/axios';

export interface loginResponse {
    at: string;
    rt: string;
    user: {};
    region: string;
}

export const userLogin = (phoneNumber: string, password: string, countryCode: string) => {
    return axios.post<any, loginResponse>("/v2/user/login", {
        phoneNumber: phoneNumber,
        password: password,
        countryCode: countryCode
    })
}

export interface homePageInfoResponse {
    userInfo?: Object;
    familyInfo?: Object;
    thingInfo?: Object;
    sceneInfo?: Object;
    messageInfo?: Object;
}


export const getHomePageInfo = () => {
    return axios.post<any, homePageInfoResponse>("/v2/homepage", {
    })
}

// export const getLongLink
