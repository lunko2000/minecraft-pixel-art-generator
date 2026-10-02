"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { type Mode, usePixelArt } from "@/app/pixel-art-provider";
import {
  LEGACY_VERSION,
  blockIcon,
  blockName,
  blocks,
  categories,
  categoryName,
  categoryNote,
  type Block,
  type Difficulty,
  type VersionFilter,
} from "@/data/blocks";
import { stripFurigana } from "@/lib/i18n/furigana";
import { T } from "@/lib/i18n/T";
import { useLanguage } from "@/lib/i18n/use-language";
import { useTranslations } from "@/lib/i18n/use-translations";
import { usePresets } from "@/lib/use-presets";

type DifficultyFilter = Difficulty | "All";

const difficultyFilters: DifficultyFilter[] = ["All", "Easy", "Medium", "Hard"];

const difficultyStyles: Record<Difficulty, string> = {
  Easy: "bg-emerald-950 text-emerald-300",
  Medium: "bg-amber-950 text-amber-300",
  Hard: "bg-rose-950 text-rose-300",
};

export function BlockPicker() {
  const router = useRouter();
  const {
    mode,
    setMode,
    excludedBlocks: excluded,
    setExcludedBlocks: setExcluded,
    version,
    setVersion,
  } = usePixelArt();
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("All");
  const { presets, savePreset, deletePreset } = usePresets();
  const [presetName, setPresetName] = useState("");
  const { language } = useLanguage();
  const t = useTranslations();

  const modes: { id: Mode; title: string; description: string }[] = [
    { id: "creative", title: t.modes.creative.title, description: t.modes.creative.description },
    { id: "survival", title: t.modes.survival.title, description: t.modes.survival.description },
  ];
  const modeShortLabel = (m: Mode) => (m === "creative" ? t.modes.creativeShort : t.modes.survivalShort);
  const versionFilters: { id: VersionFilter; label: string }[] = [
    { id: "all", label: t.version.latest },
    { id: LEGACY_VERSION, label: LEGACY_VERSION },
  ];

  // Blocks that didn't exist yet in an older version you might play instead.
  const versionBlocks =
    version === "all" ? blocks : blocks.filter((block) => block.since === version);

  const includedCount =
    mode === "creative"
      ? versionBlocks.length
      : versionBlocks.filter((block) => !excluded.has(block.id)).length;

  const toggleBlock = (id: string) =>
    setExcluded((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  const setMany = (ids: string[], exclude: boolean) =>
    setExcluded((current) => {
      const next = new Set(current);
      for (const id of ids) {
        if (exclude) next.add(id);
        else next.delete(id);
      }
      return next;
    });

  const loadPreset = (preset: (typeof presets)[number]) => {
    setMode(preset.mode);
    setVersion(preset.version);
    setExcluded(new Set(preset.excludedBlockIds));
  };

  const handleSavePreset = () => {
    const name = presetName.trim();
    if (!name) return;
    savePreset({ name, mode, version, excludedBlockIds: [...excluded] });
    setPresetName("");
  };

  const search = query.trim().toLowerCase();
  const visibleCategories = categories
    .filter((category) => difficulty === "All" || category.difficulty === difficulty)
    .map((category) => ({
      category,
      items: versionBlocks.filter(
        (block) =>
          block.category === category.id &&
          blockName(block, language).toLowerCase().includes(search),
      ),
    }))
    .filter(({ items }) => items.length > 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <div>
          <div className="text-sm font-medium text-zinc-300">
            <T>{t.presets.heading}</T>
          </div>
          <p className="text-sm text-zinc-500">
            <T>{t.presets.description}</T>
          </p>
        </div>

        {presets.length > 0 && (
          <ul className="flex flex-col gap-2">
            {presets.map((preset) => {
              const presetVersionBlocks =
                preset.version === "all" ? blocks : blocks.filter((b) => b.since === preset.version);
              const excludedIds = new Set(preset.excludedBlockIds);
              const count =
                preset.mode === "creative"
                  ? presetVersionBlocks.length
                  : presetVersionBlocks.filter((b) => !excludedIds.has(b.id)).length;

              return (
                <li
                  key={preset.id}
                  className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm"
                >
                  <span className="truncate font-medium text-zinc-200">{preset.name}</span>
                  <span className="shrink-0 text-zinc-500">
                    <T>{t.presets.summary(count, modeShortLabel(preset.mode))}</T>
                  </span>
                  <div className="ml-auto flex shrink-0 gap-3">
                    <button
                      type="button"
                      onClick={() => loadPreset(preset)}
                      className="cursor-pointer text-zinc-300 underline-offset-4 hover:underline"
                    >
                      <T>{t.presets.load}</T>
                    </button>
                    <button
                      type="button"
                      onClick={() => deletePreset(preset.id)}
                      className="cursor-pointer text-rose-400 underline-offset-4 hover:underline"
                    >
                      <T>{t.presets.delete}</T>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            aria-label={stripFurigana(t.presets.nameAriaLabel)}
            placeholder={stripFurigana(t.presets.namePlaceholder)}
            value={presetName}
            onChange={(event) => setPresetName(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && handleSavePreset()}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none sm:max-w-xs"
          />
          <button
            type="button"
            onClick={handleSavePreset}
            disabled={!presetName.trim()}
            className="cursor-pointer rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-zinc-700"
          >
            <T>{t.presets.save}</T>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <div>
          <div className="text-sm font-medium text-zinc-300">
            <T>{t.version.heading}</T>
          </div>
          <p className="text-sm text-zinc-500">
            <T>{t.version.description}</T>
          </p>
        </div>
        <div className="flex gap-2" role="group" aria-label={stripFurigana(t.version.ariaLabel)}>
          {versionFilters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              aria-pressed={version === filter.id}
              onClick={() => setVersion(filter.id)}
              className="cursor-pointer rounded-full border border-zinc-700 px-3 py-1 text-sm text-zinc-400 transition-colors hover:border-zinc-500 aria-pressed:border-zinc-300 aria-pressed:bg-zinc-100 aria-pressed:text-zinc-900"
            >
              <T>{filter.label}</T>
            </button>
          ))}
        </div>
      </div>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="sr-only">Game mode</legend>
        {modes.map(({ id, title, description }) => (
          <label key={id} className="cursor-pointer">
            <input
              type="radio"
              name="mode"
              value={id}
              checked={mode === id}
              onChange={() => setMode(id)}
              className="peer sr-only"
            />
            <div className="h-full rounded-xl border border-zinc-800 bg-zinc-900 p-5 transition-colors hover:border-zinc-700 peer-checked:border-zinc-300 peer-focus-visible:ring-2 peer-focus-visible:ring-zinc-500">
              <div className="font-medium text-zinc-100">
                <T>{title}</T>
              </div>
              <div className="mt-1 text-sm text-zinc-400">
                <T>{description}</T>
              </div>
            </div>
          </label>
        ))}
      </fieldset>

      {mode === "creative" ? (
        <p className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 text-sm text-zinc-400">
          <T>{t.blocksPage.creativeSummary(versionBlocks.length, version !== "all" ? version : null)}</T>
        </p>
      ) : (
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="search"
              aria-label={stripFurigana(t.blocksPage.searchPlaceholder)}
              placeholder={stripFurigana(t.blocksPage.searchPlaceholder)}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none sm:max-w-xs"
            />
            <div
              className="flex gap-2"
              role="group"
              aria-label={stripFurigana(t.blocksPage.difficultyAriaLabel)}
            >
              {difficultyFilters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  aria-pressed={difficulty === filter}
                  onClick={() => setDifficulty(filter)}
                  className="cursor-pointer rounded-full border border-zinc-700 px-3 py-1 text-sm text-zinc-400 transition-colors hover:border-zinc-500 aria-pressed:border-zinc-300 aria-pressed:bg-zinc-100 aria-pressed:text-zinc-900"
                >
                  <T>{filter === "All" ? t.blocksPage.difficultyAll : t.blocksPage.difficultyLabel[filter]}</T>
                </button>
              ))}
            </div>
            <p className="text-sm text-zinc-400 sm:ml-auto">
              <T>{t.blocksPage.blocksIncluded(includedCount, versionBlocks.length)}</T>
            </p>
          </div>

          {visibleCategories.length === 0 && (
            <p className="text-sm text-zinc-500">
              <T>{t.blocksPage.noMatches}</T>
            </p>
          )}

          {visibleCategories.map(({ category, items }) => {
            const ids = items.map((block) => block.id);
            const allExcluded = ids.every((id) => excluded.has(id));
            const includedInCategory = ids.filter((id) => !excluded.has(id)).length;

            return (
              <div key={category.id} className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <h2 className="font-medium text-zinc-100">
                    <T>{categoryName(category, language)}</T>
                  </h2>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${difficultyStyles[category.difficulty]}`}
                  >
                    <T>{t.blocksPage.difficultyLabel[category.difficulty]}</T>
                  </span>
                  <span className="text-sm text-zinc-500">
                    <T>{categoryNote(category, language)}</T>
                  </span>
                  <span className="text-sm text-zinc-500 sm:ml-auto">
                    <T>{t.blocksPage.categoryIncluded(includedInCategory, items.length)}</T>
                  </span>
                  <button
                    type="button"
                    onClick={() => setMany(ids, !allExcluded)}
                    className="cursor-pointer text-sm text-zinc-300 underline-offset-4 hover:underline"
                  >
                    <T>{allExcluded ? t.blocksPage.includeAll : t.blocksPage.excludeAll}</T>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {items.map((block) => (
                    <BlockTile
                      key={block.id}
                      block={block}
                      included={!excluded.has(block.id)}
                      onToggle={() => toggleBlock(block.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      )}

      <button
        type="button"
        onClick={() => router.push("/generate")}
        className="w-full cursor-pointer rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
      >
        <T>{t.common.next}</T>
      </button>
    </div>
  );
}

function BlockTile({
  block,
  included,
  onToggle,
}: {
  block: Block;
  included: boolean;
  onToggle: () => void;
}) {
  const { language } = useLanguage();
  // Plain text only — see the note on Block.nameJa for why this (unlike
  // everything else Japanese in the app) carries no furigana markup to render.
  const name = blockName(block, language);
  return (
    <button
      type="button"
      title={name}
      aria-pressed={included}
      onClick={onToggle}
      className="flex cursor-pointer items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-900 p-2 text-left text-sm text-zinc-200 transition-colors hover:border-zinc-500 aria-[pressed=false]:border-zinc-800 aria-[pressed=false]:text-zinc-500 aria-[pressed=false]:line-through aria-[pressed=false]:opacity-50"
    >
      <Image
        src={blockIcon(block)}
        alt=""
        width={32}
        height={32}
        unoptimized
        className="size-8 shrink-0 [image-rendering:pixelated]"
      />
      <span className="truncate">{name}</span>
    </button>
  );
}
