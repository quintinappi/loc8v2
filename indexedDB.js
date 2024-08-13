const DB_NAME = 'ClockingSystemDB';
const STORE_NAME = 'clockings';

export const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = (event) => reject("IndexedDB error: " + event.target.error);
    request.onsuccess = (event) => resolve(event.target.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
    };
  });
};

export const addClocking = (clockingData) => {
  return initDB().then(db => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(clockingData);
      request.onerror = (event) => reject("Error adding clocking: " + event.target.error);
      request.onsuccess = (event) => resolve(event.target.result);
    });
  });
};

export const getUnsynced = () => {
  return initDB().then(db => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onerror = (event) => reject("Error getting unsynced clockings: " + event.target.error);
      request.onsuccess = (event) => resolve(event.target.result.filter(clocking => !clocking.synced));
    });
  });
};
