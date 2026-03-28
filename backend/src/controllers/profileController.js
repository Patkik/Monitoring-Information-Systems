const path = require('path');
const User = require('../models/User');
const { uploadBuffer, deleteAsset } = require('../utils/cloudinary');

const avatarFolder = process.env.CLOUDINARY_AVATAR_FOLDER || 'mentoring/avatars';

const pick = (obj, allowed) => Object.keys(obj || {}).reduce((acc, k) => {
  if (allowed.includes(k) && obj[k] !== undefined) acc[k] = obj[k];
  return acc;
}, {});

const sanitizeStringArray = (value, options = {}) => {
  const { max = 50, itemMaxLen = 64 } = options;
  if (!Array.isArray(value)) return [];
  const out = [];
  for (const item of value) {
    if (typeof item !== 'string') continue;
    const trimmed = item.trim().slice(0, itemMaxLen);
    if (trimmed) out.push(trimmed);
    if (out.length >= max) break;
  }
  return out;
};

const isValidTime = (s) => /^([01]\d|2[0-3]):[0-5]\d$/.test(String(s || ''));
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const sanitizeAvailability = (slots) => {
  if (!Array.isArray(slots)) return [];
  const cleaned = [];
  for (const slot of slots) {
    if (!slot || typeof slot !== 'object') continue;
    const day = String(slot.day || '').toLowerCase();
    const start = slot.start;
    const end = slot.end;
    if (!DAYS.includes(day)) continue;
    if (!isValidTime(start) || !isValidTime(end)) continue;
    if (start >= end) continue;
    cleaned.push({ day, start, end });
    if (cleaned.length >= 56) break; // 8/day worst-case safety bound
  }
  return cleaned;
};

const getViewerLevel = (requester, targetUser) => {
  if (!requester) return 'public';
  if (requester.role === 'admin') return 'admin';
  if (String(requester.id) === String(targetUser._id)) return 'self';
  return 'mentors';
};

const filterByPrivacy = (profile, level) => {
  if (!profile) return {};
  if (level === 'admin' || level === 'self') return profile;
  const privacy = profile.privacy || {};
  const allowed = (field) => {
    const vis = privacy[field] || 'mentors';
    if (level === 'public') return vis === 'public';
    // mentors level: can see both 'public' and 'mentors'
    return vis === 'public' || vis === 'mentors';
  };
  const out = {};
  if (allowed('displayName')) out.displayName = profile.displayName;
  if (allowed('photo')) out.photoUrl = profile.photoUrl;
  if (allowed('bio')) out.bio = profile.bio;
  if (allowed('education')) out.education = profile.education;
  if (allowed('expertiseAreas')) out.expertiseAreas = profile.expertiseAreas;
  if (allowed('skills')) out.skills = profile.skills;
  if (allowed('availabilitySlots')) out.availabilitySlots = profile.availabilitySlots;
  if (allowed('coursesNeeded')) out.coursesNeeded = profile.coursesNeeded;
  if (allowed('interests')) out.interests = profile.interests;
  if (allowed('learningGoals')) out.learningGoals = profile.learningGoals;
  if (allowed('contact')) out.contactPreferences = profile.contactPreferences;
  out.timezone = profile.timezone; // timezone is non-sensitive
  out.privacy = privacy; // provide privacy map for clients to know
  return out;
};

exports.getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('firstname lastname email role profile');
    if (!user) return res.status(404).json({ error: 'USER_NOT_FOUND' });
    return res.json({
      id: user._id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      role: user.role,
      profile: user.profile || {}
    });
  } catch (err) {
    return res.status(500).json({ error: 'NETWORK_ERROR' });
  }
};

