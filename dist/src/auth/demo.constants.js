"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEMO_EMAIL_BY_ROLE = void 0;
const user_entity_1 = require("../users/user.entity");
exports.DEMO_EMAIL_BY_ROLE = {
    [user_entity_1.UserRole.SECRETARIA]: 'demo-secretaria@demo.local',
    [user_entity_1.UserRole.COMPRAS]: 'demo-compras@demo.local',
    [user_entity_1.UserRole.TESORERIA]: 'demo-tesoreria@demo.local',
    [user_entity_1.UserRole.ADMIN]: 'demo-admin@demo.local',
};
//# sourceMappingURL=demo.constants.js.map