
import React, { useRef } from 'react';
import { Project } from '../types';
import Button from './ui/Button';

interface Props {
  project: Project;
  setProject: React.Dispatch<React.SetStateAction<Project>>;
}

const generateHtmlContent = (project: Project): string => {
  const storyboardData = JSON.stringify(project.storyboard);
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Storyboard: ${project.title}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #121212; color: #f5f5f5; margin: 0; padding: 2rem; }
        .container { max-width: 900px; margin: auto; }
        h1 { text-align: center; color: #a78bfa; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
        .panel { background-color: #1e1e1e; border: 1px solid #2d2d2d; border-radius: 8px; overflow: hidden; }
        .panel img { max-width: 100%; display: block; }
        .panel-content { padding: 1rem; }
        .panel-header { font-weight: bold; color: #818cf8; }
        .panel-desc { font-size: 0.9rem; color: #a3a3a3; margin-top: 0.5rem; }
        .panel-vo { font-style: italic; color: #67e8f9; margin-top: 0.5rem; }
        .panel-sfx { font-weight: bold; color: #facc15; margin-top: 0.5rem; }
        .nav { position: fixed; bottom: 1rem; left: 50%; transform: translateX(-50%); background: rgba(30,30,30,0.8); backdrop-filter: blur(10px); padding: 0.5rem 1rem; border-radius: 99px; display: flex; align-items: center; gap: 1rem; border: 1px solid #2d2d2d; }
        .nav button, .nav select { background: #373737; color: #f5f5f5; border: none; padding: 0.5rem 1rem; border-radius: 99px; cursor: pointer; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>${project.title}</h1>
        <div id="storyboard-grid" class="grid"></div>
      </div>

      <script>
        const storyboard = ${storyboardData};
        const grid = document.getElementById('storyboard-grid');
        storyboard.forEach(panel => {
          const panelEl = document.createElement('div');
          panelEl.className = 'panel';
          panelEl.innerHTML = \`
            <img src="\${panel.imageUrl}" alt="Scene \${panel.shot.sceneNumber}, Shot \${panel.shot.shotNumber}">
            <div class="panel-content">
              <div class="panel-header">Scene \${panel.shot.sceneNumber}, Shot \${panel.shot.shotNumber}</div>
              <p class="panel-desc">\${panel.shot.description}</p>
              \${panel.shot.vo ? \`<p class="panel-vo">VO: "\${panel.shot.vo}"</p>\` : ''}
              \${panel.shot.sfx ? \`<p class="panel-sfx">SFX: \${panel.shot.sfx}</p>\` : ''}
            </div>
          \`;
          grid.appendChild(panelEl);
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
        <div className="bg-brand-secondary p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-indigo-400">Project Data</h3>
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
        <div className="bg-brand-secondary p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-indigo-400">Final Storyboard</h3>
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
