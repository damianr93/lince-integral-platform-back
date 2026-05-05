import {
  parseRetencionText,
  parseRemitoText,
  parseFacturaText,
  validateCuitChecksum,
} from '../vision/vision.parser';
import { validateRetencion } from '../validation/rules/retencion.rules';

// ─── Fixtures de CUIT con checksum verificado ────────────────────────────────
// 33-53534712-9 → emisor (agente de retención)
// 30-71002420-7 → retenido (Lince S.A.)
// 20-98765432-6 → CUIT alternativo para tests de múltiples candidatos

// ─── validateCuitChecksum ─────────────────────────────────────────────────────

describe('validateCuitChecksum', () => {
  it('acepta CUITs con checksum correcto', () => {
    expect(validateCuitChecksum('33-53534712-9')).toBe(true);
    expect(validateCuitChecksum('30-71002420-7')).toBe(true);
    expect(validateCuitChecksum('20-98765432-6')).toBe(true);
    expect(validateCuitChecksum('33537124209')).toBe(false); // 11 digits but wrong check
  });

  it('rechaza CUITs con dígito verificador incorrecto', () => {
    expect(validateCuitChecksum('33-53534712-0')).toBe(false);
    expect(validateCuitChecksum('20-12345678-0')).toBe(false); // correct is 6
  });

  it('rechaza strings con longitud distinta de 11 dígitos', () => {
    expect(validateCuitChecksum('20-1234567-8')).toBe(false);  // 10 digits
    expect(validateCuitChecksum('20-123456789-0')).toBe(false); // 12 digits
    expect(validateCuitChecksum('')).toBe(false);
  });
});

// ─── parseRetencionText ───────────────────────────────────────────────────────

