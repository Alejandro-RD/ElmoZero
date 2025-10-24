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

    // 1. Cargar el tema guardado al inicio
    if (currentTheme) {
        applyTheme(currentTheme);
    } else {
        // Si no hay tema guardado, usa el modo oscuro por defecto
        applyTheme('dark'); 
    }

    // 2. Escuchar el evento de clic en el botón
    toggleButton.addEventListener('click', () => {
        // Verificar si el cuerpo ya tiene la clase light-mode
        if (body.classList.contains('light-mode')) {
            // Si está en modo claro, cambiar a modo oscuro
            applyTheme('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            // Si está en modo oscuro, cambiar a modo claro
            applyTheme('light');
            localStorage.setItem('theme', 'light');
        }
    });

    const clipButton = document.getElementById('toggle-clips-button');
    const allClips = document.querySelectorAll('.clips-section .video-item');
    
    // Si hay 2 o menos clips, ocultamos el botón de toggle (no es necesario)
    if (allClips.length <= 2) {
        clipButton.style.display = 'none';
        return; // Detenemos la ejecución de la galería si no hay clips extra
    }

    // Inicialmente, solo mostramos los primeros 2 y ocultamos el resto
    // Esto lo hicimos con la clase 'hidden' en el HTML, pero lo verificamos con JS
    for (let i = 2; i < allClips.length; i++) {
        allClips[i].classList.add('hidden');
    }

    // Función para manejar el clic del botón
    clipButton.addEventListener('click', () => {
        let isHidden = false;
        
        // Verificamos si el primer elemento extra está oculto
        if (allClips.length > 2) {
            isHidden = allClips[2].classList.contains('hidden');
        }

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
});