"use strict";
// ========================================
// CONFIGURACIÓN DE CANALES DE MENSAJERÍA
// ========================================
//
// CONFIGURACIÓN ACTUAL:
// - YCloud WhatsApp: DESHABILITADO (no migrado)
// - EMAIL interno al equipo: Activo mediante InternalEmailChannel
//
// Los eventos de seguimiento se manejan manualmente (sin canales activos)
// y aparecen en la UI para que el asesor los resuelva.
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActiveChannels = getActiveChannels;
exports.isChannelActive = isChannelActive;
/**
 * Obtiene la lista de canales activos basada en la configuración
 * YCloud no está migrado — devuelve array vacío.
 * Los eventos se crean de todas formas para manejo manual.
 */
function getActiveChannels() {
    return [];
}
/**
 * Verifica si un canal específico está activo
 */
function isChannelActive(_channelType) {
    return false;
}
//# sourceMappingURL=channel-config.js.map