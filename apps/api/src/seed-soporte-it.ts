import 'reflect-metadata';
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../.env') });

import { DataSource } from 'typeorm';

async function seedSoporteIt() {
  const dbUrl = process.env['DATABASE_URL'];
  if (!dbUrl) {
    console.error('❌  Falta DATABASE_URL en el entorno.');
    process.exit(1);
  }

  const ds = new DataSource({
    type: 'postgres',
    url: dbUrl,
    synchronize: false,
    logging: false,
    entities: [],
  });

  await ds.initialize();
  console.log('✅  Conectado a Postgres');

  const runner = ds.createQueryRunner();
  await runner.connect();

  // Verificar que las tablas existen
  const tables = await runner.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'soporte_it_%'`,
  );
  if (tables.length === 0) {
    console.error('❌  Las tablas de soporte_it no existen. Ejecutá primero la migración.');
    await runner.release();
    await ds.destroy();
    process.exit(1);
  }

  // Verificar si ya hay datos
  const existing = await runner.query(`SELECT COUNT(*) as cnt FROM soporte_it_equipos`);
  if (parseInt(existing[0].cnt) > 0) {
    console.log(`ℹ️   Ya existen ${existing[0].cnt} equipos en la base — sin cambios.`);
    await runner.release();
    await ds.destroy();
    return;
  }

  console.log('📦  Insertando equipos...');

  // ─── EQUIPOS (21 registros del Excel "ANEXO 1 - Notebooks 2.xlsx") ────────────
  // usuarioPlatId = NULL en todos; asignación manual posterior
  const equipos: Array<{
    numeroActivo: number | null;
    aCargoDe: string | null;
    sector: string | null;
    hostname: string | null;
    windowsUserId: string | null;
    fabricante: string | null;
    modelo: string | null;
    ramGb: string | null;
    sistemaOperativo: string | null;
    procesador: string | null;
    firmwareUefi: string | null;
    graficos: string | null;
    almacenamiento: string | null;
    adaptadorRed: string | null;
    ipv6: string | null;
    controladorUsbHost: string | null;
  }> = [
    // id=1
    {
      numeroActivo: 1,
      aCargoDe: 'ANTONELA',
      sector: 'ADMINISTRACION',
      hostname: 'DESKTOP-RS7LMHS',
      windowsUserId: 'Damian',
      fabricante: 'Acer',
      modelo: 'Nitro AN515-58',
      ramGb: '7.71',
      sistemaOperativo: 'Microsoft Windows 11 Pro (v10.0.26100)',
      procesador: 'GenuineIntel 12th Gen Intel(R) Core(TM) i5-12450H – 8C/12T @ 2500MHz',
      firmwareUefi: 'Insyde Corp. V2.09',
      graficos: 'Intel(R) UHD Graphics – 1024MB VRAM',
      almacenamiento: 'NVMe SAMSUNG MZVL2512HCJQ-00B07: 476.94GB (SCSI)',
      adaptadorRed: 'Killer E2600 Gigabit Ethernet Controller: MAC 40:C2:BA:27:B8:2F',
      ipv6: 'fe80::c13c:ced0:ec2c:3950',
      controladorUsbHost: 'Controlador de host eXtensible Intel(R) USB 3.20 - 1.20 (Microsoft)',
    },
    // EZEQUIEL (sin numeroActivo en Excel)
    {
      numeroActivo: null,
      aCargoDe: 'EZEQUIEL',
      sector: 'VENTAS',
      hostname: null,
      windowsUserId: null,
      fabricante: null,
      modelo: null,
      ramGb: '3.78',
      sistemaOperativo: 'Microsoft Windows 11 Home (v10.0.26200)',
      procesador: 'GenuineIntel 11th Gen Intel(R) Core(TM) i3-1115G4 @ 3.00GHz – 2C/4T @ 2995MHz',
      firmwareUefi: 'Insyde Corp. V1.26',
      graficos: 'Intel(R) UHD Graphics – 1024MB VRAM',
      almacenamiento: 'NVMe SAMSUNG MZVLQ128HBHQ-00000: 119.24GB (SCSI); TOSHIBA MQ04ABF100: 931.51GB (SCSI)',
      adaptadorRed: 'Intel(R) Wi-Fi 6 AX201 160MHz: MAC E8:84:A5:C9:43:4D | WireGuard Tunnel: IP 10.0.0.29',
      ipv6: null,
      controladorUsbHost: 'Controlador de host eXtensible Intel(R) USB 3.10 - 1.20 (Microsoft)',
    },
    // id=2
    {
      numeroActivo: 2,
      aCargoDe: 'JUAN',
      sector: 'LOGISTICA',
      hostname: 'LOGISTICA',
      windowsUserId: 'Juan',
      fabricante: 'LENOVO',
      modelo: '81DE',
      ramGb: '7.91',
      sistemaOperativo: 'Microsoft Windows 10 Pro (v10.0.19045)',
      procesador: 'GenuineIntel Intel(R) Core(TM) i3-8130U CPU @ 2.20GHz – 2C/4T @ 2208MHz',
      firmwareUefi: 'LENOVO 8TCN51WW',
      graficos: 'Intel(R) UHD Graphics 620 – 1024MB VRAM',
      almacenamiento: 'KINGSTON SA400S37240G: 223.57GB (IDE)',
      adaptadorRed: 'ASIX AX88179 USB 3.0 to Gigabit Ethernet Adapter: MAC F8:E4:3B:1C:36:70',
      ipv6: null,
      controladorUsbHost: 'Controlador de host eXtensible Intel(R) USB 3.0 - 1.0 (Microsoft)',
    },
    // id=3
    {
      numeroActivo: 3,
      aCargoDe: 'PABLO',
      sector: 'FACTURACION',
      hostname: 'PABLO',
      windowsUserId: 'PABLO\\Usuario',
      fabricante: 'LENOVO',
      modelo: '81WR',
      ramGb: '7.84',
      sistemaOperativo: 'Microsoft Windows 11 Home (v10.0.26100)',
      procesador: 'GenuineIntel Intel(R) Core(TM) i3-10110U CPU @ 2.10GHz – 2C/4T @ 2592MHz',
      firmwareUefi: 'LENOVO DXCN28WW',
      graficos: 'Intel(R) UHD Graphics – 1024MB VRAM',
      almacenamiento: 'SSSTC CL1-4D256: 238.47GB (SCSI)',
      adaptadorRed: 'Microsoft Wi-Fi Direct Virtual Adapter #4: MAC FA:5E:A0:D4:8B:EF',
      ipv6: 'fe80::852d:3bf:c70:537d',
      controladorUsbHost: 'Controlador de host eXtensible Intel(R) USB 3.1 - 1.10 (Microsoft)',
    },
    // id=4
    {
      numeroActivo: 4,
      aCargoDe: 'YOANA',
      sector: 'FACTURACION',
      hostname: 'FLOR22',
      windowsUserId: 'FLOR22\\Win10',
      fabricante: 'LENOVO',
      modelo: '82KB',
      ramGb: '7.79',
      sistemaOperativo: 'Microsoft Windows 11 Pro (v10.0.22631)',
      procesador: 'GenuineIntel 11th Gen Intel(R) Core(TM) i3-1115G4 @ 3.00GHz – 2C/4T @ 2995MHz',
      firmwareUefi: 'LENOVO GGCN49WW',
      graficos: 'Intel(R) UHD Graphics – 128MB VRAM',
      almacenamiento: 'NVMe HS-SSD-Desire(P) 512G: 476.94GB (SCSI)',
      adaptadorRed: 'Realtek PCIe GbE Family Controller: MAC 9C:2D:CD:D6:68:CA',
      ipv6: null,
      controladorUsbHost: 'Controlador de host eXtensible Intel(R) USB 3.10 - 1.20 (Microsoft)',
    },
    // id=5
    {
      numeroActivo: 5,
      aCargoDe: 'JOSE',
      sector: 'FACTURACION',
      hostname: 'JOSEMP',
      windowsUserId: 'JOSEMP\\Lince SA',
      fabricante: 'LENOVO',
      modelo: '81DE',
      ramGb: '11.91',
      sistemaOperativo: 'Microsoft Windows 10 Education (v10.0.19045)',
      procesador: 'GenuineIntel Intel(R) Core(TM) i3-8130U CPU @ 2.20GHz – 2C/4T @ 2208MHz',
      firmwareUefi: 'LENOVO 8TCN25WW',
      graficos: 'Intel(R) UHD Graphics 620 – 1024MB VRAM',
      almacenamiento: 'KINGSTON SA400S37480G: 447.13GB (IDE)',
      adaptadorRed: 'Realtek PCIe GbE Family Controller: MAC 8C:16:45:72:D8:48',
      ipv6: 'fe80::a0a8:d976:5cf8:cd1',
      controladorUsbHost: 'Controlador de host eXtensible Intel(R) USB 3.0 - 1.0 (Microsoft)',
    },
    // id=6
    {
      numeroActivo: 6,
      aCargoDe: 'JOSE',
      sector: 'FACTURACION',
      hostname: 'COBRANZA',
      windowsUserId: 'COBRANZA\\Win10',
      fabricante: 'LENOVO',
      modelo: '82KB',
      ramGb: '7.79',
      sistemaOperativo: 'Microsoft Windows 11 Pro (v10.0.26100)',
      procesador: 'GenuineIntel 11th Gen Intel(R) Core(TM) i3-1115G4 @ 3.00GHz – 2C/4T @ 2995MHz',
      firmwareUefi: 'LENOVO GGCN49WW',
      graficos: 'Intel(R) UHD Graphics – 128MB VRAM',
      almacenamiento: 'NVMe HS-SSD-Desire(P) 512G: 476.94GB (SCSI)',
      adaptadorRed: 'ASIX USB to Gigabit Ethernet Family Adapter: MAC F8:E4:3B:1C:3F:5D',
      ipv6: 'fe80::bd9e:6a4e:5a3b:7f6a',
      controladorUsbHost: 'Controlador de host eXtensible Intel(R) USB 3.10 - 1.20 (Microsoft)',
    },
    // id=7
    {
      numeroActivo: 7,
      aCargoDe: 'OMAR',
      sector: 'ADMINISTRACION',
      hostname: 'IMPUESTOS',
      windowsUserId: 'Impuestos\\impue',
      fabricante: 'LENOVO',
      modelo: '82FG',
      ramGb: '7.79',
      sistemaOperativo: 'Microsoft Windows 11 Home (v10.0.26100)',
      procesador: 'GenuineIntel 11th Gen Intel(R) Core(TM) i3-1115G4 @ 3.00GHz – 2C/4T @ 2995MHz',
      firmwareUefi: 'LENOVO FHCN65WW',
      graficos: 'Intel(R) UHD Graphics – 1024MB VRAM',
      almacenamiento: 'NVMe SAMSUNG MZALQ256HBJD-00BL2: 238.47GB (SCSI)',
      adaptadorRed: 'TP-LINK 100Mbps Ethernet USB Adapter: MAC A8:6E:84:53:AA:C5',
      ipv6: 'fe80::6462:61ba:b440:6d00',
      controladorUsbHost: 'Controlador de host eXtensible Intel(R) USB 3.10 - 1.20 (Microsoft)',
    },
    // id=8 — equipo de LUCIANA (AdmLince — relevamiento 2)
    {
      numeroActivo: 8,
      aCargoDe: 'LUCIANA',
      sector: 'ADMINISTRACION',
      hostname: 'ADMLINCE',
      windowsUserId: 'AdmLince\\lrive',
      fabricante: 'LENOVO',
      modelo: '82H8',
      ramGb: '7.8',
      sistemaOperativo: 'Microsoft Windows 11 Home (v10.0.26100)',
      procesador: 'GenuineIntel 11th Gen Intel(R) Core(TM) i3-1115G4 @ 3.00GHz – 2C/4T @ 2995MHz',
      firmwareUefi: 'LENOVO GGCN29WW',
      graficos: 'Intel(R) UHD Graphics – 128MB VRAM',
      almacenamiento: 'NVMe SAMSUNG MZALQ512HBLU-00BL2: 476.94GB (SCSI)',
      adaptadorRed: 'Realtek USB FE Family Controller: MAC 00:E0:6C:3B:0E:6D',
      ipv6: 'fe80::c4e3:74a4:5618:54f4',
      controladorUsbHost: 'Controlador de host eXtensible Intel(R) USB 3.10 - 1.20 (Microsoft)',
    },
    // id=9
    {
      numeroActivo: 9,
      aCargoDe: 'FLORENCIA V',
      sector: 'ADMINISTRACION',
      hostname: 'FLORNOTEBOOK',
      windowsUserId: 'FLORNOTEBOOK\\Flor',
      fabricante: 'LENOVO',
      modelo: '81X8',
      ramGb: '3.8',
      sistemaOperativo: 'Microsoft Windows 10 Home (v10.0.19045)',
      procesador: 'GenuineIntel 11th Gen Intel(R) Core(TM) i3-1115G4 @ 3.00GHz – 2C/4T @ 2995MHz',
      firmwareUefi: 'LENOVO GCCN20WW',
      graficos: 'Intel(R) UHD Graphics – 1024MB VRAM',
      almacenamiento: 'NVMe UMIS RPJTJ128MEE1MWX: 119.24GB (SCSI)',
      adaptadorRed: 'Realtek USB GbE Family Controller: MAC 00:E0:4C:68:00:FB',
      ipv6: 'fe80::da9c:e08b:505f:426d',
      controladorUsbHost: 'Controlador de host eXtensible Intel(R) USB 3.10 - 1.20 (Microsoft)',
    },
    // id=10
    {
      numeroActivo: 10,
      aCargoDe: 'FLORENCIA M',
      sector: 'ADMINISTRACION',
      hostname: 'LINCE-SA',
      windowsUserId: 'LINCE-SA\\Usuario',
      fabricante: 'LENOVO',
      modelo: '82H8',
      ramGb: '7.8',
      sistemaOperativo: 'Microsoft Windows 11 Home (v10.0.26100)',
      procesador: 'GenuineIntel 11th Gen Intel(R) Core(TM) i3-1115G4 @ 3.00GHz – 2C/4T @ 2995MHz',
      firmwareUefi: 'LENOVO GGCN32WW',
      graficos: 'Intel(R) UHD Graphics – 128MB VRAM',
      almacenamiento: 'NVMe WDC PC SN530 SDBPMPZ-512G-1101: 476.94GB (SCSI)',
      adaptadorRed: 'ASIX USB to Gigabit Ethernet Family Adapter: MAC F8:E4:3B:1C:32:DE',
      ipv6: 'fe80::a181:bf12:b72d:d6a8',
      controladorUsbHost: 'Controlador de host eXtensible Intel(R) USB 3.10 - 1.20 (Microsoft)',
    },
    // id=11
    {
      numeroActivo: 11,
      aCargoDe: 'JULIETA',
      sector: 'RECEPCION',
      hostname: 'DESKTOP-QTOF65R',
      windowsUserId: 'DESKTOP-QTOF65R\\Usuario',
      fabricante: 'LENOVO',
      modelo: '81HL',
      ramGb: '3.83',
      sistemaOperativo: 'Microsoft Windows 11 Pro (v10.0.22631)',
      procesador: 'GenuineIntel Intel(R) Pentium(R) Silver N5000 CPU @ 1.10GHz – 4C/4T @ 1101MHz',
      firmwareUefi: 'LENOVO 6VCN43WW',
      graficos: 'Intel(R) UHD Graphics 605 – 1024MB VRAM',
      almacenamiento: 'TOSHIBA MQ01ABF050: 465.76GB (IDE); PNY 250GB SATA SSD: 232.88GB (IDE)',
      adaptadorRed: 'Realtek PCIe GbE Family Controller: MAC 48:2A:E3:6B:16:D7',
      ipv6: 'fe80::67d5:a123:cd31:9959',
      controladorUsbHost: 'Controlador de host eXtensible Intel(R) USB 3.0 - 1.0 (Microsoft)',
    },
    // id=12
    {
      numeroActivo: 12,
      aCargoDe: 'CELESTE',
      sector: 'ADMINISTRACION',
      hostname: 'LAPTOP-JU8QRRIA',
      windowsUserId: 'LAPTOP-JU8QRRIA\\Usuario',
      fabricante: 'HP',
      modelo: 'HP Laptop 15-dy2xxx',
      ramGb: '7.65',
      sistemaOperativo: 'Microsoft Windows 11 Home (v10.0.26100)',
      procesador: 'GenuineIntel 11th Gen Intel(R) Core(TM) i3-1115G4 @ 3.00GHz – 2C/4T @ 2901MHz',
      firmwareUefi: 'AMI F.33',
      graficos: 'Intel(R) UHD Graphics – 128MB VRAM',
      almacenamiento: 'NVMe WDC PC SN530 SDBPNPZ-256G-1006: 238.47GB (SCSI)',
      adaptadorRed: 'Realtek USB FE Family Controller: MAC 00:E0:4C:36:0B:AF',
      ipv6: 'fe80::d5bf:859c:51ac:58e',
      controladorUsbHost: 'Controlador de host eXtensible Intel(R) USB 3.10 - 1.20 (Microsoft)',
    },
    // id=13
    {
      numeroActivo: 13,
      aCargoDe: 'LIBRE - GABRIEL',
      sector: 'ADMINISTRACION',
      hostname: 'GABRIEL',
      windowsUserId: 'GABRIEL\\Usuario',
      fabricante: 'LENOVO',
      modelo: '81DE',
      ramGb: '19.91',
      sistemaOperativo: 'Microsoft Windows 11 Home (v10.0.26100)',
      procesador: 'GenuineIntel Intel(R) Core(TM) i3-8130U CPU @ 2.20GHz – 2C/4T @ 2208MHz',
      firmwareUefi: 'LENOVO 8TCN44WW',
      graficos: 'Intel(R) UHD Graphics 620 – 1024MB VRAM',
      almacenamiento: 'KINGSTON SA400S37480G: 447.13GB (IDE)',
      adaptadorRed: 'Realtek PCIe GbE Family Controller: MAC 8C:16:45:F9:80:8F',
      ipv6: 'fe80::4d5:ffdd:1c93:3636',
      controladorUsbHost: 'Controlador de host eXtensible Intel(R) USB 3.0 - 1.0 (Microsoft)',
    },
    // id=14
    {
      numeroActivo: 14,
      aCargoDe: 'SIMON',
      sector: 'LOGISTICA',
      hostname: 'LAPTOP-9Q3Q4EON',
      windowsUserId: 'LAPTOP-9Q3Q4EON\\Usuario',
      fabricante: 'LENOVO',
      modelo: '81X8',
      ramGb: '7.8',
      sistemaOperativo: 'Microsoft Windows 11 Home (v10.0.22631)',
      procesador: 'GenuineIntel 11th Gen Intel(R) Core(TM) i3-1115G4 @ 3.00GHz – 2C/4T @ 2995MHz',
      firmwareUefi: 'LENOVO GCCN21WW',
      graficos: 'Intel(R) UHD Graphics – 1024MB VRAM',
      almacenamiento: 'NVMe SAMSUNG MZALQ256HBJD-00BL2: 238.47GB (SCSI)',
      adaptadorRed: 'ASIX USB to Gigabit Ethernet Family Adapter: MAC F8:E4:3B:59:6B:A3',
      ipv6: 'fe80::5324:f8bc:3a59:fde2',
      controladorUsbHost: 'Controlador de host eXtensible Intel(R) USB 3.10 - 1.20 (Microsoft)',
    },
    // id=15
    {
      numeroActivo: 15,
      aCargoDe: 'LUIS HAEDO',
      sector: 'LOGISTICA',
      hostname: 'DESKTOP-K0A7228',
      windowsUserId: 'DESKTOP-K0A7228\\Usuario',
      fabricante: 'HP',
      modelo: 'HP Laptop 15-dy2xxx',
      ramGb: '7.65',
      sistemaOperativo: 'Microsoft Windows 11 Home (v10.0.26100)',
      procesador: 'GenuineIntel 11th Gen Intel(R) Core(TM) i3-1115G4 @ 3.00GHz – 2C/4T @ 2901MHz',
      firmwareUefi: 'AMI F.33',
      graficos: 'Intel(R) UHD Graphics – 128MB VRAM',
      almacenamiento: 'NVMe SK hynix BC711 HFM256GD3JX013N: 238.47GB (SCSI)',
      adaptadorRed: 'ASIX USB to Gigabit Ethernet Family Adapter #2: MAC F8:E4:3B:1C:40:03',
      ipv6: 'fe80::6754:ed8a:a412:ce1a',
      controladorUsbHost: 'Controlador de host eXtensible Intel(R) USB 3.10 - 1.20 (Microsoft)',
    },
    // id=16
    {
      numeroActivo: 16,
      aCargoDe: 'MICAELA',
      sector: 'ADMINISTRACION',
      hostname: 'NOTE-MICA',
      windowsUserId: 'Note-Mica\\Usuario',
      fabricante: 'LENOVO',
      modelo: '82H8',
      ramGb: '7.8',
      sistemaOperativo: 'Microsoft Windows 11 Home (v10.0.26100)',
      procesador: 'GenuineIntel 11th Gen Intel(R) Core(TM) i3-1115G4 @ 3.00GHz – 2C/4T @ 2995MHz',
      firmwareUefi: 'LENOVO GGCN32WW',
      graficos: 'Intel(R) UHD Graphics – 128MB VRAM',
      almacenamiento: 'NVMe WDC PC SN530 SDBPMPZ-512G-1101: 476.94GB (SCSI)',
      adaptadorRed: 'Realtek USB FE Family Controller: MAC 00:E0:6C:3B:0E:47',
      ipv6: 'fe80::f5c5:9648:5bea:131b',
      controladorUsbHost: 'Controlador de host eXtensible Intel(R) USB 3.10 - 1.20 (Microsoft)',
    },
    // id=17 — equipo de LUIS LUJAN (TerminalLuis — relevamiento 1)
    {
      numeroActivo: 17,
      aCargoDe: 'LUIS LUJAN',
      sector: 'LOGISTICA',
      hostname: 'TERMINALLUIS',
      windowsUserId: 'TerminalLuis\\Usuario',
      fabricante: 'Acer',
      modelo: 'Aspire A315-24PT',
      ramGb: '7.24',
      sistemaOperativo: 'Microsoft Windows 11 Home (v10.0.26100)',
      procesador: 'AuthenticAMD AMD Ryzen 5 7520U with Radeon Graphics – 4C/8T @ 2801MHz',
      firmwareUefi: 'Insyde Corp. V1.09',
      graficos: 'AMD Radeon(TM) Graphics – 512MB VRAM',
      almacenamiento: 'Micron_2450_MTFDKBA512TFK: 476.94GB (SCSI)',
      adaptadorRed: 'MediaTek Wi-Fi 6 MT7921 Wireless LAN Card: MAC 9C:2F:9D:85:A3:2F',
      ipv6: 'fe80::4b8d:3b4a:f9fc:6014',
      controladorUsbHost: 'Controlador de host eXtensible AMD USB 2.0 - 1.20 (Microsoft)',
    },
    // id=18
    {
      numeroActivo: 18,
      aCargoDe: 'DANIELA',
      sector: 'TUCUMAN',
      hostname: null,
      windowsUserId: null,
      fabricante: 'LENOVO',
      modelo: '81WR',
      ramGb: '7.84',
      sistemaOperativo: 'Windows 10 Home (v10.0.19042)',
      procesador: 'Intel Core i3-10110U @ 2.10GHz (2 núcleos, 4 hilos, 2592 MHz)',
      firmwareUefi: 'LENOVO DXCN28WW',
      graficos: 'Intel UHD Graphics – 1024MB VRAM',
      almacenamiento: 'Toshiba 256GB SSD (238.47GB útiles)',
      adaptadorRed: 'Intel Wireless-AC 9560 MAC: E0:2B:E9:87:EF:1A | WireGuard Tunnel: IP 10.0.0.24',
      ipv6: 'fe80::7546:5a85:4c55:4b24',
      controladorUsbHost: 'Intel USB 3.1 Host Controller',
    },
    // id=19
    {
      numeroActivo: 19,
      aCargoDe: 'MARCOS OJEDA',
      sector: 'TUCUMAN',
      hostname: null,
      windowsUserId: null,
      fabricante: 'LENOVO',
      modelo: '82FG',
      ramGb: '7.79',
      sistemaOperativo: 'Microsoft Windows 11 Home (v10.0.26200)',
      procesador: 'GenuineIntel 11th Gen Intel(R) Core(TM) i3-1115G4 @ 3.00GHz – 2C/4T @ 2995MHz',
      firmwareUefi: 'LENOVO FHCN70WW',
      graficos: 'Intel(R) UHD Graphics – 1024MB VRAM',
      almacenamiento: 'NVMe SAMSUNG MZALQ256HBJD-00BL2: 238.47GB (SCSI)',
      adaptadorRed: 'Intel(R) Wi-Fi 6 AX201 160MHz: MAC A8:64:F1:B6:2A:01 | WireGuard Tunnel: IP 10.0.0.21',
      ipv6: 'fe80::79:231f:635a:80c7',
      controladorUsbHost: 'Intel(R) USB 3.10 eXtensible Host Controller - 1.20 (Microsoft)',
    },
    // id=20
    {
      numeroActivo: 20,
      aCargoDe: 'JUAN DIAZ',
      sector: 'TUCUMAN - LOGISTICA',
      hostname: 'OpLogistica1',
      windowsUserId: 'OpLogistica1\\Usuario',
      fabricante: 'LENOVO',
      modelo: '82FG',
      ramGb: '7.79',
      sistemaOperativo: 'Microsoft Windows 11 Home (v10.0.26200)',
      procesador: 'GenuineIntel 11th Gen Intel(R) Core(TM) i3-1115G4 @ 3.00GHz – 2C/4T @ 2995MHz',
      firmwareUefi: 'LENOVO FHCN68WW',
      graficos: 'Intel(R) UHD Graphics – 1024MB VRAM',
      almacenamiento: 'NVMe SAMSUNG MZALQ256HBJD-00BL2: 238.47GB (SCSI)',
      adaptadorRed: 'Intel(R) Wi-Fi 6 AX201 160MHz: MAC A8:64:F1:B3:EB:C9 | WireGuard Tunnel: IP 10.0.0.13',
      ipv6: 'fe80::778a:b249:6019:bc4e',
      controladorUsbHost: 'Controlador de host eXtensible Intel(R) USB 3.10 - 1.20 (Microsoft)',
    },
  ];

  for (const e of equipos) {
    await runner.query(
      `INSERT INTO soporte_it_equipos
        ("numeroActivo", "aCargoDe", sector, hostname, "windowsUserId", fabricante, modelo, "ramGb",
         "sistemaOperativo", procesador, "firmwareUefi", graficos, almacenamiento, "adaptadorRed",
         ipv6, "controladorUsbHost", estado, "usuarioPlatId")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,'activo',NULL)`,
      [
        e.numeroActivo, e.aCargoDe, e.sector, e.hostname, e.windowsUserId,
        e.fabricante, e.modelo, e.ramGb, e.sistemaOperativo, e.procesador,
        e.firmwareUefi, e.graficos, e.almacenamiento, e.adaptadorRed,
        e.ipv6, e.controladorUsbHost,
      ],
    );
  }
  console.log(`✅  ${equipos.length} equipos insertados`);

  // ─── INCIDENTE 1: TerminalLuis — reinicio inesperado (19/03/2026) ─────────────
  console.log('📋  Insertando incidente TerminalLuis...');

  const terminalLuisResult = await runner.query(
    `SELECT id FROM soporte_it_equipos WHERE hostname = 'TERMINALLUIS' LIMIT 1`,
  );
  if (terminalLuisResult.length === 0) {
    throw new Error('No se encontró el equipo TERMINALLUIS');
  }
  const terminalLuisEquipoId: string = terminalLuisResult[0].id;

  const inc1Result = await runner.query(
    `INSERT INTO soporte_it_incidentes
      ("numeroReporte", "equipoId", "reportadoPorId", descripcion, urgencia, estado,
       "fechaReporte", "aplicacionesAfectadas", "accionesPrevias")
     VALUES (1, $1, NULL,
       'La notebook se reinició sola aproximadamente a las 14:00 del día 19/03/2026. El evento ocurrió al abrir la tapa del equipo. Como consecuencia adicional, los íconos del escritorio quedaron reordenados.',
       'media', 'resolved',
       '2026-03-19T17:00:00-03:00',
       NULL, NULL)
     RETURNING id`,
    [terminalLuisEquipoId],
  );
  const inc1Id: string = inc1Result[0].id;

  const rel1Result = await runner.query(
    `INSERT INTO soporte_it_relevamientos
      ("incidenteId", "creadoPorId", fecha, modalidad, "conclusionGeneral", "pasosASeguir", recomendaciones)
     VALUES ($1, NULL, '2026-03-19', 'Acceso remoto via AnyDesk',
       'El equipo no presenta fallas de hardware detectables, ni problemas de integridad en el sistema operativo, ni indicios de actividad maliciosa. El único evento anómalo confirmado es el reinicio inesperado (ID 6008), cuya causa exacta no pudo determinarse.',
       'Monitorear el equipo con el usuario durante los próximos días para determinar si el evento se repite. En caso de reincidencia, analizar los registros del Visor de eventos en el momento exacto de la nueva ocurrencia.',
       'Deshabilitar la función Inicio rápido como medida preventiva. Evaluar el estado de la batería si el problema persiste.')
     RETURNING id`,
    [inc1Id],
  );
  const rel1Id: string = rel1Result[0].id;

  const items1 = [
    {
      orden: 1,
      titulo: 'Visor de eventos (Event Viewer)',
      procedimiento: 'Se accedió al Visor de eventos de Windows (Registros de Windows > Sistema).',
      observacion: 'Se identificó el evento ID 6008 de origen EventLog, que confirma un cierre inesperado del sistema a las 12:27:36. Otros eventos: ID 7009 (timeout Dropbox, no crítico), ID 263 Win32k (dispositivo señalador sin info del monitor, no crítico).',
      conclusion: 'Reinicio inesperado confirmado (ID 6008). Causa exacta no determinada.',
    },
    {
      orden: 2,
      titulo: 'Temperatura del procesador',
      procedimiento: 'Se consultó la temperatura del procesador mediante WMI.',
      observacion: 'El valor relevado fue de 43°C.',
      conclusion: 'Dentro del rango normal para operación en reposo. Se descarta el sobrecalentamiento como causa del reinicio.',
    },
    {
      orden: 3,
      titulo: 'Estado del disco (S.M.A.R.T.)',
      procedimiento: 'Se ejecutó el comando de diagnóstico S.M.A.R.T. sobre la unidad de almacenamiento.',
      observacion: 'Resultado: OK.',
      conclusion: 'No se detectaron sectores defectuosos ni señales de falla inminente.',
    },
    {
      orden: 4,
      titulo: 'Integridad del sistema operativo',
      procedimiento: 'Se ejecutó el Comprobador de archivos de sistema (sfc /scannow) con privilegios de administrador.',
      observacion: 'Resultado: "Protección de recursos de Windows no encontró ninguna infracción de integridad."',
      conclusion: 'El sistema operativo se encuentra íntegro.',
    },
    {
      orden: 5,
      titulo: 'Configuración de energía',
      procedimiento: 'Se verificó la configuración del comportamiento de la tapa (batería y conectado).',
      observacion: 'Tanto en modo batería como conectado, la acción al cerrar la tapa está configurada como Suspender. Se observó que la función Inicio rápido está habilitada.',
      conclusion: 'Configuración correcta. El Inicio rápido habilitado podría relacionarse con problemas de reanudación; se recomienda deshabilitarlo como medida preventiva.',
    },
  ];

  for (const item of items1) {
    await runner.query(
      `INSERT INTO soporte_it_relevamiento_items
        ("relevamientoId", orden, titulo, procedimiento, observacion, conclusion)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [rel1Id, item.orden, item.titulo, item.procedimiento, item.observacion, item.conclusion],
    );
  }
  console.log('✅  Incidente 1 (TerminalLuis) + relevamiento + 5 ítems insertados');

  // ─── INCIDENTE 2: AdmLince — cuelgue del sistema (06/04/2026) ────────────────
  console.log('📋  Insertando incidente AdmLince...');

  const admLinceResult = await runner.query(
    `SELECT id FROM soporte_it_equipos WHERE hostname = 'ADMLINCE' LIMIT 1`,
  );
  if (admLinceResult.length === 0) {
    throw new Error('No se encontró el equipo ADMLINCE');
  }
  const admLinceEquipoId: string = admLinceResult[0].id;

  const inc2Result = await runner.query(
    `INSERT INTO soporte_it_incidentes
      ("numeroReporte", "equipoId", "reportadoPorId", descripcion, urgencia, estado,
       "fechaReporte", "aplicacionesAfectadas", "accionesPrevias")
     VALUES (2, $1, NULL,
       'La notebook se colgó completamente mientras utilizaba Google Chrome. La pantalla quedó en negro con una línea blanca horizontal visible. El sistema no respondió a ninguna interacción y fue necesario forzar el reinicio manteniendo presionado el botón de encendido.',
       'alta', 'resolved',
       '2026-04-06T18:28:00-03:00',
       'Google Chrome',
       'Forzar reinicio manteniendo presionado el botón de encendido.')
     RETURNING id`,
    [admLinceEquipoId],
  );
  const inc2Id: string = inc2Result[0].id;

  const rel2Result = await runner.query(
    `INSERT INTO soporte_it_relevamientos
      ("incidenteId", "creadoPorId", fecha, modalidad, "conclusionGeneral", "pasosASeguir", recomendaciones)
     VALUES ($1, NULL, '2026-04-06', 'Presencial',
       'El equipo no presenta fallas de hardware detectables ni indicios de actividad maliciosa. Se confirmaron dos hallazgos relevantes: archivos del sistema corruptos (reparados mediante sfc y DISM) y uso crítico de memoria RAM al momento del cuelgue (86,9%). La causa más probable del congelamiento es el agotamiento de la memoria RAM disponible durante el uso de Google Chrome.',
       'Monitorear el equipo durante los próximos días. En caso de reincidencia, analizar los registros del Visor de eventos en el momento exacto de la nueva ocurrencia.',
       'Limitar la cantidad de pestañas abiertas en Chrome para reducir el consumo de RAM. Considerar ampliar la RAM del equipo a 16 GB si el problema persiste, dado que 8 GB resulta insuficiente para el uso actual.')
     RETURNING id`,
    [inc2Id],
  );
  const rel2Id: string = rel2Result[0].id;

  const items2 = [
    {
      orden: 1,
      titulo: 'Visor de eventos (Event Viewer)',
      procedimiento: 'Se accedió al Visor de eventos de Windows (Registros de Windows > Sistema).',
      observacion: 'Se identificó el evento ID 41 de origen Kernel-Power (nivel: Crítico), registrado el 06/04/2026 a las 15:28:27, que confirma que el sistema se reinició sin apagarlo limpiamente. BugcheckCode = 0 (no hubo BSOD). Otros eventos: ID 7000/7009 (timeout servicios, no crítico), ID 10016 DistributedCOM (no crítico).',
      conclusion: 'Cuelgue total confirmado (ID 41 Kernel-Power, 15:28:27). No se generó volcado de memoria, consistente con congelamiento por agotamiento de recursos.',
    },
    {
      orden: 2,
      titulo: 'Temperatura del procesador',
      procedimiento: 'Se consultó la temperatura mediante HWiNFO64.',
      observacion: 'CPU Entera: 46°C. Máximo registrado: 67°C.',
      conclusion: 'Dentro del rango normal para este procesador (Intel Core i3-1115G4, límite ~100°C). Se descarta el sobrecalentamiento como causa del cuelgue.',
    },
    {
      orden: 3,
      titulo: 'Uso de memoria RAM',
      procedimiento: 'Se verificó el estado de la memoria mediante HWiNFO64.',
      observacion: 'Memoria física utilizada: 6.950 MB de ~8 GB (86,9%). Máximo registrado: 7.023 MB (87,8%). Memoria disponible: solo 1.040 MB.',
      conclusion: 'Uso crítico de RAM. Con menos de 1 GB disponible, el sistema no pudo gestionar nuevas solicitudes de memoria y se congeló. Causa más probable del cuelgue.',
    },
    {
      orden: 4,
      titulo: 'Estado del disco (S.M.A.R.T.)',
      procedimiento: 'Se ejecutó el comando de diagnóstico S.M.A.R.T. sobre la unidad de almacenamiento.',
      observacion: 'Resultado: OK.',
      conclusion: 'No se detectaron sectores defectuosos ni señales de falla inminente.',
    },
    {
      orden: 5,
      titulo: 'Integridad del sistema operativo',
      procedimiento: 'Se ejecutó sfc /scannow con privilegios de administrador. Se ejecutó adicionalmente DISM /Online /Cleanup-Image /RestoreHealth.',
      observacion: 'sfc resultado: "Protección de recursos de Windows encontró archivos dañados y los reparó correctamente." DISM resultado: operación completada exitosamente.',
      conclusion: 'Se detectaron y repararon archivos del sistema corruptos. El sistema quedó íntegro tras la reparación.',
    },
  ];

  for (const item of items2) {
    await runner.query(
      `INSERT INTO soporte_it_relevamiento_items
        ("relevamientoId", orden, titulo, procedimiento, observacion, conclusion)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [rel2Id, item.orden, item.titulo, item.procedimiento, item.observacion, item.conclusion],
    );
  }
  console.log('✅  Incidente 2 (AdmLince) + relevamiento + 5 ítems insertados');

  await runner.release();
  await ds.destroy();

  console.log('\n🎉  Seed de Soporte IT completado:');
  console.log(`    Equipos:      ${equipos.length}`);
  console.log('    Incidentes:   2');
  console.log('    Relevamientos: 2');
  console.log('    Ítems:        10');
}

seedSoporteIt().catch((err) => {
  console.error('❌  Error en seed-soporte-it:', err);
  process.exit(1);
});
