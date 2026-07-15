export default {
  default: 'public',
  disks: {
    public: { driver: 'local', root: 'storage/app/public' },
    private: { driver: 'local', root: 'storage/app/private' },
  },
}
