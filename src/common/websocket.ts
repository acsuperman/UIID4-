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
    sequence?: string,
    params: { switches?: Array<{ outlet: number, switch: 'off' | 'on' }>, online?: boolean }
}


export function useWebSocket(domain: string, port: number, handshake: HandshakeParams) {

    const config = ref<WsConfig | null>(null)
    let ws: WebSocket | null = null
    let heartbeatTimer: ReturnType<typeof setTimeout> | null = null
    let heartbeatTimeoutTimer: ReturnType<typeof setTimeout> | null = null
    const heartbeatTimeout = 5000
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
            if (msg.error !== 0) {
                console.log("websocket返回错误,错误码：", msg.error)
                return;
            }
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

    const send = (data: object) => {
        ws?.send(JSON.stringify(data))
    }

    const close = () => {
        stopHeartbeat()
        ws?.close()
    }


    const onMessage = (handler: (data: WebSocketMessage) => void) => {
        listeners.push(handler)
    }

    return { ws, config, connect, send, close, onMessage, listeners }
}
