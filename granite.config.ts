import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "personality-quiz-king",
  brand: {
    displayName: "성격유형 퀴즈왕",
    primaryColor: "#3182F6",
    icon: "https://static.toss.im/appsintoss/52065/d99ca575-57c7-4e57-9d0f-ff0b8c0d6dad.png",
  },
  web: {
    host: "localhost",
    port: 5173,
    commands: {
      dev: "vite dev",
      build: "vite build",
    },
  },
  permissions: [],
  outdir: "dist",
});
