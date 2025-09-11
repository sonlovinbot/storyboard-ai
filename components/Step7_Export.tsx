import React, { useRef } from 'react';
import { Project } from '../types';
import Button from './ui/Button';

// FIX: Defined the 'Props' interface to resolve the 'Cannot find name Props' error.
interface Props {
  project: Project;
  setProject: React.Dispatch<React.SetStateAction<Project>>;
}

const generateHtmlContent = (project: Project): string => {
  const projectDataJson = JSON.stringify(project);
  const totalDuration = project.shotlist.reduce((acc, shot) => {
      const duration = parseInt(shot.ert, 10);
      return acc + (isNaN(duration) ? 0 : duration);
  }, 0);
  const minutes = Math.floor(totalDuration / 60);
  const seconds = totalDuration % 60;
  const formattedDuration = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Storyboard: ${project.title}</title>
    <meta name="description" content="Storyboard and project information for ${project.title}">
    <meta name="theme-color" content="#1a1a2e">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700&display=swap');
        :root {
            --color-bg: 248 249 250; --color-surface: 255 255 255; --color-primary: 79 70 229; --color-secondary: 228 229 233;
            --color-text-light: 33 37 41; --color-text-dark: 108 117 125; --color-border: 222 226 230;
            --shadow: rgba(0, 0, 0, 0.1); --font-sans: 'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        html.dark {
            --color-bg: 18 18 28; --color-surface: 29 29 43; --color-primary: 99 102 241; --color-secondary: 45 45 61;
            --color-text-light: 248 249 250; --color-text-dark: 173 181 189; --color-border: 52 58 64; --shadow: rgba(0, 0, 0, 0.3);
        }
        *, *::before, *::after { box-sizing: border-box; }
        body {
            font-family: var(--font-sans); background-color: rgb(var(--color-bg)); color: rgb(var(--color-text-light)); margin: 0; padding-top: 80px;
            font-size: 16px; line-height: 1.6; transition: background-color 0.3s, color 0.3s;
            background-image: radial-gradient(circle at 1px 1px, rgb(var(--color-border) / 0.5) 1px, transparent 0);
            background-size: 2rem 2rem;
        }
        .container { max-width: 1400px; margin: 0 auto; padding: 1rem 2rem; }
        h1, h2, h3, h4 { margin: 0; line-height: 1.3; font-weight: 600; }
        h1 { font-size: 2.8rem; letter-spacing: -1px; } 
        h2 { font-size: 2.2rem; border-bottom: 1px solid rgb(var(--color-border)); padding-bottom: 0.75rem; margin-top: 4rem; margin-bottom: 2rem; }
        a { color: rgb(var(--color-primary)); text-decoration: none; }
        .hidden { display: none !important; }
        
        /* Glassmorphism Card */
        .card {
            background: rgb(var(--color-surface) / 0.5); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgb(var(--color-border) / 0.2); border-radius: 16px; padding: 1.5rem;
            box-shadow: 0 8px 32px 0 var(--shadow);
            transition: transform 0.3s, box-shadow 0.3s;
        }
        .card:hover { transform: translateY(-5px); box-shadow: 0 12px 40px 0 rgb(var(--color-primary) / 0.1); }

        /* Header */
        .app-header {
            position: fixed; top: 0; left: 0; right: 0; z-index: 100;
            background: rgb(var(--color-surface) / 0.8); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
            border-bottom: 1px solid rgb(var(--color-border)); padding: 0.75rem 2rem;
            display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 1rem;
        }
        .header-title { font-size: 1.25rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .header-stats { display: flex; gap: 1rem; font-size: 0.9rem; color: rgb(var(--color-text-dark)); }
        .header-controls button {
            background-color: rgb(var(--color-secondary)); border: 1px solid rgb(var(--color-border)); color: rgb(var(--color-text-light));
            border-radius: 999px; padding: 0.5rem; font-size: 0.9rem; cursor: pointer; line-height: 1;
        }

        /* Table of Contents */
        .toc ol { display: flex; flex-wrap: wrap; justify-content: center; list-style: none; margin: 0; padding: 0; gap: 1.5rem; }

        /* Section Specific */
        #idea blockquote { border-left: 4px solid rgb(var(--color-primary)); padding-left: 1rem; margin-left: 0; font-style: italic; color: rgb(var(--color-text-dark)); }
        
        /* Characters */
        .character-grid { display: grid; gap: 2rem; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); }
        .character-card { padding: 0; overflow: hidden; display: flex; flex-direction: column; }
        .character-image-container { width: 100%; background-color: rgb(var(--color-bg)); display: flex; align-items: center; justify-content: center; }
        .character-image-container img { width: 100%; height: 100%; object-fit: contain; }
        .character-details { padding: 1.5rem; flex-grow: 1; display: flex; flex-direction: column; }
        .character-details h3 { font-size: 1.5rem; margin-bottom: 0.5rem; }
        .character-details ul { list-style: none; padding: 0; margin-top: 1rem; color: rgb(var(--color-text-dark)); }
        .character-details ul li { margin-bottom: 0.5rem; }

        /* Storyboard */
        .storyboard-grid { display: grid; gap: 2rem; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); align-items: start; }
        .storyboard-card { padding: 0; overflow: hidden; }
        .storyboard-image-container { width: 100%; background-color: rgb(var(--color-bg)); }
        .storyboard-image-container img { width: 100%; height: auto; display: block; cursor: pointer; }
        .storyboard-image-container .placeholder { width: 100%; aspect-ratio: 16/9; display: flex; align-items: center; justify-content: center; color: rgb(var(--color-text-dark)); }
        .storyboard-details { padding: 1.5rem; }
        .storyboard-details h4 { font-size: 1.2rem; color: rgb(var(--color-primary)); margin-bottom: 0.5rem; }
        .shot-main-description { margin-bottom: 1rem; color: rgb(var(--color-text-dark)); }
        .toggle-details-btn {
            background: none; border: 1px solid rgb(var(--color-border)); color: rgb(var(--color-text-dark)); font-weight: 500; cursor: pointer;
            padding: 0.25rem 0.75rem; border-radius: 6px; font-size: 0.8rem; margin-bottom: 1rem; transition: all 0.2s;
        }
        .toggle-details-btn:hover { background-color: rgb(var(--color-secondary)); color: rgb(var(--color-text-light)); border-color: rgb(var(--color-primary)); }
        .shot-extra-details { max-height: 0; overflow: hidden; transition: max-height 0.5s ease-in-out, opacity 0.5s ease-in-out; opacity: 0; }
        .shot-extra-details.expanded { max-height: 1000px; opacity: 1; }
        .shot-details-grid {
            display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem 1rem; font-size: 0.9rem;
            margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid rgb(var(--color-border));
        }
        .shot-details-grid div strong { color: rgb(var(--color-primary)); }
        .dialogue-block {
            background-color: #1e3a2b; color: #d1fae5; border-left: 4px solid #6ee7b7;
            padding: 0.75rem 1rem; border-radius: 4px; margin-bottom: 1rem; font-size: 0.95rem;
        }
        html:not(.dark) .dialogue-block { background-color: #f0fdf4; color: #14532d; border-left-color: #34d399; }
        .dialogue-block p { margin: 0 0 0.5rem 0; }
        .dialogue-block strong { text-transform: uppercase; color: #a7f3d0; }
        html:not(.dark) .dialogue-block strong { color: #064e3b; }
        .dialogue-block em { font-style: italic; }
        .shot-pills { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .shot-pills span { font-size: 0.8rem; padding: 0.25rem 0.75rem; border-radius: 9999px; display: inline-flex; align-items: center; gap: 0.25rem; }
        .music-pill { background-color: #3b306b; color: #c4b5fd; }
        .sfx-pill { background-color: #604620; color: #fcd34d; }
        html:not(.dark) .music-pill { background-color: #ede9fe; color: #5b21b6; }
        html:not(.dark) .sfx-pill { background-color: #fefce8; color: #854d0e; }


        /* Collapsible Text (for Character Bio) */
        .collapsible-text {
            max-height: 4.8em; /* approx 3 lines */
            overflow: hidden; position: relative;
            transition: max-height 0.3s ease-in-out;
        }
        .collapsible-text:not(.expanded)::after {
            content: ''; position: absolute; bottom: 0; left: 0; right: 0;
            height: 1.6em; background: linear-gradient(to top, rgb(var(--color-surface)), transparent);
        }
        .collapsible-text.expanded { max-height: 1000px; /* large value */ }
        .toggle-text-btn {
            background: none; border: none; color: rgb(var(--color-primary)); font-weight: 600;
            cursor: pointer; padding: 0.25rem 0; margin-top: 0.5rem;
        }

        /* Footer & Utils */
        .app-footer { text-align: center; margin-top: 4rem; padding: 2rem; border-top: 1px solid rgb(var(--color-border)); color: rgb(var(--color-text-dark)); font-size: 0.9rem; }
        #back-to-top { position: fixed; bottom: 1rem; right: 1rem; z-index: 50; }
        #lightbox { position: fixed; inset: 0; z-index: 200; background-color: rgba(0,0,0,0.9); display: flex; align-items: center; justify-content: center; padding: 2rem; cursor: pointer; }
        #lightbox img { max-width: 95%; max-height: 95%; object-fit: contain; border-radius: 8px; }
        
        @media print {
            body { padding-top: 0; font-size: 11pt; color: #000; background: #fff; }
            .app-header, .toc, .app-footer, #back-to-top, .no-print, .toggle-text-btn, .toggle-details-btn { display: none; }
            .card { box-shadow: none; border: 1px solid #ccc; backdrop-filter: none; break-inside: avoid; }
            .character-grid, .storyboard-grid { grid-template-columns: 1fr; }
            .collapsible-text, .shot-extra-details { max-height: none !important; opacity: 1 !important; }
            .collapsible-text::after { display: none; }
        }
    </style>
</head>
<body>
    <script id="projectData" type="application/json">${projectDataJson}</script>

    <header class="app-header">
        <div class="header-title">${project.title}</div>
        <div class="header-stats">
            <span>${project.screenplay.length} Scenes</span>
            <span>${project.shotlist.length} Shots</span>
            <span>${project.storyboard.length} Panels</span>
            <span>${formattedDuration}</span>
        </div>
        <div class="header-controls no-print">
            <button id="theme-toggle" aria-label="Toggle dark mode">🌙</button>
        </div>
    </header>

    <main class="container">
        <nav class="toc card no-print">
            <ol>
                <li><a href="#info">Project Info</a></li>
                <li><a href="#idea">Idea</a></li>
                <li><a href="#screenplay">Screenplay</a></li>
                <li><a href="#characters">Characters</a></li>
                <li><a href="#storyboard">Storyboard</a></li>
            </ol>
        </nav>
        
        <section id="info">
            <h2>Project Info</h2>
            <div class="card">
                <h1>${project.title}</h1>
                <p><strong>Genre:</strong> ${project.genre || 'No data'}</p>
                <p><strong>Art Style:</strong> ${project.artStyle || 'No data'}</p>
                <p><strong>Aspect Ratio:</strong> ${project.aspectRatio || 'No data'}</p>
            </div>
        </section>

        <section id="idea">
            <h2>Idea</h2>
            <div class="card">
                <blockquote>${project.storyConcept.replace(/\n/g, '<br>') || 'No data'}</blockquote>
            </div>
        </section>

        <section id="screenplay">
            <h2>Screenplay</h2>
            <div id="screenplay-content" class="card"></div>
        </section>

        <section id="characters">
            <h2>Characters</h2>
            <div id="character-grid" class="character-grid"></div>
        </section>

        <section id="storyboard">
            <h2>Storyboard</h2>
            <div id="storyboard-grid" class="storyboard-grid"></div>
        </section>
    </main>

    <footer class="app-footer">
        <p>Created by Storyboard AI</p>
        <div class="no-print" style="display: flex; gap: 1rem; justify-content: center; margin-top: 1rem;">
            <button onclick="window.print()">Print PDF</button>
            <button id="download-html">Download HTML</button>
        </div>
    </footer>

    <div id="lightbox" class="hidden no-print"></div>

    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const project = JSON.parse(document.getElementById('projectData').textContent);

            const escapeHtml = (unsafe) => unsafe ? unsafe
                .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;").replace(/'/g, "&#039;") : '';
            
            // --- THEME ---
            const themeToggle = document.getElementById('theme-toggle');
            const applyTheme = (theme) => {
                const root = document.documentElement;
                if (theme === 'dark') {
                    root.classList.add('dark');
                    themeToggle.innerHTML = '☀️'; // Sun icon
                } else {
                    root.classList.remove('dark');
                    themeToggle.innerHTML = '🌙'; // Moon icon
                }
            };

            let currentTheme = localStorage.getItem('theme');
            if (!currentTheme) {
                currentTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            }
            applyTheme(currentTheme);

            themeToggle.addEventListener('click', () => {
                const root = document.documentElement;
                const newTheme = root.classList.contains('dark') ? 'light' : 'dark';
                localStorage.setItem('theme', newTheme);
                applyTheme(newTheme);
            });


            // --- SCREENPLAY ---
            const screenplayContainer = document.getElementById('screenplay-content');
            if (screenplayContainer) {
                project.screenplay.forEach(scene => {
                    const dialogueHtml = scene.dialogue.map(d => \`
                        <div style="margin-left: 2rem; margin-top: 0.5rem;"><strong style="text-transform: uppercase;">\${escapeHtml(d.character)}:</strong> "\${escapeHtml(d.line)}"</div>
                    \`).join('');
                    const sceneEl = document.createElement('div');
                    sceneEl.innerHTML = \`
                        <h3 style="font-size: 1.2rem; margin-top: 1.5rem; color: rgb(var(--color-primary));">\${escapeHtml(scene.title)}</h3>
                        <p style="color: rgb(var(--color-text-dark));">\${escapeHtml(scene.description)}</p>
                        \${dialogueHtml}
                    \`;
                    screenplayContainer.appendChild(sceneEl);
                });
            }

            // --- CHARACTERS ---
            const characterGrid = document.getElementById('character-grid');
            if (characterGrid) {
                project.characters.forEach(char => {
                    const charEl = document.createElement('div');
                    charEl.className = 'card character-card';
                    charEl.innerHTML = \`
                        <div class="character-image-container">
                            \${char.imageUrl ? \`<img src="\${char.imageUrl}" alt="\${escapeHtml(char.name)}" loading="lazy">\` : ''}
                        </div>
                        <div class="character-details">
                            <h3>\${escapeHtml(char.name)} (\${escapeHtml(char.age)})</h3>
                            <div class="character-bio collapsible-text"><p>\${escapeHtml(char.description)}</p></div>
                            <button class="toggle-text-btn no-print">See more</button>
                            <ul>
                                <li><strong>Personality:</strong> \${escapeHtml(char.personality)}</li>
                                <li><strong>Appearance:</strong> \${escapeHtml(char.appearance)}</li>
                            </ul>
                        </div>
                    \`;
                    characterGrid.appendChild(charEl);
                });
            }
            
            // --- STORYBOARD ---
            const storyboardGrid = document.getElementById('storyboard-grid');
            if (storyboardGrid && project.storyboard) {
                project.storyboard.forEach(panel => {
                    const scene = project.screenplay.find(s => s.sceneNumber === panel.shot.sceneNumber);
                    const sceneTitle = scene ? scene.title : 'N/A';
                    
                    const cardEl = document.createElement('div');
                    cardEl.className = 'card storyboard-card';

                    const dialogueHtml = panel.shot.dialogue.map(d => \`
                        <p><strong>\${escapeHtml(d.character)}:</strong> <em>"\${escapeHtml(d.line)}"</em></p>
                    \`).join('');

                    cardEl.innerHTML = \`
                        <div class="storyboard-image-container">
                            \${panel.imageUrl ? \`<img src="\${panel.imageUrl}" alt="Storyboard Panel" loading="lazy">\` : '<div class="placeholder">No image yet</div>'}
                        </div>
                        <div class="storyboard-details">
                            <h4>Scene \${panel.shot.sceneNumber}, Shot \${panel.shot.shotNumber}</h4>
                            <p class="shot-main-description">\${escapeHtml(panel.shot.description)}</p>
                            
                            <button class="toggle-details-btn no-print">Expand</button>

                            <div class="shot-extra-details">
                                <div class="shot-details-grid">
                                    <div><strong>Shot Type:</strong> \${escapeHtml(panel.shot.shotSize) || '—'}</div>
                                    <div><strong>Duration:</strong> \${escapeHtml(panel.shot.ert) || '—'}</div>
                                    <div><strong>Scene:</strong> \${escapeHtml(sceneTitle)}</div>
                                    <div><strong>Lighting:</strong> \${escapeHtml(panel.shot.lighting) || '—'}</div>
                                    <div><strong>Camera:</strong> \${escapeHtml(panel.shot.movement) || '—'}</div>
                                    <div><strong>Notes:</strong> \${escapeHtml(panel.shot.notes) || '—'}</div>
                                </div>

                                \${dialogueHtml ? \`<div class="dialogue-block">\${dialogueHtml}</div>\` : ''}

                                \${(panel.shot.music || panel.shot.sfx) ? \`
                                <div class="shot-pills">
                                    \${panel.shot.music ? \`<span class="music-pill">♪ \${escapeHtml(panel.shot.music)}</span>\` : ''}
                                    \${panel.shot.sfx ? \`<span class="sfx-pill">🔊 \${escapeHtml(panel.shot.sfx)}</span>\` : ''}
                                </div>
                                \` : ''}
                            </div>
                        </div>
                    \`;

                    if (panel.imageUrl) {
                        cardEl.querySelector('img').addEventListener('click', () => openLightbox(panel.imageUrl));
                    }
                    storyboardGrid.appendChild(cardEl);
                });
            }


            // --- COLLAPSIBLE TEXT (Characters) ---
            document.querySelectorAll('.toggle-text-btn').forEach(button => {
                const textContainer = button.previousElementSibling;
                if (textContainer.scrollHeight <= textContainer.clientHeight) {
                    button.style.display = 'none';
                }
                button.addEventListener('click', () => {
                    textContainer.classList.toggle('expanded');
                    button.textContent = textContainer.classList.contains('expanded') ? 'Collapse' : 'See more';
                });
            });
            
            // --- EXPAND/COLLAPSE DETAILS (Storyboard) ---
            document.querySelectorAll('.toggle-details-btn').forEach(button => {
                button.addEventListener('click', () => {
                    const detailsContainer = button.nextElementSibling;
                    detailsContainer.classList.toggle('expanded');
                    button.textContent = detailsContainer.classList.contains('expanded') ? 'Collapse' : 'Expand';
                });
            });

            // --- LIGHTBOX ---
            const lightbox = document.getElementById('lightbox');
            const openLightbox = (src) => {
                lightbox.innerHTML = \`<img src="\${src}" alt="Enlarged image">\`;
                lightbox.classList.remove('hidden');
                document.addEventListener('keydown', closeLightboxOnEsc);
            };
            const closeLightbox = () => {
                lightbox.classList.add('hidden');
                lightbox.innerHTML = '';
                document.removeEventListener('keydown', closeLightboxOnEsc);
            };
            const closeLightboxOnEsc = (e) => { if (e.key === 'Escape') closeLightbox(); };
            lightbox.addEventListener('click', closeLightbox);
            
            // --- DOWNLOAD HTML ---
            document.getElementById('download-html').addEventListener('click', () => {
                const htmlContent = document.documentElement.outerHTML;
                const blob = new Blob([htmlContent], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = \`\${project.title.replace(/\s+/g, '_')}_storyboard.html\`;
                a.click();
                URL.revokeObjectURL(url);
            });
        });
    </script>
</body>
</html>
  `;
};

const Step7_Export: React.FC<Props> = ({ project, setProject }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportJson = () => {
    const jsonString = JSON.stringify(project, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.replace(/\s+/g, '_')}_storyboard_project.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedProject = JSON.parse(e.target?.result as string);
          setProject(importedProject);
          alert('Project imported successfully!');
        } catch (error) {
          alert('Failed to import project. The file may be corrupt.');
          console.error("Import error:", error);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleExportHtml = () => {
    const htmlContent = generateHtmlContent(project);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.replace(/\s+/g, '_')}_storyboard.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handlePreviewHtml = () => {
     const htmlContent = generateHtmlContent(project);
     const blob = new Blob([htmlContent], { type: 'text/html' });
     const url = URL.createObjectURL(blob);
     window.open(url, '_blank');
  };

  return (
    <div className="max-w-2xl mx-auto text-center">
      <h2 className="text-2xl font-bold mb-6 text-brand-text-light">Export Project</h2>
      <p className="mb-8 text-brand-text-dark">Save your project progress or export the final storyboard as a standalone HTML file.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Project Data */}
        <div className="bg-brand-secondary/50 p-6 rounded-lg border border-brand-border/20">
          <h3 className="text-lg font-semibold text-brand-primary">Project Data</h3>
          <p className="text-sm text-brand-text-dark my-2">Save all your work (screenplay, characters, images) to a JSON file. You can import this file later to continue where you left off.</p>
          <div className="flex flex-col space-y-3 mt-4">
            <Button onClick={handleExportJson}>Export Project (.json)</Button>
            <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
              Import Project (.json)
            </Button>
            <input type="file" ref={fileInputRef} onChange={handleImportJson} accept=".json" className="hidden" />
          </div>
        </div>

        {/* Final Storyboard */}
        <div className="bg-brand-secondary/50 p-6 rounded-lg border border-brand-border/20">
          <h3 className="text-lg font-semibold text-brand-primary">Final Storyboard</h3>
          <p className="text-sm text-brand-text-dark my-2">Generate a professional, self-contained HTML file of your storyboard. Perfect for sharing and presenting.</p>
          <div className="flex flex-col space-y-3 mt-4">
             <Button onClick={handlePreviewHtml}>Preview Storyboard</Button>
            <Button variant="secondary" onClick={handleExportHtml}>Export Storyboard (.html)</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step7_Export;
