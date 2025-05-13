/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        backgroundDark: '#121212', // Dark grey
        darkBlue: "#1A2A4B", // Dark blue 
        neonPurple: '#9B59B6', // Neon purple 
        neonPink: '#FF00FF',    // Neon pink
        neonCyan: '#00FFFF',    // Neon cyan
        neonBlue: '#3498DB',    // Bright blue
        neonGreen: '#2ECC71',   // Bright green
        neonYellow: '#FFEB3B',  // Neon yellow
      }
    }
  },
  plugins: [],
};
