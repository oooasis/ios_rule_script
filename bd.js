let HTTP_STATUS_INVALID = -1;
let HTTP_STATUS_CONNECTED = 0;
let HTTP_STATUS_WAITRESPONSE = 1;
let HTTP_STATUS_FORWARDING = 2;
var httpStatus = HTTP_STATUS_INVALID;

// 移除所有验证计算
function tunnelDidConnected() {
    if ($session.proxy.isTLS) {
        // HTTPS逻辑保持空置
    } else {
        _writeHttpHeader();
        httpStatus = HTTP_STATUS_CONNECTED;
    }
    return true; // 快速返回
}

function tunnelTLSFinished() {
    _writeHttpHeader();
    httpStatus = HTTP_STATUS_CONNECTED;
    return true; // 移除调试语句
}

function tunnelDidRead(data) {
    if (httpStatus === HTTP_STATUS_WAITRESPONSE) {
        httpStatus = HTTP_STATUS_FORWARDING;
        $tunnel.established($session);
        return null; // 快速终止处理
    }
    return data; // 直接透传
}

function tunnelDidWrite() {
    if (httpStatus === HTTP_STATUS_CONNECTED) {
        httpStatus = HTTP_STATUS_WAITRESPONSE;
        $tunnel.readTo($session, '\x0D\x0A\x0D\x0A'); // 使用字节匹配
        return false; // 立即中断
    }
    return true;
}

function _writeHttpHeader() {
    // 最小化字符串操作
    const header = `CONNECT ${$session.conHost}:${$session.conPort} HTTP/1.1\r\n` +
                   `Host: ${$session.conHost}:${$session.conPort}\r\n` +
                   `Proxy-Connection: keep-alive\r\n\r\n`;
                   
    $tunnel.write($session, header);
}

function tunnelDidClose() {
    return true; // 最简关闭处理
}
