import type { Language } from "@/lib/i18n/use-language";
import blockData from "./blocks.json";

export type Difficulty = "Easy" | "Medium" | "Hard";

export type BlockCategory = {
  id: string;
  name: string;
  /** Carries {base|reading} furigana markup, same as the UI dictionaries. */
  nameJa: string;
  difficulty: Difficulty;
  note: string;
  noteJa: string;
};

/** The oldest Minecraft version blocks are tagged against, besides "later". */
export const LEGACY_VERSION = "1.16.5";

export type Block = {
  id: string;
  name: string;
  /**
   * Mojang's own official translation, extracted from your local game
   * files the same way the English name is — not hand-translated, and so
   * (unlike every hand-authored Japanese string elsewhere in the app) it
   * carries no {base|reading} furigana markup: annotating readings for all
   * 339 of these individually was a scope call, not an oversight. Falls
   * back to the English name if Japanese wasn't cached locally when this
   * was generated (see scripts/generate-blocks.mjs).
   */
  nameJa: string;
  /** Average color of the block's texture. */
  color: string;
  /**
   * How far the texture's own pixels stray from that average color, in
   * redmean units — high for a patterned texture (ore flecks, a glaze, the
   * target block's bullseye) that never actually reads as one flat color.
   */
  noise: number;
  category: string;
  /**
   * Set when this is a block's other look: the cross-cut "end" of a log or
   * pillar, or the "top" of a block like sandstone. Left out for the main look.
   */
  face?: "end" | "top";
  /** Whether the block already existed in LEGACY_VERSION, or was added later. */
  since: typeof LEGACY_VERSION | "later";
};

