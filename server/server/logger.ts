export default {
    info: (msg: any) => {
        console.log(`${ new Date().toISOString() } [INFO] ${msg}`)
    },
    warn: (msg: any) => {
        console.warn(`${ new Date().toISOString() } [WARN] ${msg}`)
    },
    error: (msg: any) => {
        console.error(`${ new Date().toISOString() } [ERROR] ${msg}`)
    }
}