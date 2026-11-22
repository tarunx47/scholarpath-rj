// Dependency-free tests for the checklist sessionStorage helpers. Run with: node src/lib/checklist.test.js
import { CHECKLIST_KEY, readChecklist, setChecklistItem } from "./checklist.js";

let failures = 0;

function check(name, condition) {
  if (condition) {
    console.log("PASS " + name);
  } else {
    failures += 1;
    console.log("FAIL " + name);
  }
}

// In-memory fake storage. Wraps a shared Map so a "reload" can reuse the same underlying data.
// Records every call in `calls` so tests can prove which keys were touched.
function createFakeStorage(store = new Map()) {
  const calls = [];
  return {
    calls,
    getItem(key) {
      calls.push(["getItem", key]);
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      calls.push(["setItem", key]);
      store.set(key, String(value));
    },
    removeItem(key) {
      calls.push(["removeItem", key]);
      store.delete(key);
    },
  };
}

function rawChecklist(store) {
  return JSON.parse(store.get(CHECKLIST_KEY));
}

// Storage key
check("storage key is exactly scholarpath.checklist", CHECKLIST_KEY === "scholarpath.checklist");

// readChecklist with a missing key
const emptyStore = new Map();
check("readChecklist returns {} when key missing", Object.keys(readChecklist(createFakeStorage(emptyStore))).length === 0);

// Documents and steps are written separately under the scheme id
const separateStore = new Map();
const separateStorage = createFakeStorage(separateStore);
check("setChecklistItem document returns true", setChecklistItem("scheme-a", "documents", "doc-1", true, separateStorage) === true);
check("setChecklistItem step returns true", setChecklistItem("scheme-a", "steps", "step-1", true, separateStorage) === true);
const separateData = rawChecklist(separateStore);
check("document is stored under documents bucket", separateData["scheme-a"].documents["doc-1"] === true);
check("step is stored under steps bucket", separateData["scheme-a"].steps["step-1"] === true);
check("step is not stored under documents bucket", !("step-1" in separateData["scheme-a"].documents));
check("document is not stored under steps bucket", !("doc-1" in separateData["scheme-a"].steps));

// Writing one item preserves existing entries of other items and other schemes
const preserveStore = new Map();
const preserveStorage = createFakeStorage(preserveStore);
setChecklistItem("scheme-a", "documents", "doc-2", true, preserveStorage);
setChecklistItem("scheme-a", "steps", "step-2", true, preserveStorage);
setChecklistItem("scheme-b", "documents", "doc-9", true, preserveStorage);
setChecklistItem("scheme-a", "documents", "doc-1", true, preserveStorage);
const preserveData = rawChecklist(preserveStore);
check("writing doc-1 keeps existing doc-2", preserveData["scheme-a"].documents["doc-2"] === true);
check("writing doc-1 keeps existing step-2", preserveData["scheme-a"].steps["step-2"] === true);
check("writing doc-1 keeps other scheme doc-9", preserveData["scheme-b"].documents["doc-9"] === true);
check("writing doc-1 sets doc-1", preserveData["scheme-a"].documents["doc-1"] === true);

// checked=false removes the entry
const uncheckStore = new Map();
const uncheckStorage = createFakeStorage(uncheckStore);
setChecklistItem("scheme-a", "documents", "doc-1", true, uncheckStorage);
setChecklistItem("scheme-a", "documents", "doc-2", true, uncheckStorage);
check("setting checked=false returns true", setChecklistItem("scheme-a", "documents", "doc-1", false, uncheckStorage) === true);
const uncheckData = rawChecklist(uncheckStore);
check("checked=false removes the entry", !("doc-1" in uncheckData["scheme-a"].documents));
check("checked=false keeps sibling entry", uncheckData["scheme-a"].documents["doc-2"] === true);
const afterUncheck = readChecklist(createFakeStorage(uncheckStore));
check("readChecklist no longer reports unchecked item", !("doc-1" in afterUncheck["scheme-a"].documents));

// Invalid JSON in storage
const invalidStore = new Map([[CHECKLIST_KEY, "{not json"]]);
const invalidStorage = createFakeStorage(invalidStore);
const invalidRead = readChecklist(invalidStorage);
check("invalid JSON: readChecklist returns {}", Object.keys(invalidRead).length === 0);

let invalidWriteResult;
let invalidWriteThrew = false;
try {
  invalidWriteResult = setChecklistItem("scheme-a", "documents", "doc-1", true, invalidStorage);
} catch {
  invalidWriteThrew = true;
}
check("invalid JSON: setChecklistItem does not throw", invalidWriteThrew === false);
check("invalid JSON: setChecklistItem reports success", invalidWriteResult === true);
let recoveredParse = true;
try {
  JSON.parse(invalidStore.get(CHECKLIST_KEY));
} catch {
  recoveredParse = false;
}
check("invalid JSON: storage recovers to valid JSON", recoveredParse);
check("invalid JSON: recovered value holds the new item", readChecklist(invalidStorage)["scheme-a"].documents["doc-1"] === true);

// Non-object JSON returns {}
const arrayStore = new Map([[CHECKLIST_KEY, "[1,2]"]]);
const arrayRead = readChecklist(createFakeStorage(arrayStore));
check("JSON array returns {}", Object.keys(arrayRead).length === 0 && !Array.isArray(arrayRead));

const nullStore = new Map([[CHECKLIST_KEY, "null"]]);
const nullRead = readChecklist(createFakeStorage(nullStore));
check("JSON null returns {}", nullRead !== null && Object.keys(nullRead).length === 0);

// Invalid kind returns false and writes nothing
const kindStore = new Map();
const kindStorage = createFakeStorage(kindStore);
check("invalid kind returns false", setChecklistItem("scheme-a", "badkind", "x", true, kindStorage) === false);
check("invalid kind writes nothing to storage", kindStore.size === 0);
check(
  "invalid kind performs no setItem call",
  !kindStorage.calls.some(([op]) => op === "setItem")
);

// Other storage keys are never touched
const isolatedStore = new Map([
  ["scholarpath.saved", '["scheme-a"]'],
  ["scholarpath.applied", '["scheme-b"]'],
]);
const isolatedStorage = createFakeStorage(isolatedStore);
setChecklistItem("scheme-a", "documents", "doc-1", true, isolatedStorage);
setChecklistItem("scheme-a", "documents", "doc-1", false, isolatedStorage);
setChecklistItem("scheme-a", "steps", "step-1", true, isolatedStorage);
readChecklist(isolatedStorage);
check("scholarpath.saved value unchanged", isolatedStore.get("scholarpath.saved") === '["scheme-a"]');
check("scholarpath.applied value unchanged", isolatedStore.get("scholarpath.applied") === '["scheme-b"]');
check(
  "only scholarpath.checklist is written or removed",
  isolatedStorage.calls
    .filter(([op]) => op === "setItem" || op === "removeItem")
    .every(([, key]) => key === CHECKLIST_KEY)
);

// Persistence after reload: write via one fake storage, read via a new call on the same underlying store
const reloadStore = new Map();
setChecklistItem("scheme-a", "documents", "doc-1", true, createFakeStorage(reloadStore));
const afterReload = readChecklist(createFakeStorage(reloadStore));
check("value persists after reload", afterReload["scheme-a"].documents["doc-1"] === true);

if (failures > 0) {
  process.exitCode = 1;
}
