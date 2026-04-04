export async function reportErrorToDiscord(error: {
  message: string;
  stack?: string;
  digest?: string;
  cause?: unknown;
}) {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) {
    console.error('Discord webhook URL is not set.');
    return;
  }

  const date = new Date().toLocaleString('de-DE', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const causeInfo =
    error.cause instanceof Error
      ? error.cause.stack?.slice(0, 1000)
      : JSON.stringify(error.cause, null, 2);

  try {
    const digestStr = `**Digest**: ${error.digest ?? '–'}\n`;

    const causeStr = `**Cause**:\n\`\`\`${causeInfo?.slice(0, 600) ?? '–'}\`\`\`\n`;

    const stackStr = `**Stack**:\n\`\`\`${error.stack?.slice(0, 1000) ?? '–'}\`\`\``;

    const content = `🚨 Fehler:
**Message**: ${error.message}
**Timestamp**: ${date} Uhr
${digestStr}${causeStr}${stackStr}`;

    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
  } catch (e) {
    console.error('Something went wrong reporting the Error:', e);
  }
}
