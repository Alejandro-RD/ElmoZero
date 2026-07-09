document.addEventListener('DOMContentLoaded', () => {
    const toggleButton = document.getElementById('theme-toggle');
    const body = document.body;
    const currentTheme = localStorage.getItem('theme');

    // Función para aplicar el tema
    function applyTheme(theme) {
        if (theme === 'light') {
            body.classList.add('light-mode');
            toggleButton.textContent = '🌙'; // Muestra la luna para cambiar a oscuro
        } else {
            body.classList.remove('light-mode');
            toggleButton.textContent = '☀️'; // Muestra el sol para cambiar a claro
        }
    }

    // 1. Cargar el tema guardado al inicio o usar oscuro por defecto
    if (currentTheme) {
        applyTheme(currentTheme);
    } else {
        applyTheme('dark'); 
    }

    // 2. Escuchar el evento de clic en el botón de tema claro/oscuro
    toggleButton.addEventListener('click', () => {
        if (body.classList.contains('light-mode')) {
            applyTheme('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            applyTheme('light');
            localStorage.setItem('theme', 'light');
        }
    });

    // --- LÓGICA DE LA GALERÍA DE CLIPS ---
    const clipButton = document.getElementById('toggle-clips-button');
    const allClips = document.querySelectorAll('.clips-section .video-item');
    
    // Si hay 2 o menos clips, simplemente ocultamos el botón y no bloqueamos el script
    if (allClips.length <= 2) {
        if (clipButton) clipButton.style.display = 'none';
    } else {
        // Inicialmente, nos aseguramos de que a partir del tercer clip tengan la clase hidden
        for (let i = 2; i < allClips.length; i++) {
            allClips[i].classList.add('hidden');
        }

        // Función para manejar el clic del botón (Mostrar / Ocultar)
        clipButton.addEventListener('click', () => {
            let isHidden = allClips[2].classList.contains('hidden');

            if (isHidden) {
                // Mostrar los clips ocultos
                for (let i = 2; i < allClips.length; i++) {
                    allClips[i].classList.remove('hidden');
                }
                clipButton.textContent = 'Ver menos clips ▲';
            } else {
                // Ocultar los clips extras
                for (let i = 2; i < allClips.length; i++) {
                    allClips[i].classList.add('hidden');
                }
                clipButton.textContent = 'Ver más clips ▼';
            }
        });
    }

    // --- LÓGICA DEL INDICADOR EN VIVO DE TWITCH (Usando Serverless API) ---
    async function checkTwitchStatus() {
        const twitchLink = document.getElementById('twitch-link');
        if (!twitchLink) return; // Validación de seguridad por si acaso
        
        twitchLink.textContent = 'Verificando estado...';

        try {
            // Llama a tu función Serverless en Vercel
            const response = await fetch('/api/twitch'); 
            const data = await response.json();

            if (data.error) {
                console.error(data.error);
                twitchLink.textContent = 'Twitch - Error al obtener estado';
                twitchLink.classList.remove('live-active');
                return;
            }

            if (data.isLive) {
                // ¡ESTÁ EN VIVO!
                twitchLink.textContent = `🔴 ¡EN VIVO! - ${data.title || 'Twitch Stream'}`;
                twitchLink.classList.add('live-active');
            } else {
                // No está en vivo
                twitchLink.textContent = 'Offline - Sígueme en Twitch';
                twitchLink.classList.remove('live-active');
            }

        } catch (error) {
            console.error("Error de conexión con el endpoint de la API:", error);
            twitchLink.textContent = 'Twitch - Enlace Directo';
        }
    }

    // Se ejecuta la verificación de Twitch de forma segura al final de la carga
    checkTwitchStatus();
});