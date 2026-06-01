import { useUserStore } from '@/store/user';
import { ref } from 'vue'
let reConnectInterval = 0;
const reConnectMaxInterval = 60
let connectingFlag = false
function randomNonce(length = 8): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
        result += chars[Math.floor(Math.random() * chars.length)]
    }
    return result
}

interface HandshakeParams {
    at: string
    apikey: string
    appid: string
}

interface WsConfig {
    hb: number
    hbInterval: number
}

export interface WebSocketMessage {
    action?: string,
    deviceid?: string,
    error: number,
    sequence: string,
    params: { switches?: Array<{ outlet: number, switch: 'off' | 'on' }>, online?: boolean }
}

export interface WsSendData {
    action: string,
    apikey: string,
    deviceid: string,
    params: {
        switches: {
            outlet: number;
            switch: "off" | "on";
        }[]
    },
    userAgent: string,
    sequence: string
}



export function useWebSocket(domain: string, port: number, handshake: HandshakeParams) {

    const config = ref<WsConfig | null>(null)
    let ws: WebSocket | null = null
    let heartbeatTimer: ReturnType<typeof setTimeout> | null = null
    let heartbeatTimeoutTimer: ReturnType<typeof setTimeout> | null = null
    const heartbeatTimeout = 5000
    const wsControlRes: Map<string, { reject: (reason?: any) => void, resolve: (value: string) => void, deviceid: string, switches: Array<{ outlet: number, switch: "on" | "off" }> }> = new Map()
    const listeners: Array<(data: any) => void> = []


    const connect = async () => {
        if (connectingFlag === true)
            return;
        connectingFlag = true;
        await new Promise((resolve) => setTimeout(() => resolve(""), reConnectInterval * 1000))
        reConnectInterval += 5;
        if (reConnectInterval > reConnectMaxInterval)
            return;
        const url = `wss://${domain}:${port}/api/ws`
        ws = new WebSocket(url)

        ws.onopen = () => {
            const handshakeMsg = {
                action: 'userOnline',
                version: 8,
                at: handshake.at,
                userAgent: 'app',
                apikey: handshake.apikey,
                appid: handshake.appid,
                nonce: randomNonce(),
                sequence: Date.now().toString(),
            }
            ws!.send(JSON.stringify(handshakeMsg))
        }

        ws.onmessage = (event) => {
            console.log("WebSocket message received:", event)
            if (event.data === "pong") {
                clearHeartbeatTimeout()
                return;
            }
            let msg = JSON.parse(event.data)
            if (msg.error === 0 && msg.config) {
                config.value = msg.config

                reConnectInterval = 0
                connectingFlag = false; //握手成功才是真的建好webSocket了

                startHeartbeat()
            }
            if (msg.error !== 0 && msg.config) {
                //握手失败，重新connect一下
                connectingFlag = false
                connect()

            };
            ;

            listeners.forEach(fn => fn(msg))
        }

        ws.onclose = (event) => {
            connectingFlag = false
            stopHeartbeat()
            clearHeartbeatTimeout()
            if (event.code !== 4001)
                connect()
        }

        ws.onerror = () => {
            console.log("这是ws.onerror")
        }

    }

    const startHeartbeat = () => {
        if (!config.value || config.value.hb !== 1) return
        const interval = (config.value.hbInterval || 90) * (0.8 + Math.random() * 0.2)
        heartbeatTimer = setInterval(() => {
            ws?.send("ping")
            heartbeatTimeoutTimer = setTimeout(() => {
                stopHeartbeat()
                connect()
            }, heartbeatTimeout);
        }, interval * 1000)
    }

    const stopHeartbeat = () => {
        if (heartbeatTimer) {
            clearTimeout(heartbeatTimer)
            heartbeatTimer = null
        }
    }

    const clearHeartbeatTimeout = () => {
        if (heartbeatTimeoutTimer) {
            clearTimeout(heartbeatTimeoutTimer)
            heartbeatTimeoutTimer = null
        }
    }

    const send = (data: WsSendData) => {
        ws?.send(JSON.stringify(data))
    }

    const close = (params: { manualClose: boolean } = { manualClose: false }) => {
        stopHeartbeat()
        clearHeartbeatTimeout()
        const code = params.manualClose ? 4001 : 1005
        ws?.close(code)
    }


    const onMessage = (handler: (data: WebSocketMessage) => void) => {
        listeners.push(handler)
    }

    const dealWsRes = (data: WebSocketMessage) => {
        const userStore = useUserStore()
        if (wsControlRes.has(data.sequence)) {
            const targetRs = wsControlRes.get(data.sequence)!
            if (data.error === 0) {
                Object.values(userStore.roomDeviceList).find((deviceArray) => {
                    const result = deviceArray.find((device) => {
                        if (device.deviceid === targetRs.deviceid) {
                            device.params.switches = targetRs.switches!
                            return true
                        }
                    })
                    if (result)
                        return true
                })
                targetRs.resolve("ok")
            }
            else
                targetRs.reject(data.error)
            wsControlRes.delete(data.sequence)
            return;
        }
        if (data.error !== undefined && data.error !== 0)
            return;
        const { action } = data
        if (action === "sysmsg") {  //上下线
            const { deviceid, params: { online } } = data
            Object.values(userStore.roomDeviceList).find((deviceArray) => {
                const result = deviceArray.find((device) => {
                    if (device.deviceid === deviceid) {
                        device.params.online = online!
                        return true;
                    }
                })
                if (result)
                    return true
            })
            return;
        }
        if (action !== "update") return  //别的客户端更新状态后，本客户端同步
        const { deviceid, params: { switches } } = data
        Object.values(userStore.roomDeviceList).find((deviceArray) => {
            const result = deviceArray.find((device) => {
                if (device.deviceid === deviceid) {
                    device.params.switches = switches!
                    return true;
                }
            })
            if (result)
                return true;
        })

    }

    const sendRequest = (data: WsSendData) => {
        send(data)
        return new Promise((resolve, reject) => {
            wsControlRes.set(data.sequence, { reject, resolve, deviceid: data.deviceid, switches: data.params.switches })
        })

    }


    const init = () => {
        listeners.push(dealWsRes)
    }
    init()



    return { ws, config, connect, send, close, onMessage, listeners, sendRequest }
}
