"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FOLLOW_UP_SUBJECTS = exports.FOLLOW_UP_TEMPLATE_BUILDERS = exports.CUSTOMER_FOLLOW_UP_RULES = void 0;
const HOUR_IN_MS = 60 * 60 * 1000;
const DAY_IN_MS = 24 * HOUR_IN_MS;
const channel_config_1 = require("./messaging/channel-config");
exports.CUSTOMER_FOLLOW_UP_RULES = {
    NO_CONTESTO: {
        delayMs: 24 * HOUR_IN_MS, // 24 horas
        templateId: 'NO_RESPONSE_24H',
        delivery: (0, channel_config_1.getActiveChannels)(),
    },
    SE_COTIZO_Y_PENDIENTE: {
        delayMs: 48 * HOUR_IN_MS, // 48 horas
        templateId: 'QUOTE_PENDING_48H',
        delivery: (0, channel_config_1.getActiveChannels)(),
    },
    COMPRO: {
        delayMs: 14 * DAY_IN_MS, // 14 días
        templateId: 'SATISFACTION_14D',
        delivery: (0, channel_config_1.getActiveChannels)(),
    },
};
exports.FOLLOW_UP_TEMPLATE_BUILDERS = {
    NO_RESPONSE_24H: () => `Hola, ¿cómo estás?
Te habíamos enviado la info del bloque de melaza PIPO. Si tenés alguna duda o querés que te lo coticemos, estamos para ayudarte.
📲 ¡Contanos si te interesa avanzar o si preferís que lo retomemos más adelante!`,
    QUOTE_PENDING_48H: () => `Hola cómo estás?
Te habíamos pasado la cotización del bloque de melaza PIPO. Solo queríamos saber si pudiste verla o si quedó alguna duda.
Si necesitás ajustar algo o querés que lo repasemos juntos, contanos. Estamos para ayudarte cuando lo necesites.`,
    SATISFACTION_14D: () => `Hola, ¿cómo estás? Pasaron unos días desde tu compra del bloque de melaza PIPO y queremos saber cómo fue tu experiencia. Te dejamos la encuesta de satisfacción para que nos cuentes qué tal salió todo. ¡Gracias por confiar en nosotros!`,
};
exports.FOLLOW_UP_SUBJECTS = {
    NO_RESPONSE_24H: 'Seguimiento de tu consulta PIPO',
    QUOTE_PENDING_48H: '¿Pudiste ver la cotización de PIPO?',
    SATISFACTION_14D: 'Encuesta de satisfacción PIPO',
};
//# sourceMappingURL=follow-up.rules.js.map