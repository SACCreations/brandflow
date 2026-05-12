"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
function createPrismaClient() {
    const client = new client_1.PrismaClient({
        log: process.env['NODE_ENV'] === 'development'
            ? ['query', 'error', 'warn']
            : ['error'],
    });
    return client;
}
// Singleton: reuse in development to avoid exhausting connection pool
exports.prisma = global.__prisma ?? createPrismaClient();
if (process.env['NODE_ENV'] !== 'production') {
    global.__prisma = exports.prisma;
}
//# sourceMappingURL=client.js.map