describe('parseRetencionText', () => {
  describe('formato estándar SICOR', () => {
    const SICOR_STD = `
      CERTIFICADO DE RETENCIÓN
      Agente de Retención: EMPRESA ABC S.A.
      C.U.I.T. N°: 33-53534712-9
      Impuesto: GANANCIAS
      Sujeto Retenido: LINCE S.A.
      C.U.I.T. N°: 30-71002420-7
      Monto de la Retención
      $ 436.116,34
    `;

    it('extrae cuitEmisor del agente de retención', () => {
      const { cuitEmisor } = parseRetencionText(SICOR_STD);
      expect(cuitEmisor).toBe('33-53534712-9');
    });

    it('clasifica tipoImpuesto como GANANCIAS', () => {
      const { tipoImpuesto } = parseRetencionText(SICOR_STD);
      expect(tipoImpuesto).toBe('GANANCIAS');
    });

    it('extrae el monto correcto', () => {
      const { monto } = parseRetencionText(SICOR_STD);
      expect(monto).toBe('436.116,34');
    });
  });

  describe('retención IIBB', () => {
    const IIBB_TEXT = `
      Agente de Retención
      33-53534712-9
      Dirección General de Rentas Santiago del Estero
      Ingresos Brutos — Res. 123/2024
      Sujeto Retenido: LINCE
      30-71002420-7
      Importe Retenido: $ 15.000,00
    `;

    it('clasifica IIBB correctamente', () => {
      expect(parseRetencionText(IIBB_TEXT).tipoImpuesto).toBe('IIBB');
    });

    it('extrae monto con etiqueta "Importe Retenido"', () => {
      expect(parseRetencionText(IIBB_TEXT).monto).toBe('15.000,00');
    });

    it('extrae provincia si la jurisdicción IIBB aparece en el texto', () => {
      expect(parseRetencionText(IIBB_TEXT).provincia).toBe('Santiago del Estero');
    });
  });

  describe('variantes de IIBB en texto OCR', () => {
    it('detecta "II.BB."', () => {
      expect(parseRetencionText('Agente 33-53534712-9 II.BB. Monto $ 100,00').tipoImpuesto).toBe('IIBB');
    });

    it('detecta "IIBB"', () => {
      expect(parseRetencionText('Agente 33-53534712-9 IIBB Monto $ 100,00').tipoImpuesto).toBe('IIBB');
    });

    it('detecta "Ingresos Brutos"', () => {
      expect(parseRetencionText('33-53534712-9 Ingresos Brutos $ 100,00').tipoImpuesto).toBe('IIBB');
    });

    it('detecta provincia con acentos o sin acentos', () => {
      expect(parseRetencionText('IIBB Provincia de Cordoba Monto $ 100,00').provincia).toBe('Córdoba');
      expect(parseRetencionText('Ingresos Brutos Dirección General de Rentas Tucumán $ 100,00').provincia).toBe('Tucumán');
    });

    it('detecta CABA como Ciudad Autónoma de Buenos Aires', () => {
      expect(parseRetencionText('IIBB Jurisdicción CABA Monto $ 100,00').provincia).toBe('Ciudad Autónoma de Buenos Aires');
    });
  });

  describe('provincia opcional', () => {
    it('no extrae provincia desde domicilios en certificados de Ganancias', () => {
      const text = `
        Comprobante de impuesto a las Ganancias
        Agente de Retención 33-53534712-9
        Beneficiario LINCE S.A.
        Domicilio: Villa Nueva - Córdoba
        Monto de la Retención $ 1.000,00
      `;

      expect(parseRetencionText(text).provincia).toBe('');
    });
  });

  describe('layout desordenado (no SICOR estándar)', () => {
    const DISORDERED = `
      RETENCION IMPUESTO GANANCIAS
      Total Retenido $ 8.500,50
      Agente: 33-53534712-9
      Retenido: 30-71002420-7
    `;

    it('encuentra el CUIT del agente aunque no esté bajo etiqueta estándar', () => {
      const { cuitEmisor } = parseRetencionText(DISORDERED);
      expect(cuitEmisor).toBe('33-53534712-9');
    });

    it('extrae el monto con etiqueta "Total Retenido"', () => {
      expect(parseRetencionText(DISORDERED).monto).toBe('8.500,50');
    });
  });

  describe('múltiples CUITs en el documento', () => {
    const MULTI_CUIT = `
      Agente de Retención: EMPRESA TEST
      CUIT Agente: 33-53534712-9
      Impuesto: GANANCIAS
      Sujeto Retenido: LINCE S.A.
      CUIT Retenido: 30-71002420-7
      Monto de la Retención: $ 22.000,00
    `;

    it('elige el CUIT del agente sobre el del retenido', () => {
      const { cuitEmisor } = parseRetencionText(MULTI_CUIT);
      expect(cuitEmisor).toBe('33-53534712-9');
    });
  });

  describe('múltiples montos en el documento', () => {
    const MULTI_MONTO = `
      Agente 33-53534712-9 GANANCIAS
      Base de cálculo: $ 100.000,00
      Alícuota: 6,00%
      Monto de la Retención
      $ 6.000,00
    `;

    it('elige el monto más cercano a "Monto de la Retención"', () => {
      const { monto } = parseRetencionText(MULTI_MONTO);
      expect(monto).toBe('6.000,00');
    });
  });

  describe('retenciones discriminadas', () => {
    it('suma conceptos debajo de "Neto a retener"', () => {
      const text = `
        Certificado de retención IIBB
        Agente de Retención 33-53534712-9
        Sujeto retenido LINCE S.A. 30-71002420-7
        Neto a retener
        Retención IIBB Córdoba 12.300,10
        Retención IIBB Santa Fe 4.500,20
        Retención IIBB Buenos Aires 1.199,70
      `;

      expect(parseRetencionText(text).monto).toBe('18.000,00');
    });

    it('suma la última columna cuando las filas bajo "Neto a Retener" traen la tabla completa', () => {
      const text = `
        Certificado de Retención Imp. a las Ganancias
        Agente de Retención 33-53534712-9
        Sujeto retenido LINCE S.A. 30-71002420-7
        Importe Neto Acumulado Mínimo No Alcanzado Base Imponible Alícuota Importe a Retener Acumulado Retención Neto a Retener
        2.461.975,45 2.461.975,45 224.000,00 2.237.975,45 2,00 44.759,51 44.759,51 44.759,51
        2.076.795,07 4.538.770,52 224.000,00 4.314.770,52 2,00 8.625,47 86.255,41 8.625,47
        2.325.869,67 6.864.640,19 224.000,00 6.640.640,19 2,00 132.812,80 86.255,41 132.812,80
      `;

      expect(parseRetencionText(text).monto).toBe('186.197,78');
    });

    it('suma netos a retener cuando Document AI lee la tabla por grupos de alícuota', () => {
      const text = `
        CERTIFICADO DE RETENCION
        IMP.A LAS GANANCIAS
        CUIT: 30-50068944-3
        30-70736032-8
        Importe
        Importe
        Neto
        Acumulado
        Minimo
        No Alcanzado Imponible
        Base
        Monto
        Fijo Ret.
        Exedente Alicuota Importe
        Gravado
        a Retener
        Acumulado
        Retención
        Neto a
        Retener
        2,461,975.45
        2,461,975.45
        2,076,795.07
        224,000.00 2,237,975.45
        4,538,770.52 224,000.00 4,314,770.52
        2.00
        44,759.51
        44,759.51
        2.00
        86,295.41 44,759.51 41,535.90
        2,325,869.67 6,864,640.19 224,000.00 6,640,640.19
        2.00
        132,812.80
        86,295.41
        46,517.39
        Comprobante
      `;

      expect(parseRetencionText(text).monto).toBe('132.812,80');
    });

    it('elige Total retenido y no la alícuota cuando ambos aparecen como importes', () => {
      const text = `
        Certificado de retención IIBB
        Agente de Retención 33-53534712-9
        Base imponible 50.000,00
        Alicuota 3,00
        Total retenido 1.500,00
      `;

      expect(parseRetencionText(text).monto).toBe('1.500,00');
    });

    it('lee Total Retenido con punto decimal y no toma Alícuota', () => {
      const text = `
        Impuesto sobre los Ingresos Brutos
        Comprobante de Retención
        DIRECCIÓN GENERAL DE RENTAS SANTIAGO DEL ESTERO
        Datos del Agente de Retención
        CUIT N°: 30715133209
        ESTANCIA EL DUENDE SRL
        Datos del Sujeto Retenido
        CUIT N°: 30707360328
        LINCE S.A.
        Detalle de Liquidación
        Total Comprobante 1947528,78
        Neto 1609527,92
        Alícuota : 1,50
        Total Calculado: $ 24142.92
        Total Retenido: $ 24142.92
      `;

      expect(parseRetencionText(text).monto).toBe('24.142,92');
    });
  });

  describe('ruido OCR (O→0, separadores raros)', () => {
    it('normaliza CUIT con dígitos alfanuméricos confundidos si quedan 11 dígitos válidos', () => {
      // "33-53534712-9" con OCR perfecto — verifica que el parser no lo rompe
      const text = `Agente de Retención 33-53534712-9 GANANCIAS Monto de la Retención $ 1.234,56`;
      expect(parseRetencionText(text).cuitEmisor).toBe('33-53534712-9');
    });

    it('acepta CUIT sin separadores (11 dígitos continuos)', () => {
      const text = `Agente de Retención 33535347129 GANANCIAS Monto $ 500,00`;
      expect(parseRetencionText(text).cuitEmisor).toBe('33-53534712-9');
    });

    it('acepta CUIT con espacios como separadores', () => {
      const text = `Agente de Retención 33 53534712 9 GANANCIAS Monto de la Retención $ 200,00`;
      expect(parseRetencionText(text).cuitEmisor).toBe('33-53534712-9');
    });

    it('acepta monto sin separadores de miles', () => {
      const text = `Agente 33-53534712-9 GANANCIAS Monto de la Retención $ 500,00`;
      expect(parseRetencionText(text).monto).toBe('500,00');
    });
  });

  describe('manuscrito simulado (texto muy ruidoso)', () => {
    const HANDWRITTEN = `
      AGcNTE de RcTcNCION: EMPReSA XYZ
      CUlT: 33-53534712-9
      lMPUeSTO: GANANClAS
      MONTO ReTENlDO: $ 3.200,75
    `;

    it('extrae CUIT aunque haya mayúsculas mixtas y OCR ruidoso', () => {
      expect(parseRetencionText(HANDWRITTEN).cuitEmisor).toBe('33-53534712-9');
    });

    it('detecta GANANCIAS con variantes de caracteres', () => {
      expect(parseRetencionText(HANDWRITTEN).tipoImpuesto).toBe('GANANCIAS');
    });

    it('extrae monto en texto ruidoso', () => {
      expect(parseRetencionText(HANDWRITTEN).monto).toBe('3.200,75');
    });
  });

  describe('texto vacío y sin datos', () => {
    it('devuelve campos vacíos para input vacío', () => {
      const { cuitEmisor, tipoImpuesto, monto } = parseRetencionText('');
      expect(cuitEmisor).toBe('');
      expect(tipoImpuesto).toBe('');
      expect(monto).toBe('');
    });

    it('devuelve campos vacíos si no hay datos reconocibles', () => {
      const { cuitEmisor, tipoImpuesto, monto } = parseRetencionText('Lorem ipsum dolor sit amet');
      expect(cuitEmisor).toBe('');
      expect(tipoImpuesto).toBe('');
      expect(monto).toBe('');
    });

    it('no confunde años con montos', () => {
      const text = `Agente 33-53534712-9 GANANCIAS Período: 2024 Monto de la Retención $ 500,00`;
      expect(parseRetencionText(text).monto).toBe('500,00');
    });
  });

  describe('non-regression — remito y factura no se ven afectados', () => {
    it('parseRemitoText sigue devolviendo el objeto esperado', () => {
      const fields = parseRemitoText('');
      expect(fields).toHaveProperty('nroRemito');
      expect(fields).toHaveProperty('fecha');
      expect(fields).toHaveProperty('cliente');
      expect(fields).toHaveProperty('rawText');
    });

    it('parseFacturaText sigue devolviendo el objeto esperado', () => {
      const fields = parseFacturaText('');
      expect(fields).toHaveProperty('numero');
      expect(fields).toHaveProperty('cuit');
      expect(fields).toHaveProperty('total');
      expect(fields).toHaveProperty('rawText');
    });
  });
});

  describe('formulario RG 830 AFIP manuscrito (estructura real observada)', () => {
    // Simula lo que Vision OCR produce en los formularios manuscritos de Rafael Luis Barra.
    // El CUIT del agente va en casilleros individuales → OCR lo lee con espacios entre dígitos.
    // "Retención Practicada" y "Son" son los labels que contienen el monto real.
    // "Importe del Pago" es el bruto — NO debe ser elegido.
    const RG830_DOC1 = `
      Comprobante de impuesto a las Ganancias
      (R.G. N 830 - A.F.I.P.)
      Denominación Social: Rafael Luis Barra
      Dirección: 25 de Mayo 1708
      Agente de Retención: 2 0 1 2 3 2 8 1 1 3 7
      Fecha: 23/3/26

      Datos del Beneficiario:
      Denominación: Lince SA
      Domicilio: Villa Nueva - Cba
      Cuit: 30-71002420-7

      Datos de la retención:
      Concepto de pago: Bs de Cambio
      Importe del Pago: $ 6.899.304,44
      Retención Practicada: $ 433.166,09
      DJ en la que se informa la retención: 1003-0007598

      Son $ 433.166,09
      Firma
    `;

    it('extrae el CUIT del agente (en casilleros con espacios)', () => {
      expect(parseRetencionText(RG830_DOC1).cuitEmisor).toBe('20-12328113-7');
    });

    it('elige "Retención Practicada" sobre "Importe del Pago"', () => {
      expect(parseRetencionText(RG830_DOC1).monto).toBe('433.166,09');
    });

    it('clasifica como GANANCIAS por el título del comprobante', () => {
      expect(parseRetencionText(RG830_DOC1).tipoImpuesto).toBe('GANANCIAS');
    });

    it('no toma el CUIT del beneficiario (Lince SA)', () => {
      const { cuitEmisor } = parseRetencionText(RG830_DOC1);
      expect(cuitEmisor).not.toBe('30-71002420-7');
    });

    it('monto "Son" es válido como fallback si "Retención Practicada" no está', () => {
      const sinLabel = RG830_DOC1.replace('Retención Practicada: $ 433.166,09', '');
      expect(parseRetencionText(sinLabel).monto).toBe('433.166,09');
    });
  });

