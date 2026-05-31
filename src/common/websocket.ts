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
    sequence?: string,
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
    const wsControlRes: Array<{ reject: (reason?: any) => void, resolve: (value: string) => void, sequence: string, deviceid: string, switches: Array<{ outlet: number, switch: "on" | "off" }> }> = []
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
            reConnectInterval = 0
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
                clearTimeout(heartbeatTimeoutTimer ? heartbeatTimeoutTimer : undefined)
                return;
            }
            let msg = JSON.parse(event.data)
            if (msg.error === 0 && msg.config) {
                config.value = msg.config
                startHeartbeat()
            }
            listeners.forEach(fn => fn(msg))
        }

        ws.onclose = () => {
            stopHeartbeat()
            connect()
        }

        ws.onerror = () => {
            ws?.close()
        }
        connectingFlag = false;
    }

    const startHeartbeat = () => {
        if (!config.value || config.value.hb !== 1) return
        const interval = (config.value.hbInterval || 90) * (0.8 + Math.random() * 0.2)
        heartbeatTimer = setTimeout(() => {
            ws?.send("ping")
            heartbeatTimeoutTimer = setTimeout(() => {
                stopHeartbeat()
                connect()
            }, heartbeatTimeout);
            startHeartbeat()
        }, interval * 1000)
    }

    const stopHeartbeat = () => {
        if (heartbeatTimer) {
            clearTimeout(heartbeatTimer)
            heartbeatTimer = null
        }
    }

    const send = (data: WsSendData) => {
        ws?.send(JSON.stringify(data))
    }

    const close = () => {
        stopHeartbeat()
        clearTimeout(heartbeatTimeoutTimer as number)
        ws?.close()
    }


    const onMessage = (handler: (data: WebSocketMessage) => void) => {
        listeners.push(handler)
    }

    const dealWsRes = (data: WebSocketMessage) => {
        let hasWsControlRs = -1
        const userStore = useUserStore()
        wsControlRes.forEach((item, index) => {
            if (item.sequence === data.sequence) {
                hasWsControlRs = index
            }
        })
        if (hasWsControlRs !== -1) {
            const targetRs = wsControlRes[hasWsControlRs]
            if (data.error === 0) {
                Object.values(userStore.roomDeviceList).forEach((deviceArray) => {
                    deviceArray.forEach((device) => {
                        if (device.deviceid === targetRs.deviceid) {
                            device.params.switches = targetRs.switches!
                        }
                    })
                })
                targetRs.resolve("ok")
            }
            else
                targetRs.reject(data.error)
            wsControlRes.splice(hasWsControlRs, 1)
            return;
        }
        if (data.error !== undefined && data.error !== 0)
            return;
        const { action } = data
        if (action === "sysmsg") {  //上下线
            const { deviceid, params: { online } } = data
            Object.values(userStore.roomDeviceList).forEach((deviceArray) => {
                deviceArray.forEach((device) => {
                    if (device.deviceid === deviceid) {
                        device.params.online = online!
                    }
                })
            })
            return;
        }
        if (action !== "update") return  //别的客户端更新状态后，本客户端同步
        const { deviceid, params: { switches } } = data
        Object.values(userStore.roomDeviceList).forEach((deviceArray) => {
            deviceArray.forEach((device) => {
                if (device.deviceid === deviceid) {
                    device.params.switches = switches!
                }
            })
        })

    }

    const sendRequest = (data: WsSendData) => {
        send(data)
        return new Promise((resolve, reject) => {
            wsControlRes.push({ reject, resolve, sequence: data.sequence, deviceid: data.deviceid, switches: data.params.switches })
        })

    }


    const init = () => {
        listeners.push(dealWsRes)
    }
    init()



    return { ws, config, connect, send, close, onMessage, listeners, sendRequest }
}
