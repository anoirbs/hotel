"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var bcryptjs_1 = require("bcryptjs");
var promises_1 = require("fs/promises");
var path_1 = require("path");
var gridfs_1 = require("@/lib/gridfs");
var prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var hashedAdminPassword, hashedUserPassword, imageId, imagePath, imageBuffer, error_1, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 11, 12, 14]);
                    return [4 /*yield*/, bcryptjs_1.default.hash('admin123', 10)];
                case 1:
                    hashedAdminPassword = _a.sent();
                    return [4 /*yield*/, bcryptjs_1.default.hash('user123', 10)];
                case 2:
                    hashedUserPassword = _a.sent();
                    return [4 /*yield*/, prisma.user.upsert({
                            where: { email: 'admin@example.com' },
                            update: {},
                            create: {
                                email: 'admin@example.com',
                                password: hashedAdminPassword,
                                isAdmin: true,
                            },
                        })];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, prisma.user.upsert({
                            where: { email: 'user@example.com' },
                            update: {},
                            create: {
                                email: 'user@example.com',
                                password: hashedUserPassword,
                                isAdmin: false,
                            },
                        })];
                case 4:
                    _a.sent();
                    imageId = void 0;
                    _a.label = 5;
                case 5:
                    _a.trys.push([5, 8, , 9]);
                    imagePath = path_1.default.join(__dirname, 'sample-room.jpg');
                    return [4 /*yield*/, promises_1.default.readFile(imagePath)];
                case 6:
                    imageBuffer = _a.sent();
                    return [4 /*yield*/, (0, gridfs_1.uploadImage)(imageBuffer, 'sample-room.jpg')];
                case 7:
                    imageId = _a.sent();
                    return [3 /*break*/, 9];
                case 8:
                    error_1 = _a.sent();
                    console.warn('Sample image not found, skipping image upload:', error_1);
                    return [3 /*break*/, 9];
                case 9: return [4 /*yield*/, prisma.room.createMany({
                        data: [
                            { name: 'Room 101', type: 'Single', price: 100, description: 'Cozy single room', available: true, imageId: imageId },
                            { name: 'Room 102', type: 'Double', price: 150, description: 'Spacious double room', available: true, imageId: imageId },
                        ],
                        skipDuplicates: true,
                    })];
                case 10:
                    _a.sent();
                    console.log('Database seeded successfully');
                    return [3 /*break*/, 14];
                case 11:
                    error_2 = _a.sent();
                    console.error('Error seeding database:', error_2);
                    process.exit(1);
                    return [3 /*break*/, 14];
                case 12: return [4 /*yield*/, prisma.$disconnect()];
                case 13:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 14: return [2 /*return*/];
            }
        });
    });
}
main();
