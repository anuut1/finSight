export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Proxy all /api requests to the Render backend so requests originate from Cloudflare's servers,
    // bypassing any campus/hostel Wi-Fi firewall blocks on third-party backend hosting domains.
    if (url.pathname.startsWith('/api')) {
      const backendBase = env.BACKEND_URL || 'https://finsight-4qqi.onrender.com';
      const targetUrl = new URL(url.pathname + url.search, backendBase);

      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('host', targetUrl.host);
      
      const clientIp = request.headers.get('cf-connecting-ip');
      if (clientIp) {
        requestHeaders.set('x-forwarded-for', clientIp);
      }

      // Handle CORS preflight options directly if needed
      if (request.method.toUpperCase() === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': url.origin,
            'Access-Control-Allow-Methods': 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
            'Access-Control-Allow-Headers': request.headers.get('Access-Control-Request-Headers') || '*',
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Max-Age': '86400',
          },
        });
      }

      const method = request.method.toUpperCase();
      const fetchOptions = {
        method,
        headers: requestHeaders,
        redirect: 'follow',
      };

      if (!['GET', 'HEAD'].includes(method)) {
        fetchOptions.body = request.body;
        // Required by Cloudflare runtime when forwarding streaming request body
        fetchOptions.duplex = 'half';
      }

      try {
        const response = await fetch(targetUrl.toString(), fetchOptions);

        const responseHeaders = new Headers(response.headers);
        responseHeaders.set('Access-Control-Allow-Origin', url.origin);
        responseHeaders.set('Access-Control-Allow-Credentials', 'true');

        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
        });
      } catch (err) {
        return new Response(
          JSON.stringify({
            success: false,
            message: `FinSight Cloudflare proxy could not connect to backend: ${err.message}`,
          }),
          {
            status: 502,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': url.origin,
            },
          }
        );
      }
    }

    // Serve static frontend SPA assets
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not found', { status: 404 });
  },
};
