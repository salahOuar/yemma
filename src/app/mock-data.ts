export type MsgRow = {
  status: 'ok'|'warn'|'err'|'waiting';
  direction: 'Incoming'|'Outgoing';
  network: 'SWIFT'|'SWIFT_I'|'SIC'|'SEPA'|'Other';
  type: string;
  extRef: string;
  intRef: string;
  receiver: string;
  sender: string;
  start: string;
  stop: string;
  owner: string;
};

export function generateRows(count = 250): MsgRow[] {
  const now = Date.now();
  return Array.from({ length: count }).map((_, i) => ({
    status: (['ok','waiting','warn','err'] as const)[i % 4],
    direction: i % 3 === 0 ? 'Outgoing' : 'Incoming',
    network: i % 5 === 0 ? 'SWIFT_I' : 'SWIFT',
    type: '535',
    extRef: i % 7 ? `LOCYCH${2300+i}-240226PN${5050+i}` : `GLB0520${1875+i}`,
    intRef: `20240226${(8000+i).toString()}...`,
    receiver: i % 2 ? 'LOCYCHGGNDP' : 'LO-XYZBANK',
    sender: i % 2 ? 'BSUILULLXXX' : 'LO-GVA-NDP',
    start: new Date(now - i * 3600_000).toISOString().slice(0,16).replace('T',' '),
    stop: new Date(now - i * 3500_000).toISOString().slice(0,16).replace('T',' '),
    owner: 'LO-GVA.NDP',
  }));
}