// ─── validateRetencion ────────────────────────────────────────────────────────

describe('validateRetencion', () => {
  const REQUIRED = ['cuitEmisor', 'tipoImpuesto', 'monto'];

  it('no devuelve errores con campos válidos', () => {
    const errors = validateRetencion(
      { cuitEmisor: '33-53534712-9', tipoImpuesto: 'GANANCIAS', monto: '1.234,56' },
      REQUIRED,
    );
    expect(errors).toHaveLength(0);
  });

  it('devuelve error si falta cuitEmisor', () => {
    const errors = validateRetencion(
      { cuitEmisor: '', tipoImpuesto: 'GANANCIAS', monto: '100,00' },
      REQUIRED,
    );
    expect(errors.some((e) => e.includes('cuitEmisor'))).toBe(true);
  });

  it('devuelve error si tipoImpuesto es inválido', () => {
    const errors = validateRetencion(
      { cuitEmisor: '33-53534712-9', tipoImpuesto: 'IVA', monto: '100,00' },
      REQUIRED,
    );
    expect(errors.some((e) => e.includes('IVA'))).toBe(true);
  });

  it('devuelve error si el CUIT tiene checksum incorrecto', () => {
    const errors = validateRetencion(
      { cuitEmisor: '33-53534712-0', tipoImpuesto: 'GANANCIAS', monto: '100,00' },
      REQUIRED,
    );
    expect(errors.some((e) => e.includes('33-53534712-0'))).toBe(true);
  });

  it('devuelve error si el monto no es numérico', () => {
    const errors = validateRetencion(
      { cuitEmisor: '33-53534712-9', tipoImpuesto: 'IIBB', monto: 'N/A' },
      REQUIRED,
    );
    expect(errors.some((e) => e.includes('N/A'))).toBe(true);
  });

  it('acepta IIBB como tipo válido', () => {
    const errors = validateRetencion(
      { cuitEmisor: '33-53534712-9', tipoImpuesto: 'IIBB', monto: '500,00' },
      REQUIRED,
    );
    expect(errors).toHaveLength(0);
  });
});
