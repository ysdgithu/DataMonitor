// 简单的 API 响应工具

export function success<T>(data: T, message = 'success') {
    return { code: 200, message, data };
}

export function error(message = '服务器错误', code = 500, data: any = null) {
    return { code, message, data };
}

export function unauthorized(message = '未登录') {
    return error(message, 401);
}

export function badRequest(message = '参数错误') {
    return error(message, 400);
}
