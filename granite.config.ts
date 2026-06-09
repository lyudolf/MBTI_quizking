import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "quiz-master",
  brand: {
    displayName: "MBTI 퀴즈왕",
    primaryColor: "#3182F6",
    icon: "",
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
