/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    colors: {
      "border-style": "syntax: " * ";inherits: false;initial-value: solid;border-color: var(--ant-color-border);",
    },
    extend: {
      colors: {
        "color-primary": "var(--ant-color-primary)",
        "color-primary-hover": "var(--ant-color-primary-hover)",
        "color-primary-active": "var(--ant-color-primary-active)",
        "color-primary-disabled": "var(--ant-color-primary-disabled)",
        "color-primary-focus": "var(--ant-color-primary-focus)",
        "color-primary-active": "var(--ant-color-primary-active)",
      },
    },
  },
  plugins: [],
}