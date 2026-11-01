export const TAP_MOVE_KEY='xom-nha-la-tap-to-move';
export const CONTROL_SETTINGS_EVENT='xom-nha-la-controls-changed';
export function tapMovementEnabled(){return localStorage.getItem(TAP_MOVE_KEY)!=='off';}