exports.updateMyProfile = async (req, res) => {
  try {
    const { profile } = req.body || {};
    const allowedTop = ['displayName', 'photoUrl', 'bio', 'education', 'coursesNeeded', 'interests', 'learningGoals', 'timezone', 'contactPreferences', 'privacy', 'expertiseAreas', 'skills', 'availabilitySlots'];
    const allowedEducation = ['program', 'yearLevel', 'major', 'role'];
    const clean = {};

    if (profile) {
      const picked = pick(profile, allowedTop);
      if (picked.education) {
        picked.education = pick(picked.education, allowedEducation);
        if (picked.education.role && !['student', 'instructor'].includes(picked.education.role)) {
          delete picked.education.role;
        }
        if (picked.education.program) picked.education.program = picked.education.program.trim();
        if (picked.education.yearLevel) picked.education.yearLevel = picked.education.yearLevel.trim();
        if (picked.education.major) picked.education.major = picked.education.major.trim();
      }
      picked.coursesNeeded = sanitizeStringArray(picked.coursesNeeded, { max: 50 });
      picked.interests = sanitizeStringArray(picked.interests, { max: 50 });
      picked.expertiseAreas = sanitizeStringArray(picked.expertiseAreas, { max: 50 });
      picked.skills = sanitizeStringArray(picked.skills, { max: 100 });
      if (picked.contactPreferences !== undefined) {
        if (Array.isArray(picked.contactPreferences)) {
          const allowedChannels = ['in_app', 'email'];
          const filtered = [];
          for (const channel of picked.contactPreferences) {
            if (allowedChannels.includes(channel) && !filtered.includes(channel)) {
              filtered.push(channel);
            }
          }
          picked.contactPreferences = filtered.length ? filtered : ['in_app'];
        } else {
          picked.contactPreferences = ['in_app'];
        }
      }
      if (picked.availabilitySlots) picked.availabilitySlots = sanitizeAvailability(picked.availabilitySlots);
      clean.profile = picked;
    }

    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { $set: clean },
      { new: true }
    ).select('firstname lastname email role profile');

    if (!updated) return res.status(404).json({ error: 'USER_NOT_FOUND' });
    return res.json({
      id: updated._id,
      firstname: updated.firstname,
      lastname: updated.lastname,
      email: updated.email,
      role: updated.role,
      profile: updated.profile || {}
    });
  } catch (err) {
    console.error('Update profile error', err);
    return res.status(500).json({ error: 'NETWORK_ERROR' });
  }
};

exports.getPublicProfile = async (req, res) => {
  try {
    const target = await User.findById(req.params.id).select('firstname lastname role profile');
    if (!target) return res.status(404).json({ error: 'USER_NOT_FOUND' });
    const level = getViewerLevel(req.user, target);
    const filtered = filterByPrivacy(target.profile || {}, level);
    return res.json({
      id: target._id,
      role: target.role,
      displayName: (target.profile && target.profile.displayName) || `${target.firstname || ''} ${target.lastname || ''}`.trim(),
      profile: filtered
    });
  } catch (err) {
    return res.status(500).json({ error: 'NETWORK_ERROR' });
  }
};

exports.afterPhotoUploaded = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'NO_FILE' });

    const user = await User.findById(req.user.id).select('profile');
    if (!user) return res.status(404).json({ error: 'USER_NOT_FOUND' });

    const sanitizedBase = path
      .basename(req.file.originalname, path.extname(req.file.originalname))
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 120) || 'profile_photo';

    let uploadResult;
    try {
      uploadResult = await uploadBuffer(req.file.buffer, {
        folder: avatarFolder,
        resource_type: 'image',
        public_id: `${sanitizedBase}_${Date.now()}`,
        overwrite: false,
        transformation: [{ width: 512, height: 512, crop: 'limit' }],
      });
    } catch (storageErr) {
      // Log error but provide helpful message for development
      console.warn('Avatar upload failed:', storageErr.message);
      const message = storageErr.code === 'CLOUDINARY_NOT_CONFIGURED'
        ? 'Cloud storage is not configured. Avatar upload is disabled in development mode. Configure Cloudinary credentials to enable file uploads.'
        : storageErr.message;
      return res.status(502).json({ error: 'UPLOAD_FAILED', message });
    }

    const updatePayload = {
      'profile.photoUrl': uploadResult.secure_url || uploadResult.url,
      'profile.photoPublicId': uploadResult.public_id,
    };

    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updatePayload },
      { new: true }
    ).select('profile');

    const previousPublicId = user.profile?.photoPublicId;
    if (previousPublicId && previousPublicId !== uploadResult.public_id) {
      deleteAsset(previousPublicId, 'image').catch(() => {});
    }

    return res.json({ photoUrl: updated.profile?.photoUrl || updatePayload['profile.photoUrl'] });
  } catch (err) {
    return res.status(500).json({ error: 'NETWORK_ERROR' });
  }
};
