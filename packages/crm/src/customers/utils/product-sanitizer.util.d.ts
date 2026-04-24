/**
 * Sanitizador de nombres de productos
 *
 * Mapea nombres de productos del chatbot u otras fuentes externas
 * a los nombres estándar utilizados en el sistema.
 *
 * Si no encuentra coincidencia, devuelve el valor original sin modificar.
 */
export declare const PRODUCT_NAME_MAP: Record<string, string>;
/**
 * Sanitiza el nombre de un producto
 *
 * @param productName - Nombre del producto a sanitizar
 * @returns Nombre sanitizado, el valor original (si >4 chars), "-" (si <=4 chars), o undefined si está vacío
 */
export declare function sanitizeProductName(productName: string | null | undefined): string | undefined;
//# sourceMappingURL=product-sanitizer.util.d.ts.map