// Local entity store — replaces base44 SDK with localStorage-backed CRUD + real AI chat.
// All entity data persists across sessions. InvokeLLM routes to the api-server.

import { animaApi } from './animaApi';

const DB_PREFIX = 'anima_entity_';

function getStore(entityName) {
  try {
    return JSON.parse(localStorage.getItem(`${DB_PREFIX}${entityName}`) || '[]');
  } catch {
    return [];
  }
}

function saveStore(entityName, items) {
  localStorage.setItem(`${DB_PREFIX}${entityName}`, JSON.stringify(items));
}

function makeId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// Apply SDK-style querying: optional equality filters, a sort string
// ("field" ascending, "-field" descending) and a numeric limit.
function applyQuery(items, filters, sort, limit) {
  let result = items;

  if (filters && typeof filters === 'object') {
    const entries = Object.entries(filters);
    if (entries.length) {
      result = result.filter((item) => entries.every(([k, v]) => item[k] === v));
    }
  }

  if (typeof sort === 'string' && sort) {
    const desc = sort.startsWith('-');
    const field = desc ? sort.slice(1) : sort;
    result = [...result].sort((a, b) => {
      const av = a[field];
      const bv = b[field];
      if (av === bv) return 0;
      if (av === undefined || av === null) return 1;
      if (bv === undefined || bv === null) return -1;
      let cmp;
      if (typeof av === 'number' && typeof bv === 'number') {
        cmp = av - bv;
      } else {
        cmp = String(av) < String(bv) ? -1 : 1;
      }
      return desc ? -cmp : cmp;
    });
  }

  if (typeof limit === 'number' && limit >= 0) {
    result = result.slice(0, limit);
  }

  return result;
}

function entityStore(entityName) {
  return {
    // Supports the SDK-style signatures used across the app:
    //   list()                       → all items
    //   list("-updated_date", 50)    → sorted + limited
    //   list({ key: value })         → filtered (back-compat)
    async list(sortOrFilters, limit) {
      const items = getStore(entityName);
      if (typeof sortOrFilters === 'string') {
        return applyQuery(items, undefined, sortOrFilters, limit);
      }
      if (sortOrFilters && typeof sortOrFilters === 'object') {
        return applyQuery(items, sortOrFilters, undefined, limit);
      }
      return applyQuery(items, undefined, undefined, limit);
    },

    async get(id) {
      const items = getStore(entityName);
      return items.find((item) => item.id === id) || null;
    },

    async create(data) {
      const items = getStore(entityName);
      const newItem = {
        id: makeId(),
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
        ...data,
      };
      items.push(newItem);
      saveStore(entityName, items);
      return newItem;
    },

    async update(id, data) {
      const items = getStore(entityName);
      const idx = items.findIndex((item) => item.id === id);
      if (idx === -1) {
        // Create if not found (upsert)
        const newItem = { id, created_date: new Date().toISOString(), updated_date: new Date().toISOString(), ...data };
        items.push(newItem);
        saveStore(entityName, items);
        return newItem;
      }
      items[idx] = { ...items[idx], ...data, updated_date: new Date().toISOString() };
      saveStore(entityName, items);
      return items[idx];
    },

    async delete(id) {
      const items = getStore(entityName);
      const filtered = items.filter((item) => item.id !== id);
      saveStore(entityName, filtered);
    },

    async bulkCreate(dataArray) {
      const items = getStore(entityName);
      const newItems = dataArray.map((data) => ({
        id: makeId(),
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
        ...data,
      }));
      saveStore(entityName, [...items, ...newItems]);
      return newItems;
    },

    // filter(filters?, sort?, limit?) — SDK-style equality filtering with
    // optional sort string and numeric limit.
    async filter(filters = {}, sort, limit) {
      const items = getStore(entityName);
      return applyQuery(items, filters, sort, limit);
    },
  };
}

// Auth state stored in sessionStorage so it persists within a tab.
const AUTH_KEY = 'anima_auth_user';

function getAuthUser() {
  try {
    return JSON.parse(sessionStorage.getItem(AUTH_KEY) || 'null');
  } catch {
    return null;
  }
}

function setAuthUser(user) {
  if (user) sessionStorage.setItem(AUTH_KEY, JSON.stringify(user));
  else sessionStorage.removeItem(AUTH_KEY);
}

// Create a guest user automatically so the app boots without a login flow.
function ensureGuestUser() {
  let user = getAuthUser();
  if (!user) {
    user = {
      id: 'guest',
      email: 'guest@anima.local',
      full_name: 'Guest Explorer',
      role: 'User',
      selected_mode: 'companion',
      created_date: new Date().toISOString(),
    };
    setAuthUser(user);
  }
  return user;
}

const entitiesProxy = new Proxy({}, {
  get: (_, entityName) => entityStore(entityName),
});

export const base44 = {
  auth: {
    isAuthenticated: async () => {
      ensureGuestUser();
      return true;
    },
    redirectToLogin: () => {},
    me: async () => ensureGuestUser(),
    updateMe: async (data) => {
      const user = ensureGuestUser();
      const updated = { ...user, ...data };
      setAuthUser(updated);
      return updated;
    },
    updateMyUserData: async (data) => {
      const user = ensureGuestUser();
      const updated = { ...user, ...data };
      setAuthUser(updated);
      return updated;
    },
    logout: async (redirectPath) => {
      setAuthUser(null);
      window.location.href = redirectPath || '/';
    },
  },

  entities: entitiesProxy,

  // Mirror the SDK's service-role accessor. Locally there is no privilege
  // separation, so it resolves the same localStorage-backed entity store.
  asServiceRole: {
    entities: entitiesProxy,
  },

  integrations: {
    Core: {
      InvokeLLM: async ({ prompt, systemPrompt, history }) => {
        // Create/reuse a conversation for LLM calls
        let convId = sessionStorage.getItem('anima_llm_conv_id');
        if (!convId) {
          const conv = await animaApi.conversations.create('LLM session');
          convId = String(conv.id);
          sessionStorage.setItem('anima_llm_conv_id', convId);
        }

        let result = '';
        for await (const chunk of animaApi.sendMessage(
          Number(convId),
          prompt,
          systemPrompt || ''
        )) {
          if (chunk.done) break;
          if (chunk.error) throw new Error(chunk.error);
          if (chunk.content) result += chunk.content;
        }
        return result;
      },

      GenerateImage: async ({ prompt }) => {
        console.warn('GenerateImage not implemented in Replit environment');
        return null;
      },

      UploadFile: async (file) => {
        console.warn('UploadFile not implemented in Replit environment');
        return { url: null };
      },

      GetStripeLifetimePrices: async () => {
        return { prices: [] };
      },
    },
  },

  functions: new Proxy({}, {
    get: (_, fnName) => {
      const callFn = async (nameOrData, data) => {
        // Support both call styles:
        // base44.functions.invoke("fnName", data)   → fnName is "invoke", nameOrData is the real fn name
        // base44.functions.realName.invoke(data)    → fnName is the real fn name, nameOrData is data
        const realName = fnName === 'invoke' ? nameOrData : fnName;
        const payload  = fnName === 'invoke' ? data        : nameOrData;
        try {
          const res = await fetch(`${window.location.origin}/api/openai/invoke/${realName}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload || {}),
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({ error: res.statusText }));
            throw new Error(err.error || res.statusText);
          }
          const json = await res.json();
          return json.result;
        } catch (err) {
          console.warn(`base44.functions.${String(realName)} failed:`, err.message);
          return null;
        }
      };

      if (fnName === 'invoke') {
        return callFn;
      }
      return { invoke: callFn };
    },
  }),
};

export default base44;
