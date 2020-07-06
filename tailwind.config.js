module.exports = {
  purge: ['./src/**/*.js'],
  theme: {
    colors: {
      transparent: 'transparent',
      white: '#ffffff',
      foreground: '#f7f7f7',
      gray: '#e5e5e5',
      border: '#d8d8d8',
      darkgray: '#b2b2b2',
      black: '#2d2926',
      pitchblack: '#0c0c0c',
      brand: '#2935ff',
      darkbrand: '#003fe3',
      green: '#28a745',
      darkgreen: '#24963e',
      yellow: '#ffc940',
      darkyellow: '#e6b53a',
      red: '#ff0000',
      darkred: '#e60000',
    },
    extend: {},
  },
  variants: {
    borderWidth: ['last', 'focus'],
  },
  plugins: [],
};
