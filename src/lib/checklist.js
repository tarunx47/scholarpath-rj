// sessionStorage access for the scheme document/step checklist.
// Never touches 'scholarpath.saved' or 'scholarpath.applied'.

export const CHECKLIST_KEY = 'scholarpath.checklist';

const KINDS = ['documents', 'steps'];

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function readChecklist(storage = globalThis.sessionStorage) {
  try {
    if (!storage) return {};
    const raw = storage.getItem(CHECKLIST_KEY);
    if (raw === null || raw === undefined) return {};
    const parsed = JSON.parse(raw);
    return isPlainObject(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function writeChecklist(data, storage = globalThis.sessionStorage) {
  try {
    if (!storage) return false;
    storage.setItem(CHECKLIST_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function setChecklistItem(schemeId, kind, itemId, checked, storage = globalThis.sessionStorage) {
  if (!KINDS.includes(kind)) return false;

  const data = readChecklist(storage);
  if (!isPlainObject(data[schemeId])) data[schemeId] = {};
  if (!isPlainObject(data[schemeId][kind])) data[schemeId][kind] = {};

  if (checked) {
    data[schemeId][kind][itemId] = true;
  } else {
    delete data[schemeId][kind][itemId];
  }

  return writeChecklist(data, storage);
}

export function getChecklistItem(schemeId, kind, itemId, storage = globalThis.sessionStorage) {
  const data = readChecklist(storage);
  const scheme = data[schemeId];
  if (!isPlainObject(scheme)) return false;
  const bucket = scheme[kind];
  if (!isPlainObject(bucket)) return false;
  return bucket[itemId] === true;
}
