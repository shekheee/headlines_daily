// Auto-reply to comments on our OWN recent Instagram posts. Fast, genuine replies
// (especially in the first hour) boost the engagement signal and expand reach.
// This uses ONLY official, permitted endpoints — it never touches other accounts.
import { prisma } from "@/lib/prisma";
import { geminiText } from "@/lib/gemini";
import { getAccountUsername } from "@/lib/instagram";

const GRAPH = process.env.IG_GRAPH_BASE || "https://graph.facebook.com/v21.0";

interface IgReply {
  username?: string;
}
interface IgComment {
  id: string;
  text?: string;
  username?: string;
  replies?: { data: IgReply[] };
}

export interface EngageResult {
  ok: boolean;
  postsChecked: number;
  commentsSeen: number;
  replied: number;
  errors: string[];
}

async function ourHandle(): Promise<string> {
  // Fetch the live username so renaming the account never breaks self-detection.
  const live = await getAccountUsername();
  if (live) return live.toLowerCase();
  return (process.env.IG_BRAND_HANDLE || "").replace(/^@/, "").toLowerCase();
}

async function fetchComments(mediaId: string, token: string): Promise<IgComment[]> {
  const res = await fetch(`${GRAPH}/${mediaId}/comments?fields=id,text,username,replies{username}&limit=50&access_token=${token}`);
  const data = await res.json();
  return Array.isArray(data?.data) ? (data.data as IgComment[]) : [];
}

async function replyToComment(commentId: string, message: string, token: string): Promise<boolean> {
  try {
    const res = await fetch(`${GRAPH}/${commentId}/replies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: message.slice(0, 300), access_token: token }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function craftReply(commentText: string): Promise<string> {
  const fallback = ["Thanks for reading! 🙏", "Appreciate you 🙌", "Glad this resonated!", "Thanks for engaging 👏"];
  try {
    const out = await geminiText(
      `You run an Indian news Instagram account. A follower left this comment: "${commentText}". ` +
        `Write ONE warm, human, 1-sentence reply (max 12 words). No hashtags, no links, at most one emoji. ` +
        `If the comment is negative or spam, reply politely and neutrally.`
    );
    const clean = (out || "").replace(/["\n]/g, " ").replace(/\s+/g, " ").trim();
    return clean && clean.length <= 150 ? clean : fallback[Math.floor(Math.random() * fallback.length)];
  } catch {
    return fallback[Math.floor(Math.random() * fallback.length)];
  }
}

/** Reply to unanswered comments on posts from the last `withinDays` days. */
export async function engageRecentComments(opts: { withinDays?: number; maxPerPost?: number; dryRun?: boolean } = {}): Promise<EngageResult> {
  const withinDays = opts.withinDays ?? 3;
  const maxPerPost = opts.maxPerPost ?? 8;
  const errors: string[] = [];
  if (!process.env.IG_USER_ID || !process.env.IG_ACCESS_TOKEN) {
    return { ok: false, postsChecked: 0, commentsSeen: 0, replied: 0, errors: ["Instagram not configured"] };
  }
  const token = process.env.IG_ACCESS_TOKEN;
  const me = await ourHandle();

  const since = new Date(Date.now() - withinDays * 86400_000);
  const posts = await prisma.socialPost.findMany({ where: { postedAt: { gte: since } }, orderBy: { postedAt: "desc" } });

  let commentsSeen = 0;
  let replied = 0;
  for (const post of posts) {
    let comments: IgComment[] = [];
    try {
      comments = await fetchComments(post.igMediaId, token);
    } catch (e) {
      errors.push(`fetch ${post.igMediaId}: ${e instanceof Error ? e.message : "err"}`);
      continue;
    }
    let repliedHere = 0;
    for (const c of comments) {
      if (repliedHere >= maxPerPost) break;
      commentsSeen++;
      const author = (c.username || "").toLowerCase();
      if (!author || author === me) continue; // skip our own (incl. the hashtag first-comment)
      const alreadyReplied = (c.replies?.data || []).some((r) => (r.username || "").toLowerCase() === me);
      if (alreadyReplied) continue;
      const msg = await craftReply(c.text || "");
      if (opts.dryRun) {
        replied++;
        repliedHere++;
        continue;
      }
      if (await replyToComment(c.id, msg, token)) {
        replied++;
        repliedHere++;
      }
    }
  }
  return { ok: true, postsChecked: posts.length, commentsSeen, replied, errors };
}
