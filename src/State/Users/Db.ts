import { HexKey } from "Nostr";
import { db as idb } from "Db";

import { UsersDb, MetadataCache, setUsers } from "State/Users";
import store, { RootState } from "State/Store";
import { useSelector } from "react-redux";
import { unwrap } from "Util";

class IndexedUsersDb implements UsersDb {
  ready = false;

  isAvailable() {
    if ("indexedDB" in window) {
      return new Promise<boolean>(resolve => {
        const req = window.indexedDB.open("dummy", 1);
        req.onsuccess = () => {
          resolve(true);
        };
        req.onerror = () => {
          resolve(false);
        };
      });
    }
    return Promise.resolve(false);
  }

  find(key: HexKey) {
    return idb.users.get(key);
  }

  query(q: string) {
    return idb.users
      .where("npub")
      .startsWithIgnoreCase(q)
      .or("name")
      .startsWithIgnoreCase(q)
      .or("display_name")
      .startsWithIgnoreCase(q)
      .or("nip05")
      .startsWithIgnoreCase(q)
      .limit(5)
      .toArray();
  }

  async bulkGet(keys: HexKey[]) {
    const ret = await idb.users.bulkGet(keys);
    return ret.filter(a => a !== undefined).map(a_1 => unwrap(a_1));
  }

  async add(user: MetadataCache) {
    await idb.users.add(user);
  }

  async put(user: MetadataCache) {
    await idb.users.put(user);
  }

  async bulkAdd(users: MetadataCache[]) {
    await idb.users.bulkAdd(users);
  }

  async bulkPut(users: MetadataCache[]) {
    await idb.users.bulkPut(users);
  }

  async update(key: HexKey, fields: Record<string, string>) {
    await idb.users.update(key, fields);
  }
}

function groupByPubkey(acc: Record<HexKey, MetadataCache>, user: MetadataCache) {
  return { ...acc, [user.pubkey]: user };
}

class ReduxUsersDb implements UsersDb {
  async isAvailable() {
    return true;
  }

  async query(q: string) {
    const state = store.getState();
    const { users } = state.users;
    return Object.values(users).filter(user => {
      const profile = user as MetadataCache;
      return (
        profile.name?.includes(q) ||
        profile.npub?.includes(q) ||
        profile.display_name?.includes(q) ||
        profile.nip05?.includes(q)
      );
    });
  }

  async find(key: HexKey) {
    const state = store.getState();
    const { users } = state.users;
    return users[key];
  }

  async add(user: MetadataCache) {
    const state = store.getState();
    const { users } = state.users;
    store.dispatch(setUsers({ ...users, [user.pubkey]: user }));
  }

  async put(user: MetadataCache) {
    const state = store.getState();
    const { users } = state.users;
    store.dispatch(setUsers({ ...users, [user.pubkey]: user }));
  }

  async bulkAdd(newUserProfiles: MetadataCache[]) {
    const state = store.getState();
    const { users } = state.users;
    const newUsers = newUserProfiles.reduce(groupByPubkey, {});
    store.dispatch(setUsers({ ...users, ...newUsers }));
  }

  async bulkGet(keys: HexKey[]) {
    const state = store.getState();
    const { users } = state.users;
    const ids = new Set([...keys]);
    return Object.values(users).filter(user => {
      return ids.has(user.pubkey);
    });
  }

  async update(key: HexKey, fields: Record<string, string>) {
    const state = store.getState();
    const { users } = state.users;
    const current = users[key];
    const updated = { ...current, ...fields };
    store.dispatch(setUsers({ ...users, [key]: updated }));
  }

  async bulkPut(newUsers: MetadataCache[]) {
    const state = store.getState();
    const { users } = state.users;
    const newProfiles = newUsers.reduce(groupByPubkey, {});
    store.dispatch(setUsers({ ...users, ...newProfiles }));
  }
}

export const IndexedUDB = new IndexedUsersDb();
export const ReduxUDB = new ReduxUsersDb();

export function useDb(): UsersDb {
  const db = useSelector((s: RootState) => s.login.useDb);
  switch (db) {
    case "indexdDb":
      return IndexedUDB;
    default:
      return ReduxUDB;
  }
}
