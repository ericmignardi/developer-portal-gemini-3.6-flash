import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const repoUrl = searchParams.get("repoUrl");

    if (!repoUrl) {
      return NextResponse.json({ error: "Missing repoUrl parameter" }, { status: 400 });
    }

    // Parse owner and repo from URL
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      return NextResponse.json({ error: "Invalid GitHub repository URL format" }, { status: 400 });
    }

    const owner = match[1];
    const repo = match[2].replace(/\.git$/, "");

    const token = process.env.GITHUB_TOKEN;

    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "Atlas-Dev-Portal",
    };

    if (token && token.trim()) {
      headers.Authorization = `Bearer ${token}`;
    }

    // Fetch 5 most recent commits
    const commitsRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/commits?per_page=5`,
      { headers, next: { revalidate: 60 } }
    );

    // Fetch open pull requests
    const prsRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls?state=open&per_page=5`,
      { headers, next: { revalidate: 60 } }
    );

    if (commitsRes.status === 404 || prsRes.status === 404) {
      return NextResponse.json({
        disabled: true,
        message: `Repository '${owner}/${repo}' not found or is private (Personal Access Token required).`,
      });
    }

    if (commitsRes.status === 403 || prsRes.status === 403) {
      return NextResponse.json({
        disabled: true,
        message: "GitHub API rate limit exceeded or access forbidden.",
      });
    }

    if (!commitsRes.ok || !prsRes.ok) {
      return NextResponse.json({
        disabled: true,
        message: "Unable to reach GitHub API.",
      });
    }

    const commitsData = await commitsRes.json();
    const prsData = await prsRes.json();

    const commits = Array.isArray(commitsData)
      ? commitsData.map((c: any) => ({
          sha: c.sha.substring(0, 7),
          message: c.commit.message.split("\n")[0],
          author: c.commit.author.name,
          date: c.commit.author.date,
          url: c.html_url,
        }))
      : [];

    const pullRequests = Array.isArray(prsData)
      ? prsData.map((p: any) => ({
          id: p.id,
          number: p.number,
          title: p.title,
          author: p.user.login,
          url: p.html_url,
          createdAt: p.created_at,
        }))
      : [];

    return NextResponse.json({
      owner,
      repo,
      commits,
      pullRequests,
      hasToken: Boolean(token && token.trim()),
    });
  } catch (error) {
    console.error("GitHub API Handler error:", error);
    return NextResponse.json({
      disabled: true,
      message: "An unexpected error occurred while connecting to GitHub.",
    });
  }
}
