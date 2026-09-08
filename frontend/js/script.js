const html = document.documentElement;
const canvas = document.getElementById("hero-lightpass");
const context = canvas.getContext("2d");

const frameCount = 239;
const currentFrame = index => (
  `/public/frames/frame_${String(index).padStart(6, '0')}.jpg`
);

const images = [];
// Initialize empty image objects
for (let i = 0; i <= frameCount; i++) {
  images[i] = new Image();
}

function setCanvasDimensions() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
setCanvasDimensions();

function drawCover(img) {
  if (!img || !img.complete || img.naturalWidth === 0) return;

  const canvasRatio = canvas.width / canvas.height;
  const imgRatio = img.naturalWidth / img.naturalHeight;

  let drawWidth, drawHeight;
  let offsetX = 0, offsetY = 0;

  if (canvasRatio > imgRatio) {
    drawWidth = canvas.width;
    drawHeight = canvas.width / imgRatio;
    offsetY = (canvas.height - drawHeight) / 2;
  } else {
    drawWidth = canvas.height * imgRatio;
    drawHeight = canvas.height;
    offsetX = (canvas.width - drawWidth) / 2;
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, offsetX, offsetY, drawWidth, drawHeight);
}

const updateImage = index => {
  const currentImg = images[index];

  // If the image hasn't started loading yet, load it now
  if (!currentImg.src) {
    currentImg.src = currentFrame(index);
  }

  if (currentImg.complete) {
    if (currentImg.naturalWidth > 0) {
      drawCover(currentImg);
    }
  } else {
    currentImg.onload = () => {
      if (currentImg.naturalWidth > 0) {
        drawCover(currentImg);
      }
    };
  }
}

// Sequential preloader to prevent network cancellation from too many simultaneous requests
let preloadIndex = 0;
function preloadNext() {
  if (preloadIndex > frameCount) return;

  const img = images[preloadIndex];

  if (img.src) {
    // Already loading or loaded (due to user scroll), move to next
    preloadIndex++;
    preloadNext();
    return;
  }

  img.addEventListener('load', () => {
    preloadIndex++;
    preloadNext();
  });

  img.addEventListener('error', () => {
    preloadIndex++;
    preloadNext();
  });

  img.src = currentFrame(preloadIndex);
}

// Draw the first frame immediately, then start preloading the rest sequentially
if (!images[0].src) images[0].src = currentFrame(0);
if (images[0].complete) {
  drawCover(images[0]);
} else {
  images[0].addEventListener('load', () => drawCover(images[0]));
}
preloadNext();

window.addEventListener('scroll', () => {
  const scrollTop = html.scrollTop;
  const maxScrollTop = html.scrollHeight - window.innerHeight;
  const scrollFraction = maxScrollTop > 0 ? scrollTop / maxScrollTop : 0;

  const frameIndex = Math.min(
    frameCount,
    Math.max(0, Math.floor(scrollFraction * frameCount))
  );

  requestAnimationFrame(() => updateImage(frameIndex));
});

window.addEventListener('resize', () => {
  setCanvasDimensions();
  const scrollTop = html.scrollTop;
  const maxScrollTop = html.scrollHeight - window.innerHeight;
  const scrollFraction = maxScrollTop > 0 ? scrollTop / maxScrollTop : 0;
  const frameIndex = Math.min(
    frameCount,
    Math.max(0, Math.floor(scrollFraction * frameCount))
  );
  updateImage(frameIndex);
});

/* =========================================
   AUTHENTICATION BUTTON LOGIC
   ========================================= */
