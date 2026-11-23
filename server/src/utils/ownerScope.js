import { Category } from '../models/Category.js';

export const isDeviceAuth = (req) => req.authType === 'device' || !!req.user?.isDeviceBound;

export const getOwnerFilter = (req) => {
  if (isDeviceAuth(req)) {
    return { sessionId: req.user.sessionId || req.deviceSession.sessionId };
  }
  return { userId: req.user._id };
};

export const documentOwnedByRequester = (doc, req) => {
  if (!doc) return false;
  const filter = getOwnerFilter(req);
  if (filter.sessionId) {
    return doc.sessionId === filter.sessionId;
  }
  return doc.userId?.toString() === filter.userId?.toString();
};

export const findUsableCategory = (categoryId, req) => {
  const ownerFilter = getOwnerFilter(req);
  return Category.findOne({
    _id: categoryId,
    $or: [
      { isDefault: true, userId: null, sessionId: null },
      ownerFilter
    ]
  });
};
