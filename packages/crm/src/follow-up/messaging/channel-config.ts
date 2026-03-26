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

import { FollowUpDeliveryOption } from '../follow-up.rules';

/**
 * Obtiene la lista de canales activos basada en la configuración
 * YCloud no está migrado — devuelve array vacío.
 * Los eventos se crean de todas formas para manejo manual.
 */
export function getActiveChannels(): FollowUpDeliveryOption[] {
  return [];
}

/**
 * Verifica si un canal específico está activo
 */
export function isChannelActive(_channelType: string): boolean {
  return false;
}
