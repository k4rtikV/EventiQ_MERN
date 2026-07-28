const avatarOptions = Array.from({ length: 12 }, (_, index) => {
    const number = index + 1;

    return {
        id: `avatar-${number}`,
        label: `Avatar ${number}`,
        src: `/avatars/avatar-${number}.png`
    };
});

export const DEFAULT_AVATAR_ID = 'avatar-1';

export const getAvatarSrc = (avatarId) => {
    const selected = avatarOptions.find((avatar) => avatar.id === avatarId);
    return selected?.src || `/avatars/${DEFAULT_AVATAR_ID}.png`;
};

export default avatarOptions;
