export default {
  default: 'local',
  disks: {
    local: {
      driver: 'local',
      root: new URL('../storage/app', import.meta.url).pathname,
      visibility: 'private',
    },
    public: {
      driver: 'local',
      root: new URL('../storage/app/public', import.meta.url).pathname,
      url: '/storage',
      visibility: 'public',
    },
  },
};
