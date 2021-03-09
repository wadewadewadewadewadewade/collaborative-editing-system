// below borrowed from here: https://dmitripavlutin.com/timeout-fetch-request/
export async function fetchWithTimeout(resource, options) {
  const { timeout = 4000 } = options;
  
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  const response = await fetch(resource, {
    ...options,
    signal: controller.signal  
  });
  clearTimeout(id);

  return response;
}
