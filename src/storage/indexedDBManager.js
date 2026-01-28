// src/app/features/ocr/storage/indexedDBManager.js

/**
 * Low-level IndexedDB operations and utilities
 */

export class IndexedDBManager {
  constructor(dbName, version) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        this.handleUpgrade(event.target.result, event.oldVersion);
      };
    });
  }

  handleUpgrade(db, oldVersion) {
    // Database upgrade logic here
    console.log(`Upgrading database from version ${oldVersion} to ${this.version}`);
    
    // Create or modify object stores as needed
    if (oldVersion < 1) {
      // Initial schema creation
    }
  }

  async transaction(storeNames, mode = 'readonly') {
    if (!this.db) await this.connect();
    return this.db.transaction(storeNames, mode);
  }

  async getAll(storeName, indexName = null, query = null) {
    const transaction = await this.transaction([storeName]);
    const store = transaction.objectStore(storeName);
    const source = indexName ? store.index(indexName) : store;

    return new Promise((resolve, reject) => {
      const request = query ? source.getAll(query) : source.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async put(storeName, data) {
    const transaction = await this.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.put(data);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName, key) {
    const transaction = await this.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.delete(key);
      
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName) {
    const transaction = await this.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.clear();
      
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }
}

export default IndexedDBManager;