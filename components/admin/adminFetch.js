// Tiny fetch wrapper for admin client components.
// Throws a readable Error for non-2xx responses so pages can show the message.

export async function adminFetch(path, options = {}) {
  const { body, headers, ...rest } = options;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  const response = await fetch(path, {
    ...rest,
    body,
    headers: isFormData
      ? headers
      : { "Content-Type": "application/json", ...(headers || {}) },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`);
  }

  return data;
}
