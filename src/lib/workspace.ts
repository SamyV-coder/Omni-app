// Google Workspace Client API for Gmail and Drive
// Strictly uses Bearer token cached in memory from Firebase GoogleAuthProvider

export interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  subject: string;
  from: string;
  date: string;
  unread: boolean;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  iconLink?: string;
  webViewLink?: string;
  modifiedTime?: string;
  size?: string;
}

export async function fetchGmailMessages(accessToken: string, maxResults = 10): Promise<GmailMessage[]> {
  try {
    const listRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&q=in:inbox`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      }
    );

    if (!listRes.ok) {
      const err = await listRes.json().catch(() => ({}));
      throw new Error(err.error?.message || `Gmail API Error: ${listRes.status}`);
    }

    const listData = await listRes.json();
    if (!listData.messages || listData.messages.length === 0) {
      return [];
    }

    // Fetch details for each message
    const messages = await Promise.all(
      listData.messages.slice(0, 8).map(async (msgItem: { id: string }) => {
        try {
          const detailRes = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgItem.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
            {
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          );
          if (!detailRes.ok) return null;
          const detail = await detailRes.json();
          const headers = detail.payload?.headers || [];
          const subject = headers.find((h: any) => h.name.toLowerCase() === "subject")?.value || "(Sans objet)";
          const from = headers.find((h: any) => h.name.toLowerCase() === "from")?.value || "Expéditeur inconnu";
          const date = headers.find((h: any) => h.name.toLowerCase() === "date")?.value || "";
          const unread = detail.labelIds?.includes("UNREAD") || false;

          return {
            id: detail.id,
            threadId: detail.threadId,
            snippet: detail.snippet || "",
            subject,
            from,
            date,
            unread,
          } as GmailMessage;
        } catch {
          return null;
        }
      })
    );

    return messages.filter((m): m is GmailMessage => m !== null);
  } catch (error) {
    console.error("fetchGmailMessages error:", error);
    throw error;
  }
}

export async function sendGmailMessage(
  accessToken: string,
  to: string,
  subject: string,
  bodyText: string
): Promise<{ id: string }> {
  // Construct RFC 2822 email format and base64url encode
  const emailLines = [
    `To: ${to}`,
    `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    `Content-Type: text/plain; charset=utf-8`,
    `MIME-Version: 1.0`,
    "",
    bodyText,
  ];

  const rawEmail = emailLines.join("\r\n");
  const encodedEmail = btoa(unescape(encodeURIComponent(rawEmail)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: encodedEmail }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to send email (${res.status})`);
  }

  return await res.json();
}

export async function fetchDriveFiles(accessToken: string, pageSize = 15): Promise<DriveFile[]> {
  try {
    const query = encodeURIComponent("trashed = false");
    const fields = encodeURIComponent("files(id, name, mimeType, iconLink, webViewLink, modifiedTime, size)");
    const url = `https://www.googleapis.com/drive/v3/files?q=${query}&pageSize=${pageSize}&fields=${fields}&orderBy=modifiedTime desc`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Drive API Error: ${res.status}`);
    }

    const data = await res.json();
    return data.files || [];
  } catch (error) {
    console.error("fetchDriveFiles error:", error);
    throw error;
  }
}

export async function createDriveFile(
  accessToken: string,
  name: string,
  content: string
): Promise<DriveFile> {
  const metadata = {
    name,
    mimeType: "text/plain",
  };

  const form = new FormData();
  form.append(
    "metadata",
    new Blob([JSON.stringify(metadata)], { type: "application/json" })
  );
  form.append("file", new Blob([content], { type: "text/plain" }));

  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: form,
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Drive Upload Error: ${res.status}`);
  }

  return await res.json();
}
