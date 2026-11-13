import { resolveUserAvatar } from './avatar.js';

export function isMissingCarpoolTableError(err) {
  if (!err) return false;
  const code = String(err.code || '');
  const msg = String(err.message || '').toLowerCase();
  return code === '42P01' || code === 'PGRST205' || (msg.includes('event_carpool') && msg.includes('exist')) || msg.includes('schema cache');
}

export function buildCarpoolsByEvent(carpoolRows = [], passengerRows = [], usersList = []) {
  const userById = {};
  (usersList || []).forEach(u => {
    if (u?.id) userById[u.id] = u;
  });

  const passengersByCarpool = {};
  (passengerRows || []).forEach(p => {
    const cid = p.carpool_id;
    if (!cid) return;
    if (!passengersByCarpool[cid]) passengersByCarpool[cid] = [];
    const rider = userById[p.user_id];
    passengersByCarpool[cid].push({
      userId: p.user_id,
      name: rider?.name || 'Community Member',
      avatar: resolveUserAvatar(rider, 'Rider'),
      reservedAt: p.created_at || null,
    });
  });

  const map = {};
  (carpoolRows || []).forEach(row => {
    if (!row?.event_id) return;
    if (!map[row.event_id]) map[row.event_id] = [];
    const driver = userById[row.driver_id];
    const seatsTotal = Math.max(1, Number(row.seats_total) || 3);
    const passengers = passengersByCarpool[row.id] || [];
    map[row.event_id].push({
      id: row.id,
      eventId: row.event_id,
      driverId: row.driver_id,
      driverName: driver?.name || 'Community Member',
      driverAvatar: resolveUserAvatar(driver, 'Driver'),
      origin: row.origin || '',
      time: row.departure_time || '',
      seatsTotal,
      seatsAvailable: Math.max(0, seatsTotal - passengers.length),
      passengers,
      flexibleOnRoute: row.flexible_on_route !== false,
      notes: row.notes || '',
      chipIn: row.chip_in || 'Free',
      createdAt: row.created_at || null,
    });
  });

  Object.keys(map).forEach(evId => {
    map[evId].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  });

  return map;
}

export function getCarpoolHandshakeMessage(carpool, event) {
  if (!carpool || !event) return '';
  return `Hey ${carpool.driverName}! I have booked a seat in your carpool for ${event.title} (leaves ${carpool.time} from ${carpool.origin}). Could we meet near [My Street / Corner]? Looking forward to the walk!`;
}
