// ============================================================================
// SAVED INSTAGRAM CONTENT TEMPLATES
// ----------------------------------------------------------------------------
// This file is the single source of truth for the Instagram content calendar.
// Edit theme names, prompts, colors, hashtags and the weekly/monthly schedule
// here — the generator reads everything from this config.
// ============================================================================

export type PostStyle =
  | "motivation" // single generated image + big quote/hook (no article needed)
  | "article-single" // single post built from ONE real article
  | "headlines" // carousel: cover + one slide per real article
  | "explainer"; // carousel: cover + AI "key takeaway" slides from ONE article

export interface Theme {
  id: string;
  name: string; // human name, e.g. "Monday Motivation"
  kicker: string; // label burned onto the image, e.g. "MONDAY MOTIVATION"
  style: PostStyle;
  slides: number; // target slide count for carousels
  categorySlugs?: string[]; // which article categories to pull from
  withinDays: number; // recency window for article selection
  accent: string; // hex (no #) used for the kicker text
  hashtags: string[];
  // Saved prompt fed to the text LLM to write the hook + caption (+ cover copy).
  copyPrompt: string;
  // Saved prompt template for the cover / motivation background image.
  imagePrompt: string;
}

const BRAND_HASHTAGS = ["#news", "#headlinesdaily", "#dailynews"];

