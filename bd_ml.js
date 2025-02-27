let HTTP_STATUS_INVALID = -1;
let HTTP_STATUS_CONNECTED = 0;
let HTTP_STATUS_WAITRESPONSE = 1;
let HTTP_STATUS_FORWARDING = 2;
var httpStatus = HTTP_STATUS_INVALID;

function tunnelDidConnected() {
    $session.proxy.isTLS ? null : _writeHttpHeader(); // 三元表达式提速
    httpStatus = HTTP_STATUS_CONNECTED;
    return true;
}

function tunnelTLSFinished() {
    _writeHttpHeader();
    return true;
}

function tunnelDidRead(data) {
    if (httpStatus === HTTP_STATUS_WAITRESPONSE) {
        httpStatus = HTTP_STATUS_FORWARDING;
        $tunnel.established($session);
        return null;
    }
    return data;
}

function tunnelDidWrite() {
    if (httpStatus === HTTP_STATUS_CONNECTED) {
        httpStatus = HTTP_STATUS_WAITRESPONSE;
        $tunnel.readTo($session, '\x0D\x0A\x0D\x0A'); // 保持二进制匹配
        return false;
    }
    return true;
}

function _writeHttpHeader() {
    // 修复协议头构造（关键修正点）
    const {conHost, conPort} = $session;
    const header = 
        `CONNECT ${conHost}:${conPort} HTTP/1.1\r\n` +  // 修复空格缺失
        `Host: ${conHost}:${conPort}\r\n` +             // 动态Host
        `Proxy-Connection: keep-alive\r\n\r\n`;         // 精简必要头
    
    $tunnel.write($session, header);
}

function tunnelDidClose() {
    return true;
}
