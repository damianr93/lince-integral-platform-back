import { FollowUpDeliveryOption } from '../follow-up.rules';
/**
 * Obtiene la lista de canales activos basada en la configuración
 * YCloud no está migrado — devuelve array vacío.
 * Los eventos se crean de todas formas para manejo manual.
 */
export declare function getActiveChannels(): FollowUpDeliveryOption[];
/**
 * Verifica si un canal específico está activo
 */
export declare function isChannelActive(_channelType: string): boolean;
//# sourceMappingURL=channel-config.d.ts.map