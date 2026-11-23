import crypto from 'crypto';

class MemoryCollection {
  constructor(name) {
    this.name = name;
    this.items = [];
  }

  _matches(item, filter) {
    if (!filter || Object.keys(filter).length === 0) return true;
    for (const key of Object.keys(filter)) {
      if (key === '_id') {
        const targetId = filter._id?.toString ? filter._id.toString() : String(filter._id);
        if (item._id.toString() !== targetId) return false;
      } else if (filter[key] !== undefined && item[key] !== filter[key]) {
        return false;
      }
    }
    return true;
  }

  find(filter = {}) {
    const runFind = () => this.items.filter((item) => this._matches(item, filter));
    return {
      sort: (sortObj = {}) => {
        const matched = runFind();
        const [sortKey, sortDir] = Object.entries(sortObj)[0] || ['createdAt', -1];
        matched.sort((a, b) => {
          if (a[sortKey] < b[sortKey]) return sortDir === 1 ? -1 : 1;
          if (a[sortKey] > b[sortKey]) return sortDir === 1 ? 1 : -1;
          return 0;
        });
        return {
          select: () => matched,
          then: (resolve) => resolve(matched)
        };
      },
      select: () => runFind(),
      then: (resolve) => resolve(runFind())
    };
  }

  findOne(filter = {}) {
    const getDoc = () => this.items.find((item) => this._matches(item, filter)) || null;

    return {
      sort: (sortObj = {}) => {
        const matched = this.items.filter((item) => this._matches(item, filter));
        const [sortKey, sortDir] = Object.entries(sortObj)[0] || ['createdAt', -1];
        matched.sort((a, b) => {
          if (a[sortKey] < b[sortKey]) return sortDir === 1 ? -1 : 1;
          if (a[sortKey] > b[sortKey]) return sortDir === 1 ? 1 : -1;
          return 0;
        });
        const doc = matched[0] || null;
        return {
          select: () => doc,
          then: (resolve) => resolve(doc)
        };
      },
      select: () => getDoc(),
      then: (resolve) => resolve(getDoc())
    };
  }

  findById(id) {
    const strId = id?.toString ? id.toString() : String(id);
    const doc = this.items.find((i) => i._id.toString() === strId) || null;
    return {
      select: () => doc,
      then: (resolve) => resolve(doc)
    };
  }

  async create(data) {
    const now = new Date();
    const doc = {
      _id: crypto.randomBytes(12).toString('hex'),
      createdAt: now,
      updatedAt: now,
      ...data,
      save: async function () {
        return this;
      }
    };
    this.items.push(doc);
    return doc;
  }

  async deleteOne(filter) {
    const idx = this.items.findIndex((item) => this._matches(item, filter));
    if (idx !== -1) {
      this.items.splice(idx, 1);
      return { deletedCount: 1 };
    }
    return { deletedCount: 0 };
  }

  async deleteMany(filter) {
    const initialLen = this.items.length;
    this.items = this.items.filter((item) => !this._matches(item, filter));
    return { deletedCount: initialLen - this.items.length };
  }

  async clear() {
    this.items = [];
  }
}

export const memoryDB = {
  users: new MemoryCollection('users'),
  otpSessions: new MemoryCollection('otpSessions'),
  categories: new MemoryCollection('categories'),
  activities: new MemoryCollection('activities')
};
