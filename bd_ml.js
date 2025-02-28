//自定义函数
let HTTP_STATUS_INVALID = -1
let HTTP_STATUS_CONNECTED = 0
let HTTP_STATUS_WAITRESPONSE = 1
let HTTP_STATUS_FORWARDING = 2
var httpStatus = HTTP_STATUS_INVALID
//会话tcp连接成功回调
function tunnelDidConnected() {
    console.log($session)
    if ($session.proxy.isTLS) {
        //https
    } else {
        //http
        _writeHttpHeader()
        httpStatus = HTTP_STATUS_CONNECTED
    }
    return true
}
//会话进行tls握手
function tunnelTLSFinished() {
    _writeHttpHeader()
    httpStatus = HTTP_STATUS_CONNECTED
    return true
}
//从代理服务器读取到数据回调
function tunnelDidRead(data) {
    if (httpStatus == HTTP_STATUS_WAITRESPONSE) {
        //check http response code == 200
        //Assume success here
        httpStatus = HTTP_STATUS_FORWARDING
        $tunnel.established($session)//
        return null//
    } else if (httpStatus == HTTP_STATUS_FORWARDING) {
        return data
    }
}
//发送到代理服务器成功
function tunnelDidWrite() {
    if (httpStatus == HTTP_STATUS_CONNECTED) {
        console.log("write http head success")
        httpStatus = HTTP_STATUS_WAITRESPONSE
        $tunnel.readTo($session, "\x0D\x0A\x0D\x0A")//读取远端数据直到出现\r\n\r\n
        return false //中断wirte callback
    }
    return true
}
//会话关闭
function tunnelDidClose() {
    return true
}

//Tools
function _writeHttpHeader() {
    let conHost = $session.conHost
    let conPort = $session.conPort

    var header = `CONNECT ${conHost}:${conPort}HTTP/1.1\r\nHost: ${conHost}:${conPort}\r\nConnection: keep-alive\r\n\r\n`
    $tunnel.write($session, header)
}
