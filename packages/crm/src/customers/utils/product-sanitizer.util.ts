/**
 * Sanitizador de nombres de productos
 *
 * Mapea nombres de productos del chatbot u otras fuentes externas
 * a los nombres estándar utilizados en el sistema.
 *
 * Si no encuentra coincidencia, devuelve el valor original sin modificar.
 */

export const PRODUCT_NAME_MAP: Record<string, string> = {
  // Bloque de Melaza PIPO (variantes)
  'Bloque de Melaza PIPO': 'Bloque de Melaza Pipo',
  'bloque de melaza pipo': 'Bloque de Melaza Pipo',
  'BLOQUE DE MELAZA PIPO': 'Bloque de Melaza Pipo',
  'Bloque de melaza PIPO': 'Bloque de Melaza Pipo',

  // Concentrado de Proteína
  'Concentrado de Proteína de Soja': 'Concentrado de Proteina de Soja - Feed Grade',
  'Concentrado de Proteina de Soja': 'Concentrado de Proteina de Soja - Feed Grade',
  'concentrado de proteína de soja': 'Concentrado de Proteina de Soja - Feed Grade',
  'CONCENTRADO DE PROTEÍNA DE SOJA': 'Concentrado de Proteina de Soja - Feed Grade',

  // Fósforo de Origen Vegetal
  'Fósforo de Origen Vegetal': 'Fosforo de Origen Vegetal',
  'fósforo de origen vegetal': 'Fosforo de Origen Vegetal',
  'FÓSFORO DE ORIGEN VEGETAL': 'Fosforo de Origen Vegetal',
  'Fosforo de origen vegetal': 'Fosforo de Origen Vegetal',

  // Melaza Deshidratada -> Mela Dry
  'Melaza Deshidratada': 'Mela Dry',
  'melaza deshidratada': 'Mela Dry',
  'MELAZA DESHIDRATADA': 'Mela Dry',

  // Subproductos - Solubles de Destilería
  'Solubles de Destilería Concentrados': 'Solubles de Destileria Concentrados',
  'solubles de destilería concentrados': 'Solubles de Destileria Concentrados',
  'SOLUBLES DE DESTILERÍA CONCENTRADOS': 'Solubles de Destileria Concentrados',

  // Subproductos - Melaza de Caña
  'Melaza de Caña': 'Melaza de Cana',
  'melaza de caña': 'Melaza de Cana',
  'MELAZA DE CAÑA': 'Melaza de Cana',

  // Subproductos - Burlanda de Maíz
  'Burlanda de Maíz': 'Burlanda de Maiz',
  'burlanda de maíz': 'Burlanda de Maiz',
  'BURLANDA DE MAÍZ': 'Burlanda de Maiz',

  // Subproductos - Malta
  'Malta': 'Malta Humeda',
  'malta': 'Malta Humeda',
  'MALTA': 'Malta Humeda',

  // Subproductos - Cáscara de Citrus
  'Cascara citrus': 'Cascara de Citrus',
  'cascara citrus': 'Cascara de Citrus',
  'CASCARA CITRUS': 'Cascara de Citrus',
  'Cáscara de Citrus': 'Cascara de Citrus',

  // Subproductos - Germen de Maíz
  'Germen de Maíz': 'Germen de Maiz',
  'germen de maíz': 'Germen de Maiz',
  'GERMEN DE MAÍZ': 'Germen de Maiz',

  // Subproductos - Gluten Feed Pellet
  'Gluten feed pellet': 'Gluten Feed Pellet',
  'gluten feed pellet': 'Gluten Feed Pellet',
  'GLUTEN FEED PELLET': 'Gluten Feed Pellet',

  // Subproductos - Burlanda de Maíz Seca
  'Burlanda de Maíz (Seco)': 'Burlanda de Maiz (Seco)',
  'burlanda de maíz seca': 'Burlanda de Maiz (Seco)',
  'BURLANDA DE MAÍZ SECA': 'Burlanda de Maiz (Seco)',
};

/**
 * Sanitiza el nombre de un producto
 *
 * @param productName - Nombre del producto a sanitizar
 * @returns Nombre sanitizado, el valor original (si >4 chars), "-" (si <=4 chars), o undefined si está vacío
 */
export function sanitizeProductName(productName: string | null | undefined): string | undefined {
  // Si no hay valor, retornar undefined
  if (productName === null || productName === undefined || productName === '') {
    return undefined;
  }

  // Convertir a string por si acaso
  const productStr = String(productName).trim();

  // Si está vacío después de trim, retornar undefined
  if (!productStr) {
    return undefined;
  }

  // Buscar en el mapa (exacto)
  if (PRODUCT_NAME_MAP[productStr]) {
    return PRODUCT_NAME_MAP[productStr];
  }

  // Si no se encuentra mapeo:
  // - Si tiene más de 4 caracteres → devolver el valor original
  // - Si tiene 4 o menos caracteres → devolver "-"
  return productStr.length > 4 ? productStr : '-';
}
