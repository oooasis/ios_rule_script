// 常量定义
let HTTP_STATUS_INVALID = -1;
let HTTP_STATUS_CONNECTED = 0;
let HTTP_STATUS_WAITRESPONSE = 1;
let HTTP_STATUS_FORWARDING = 2;
var httpStatus = HTTP_STATUS_INVALID;

// 会话tcp连接成功回调
function tunnelDidConnected() {
    // 只有当连接为 HTTP 时才执行一次写入请求头
    if (httpStatus === HTTP_STATUS_INVALID) {
        if (!$session.proxy.isTLS) {
            _writeHttpHeader();
            httpStatus = HTTP_STATUS_CONNECTED;
        }
    }
    return true;
}

// 会话进行 tls 握手
function tunnelTLSFinished() {
    // 只有在首次握手时才写入请求头
    if (httpStatus === HTTP_STATUS_INVALID) {
        _writeHttpHeader();
        httpStatus = HTTP_STATUS_CONNECTED;
    }
    return true;
}

// 从代理服务器读取到数据回调
function tunnelDidRead(data) {
    switch (httpStatus) {
        case HTTP_STATUS_WAITRESPONSE:
            // 假设 HTTP 握手成功，处理后续数据
            console.log("http handshake success");
            httpStatus = HTTP_STATUS_FORWARDING;
            $tunnel.established($session); // 开始数据转发
            return null; // 不转发 HTTP 握手数据到客户端

        case HTTP_STATUS_FORWARDING:
            return data;

        default:
            return null; // 若状态无效，不进行任何操作
    }
}

// 发送到代理服务器成功回调
function tunnelDidWrite() {
    if (httpStatus === HTTP_STATUS_CONNECTED) {
        console.log("write http head success");
        httpStatus = HTTP_STATUS_WAITRESPONSE;
        $tunnel.readTo($session, '\x0D\x0A\x0D\x0A'); // 读取数据直到遇到\r\n\r\n
        return false; // 中断 write 回调，表示已经写入请求头
    }
    return true;
}

// 会话关闭回调
function tunnelDidClose() {
    return true;
}

// 工具函数：构建 HTTP 请求头
function _writeHttpHeader() {
    let conHost = $session.conHost;
    let conPort = $session.conPort;

    // 优化：减少字符串拼接时的多余计算
    var header = `CONNECT ${conHost}:${conPort} HTTP/1.1\r\nHost: ${conHost}:${conPort}\r\nConnection: keep-alive\r\n\r\n`;
    $tunnel.write($session, header);
}
