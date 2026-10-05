// Token de aplicación reutilizado entre invocaciones mientras la instancia de Vercel siga activa
let cachedToken = null;
let tokenExpiresAt = 0;

// Obtiene un Access Token (Token de Portador) de Twitch, reutilizando el de caché si sigue vigente
async function getAccessToken(clientId, clientSecret) {
    if (cachedToken && Date.now() < tokenExpiresAt) {
        return cachedToken;
    }

    // Las credenciales van en el cuerpo del POST, no en la URL, para que no queden en logs
    const tokenResponse = await fetch('https://id.twitch.tv/oauth2/token', {
        method: 'POST',
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'client_credentials',
        }),
    });

    if (!tokenResponse.ok) {
        console.error(`Twitch token request failed: HTTP ${tokenResponse.status}`, await tokenResponse.text());
        return null;
    }

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
        return null;
    }

    cachedToken = tokenData.access_token;
    // Renovamos un minuto antes de que caduque para no usar un token a punto de expirar
    tokenExpiresAt = Date.now() + ((tokenData.expires_in ?? 3600) - 60) * 1000;
    return cachedToken;
}

// Consulta el estado del stream en la Helix API
function fetchStream(clientId, accessToken, username) {
    const streamUrl = `https://api.twitch.tv/helix/streams?${new URLSearchParams({ user_login: username })}`;
    return fetch(streamUrl, {
        headers: {
            'Client-ID': clientId,
            'Authorization': `Bearer ${accessToken}`,
        },
    });
}

// La función se exporta para que Vercel la reconozca como un endpoint de API
export default async function (req, res) {
    // ⚠️ ATENCIÓN: Estas claves se inyectarán de forma segura desde Vercel
    const CLIENT_ID = process.env.TWITCH_CLIENT_ID;
    const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
    const TWITCH_USERNAME = process.env.TWITCH_USERNAME;

    // Los errores no se cachean, para que el siguiente visitante vuelva a intentarlo
    res.setHeader('Cache-Control', 'no-store');

    if (!CLIENT_ID || !CLIENT_SECRET || !TWITCH_USERNAME) {
        return res.status(500).json({ error: "Missing Twitch API credentials or username in Vercel Environment Variables." });
    }

    try {
        // PASO 1: Obtener el Access Token
        let accessToken = await getAccessToken(CLIENT_ID, CLIENT_SECRET);
        if (!accessToken) {
            return res.status(502).json({ error: "Could not retrieve Access Token from Twitch." });
        }

        // PASO 2: Usar el Token para verificar el estado del Stream
        let streamResponse = await fetchStream(CLIENT_ID, accessToken, TWITCH_USERNAME);

        // Si Twitch revocó el token en caché, pedimos uno nuevo y reintentamos una vez
        if (streamResponse.status === 401) {
            cachedToken = null;
            accessToken = await getAccessToken(CLIENT_ID, CLIENT_SECRET);
            if (!accessToken) {
                return res.status(502).json({ error: "Could not retrieve Access Token from Twitch." });
            }
            streamResponse = await fetchStream(CLIENT_ID, accessToken, TWITCH_USERNAME);
        }

        // Sin esta comprobación, un 401/429 de Twitch se mostraría como "Offline"
        if (!streamResponse.ok) {
            console.error(`Twitch streams request failed: HTTP ${streamResponse.status}`, await streamResponse.text());
            return res.status(502).json({ error: "Twitch API returned an error while checking stream status." });
        }

        const streamData = await streamResponse.json();

        // Verificar si el stream está activo (la propiedad 'data' tiene elementos)
        const isLive = Array.isArray(streamData.data) && streamData.data.length > 0;
        const streamTitle = isLive ? streamData.data[0].title : null;

        // El CDN de Vercel sirve esta respuesta durante 60 s, así Twitch recibe como mucho una consulta por minuto
        res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');

        // Devuelve el resultado al frontend
        res.status(200).json({
            isLive: isLive,
            title: streamTitle,
        });

    } catch (error) {
        console.error("Twitch API Error:", error);
        res.status(500).json({ error: "Internal server error during Twitch API call." });
    }
}