document.addEventListener('DOMContentLoaded', () => {
    const authBtn = document.getElementById('auth-btn');
    const authText = document.getElementById('auth-text');
    const authIcon = document.getElementById('auth-icon');
    
    // Check if elements exist before adding listeners (prevents errors)
    if (authBtn && authText) {
        // SVG string for the Login Icon
        const loginIconSvg = `
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
            <polyline points="10 17 15 12 10 7"></polyline>
            <line x1="15" y1="12" x2="3" y2="12"></line>
        `;

        // SVG string for the Logout Icon
        const logoutIconSvg = `
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
        `;

        const updateAuthUI = () => {
            const isLoggedIn = localStorage.getItem('user_token') !== null;
            if (isLoggedIn) {
                authText.textContent = 'Logout';
                if (authIcon) authIcon.innerHTML = logoutIconSvg;
            } else {
                authText.textContent = 'Login';
                if (authIcon) authIcon.innerHTML = loginIconSvg;
            }
        };

        // Initialize UI on load
        updateAuthUI();

        authBtn.addEventListener('click', (e) => {
            e.preventDefault(); // Prevents page from jumping
            
            if (localStorage.getItem('user_token') !== null) {
                // Action to take when logging out
                console.log("Logging out...");
                localStorage.removeItem('user_token');
                localStorage.removeItem('username');
                
                updateAuthUI();
                // Optionally redirect to home page or login page after logout
                window.location.href = 'index.html'; 
            } else {
                // Action to take when logging in
                console.log("Redirecting to login page...");
                
                // Redirect to login page
                window.location.href = 'login.html'; 
            }
        });
    }
});

/* =========================================
   DYNAMIC DATA FETCHING
   ========================================= */
