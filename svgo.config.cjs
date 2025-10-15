module.exports = {
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          // Disable ID removal from preset, we'll handle it separately
          cleanupIds: false,
        },
      },
    },
    {
      name: 'removeAttrs',
      params: {
        attrs: 'id'
      }
    }
  ],
};
