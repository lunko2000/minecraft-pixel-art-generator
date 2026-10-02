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
    next: "{次|つぎ}へ",
  },
};