document.addEventListener('DOMContentLoaded', async () => {
    // Determine the API base URL (can be updated for production)
    const API_BASE = 'http://localhost:8000/api';

    // 1. Fetch and render Skills
    try {
        const skillsRes = await fetch(`${API_BASE}/skills`);
        if (skillsRes.ok) {
            const skills = await skillsRes.json();
            const skillsContainer = document.getElementById('skills');
            if (skillsContainer && skills.length > 0) {
                skillsContainer.innerHTML = ''; // Clear fallback if any
                skills.forEach(skill => {
                    const skillDiv = document.createElement('div');
                    skillDiv.className = 'logo-item';
                    skillDiv.textContent = skill.name;
                    skillsContainer.appendChild(skillDiv);
                });
            }
        }
    } catch (e) {
        console.error('Failed to load skills:', e);
    }

    // 2. Fetch and render Projects (for projects.html and index.html slider)
    try {
        const projectsRes = await fetch(`${API_BASE}/projects`);
        if (projectsRes.ok) {
            const projects = await projectsRes.json();
            
            // --- Logic for projects.html ---
            const projectsContainer = document.getElementById('projects-container');
            if (projectsContainer && projects.length > 0) {
                projectsContainer.innerHTML = '';
                projects.forEach((proj, index) => {
                    const card = document.createElement('div');
                    card.className = `project-card ${index % 2 !== 0 ? 'mt-large' : ''}`;
                    
                    let imageHtml = '';
                    if (proj.image_url) {
                        imageHtml = `<img src="${proj.image_url}" alt="${proj.title}" style="width: 100%; height: 100%; object-fit: cover;">`;
                    } else {
                        imageHtml = `<div class="project-placeholder-text" style="color: rgba(0,0,0,0.5); font-weight: bold; font-size: 1.5rem; text-align: center; padding: 1rem;">${proj.title}</div>`;
                    }

                    const bgStyle = proj.fallback_background || 'linear-gradient(135deg, #2b2d42 0%, #1a1a24 100%)';
                    
                    let techsArray = [];
                    if (proj.technologies) techsArray = typeof proj.technologies === 'string' ? JSON.parse(proj.technologies) : proj.technologies;
                    const tagsHtml = techsArray.map(t => `<span class="tag">${t}</span>`).join('');

                    card.innerHTML = `
                        <div class="project-image" style="background: ${bgStyle};">
                            ${imageHtml}
                        </div>
                        <h3>${proj.title}</h3>
                        <p>${proj.short_description || ''}</p>
                        <div class="tags" style="margin-bottom: 1rem;">${tagsHtml}</div>
                        <a href="project-details.html?id=${proj.id}" class="btn-primary" style="align-self: flex-start; padding: 0.5rem 1rem; font-size: 0.9rem;">View Details</a>
                    `;
                    projectsContainer.appendChild(card);
                });
            }

            // --- Logic for index.html Slider ---
            const track = document.getElementById('projects-slider-track');
            const dotsContainer = document.getElementById('slider-dots-container');
            
            if (track) {
                const featuredProjects = projects.filter(p => p.featured);
                if (featuredProjects.length > 0) {
                    track.innerHTML = ''; // Clear fallback HTML
                    if (dotsContainer) dotsContainer.innerHTML = '';
                    
                    track.style.width = `${featuredProjects.length * 100}%`;
                    const slideWidthPercent = 100 / featuredProjects.length;

                    featuredProjects.forEach((proj, index) => {
                        // Create slide
                        const slide = document.createElement('div');
                        slide.className = `slide ${index === 0 ? 'active' : ''}`;
                        slide.style.width = `${slideWidthPercent}%`;
                        
                        let imgUrl = proj.image_url ? `${proj.image_url}` : 'https://images.unsplash.com/photo-1498050108023-c5249f4df085';
                        
                        let techsArray = [];
                        if (proj.technologies) techsArray = typeof proj.technologies === 'string' ? JSON.parse(proj.technologies) : proj.technologies;
                        const tagsHtml = techsArray.map(t => `<span class="tag">${t}</span>`).join('');
                        
                        let featuresHtml = '';
                        let featsArray = [];
                        if (proj.features) featsArray = typeof proj.features === 'string' ? JSON.parse(proj.features) : proj.features;
                        if (Array.isArray(featsArray)) {
                            featuresHtml = featsArray.map(f => `<li>${f}</li>`).join('');
                        }

                        let githubBtn = proj.github_url ? `<a href="${proj.github_url}" target="_blank" class="btn-text" style="display: flex; align-items: center; gap: 0.5rem; padding: 0.8rem 1.5rem; font-size: 0.9rem; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                            GitHub
                        </a>` : '';

                        let demoBtn = proj.live_demo_url ? `<a href="${proj.live_demo_url}" target="_blank" class="btn-primary" style="padding: 0.8rem 1.5rem; font-size: 0.9rem;">
                            Live Demo ↗
                        </a>` : '';

                        slide.innerHTML = `
                            <div class="slide-content">
                                <div class="slide-left">
                                    <img src="${imgUrl}" alt="${proj.title}">
                                </div>
                                <div class="slide-right">
                                    <span class="project-category" style="color: var(--primary); font-size: 0.85rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">${proj.category || ''}</span>
                                    <h3 style="margin-top: 0.5rem; margin-bottom: 1rem;">${proj.title}</h3>
                                    <p style="margin-bottom: 1rem; font-size: 0.95rem; color: var(--text-muted);">${proj.short_description || ''}</p>
                                    
                                    <div class="project-details" style="margin-bottom: 1.5rem;">
                                        ${featuresHtml ? `<strong style="color: var(--text-main); font-size: 0.95rem; display: inline-block; margin-top: 0.5rem;">Key Features:</strong>
                                        <ul style="margin-top: 0.25rem; padding-left: 1.2rem; color: var(--text-muted); font-size: 0.9rem; line-height: 1.6;">
                                            ${featuresHtml}
                                        </ul>` : ''}
                                    </div>

                                    <div class="tags" style="margin-bottom: 2rem;">
                                        ${tagsHtml}
                                    </div>
                                    
                                    <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                                        ${demoBtn}
                                        ${githubBtn}
                                    </div>
                                </div>
                            </div>
                        `;
                        track.appendChild(slide);

                        // Create dot
                        if (dotsContainer) {
                            const dot = document.createElement('span');
                            dot.className = `dot ${index === 0 ? 'active' : ''}`;
                            dot.dataset.index = index;
                            dotsContainer.appendChild(dot);
                        }
                    });

                    // Re-initialize slider functionality
                    initSlider();
                }
            }
        }
    } catch (e) {
        console.error('Failed to load projects:', e);
        // Initialize slider for fallback static HTML if fetch fails
        initSlider();
    }

    // 3. Fetch and render Education
    try {
        const eduRes = await fetch(`${API_BASE}/education`);
        if (eduRes.ok) {
            const education = await eduRes.json();
            const eduContainer = document.getElementById('education-container');
            if (eduContainer && education.length > 0) {
                eduContainer.innerHTML = '';
                education.forEach(edu => {
                    const item = document.createElement('div');
                    item.style.marginBottom = '2rem';
                    item.innerHTML = `
                        <h3 style="color: #fff; margin-bottom: 0.5rem; font-size: 1.5rem; font-weight: 500;">${edu.degree} - ${edu.institution}</h3>
                        <div style="color: var(--primary); font-weight: 500; margin-bottom: 0.5rem;">${edu.year}</div>
                        <p style="font-size: 1.1rem; line-height: 1.5; color: var(--text-muted); margin: 0;">${edu.description}</p>
                    `;
                    eduContainer.appendChild(item);
                });
            }
        }
    } catch (e) {
        console.error('Failed to load education:', e);
    }
});

