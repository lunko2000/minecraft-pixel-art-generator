import type { en } from "./en";

// Typed against en's shape so a key added to one side and forgotten on the
// other is a compile error, not a silent fallback to English (or nothing).
//
// Kanji readings are marked inline as {base|reading} — see furigana.tsx.
// This same text serves both plain Japanese (the markup is stripped) and
// Japanese-with-furigana (it becomes a real <ruby> annotation), so there's
// one Japanese source to keep correct, not two copies that could drift.
export const ja: typeof en = {
  nav: {
    homeLink: "⌂ ホーム",
    languageLabel: "{言語|げんご}",
  },
  common: {
    back: "← {戻る|もどる}",
    next: "{次|つぎ}へ",
  },
  home: {
    title: "マインクラフト ピクセルアート ジェネレーター",
    currentProjectLink: "{現在|げんざい}のプロジェクト",
    aboutHeading: "このアプリについて",
    aboutBody:
      "どんな{画像|がぞう}でもマインクラフトの{建築物|けんちくぶつ}に{変換|へんかん}します。{各|かく}ピクセルを、{実際|じっさい}のブロックテクスチャの{中|なか}から{見た目|みため}が{最も|もっとも}{近い|ちかい}ブロックに{置き換える|おきかえる}ので、ただの{色付き|いろつき}{画像|がぞう}ではなく、{必要|ひつよう}な{素材|そざい}リストとブロックごとの{設置|せっち}ガイドが{手|て}に{入り|はい}ります。",
    howToUseHeading: "{使い方|つかいかた}",
    step1:
      "{上|うえ}で{画像|がぞう}をアップロードし、{完成|かんせい}する{建築物|けんちくぶつ}の{高さ|たかさ}を{選び|えらび}ましょう。",
    step2:
      "ブロックを{選び|えらび}ましょう。クリエイティブモードならすべてのブロックが{使え|つかえ}、サバイバルモードなら{簡単|かんたん}には{集め|あつめ}られないブロックを{除外|じょがい}できます。{特定|とくてい}のマインクラフトのバージョンで{絞り込む|しぼりこむ}ことも{可能|かのう}です。{今|いま}のところ{選べる|えらべる}のは{最新|さいしん}バージョンと1.16.5だけですが、それは{単に|たんに}{製作者|せいさくしゃ}がそのバージョンで{遊ん|あそん}でいるからです :)",
    step3:
      "{生成|せいせい}すると{建築物|けんちくぶつ}が{表示|ひょうじ}されます。そこからズームイン、{色|いろ}の{塗り方|ぬりかた}（フラット／ディザリング）の{切り替え|きりかえ}、{設置済み|せっちずみ}のブロックへの{印付け|しるしづけ}、{集め|あつめ}た{素材|そざい}のチェックなどができます。",
    step4Prefix: "{上|うえ}にある「",
    step4Suffix:
      "」リンクから、いつでも{作業|さぎょう}を{再開|さいかい}できます。{印|しるし}や{進捗|しんちょく}はそのまま{保存|ほぞん}されています。",
  },
  upload: {
    chooseImageLabel: "{生成|せいせい}する{画像|がぞう}を{選択|せんたく}してください",
    pixelArtSizeLabel: "ピクセルアートのサイズ",
    heightAriaLabel: "ピクセルアートの{高さ|たかさ}（ブロック{数|すう}）",
    blocksTall: "ブロック（{高さ|たかさ}）",
    previewUnknown:
      "{上|うえ}で{画像|がぞう}を{選択|せんたく}すると、{実際|じっさい}のサイズが{表示|ひょうじ}されます。{幅|はば}は{画像|がぞう}の{形|かたち}に{合わせて|あわせて}{自動的|じどうてき}に{決まり|きまり}ます。",
    previewKnown: (width: number, height: number) =>
      `{画像|がぞう}の{形|かたち}に{合わせる|あわせる}と、${width}x${height} になります。`,
  },
  modes: {
    creative: {
      title: "クリエイティブモード",
      description: "どれだけ{入手|にゅうしゅ}が{大変|たいへん}でも、すべてのブロックを{使う|つかう}。",
    },
    survival: {
      title: "サバイバルモード",
      description: "{集める|あつめる}のが{大変|たいへん}すぎるブロックを{除外|じょがい}する。",
    },
    creativeShort: "クリエイティブ",
    survivalShort: "サバイバル",
  },
  version: {
    heading: "マインクラフトのバージョン",
    description: "そのバージョンに{存在|そんざい}するブロックだけが{表示|ひょうじ}されます",
    ariaLabel: "マインクラフトのバージョンで{絞り込む|しぼりこむ}",
    latest: "{最新|さいしん}（すべてのブロック）",
  },
  blocksPage: {
    pageTitle: "ブロックを{選ぶ|えらぶ}",
    creativeSummary: (count: number, version: string | null) =>
      version
        ? `マインクラフト${version}{時点|じてん}の${count}{個|こ}のブロックすべてが、ピクセルアートに{使われます|つかわれます}。`
        : `${count}{個|こ}のブロックすべてが、ピクセルアートに{使われます|つかわれます}。`,
    searchPlaceholder: "ブロックを{検索|けんさく}",
    difficultyAriaLabel: "{難易度|なんいど}で{絞り込む|しぼりこむ}",
    difficultyAll: "すべて",
    difficultyLabel: {
      Easy: "{簡単|かんたん}",
      Medium: "{普通|ふつう}",
      Hard: "{難しい|むずかしい}",
    },
    blocksIncluded: (count: number, total: number) =>
      `${total}{個|こ}中${count}{個|こ}が{含まれて|ふくまれて}います`,
    noMatches: "{検索|けんさく}{条件|じょうけん}に{一致|いっち}するブロックがありません。",
    categoryIncluded: (count: number, total: number) =>
      `${count}/${total}{個|こ}{選択中|せんたくちゅう}`,
    includeAll: "すべて{含める|ふくめる}",
    excludeAll: "すべて{除外|じょがい}する",
  },
  presets: {
    heading: "プリセット",
    description:
      "{選んだ|えらんだ}モード・バージョン・ブロックを{保存|ほぞん}して、{次回|じかい}も{使えます|つかえます}",
    summary: (count: number, modeLabel: string) => `${count}{個|こ} · ${modeLabel}`,
    load: "{読み込む|よみこむ}",
    delete: "{削除|さくじょ}",
    nameAriaLabel: "{新しい|あたらしい}プリセット{名|めい}",
    namePlaceholder: "プリセット{名|めい}（{例|れい}：いつものパレット）",
    save: "{現在|げんざい}の{選択|せんたく}を{保存|ほぞん}",
  },
  generate: {
    pageTitle: "あなたのピクセルアート",
    colorBlending: {
      heading: "{色|いろ}の{混ぜ方|まぜかた}",
      description: "ディザリングは、{単調|たんちょう}な{色|いろ}の{帯|おび}をより{繊細|せんさい}な{質感|しつかん}に{変える|かえる}",
      ariaLabel: "{色|いろ}の{一致|いっち}モード",
      flat: "フラットカラー",
      dithered: "ディザリング",
    },
    previewStyle: {
      heading: "プレビュー{表示|ひょうじ}",
      description: "{実際|じっさい}のテクスチャには{独自|どくじ}の{質感|しつかん}があり、ソリッドは{一致|いっち}した{色|いろ}だけを{表示|ひょうじ}する",
      ariaLabel: "プレビュー{表示|ひょうじ}",
      textured: "テクスチャ",
      solid: "ソリッドカラー",
    },
    zoom: {
      heading: "ズーム",
      description: "1×を{超える|こえる}と、はみ出した{部分|ぶぶん}はプレビューをスクロールして{確認|かくにん}できます",
      ariaLabel: "ズームレベル",
      fit: "フィット",
      label: (zoomValue: number, px: number) => `${zoomValue.toFixed(1)}× · ${px}px`,
      reset: "{リセット|りせっと}",
    },
    noBlocksAvailable:
      "{使える|つかえる}ブロックがありません。{戻って|もどって}、{少なくとも|すくなくとも}{一つ|ひとつ}{含めて|ふくめて}ください。",
    generating: "ピクセルアートを{生成中|せいせいちゅう}…",
    markedProgress: (marked: number, total: number) =>
      `${total}{個|こ}中${marked}{個|こ}を{設置済み|せっちずみ}としてマーク`,
    clearMarks: "マークを{解除|かいじょ}",
    clickToMark: "ゲーム{内|ない}で{設置|せっち}したら、ブロックをクリックしてください",
    rowButtonTitle: (row: number) => `${row}{行目|ぎょうめ}のブロック`,
    materialsHeading: (count: number) => `{素材|そざい}（${count}{個|こ}）`,
    collectedCount: (count: number) => `${count}{個|こ}{収集済み|しゅうしゅうずみ}`,
    clearCollected: "{収集済み|しゅうしゅうずみ}を{解除|かいじょ}",
    markCollectedAriaLabel: (name: string) => `${name}を{収集済み|しゅうしゅうずみ}としてマーク`,
    rowDialogTitle: (row: number, total: number) => `${total}{行中|ぎょうちゅう}${row}{行目|ぎょうめ}`,
    close: "{閉じる|とじる}",
    // Every block stacks to 64 in the actual game.
    stackBreakdown: (count: number): string | null => {
      const stacks = Math.floor(count / 64);
      if (stacks === 0) return null;
      const remainder = count % 64;
      const label = `${stacks}スタック`;
      return remainder === 0 ? label : `${label} + ${remainder}`;
    },
  },
};
