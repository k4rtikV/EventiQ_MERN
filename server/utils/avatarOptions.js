const ALLOWED_AVATARS = Array.from(
    { length: 12 },
    (_, index) => `avatar-${index + 1}`
);

const DEFAULT_AVATAR = 'avatar-1';

const isAllowedAvatar = (avatar) =>
    typeof avatar === 'string' && ALLOWED_AVATARS.includes(avatar);

module.exports = {
    ALLOWED_AVATARS,
    DEFAULT_AVATAR,
    isAllowedAvatar
};