// Difficulty is a rough guide to how hard the blocks are to gather.
export const categories: BlockCategory[] = [
  {
    id: "overworld",
    name: "Stone & earth",
    nameJa: "{石|いし}と{土|つち}",
    difficulty: "Easy",
    note: "Found on the surface or in shallow caves",
    noteJa: "{地表|ちひょう}や{浅い|あさい}{洞窟|どうくつ}で{見つかる|みつかる}",
  },
  {
    id: "wood",
    name: "Wood",
    nameJa: "{木材|もくざい}",
    difficulty: "Easy",
    note: "Chop trees and craft",
    noteJa: "{木|き}を{切って|きって}{加工|かこう}する",
  },
  {
    id: "wool",
    name: "Wool",
    nameJa: "{羊毛|ようもう}",
    difficulty: "Medium",
    note: "Sheep plus dyes for every color",
    noteJa: "{羊|ひつじ}と、すべての{色|いろ}の{染料|せんりょう}",
  },
  {
    id: "concrete",
    name: "Concrete",
    nameJa: "コンクリート",
    difficulty: "Medium",
    note: "Sand, gravel and dye, hardened in water",
    noteJa: "{砂|すな}と{砂利|じゃり}と{染料|せんりょう}を、{水|みず}で{固めた|かためた}もの",
  },
  {
    id: "concrete_powder",
    name: "Concrete powder",
    nameJa: "コンクリートパウダー",
    difficulty: "Medium",
    note: "Sand, gravel and dye, not yet hardened",
    noteJa: "{砂|すな}と{砂利|じゃり}と{染料|せんりょう}、まだ{固まって|かたまって}いない",
  },
  {
    id: "terracotta",
    name: "Terracotta",
    nameJa: "テラコッタ",
    difficulty: "Medium",
    note: "Clay smelted and dyed",
    noteJa: "{粘土|ねんど}を{焼いて|やいて}{染めた|そめた}もの",
  },
  {
    id: "glazed_terracotta",
    name: "Glazed terracotta",
    nameJa: "{彩釉|さいゆう}テラコッタ",
    difficulty: "Medium",
    note: "Terracotta glazed in a furnace",
    noteJa: "{炉|ろ}で{釉薬|ゆうやく}をかけて{焼いた|やいた}テラコッタ",
  },
  {
    id: "coral",
    name: "Dead coral blocks",
    nameJa: "{死んだ|しんだ}サンゴブロック",
    difficulty: "Medium",
    note: "Warm oceans — silk-touch live coral, then let it dry out",
    noteJa: "{暖かい|あたたかい}{海|うみ}で、シルクタッチでサンゴを{採り|とり}、{乾燥|かんそう}させる",
  },
  {
    id: "underground",
    name: "Underground & mined",
    nameJa: "{地下|ちか}と{採掘|さいくつ}{素材|そざい}",
    difficulty: "Medium",
    note: "Deep caves, ores and crafted metal blocks",
    noteJa: "{深い|ふかい}{洞窟|どうくつ}、{鉱石|こうせき}、{加工した|かこうした}{金属|きんぞく}ブロック",
  },
  {
    id: "sulfur",
    name: "Sulfur caves",
    nameJa: "{硫黄|いおう}の{洞窟|どうくつ}",
    difficulty: "Medium",
    note: "Found in the sulfur caves biome",
    noteJa: "{硫黄|いおう}の{洞窟|どうくつ}バイオームで{見つかる|みつかる}",
  },
  {
    id: "nether",
    name: "Nether",
    nameJa: "ネザー",
    difficulty: "Hard",
    note: "Requires a trip to the Nether",
    noteJa: "ネザーに{行く|いく}{必要|ひつよう}がある",
  },
  {
    id: "end",
    name: "The End",
    nameJa: "ジ・エンド",
    difficulty: "Hard",
    note: "Requires reaching the End",
    noteJa: "ジ・エンドに{到達|とうたつ}する{必要|ひつよう}がある",
  },
  {
    id: "ocean",
    name: "Ocean monument",
    nameJa: "{海底神殿|かいていしんでん}",
    difficulty: "Hard",
    note: "Only from ocean monuments and their guardians",
    noteJa: "{海底神殿|かいていしんでん}とガーディアンからのみ",
  },
  {
    id: "special",
    name: "Special finds",
    nameJa: "{特別な|とくべつな}{入手方法|にゅうしゅほうほう}",
    difficulty: "Hard",
    note: "Silk touch, ancient cities, pale gardens and more",
    noteJa: "シルクタッチ、{古代都市|こだいとし}、{青白い|あおじろい}{庭|にわ}など",
  },
  {
    id: "rare",
    name: "Rare & expensive",
    nameJa: "レアで{高価|こうか}",
    difficulty: "Hard",
    note: "Needs many gems or ingots per block",
    noteJa: "1ブロックに{多くの|おおくの}{宝石|ほうせき}やインゴットが{必要|ひつよう}",
  },
  {
    id: "creative",
    name: "Creative only",
    nameJa: "クリエイティブ{限定|げんてい}",
    difficulty: "Hard",
    note: "Can't be obtained in survival",
    noteJa: "サバイバルでは{入手|にゅうしゅ}できない",
  },
];

export type VersionFilter = "all" | typeof LEGACY_VERSION;

// Generated by scripts/generate-blocks.mjs from the Minecraft game files.
export const blocks = blockData as Block[];

/** Every block, keyed by id, for quick lookup once you only have an id. */
export const blocksById = new Map(blocks.map((block) => [block.id, block]));

/** Path of a block's texture, a 16x16 image in public/blocks. */
export const blockIcon = (block: Block) => `/blocks/${block.id}.png`;

/**
 * A block's name in the given language. Both "ja" and "ja-furigana" show the
 * same plain nameJa — there's no ruby markup to render for these (see the
 * note on Block.nameJa), so furigana mode falls back to the same text rather
 * than showing nothing extra for 339 individual names.
 */
export const blockName = (block: Block, language: Language) =>
  language === "en" ? block.name : block.nameJa;

/** A category's name/note in the given language — unlike blockName, these
 * carry real furigana markup in Japanese, so render through <T>. */
export const categoryName = (category: BlockCategory, language: Language) =>
  language === "en" ? category.name : category.nameJa;
export const categoryNote = (category: BlockCategory, language: Language) =>
  language === "en" ? category.note : category.noteJa;
