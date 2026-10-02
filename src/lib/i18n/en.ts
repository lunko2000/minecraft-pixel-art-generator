// The English dictionary is the shape every other language's dictionary is
// checked against (see ja.ts) — add a key here first, then everywhere else.
export const en = {
  nav: {
    homeLink: "⌂ Home",
    languageLabel: "Language",
  },
  home: {
    title: "Minecraft Pixel Art Generator",
    currentProjectLink: "Current project",
    aboutHeading: "About",
    aboutBody:
      "Turns any image into a Minecraft build: it matches each pixel to the closest-looking real block, using actual block textures, so you get a materials list and a block-by-block guide instead of just a colorful picture.",
    howToUseHeading: "How to use it",
    step1: "Upload an image above and choose how tall the finished build should be.",
    step2: "Pick your blocks: Creative mode uses everything, or go Survival to exclude whatever you can't easily gather, filtered to a specific Minecraft version if you'd like. There's only the current version and 1.16.5 for now — that's just what the creator plays :)",
    step3: "Generate your build. From there you can zoom in, switch between flat and dithered colors, mark blocks off as you place them, and check off materials as you collect them.",
    step4Prefix: "Come back anytime with the ",
    step4Suffix: " link above — your marks and progress are saved right where you left them.",
  },
  upload: {
    chooseImageLabel: "Choose an image to generate",
    pixelArtSizeLabel: "Pixel art size",
    heightAriaLabel: "Pixel art height in blocks",
    blocksTall: "blocks tall",
    previewUnknown: "Choose an image above to see the full size. The width is set to match its shape.",
    previewKnown: (width: number, height: number) =>
      `That comes out to ${width}x${height}, based on your image's shape.`,
    next: "Next",
  },
};