/* =========================================
   FEATURED PROJECTS SLIDER LOGIC
   ========================================= */
function initSlider() {
    const track = document.getElementById('projects-slider-track');
    if (!track) return;
    
    const slides = Array.from(track.querySelectorAll('.slide'));
    const nextBtn = document.getElementById('next-slide');
    const prevBtn = document.getElementById('prev-slide');
    const dots = Array.from(document.querySelectorAll('.dot'));
    
    if (slides.length === 0) return;

    let currentIndex = 0;
    
    function updateSlider() {
        const slideWidth = 100 / slides.length;
        track.style.transform = `translateX(-${currentIndex * slideWidth}%)`;
        
        slides.forEach((slide, index) => {
            if (index === currentIndex) {
                slide.classList.add('active');
            } else {
                slide.classList.remove('active');
            }
        });
        
        dots.forEach((dot, index) => {
            if (index === currentIndex) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.onclick = () => {
            currentIndex = (currentIndex + 1) % slides.length;
            updateSlider();
            resetAutoSlide();
        };
    }
    
    if (prevBtn) {
        prevBtn.onclick = () => {
            currentIndex = (currentIndex - 1 + slides.length) % slides.length;
            updateSlider();
            resetAutoSlide();
        };
    }
    
    dots.forEach((dot, index) => {
        dot.onclick = () => {
            currentIndex = index;
            updateSlider();
            resetAutoSlide();
        };
    });
    
    updateSlider();

    // Auto-slide functionality
    let autoSlideInterval;
    
    function startAutoSlide() {
        if (!autoSlideInterval) {
            autoSlideInterval = setInterval(() => {
                currentIndex = (currentIndex + 1) % slides.length;
                updateSlider();
            }, 5000); // Change slide every 5 seconds
        }
    }

    function stopAutoSlide() {
        if (autoSlideInterval) {
            clearInterval(autoSlideInterval);
            autoSlideInterval = null;
        }
    }

    function resetAutoSlide() {
        stopAutoSlide();
        startAutoSlide();
    }

    // Pause on hover
    const sliderContainer = document.querySelector('.projects-slider-container');
    if (sliderContainer) {
        sliderContainer.addEventListener('mouseenter', stopAutoSlide);
        sliderContainer.addEventListener('mouseleave', startAutoSlide);
    }

    // Start auto-sliding only when the section is in view
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    startAutoSlide();
                } else {
                    stopAutoSlide();
                }
            });
        }, { threshold: 0.2 });
        observer.observe(sliderContainer || track);
    } else {
        startAutoSlide(); // Fallback for older browsers
    }
}

// Initializing in DOMContentLoaded is now handled dynamically after fetch.
// But we still wrap it to support static markup if no fetch happens.
document.addEventListener('DOMContentLoaded', () => {
    // If not fetching dynamically, we call initSlider() here.
    initSlider();
});

/* =========================================
   SCROLL ANIMATIONS (Fade Up)
   ========================================= */
document.addEventListener('DOMContentLoaded', () => {
    const fadeUpElements = document.querySelectorAll('.fade-up-element');
    
    if (fadeUpElements.length > 0) {
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };
        
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    // Stop observing once the animation has been triggered
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);
        
        fadeUpElements.forEach(el => observer.observe(el));
    }
});