export const THEMES: Record<string, Theme> = {
  monday_motivation: {
    id: "monday_motivation",
    name: "Monday Motivation",
    kicker: "MONDAY MOTIVATION",
    style: "motivation",
    slides: 1,
    withinDays: 3,
    accent: "FFD23F",
    hashtags: [...BRAND_HASHTAGS, "#mondaymotivation", "#motivation", "#mindset", "#success"],
    copyPrompt:
      "Write a punchy, original Monday-motivation post for a modern news brand. " +
      "Return: a HOOK of max 8 words (bold, quotable, no clichés like 'rise and grind'), " +
      "a SUB line of max 12 words, and a CAPTION of 2-4 short sentences that ties motivation " +
      "to staying informed and taking on the week, ending with an inspiring one-liner.",
    imagePrompt:
      "Cinematic, aspirational photograph for a Monday motivation post: a lone figure (face not visible) " +
      "at dawn overlooking a vast city skyline or mountain vista, warm golden sunrise light, sense of " +
      "possibility and momentum. Photojournalistic, high detail, no text, no logos, no watermark.",
  },

  tech_tuesday: {
    id: "tech_tuesday",
    name: "Tech Tuesday",
    kicker: "TECH TUESDAY",
    style: "explainer",
    slides: 4,
    categorySlugs: ["technology", "science"],
    withinDays: 7,
    accent: "3DD6D0",
    hashtags: [...BRAND_HASHTAGS, "#techtuesday", "#technology", "#ai", "#innovation", "#science"],
    copyPrompt:
      "You are turning ONE tech/science news article into a swipeable explainer carousel. " +
      "Return a COVER hook of max 8 words, then 3 KEY POINTS (each max 14 words, punchy, plain-English), " +
      "and a CAPTION of 2-3 sentences summarizing why it matters, no hype.",
    imagePrompt:
      "Sleek, modern tech-editorial background image (abstract or contextual to the topic), " +
      "cool blue/teal palette, futuristic but clean, cinematic lighting. No text, no logos, no watermark.",
  },

  world_wrap: {
    id: "world_wrap",
    name: "World Wrap",
    kicker: "WORLD WRAP",
    style: "headlines",
    slides: 5,
    categorySlugs: ["world", "politics"],
    withinDays: 2,
    accent: "FF6B6B",
    hashtags: [...BRAND_HASHTAGS, "#worldnews", "#worldwrap", "#globalnews", "#politics"],
    copyPrompt:
      "You are creating a midweek 'World Wrap' carousel of top global headlines. " +
      "Return a COVER hook of max 6 words (e.g. 'The world, midweek') and a CAPTION of 2-3 sentences " +
      "teasing the stories inside and inviting a swipe.",
    imagePrompt:
      "Striking editorial cover image representing global news: a stylized world/globe motif or an " +
      "iconic international skyline at blue hour, serious newsroom tone. No text, no logos, no watermark.",
  },

  deep_dive: {
    id: "deep_dive",
    name: "Deep Dive",
    kicker: "DEEP DIVE",
    style: "explainer",
    slides: 4,
    withinDays: 4,
    accent: "C08CFF",
    hashtags: [...BRAND_HASHTAGS, "#deepdive", "#explained", "#news", "#context"],
    copyPrompt:
      "You are turning ONE major news story into a 'Deep Dive' explainer carousel. " +
      "Return a COVER hook of max 8 words, 3 KEY POINTS (each max 14 words) that break the topic down " +
      "clearly and neutrally, and a CAPTION of 2-3 sentences on why it matters.",
    imagePrompt:
      "Moody, editorial cinematic background image contextual to the story's topic, dramatic lighting, " +
      "documentary feel. No text, no logos, no watermark.",
  },

  culture_friday: {
    id: "culture_friday",
    name: "Culture & Weekend Reads",
    kicker: "CULTURE & WEEKEND READS",
    style: "article-single",
    slides: 1,
    categorySlugs: ["entertainment", "culture"],
    withinDays: 5,
    accent: "FF9F1C",
    hashtags: [...BRAND_HASHTAGS, "#culture", "#weekendreads", "#entertainment", "#fridayfeeling"],
    copyPrompt:
      "You are creating a Friday 'Culture & Weekend Reads' post from ONE article. " +
      "Return a HOOK of max 9 words (inviting, weekend energy), a SUB of max 12 words, and a CAPTION " +
      "of 2-3 sentences that make it feel like the perfect weekend read.",
    imagePrompt: "", // uses the article's own image
  },

  sports_saturday: {
    id: "sports_saturday",
    name: "Sports Saturday",
    kicker: "SPORTS SATURDAY",
    style: "headlines",
    slides: 5,
    categorySlugs: ["sports"],
    withinDays: 7,
    accent: "2EC4B6",
    hashtags: [...BRAND_HASHTAGS, "#sportssaturday", "#sports", "#football", "#sportsnews"],
    copyPrompt:
      "You are creating a 'Sports Saturday' carousel of the week's biggest sports stories. " +
      "Return a COVER hook of max 6 words with high energy and a CAPTION of 2-3 sentences teasing the swipe.",
    imagePrompt:
      "High-energy sports editorial cover: dramatic stadium atmosphere, floodlights, motion and crowd " +
      "energy, cinematic. No text, no logos, no watermark.",
  },

  sunday_briefing: {
    id: "sunday_briefing",
    name: "Sunday Briefing",
    kicker: "SUNDAY BRIEFING",
    style: "headlines",
    slides: 6,
    withinDays: 7,
    accent: "8ECAE6",
    hashtags: [...BRAND_HASHTAGS, "#sundaybriefing", "#weekinreview", "#news", "#catchup"],
    copyPrompt:
      "You are creating a 'Sunday Briefing' carousel recapping the week's biggest stories across topics. " +
      "Return a COVER hook of max 7 words and a CAPTION of 2-3 sentences framing the week that was.",
    imagePrompt:
      "Calm, premium editorial cover for a weekly news recap: soft Sunday-morning light, newspaper-and-coffee " +
      "mood or a serene city at dawn, reflective tone. No text, no logos, no watermark.",
  },

  monthly_feature: {
    id: "monthly_feature",
    name: "Month in Review",
    kicker: "MONTH IN REVIEW",
    style: "headlines",
    slides: 8,
    withinDays: 31,
    accent: "E0AAFF",
    hashtags: [...BRAND_HASHTAGS, "#monthinreview", "#recap", "#news", "#monthlyroundup"],
    copyPrompt:
      "You are creating a premium 'Month in Review' carousel of the month's defining stories. " +
      "Return a COVER hook of max 7 words and a CAPTION of 3-4 sentences reflecting on the month.",
    imagePrompt:
      "Premium, magazine-cover-quality editorial image summarizing a month of world events, cinematic and " +
      "timeless, sophisticated color grade. No text, no logos, no watermark.",
  },
};

// Weekday (0=Sun ... 6=Sat) -> theme id.
export const WEEKLY_SCHEDULE: Record<number, string> = {
  0: "sunday_briefing",
  1: "monday_motivation",
  2: "tech_tuesday",
  3: "world_wrap",
  4: "deep_dive",
  5: "culture_friday",
  6: "sports_saturday",
};

/** Pick the theme for a given date. The 1st of the month is the Monthly Feature. */
export function getThemeForDate(date = new Date()): Theme {
  if (date.getDate() === 1) return THEMES.monthly_feature;
  const id = WEEKLY_SCHEDULE[date.getDay()] ?? "world_wrap";
  return THEMES[id];
}

export function fullHashtags(theme: Theme): string {
  return Array.from(new Set(theme.hashtags)).join(" ");
}
