import fs from 'fs';
import path from 'path';
import opentype from 'opentype.js';

async function generate() {
  const res = await fetch('https://fonts.gstatic.com/s/caprasimo/v6/esDT31JQOPuXIUGBp72klQ.ttf');
  const buffer = await res.arrayBuffer();
  const font = opentype.parse(buffer);

  // Canvas 500x500
  // Center is (250, 250)
  // Perfectly balanced to fill the circle with maximum impact and zero clipping
  const fontSizeLine1 = 134; // "mamé"
  const fontSizeLine2 = 116; // "fricoto"

  const path1 = font.getPath('mamé', 0, 0, fontSizeLine1);
  const bbox1 = path1.getBoundingBox();
  const w1 = bbox1.x2 - bbox1.x1;
  const h1 = bbox1.y2 - bbox1.y1;

  const path2 = font.getPath('fricoto', 0, 0, fontSizeLine2);
  const bbox2 = path2.getBoundingBox();
  const w2 = bbox2.x2 - bbox2.x1;
  const h2 = bbox2.y2 - bbox2.y1;

  // Center horizontally
  const x1 = 250 - (bbox1.x1 + w1 / 2);
  const x2 = 250 - (bbox2.x1 + w2 / 2);

  // Total block height & vertical centering
  const totalTop = bbox1.y1;
  const gap = 16;
  const baselineOffset = (bbox1.y2 - bbox1.y1) + gap;

  // Compute bounding box of both lines combined
  const combinedHeight = (bbox1.y2 - bbox1.y1) + gap + (bbox2.y2 - bbox2.y1);
  
  // Set Y1 such that the center of the combined block is exactly at Y=246 (slight optical lift)
  const y1 = 246 - combinedHeight / 2 - bbox1.y1;
  const y2 = y1 + (bbox1.y2 - bbox2.y1) + gap;

  const finalPath1 = font.getPath('mamé', x1, y1, fontSizeLine1);
  const finalPath2 = font.getPath('fricoto', x2, y2, fontSizeLine2);

  const b1 = finalPath1.getBoundingBox();
  const b2 = finalPath2.getBoundingBox();
  console.log('Final Line 1 bounds:', b1);
  console.log('Final Line 2 bounds:', b2);

  const svgData1 = finalPath1.toPathData(2);
  const svgData2 = finalPath2.toPathData(2);

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="100%" height="100%">
  <defs>
    <!-- Ombre douce sous les lettres pour un relief chaleureux -->
    <filter id="textGlow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#14263D" flood-opacity="0.5" />
    </filter>

    <!-- Dégradé Bleu Signature Provence / Méditerranée -->
    <linearGradient id="blueProvence" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3A669A" />
      <stop offset="50%" stop-color="#315B8C" />
      <stop offset="100%" stop-color="#244872" />
    </linearGradient>

    <!-- Dégradé Or Chaud pour liseré -->
    <linearGradient id="goldRim" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FCD565" />
      <stop offset="50%" stop-color="#EAA620" />
      <stop offset="100%" stop-color="#C58512" />
    </linearGradient>
  </defs>

  <!-- Fond circulaire Bleu Provence -->
  <circle cx="250" cy="250" r="250" fill="url(#blueProvence)" />

  <!-- Fin liseré intérieur doré subtil -->
  <circle cx="250" cy="250" r="242" fill="none" stroke="url(#goldRim)" stroke-width="2.5" opacity="0.6" />

  <!-- Typographie pure "mamé fricoto" occupant tout l'espace -->
  <g fill="#FFFDF8" filter="url(#textGlow)">
    <!-- Ligne 1 : "mamé" -->
    <path d="${svgData1}" />
    <!-- Ligne 2 : "fricoto" -->
    <path d="${svgData2}" />
  </g>
</svg>
`;

  fs.writeFileSync(path.join(process.cwd(), 'public', 'logo.svg'), svgContent, 'utf-8');
  fs.writeFileSync(path.join(process.cwd(), 'public', 'icon.svg'), svgContent, 'utf-8');
  console.log('Generated pixel-perfect bold logo!');
}

generate().catch(console.error);
