/**
 * Fixtures con rawText real capturado por Document AI sobre 4 remitos que
 * fallaban en producción (2026-05-23). Validan que la detección de
 * firma/aclaración/dni y fecha funcione contra el OCR ruidoso real:
 *  - "FIRMA" leído como "FOMA"
 *  - "ACLARACIÓN" leído como "ACLACION" / "ACLARAN"
 *  - "D.N.I." leído como "ONI" / "ONE" / "INTO"
 *  - "FECHA:" leído como "FEC" / "FECHOR"
 */

import { detectRemitoPresence, parseRemitoText } from '../vision/vision.parser';

const RAW_ANULADO_5368 = `
Camión: GTV
Baton AC9108
27,56
BURLANDA
MERCADERÍA RETIRADA DE PLANTA
Total:
FOMA
RO015-00005368
113775
ACLARACION
Una vez conformado esquente do y made wam no se aceptanan rectamos
INTO
IMPRENTA
`;

const RAW_FIRMADO_5364 = `
RO015-00005364-113775
FIRMA
Nicolos
38.774555
jangan
Una ver conformado el siguiente remito y made a mano
ptako
ONI
IMPRENTA CULT 25
`;

const RAW_FIRMADO_5369 = `
MERCADERÍA RETIRADA DE PLANTA
Sub
Total:
R0015-00005309
113706
79001
DARI Diez
ACLARAN
42.212.511
Una vez sramado spy Semake of
`;

const RAW_FIRMADO_5370 = `
MERCADERÍA RETIRADA DE PLANTA
Sub
Total: 29560
RO015-00005370
113778
Complom Cosoffer
GONZALON CAAFUS
37953109
ACLACION
Una vez conformado el siguiente remito
ONE
`;

describe('detectRemitoPresence — variantes OCR reales', () => {
  it('remito 5368 ANULADO: marca duda donde se ven labels y no contenido', () => {
    const p = detectRemitoPresence(RAW_ANULADO_5368);
    expect(p.firmaEstado).toBe('duda');      // FOMA detectado, sin contenido manuscrito
    expect(p.aclaracionEstado).toBe('duda'); // ACLARACION sin contenido
    expect(p.dniEstado).toBe('duda');        // INTO (D.N.I.) sin contenido
  });

  it('caso firma manuscrita justo antes de FIRMA label (Savonese "Se")', () => {
    const raw = `
      0,00
      BURLANDA 28.940
      MERCADERÍA RETIRADA DE PLANTA
      R0008-00003845 156 7 7 5156775
      Total:
      Se
      FIRMA
      ACLARACIÓN
      Una vez conformado el siguiente remito
      D.N.I.
    `;
    const p = detectRemitoPresence(raw);
    expect(p.firmaEstado).toBe('si'); // "Se" 2 letras → detectado
  });

  it('remito 5364 firmado por Nicolas — detecta firma, aclaración y DNI', () => {
    const p = detectRemitoPresence(RAW_FIRMADO_5364);
    expect(p.firmaEstado).toBe('si');
    expect(p.aclaracionEstado).toBe('si');
    expect(p.dniEstado).toBe('si');
  });

  it('remito 5369 firmado por DARÍO DÍAZ — detecta sin label FIRMA (vía fallback bloque)', () => {
    const p = detectRemitoPresence(RAW_FIRMADO_5369);
    expect(p.firmaEstado).toBe('si');
    expect(p.aclaracionEstado).toBe('si');
    expect(p.dniEstado).toBe('si');
  });

  it('remito 5370 firmado por GONZALO CASARES — detecta con "ACLACION" + "ONE"', () => {
    const p = detectRemitoPresence(RAW_FIRMADO_5370);
    expect(p.firmaEstado).toBe('si');
    expect(p.aclaracionEstado).toBe('si');
    expect(p.dniEstado).toBe('si');
  });

  it('no genera falsos positivos con un bloque sin contenido manuscrito', () => {
    const empty = `
      MERCADERÍA RETIRADA DE PLANTA
      Total:
      R0015-00099999
      113000
      Una vez conformado el siguiente remito
    `;
    const p = detectRemitoPresence(empty);
    expect(p.firmaEstado).toBe('no');
    expect(p.aclaracionEstado).toBe('no');
    expect(p.dniEstado).toBe('no');
  });

  it('no confunde CUITs con DNIs dentro del bloque', () => {
    const cuitInBlock = `
      MERCADERÍA RETIRADA DE PLANTA
      R0015-00012345
      FIRMA
      ACLARACION
      D.N.I.
      20-29139068-5
      Una vez conformado
    `;
    const p = detectRemitoPresence(cuitInBlock);
    // El CUIT (20-29139068-5) no debe contarse como DNI — sin contenido real → 'duda'
    expect(p.dniEstado).toBe('duda');
  });

  it('no confunde montos con decimales como DNIs', () => {
    const amountInBlock = `
      MERCADERÍA RETIRADA DE PLANTA
      Total: 1.234.567,00
      R0015-00012345
      FIRMA
      Una vez conformado
    `;
    const p = detectRemitoPresence(amountInBlock);
    expect(p.dniEstado).toBe('no');
  });
});

describe('parseRemitoText — fecha robusta', () => {
  it('detecta fecha precedida por "FEC " (sin "HA")', () => {
    const f = parseRemitoText('REMITO N° 00015-00005368\nFEC 29/07/2021\nC.U.I.T.: 30-12345678-9');
    expect(f.fecha).toBe('29/07/2021');
  });

  it('detecta fecha cerca de "Ordenanza" cuando el label FECHA no aparece', () => {
    const f = parseRemitoText('REMITO N° 00015-00005364\nFechamigog\nOrdenanza 1777 29-07-21\nInicio de Actividades: 03/10/2000');
    expect(f.fecha).toBe('29-07-21');
  });

  it('descarta "Inicio de Actividades" como fecha del remito', () => {
    const f = parseRemitoText('REMITO N° 00015-00005364\nInicio de Actividades: 03/10/2000\nOtro texto');
    expect(f.fecha).toBe('');
  });

  it('descarta fechas de "impresión" / "Vto"', () => {
    const f = parseRemitoText('REMITO N° 00015-00005370\nFecha impresión 08/06/2021\nFecha Vto 08/06/2022');
    expect(f.fecha).toBe('');
  });
});
