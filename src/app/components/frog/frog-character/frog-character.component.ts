import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FrogPhase } from '../../../services/frog-game.service';

@Component({
  selector: 'app-frog-character',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="frog-wrapper relative flex items-center justify-center" [style.width.px]="size" [style.height.px]="size">
      
      <!-- Aura Layer -->
      <div *ngIf="accessories.includes('aura_gold')" 
           class="absolute inset-0 rounded-full animate-pulse opacity-40"
           style="background: radial-gradient(circle, #fbbf24 0%, transparent 70%)">
      </div>

      <!-- Main SVG via innerHTML for complex SVG with arbitrary path strings -->
      <div [innerHTML]="svgHtml" [class.animate-bounce]="isAnimating" class="transition-all duration-300"></div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .frog-wrapper { position: relative; }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `]
})
export class FrogCharacterComponent implements OnChanges {
  @Input() phase: FrogPhase = 'tadpole';
  @Input() accessories: string[] = [];
  @Input() color: string = '#4ade80';
  @Input() isAnimating: boolean = false;
  @Input() isSleepy: boolean = false;
  @Input() size: number = 120;

  svgHtml: SafeHtml = '';

  constructor(private sanitizer: DomSanitizer) {}

  ngOnChanges() {
    this.svgHtml = this.sanitizer.bypassSecurityTrustHtml(this.buildSvg());
  }

  private get cx() { return this.size / 2; }
  private get cy() { return this.size / 2; }
  private get c() { return this.color; }

  private p(d: string) {
    return `<path d="${d}" fill="none" stroke="${this.c}" stroke-width="6" stroke-linecap="round"/>`;
  }
  private ellipse(rx: number, ry: number, cx = this.cx, cy = this.cy, fill = this.c) {
    return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}"/>`;
  }
  private circle(cx: number, cy: number, r: number, fill: string) {
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`;
  }

  private buildFrogBody(scale = 1): string {
    const { cx, cy, c } = this;
    const s = scale;
    // Helpers
    const el = (x: number, y: number, rx: number, ry: number, fill: string) =>
      `<ellipse cx="${cx + x * s}" cy="${cy + y * s}" rx="${rx * s}" ry="${ry * s}" fill="${fill}"/>`;
    const ci = (x: number, y: number, r: number, fill: string) =>
      `<circle cx="${cx + x * s}" cy="${cy + y * s}" r="${r * s}" fill="${fill}"/>`;
    const pa = (d: string, stroke = c, sw = 7) =>
      `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round"/>`;

    return `
      ${el(0, 5, 28, 24, c)}
      ${el(0, 9, 16, 13, 'rgba(255,255,255,0.4)')}
      ${el(0, -14, 18, 12, c)}
      ${el(-14, -20, 10, 10, 'white')}
      ${el(14, -20, 10, 10, 'white')}
      ${ci(-14, -20, 6, '#1e293b')}
      ${ci(14, -20, 6, '#1e293b')}
      ${ci(-11, -23, 2.5, 'white')}
      ${ci(17, -23, 2.5, 'white')}
      <path d="M${cx + -10 * s},${cy + 1 * s} Q${cx},${cy + 10 * s} ${cx + 10 * s},${cy + 1 * s}" fill="none" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round"/>
      ${ci(-5, -5, 2, 'rgba(0,0,0,0.2)')}
      ${ci(5, -5, 2, 'rgba(0,0,0,0.2)')}
      <path d="M${cx - 26 * s},${cy + 10 * s} Q${cx - 40 * s},${cy + 15 * s} ${cx - 36 * s},${cy + 28 * s}" fill="none" stroke="${c}" stroke-width="7" stroke-linecap="round"/>
      ${el(-36, 32, 6, 3.5, c)}
      <path d="M${cx + 26 * s},${cy + 10 * s} Q${cx + 40 * s},${cy + 15 * s} ${cx + 36 * s},${cy + 28 * s}" fill="none" stroke="${c}" stroke-width="7" stroke-linecap="round"/>
      ${el(36, 32, 6, 3.5, c)}
      <path d="M${cx - 20 * s},${cy + 26 * s} Q${cx - 36 * s},${cy + 38 * s} ${cx - 24 * s},${cy + 46 * s}" fill="none" stroke="${c}" stroke-width="7" stroke-linecap="round"/>
      ${el(-22, 49, 8, 3.5, c)}
      <path d="M${cx + 20 * s},${cy + 26 * s} Q${cx + 36 * s},${cy + 38 * s} ${cx + 24 * s},${cy + 46 * s}" fill="none" stroke="${c}" stroke-width="7" stroke-linecap="round"/>
      ${el(22, 49, 8, 3.5, c)}
    `;
  }

  private buildAccessories(): string {
    const { cx, cy, accessories } = this;
    let html = '';

    if (accessories.includes('hat_flower')) {
      html += `<circle cx="${cx}" cy="${cy - 30}" r="8" fill="#f472b6"/>
               <circle cx="${cx - 7}" cy="${cy - 30}" r="5" fill="#f9a8d4"/>
               <circle cx="${cx + 7}" cy="${cy - 30}" r="5" fill="#f9a8d4"/>`;
    }
    if (accessories.includes('hat_wizard')) {
      html += `<polygon points="${cx},${cy - 46} ${cx - 14},${cy - 24} ${cx + 14},${cy - 24}" fill="#4f46e5"/>
               <ellipse cx="${cx}" cy="${cy - 24}" rx="16" ry="5" fill="#6366f1"/>
               <text x="${cx}" y="${cy - 35}" text-anchor="middle" font-size="8">⭐</text>`;
    }
    if (accessories.includes('hat_crown')) {
      html += `<rect x="${cx - 14}" y="${cy - 36}" width="28" height="12" rx="2" fill="#f59e0b"/>
               <polygon points="${cx - 14},${cy - 36} ${cx - 10},${cy - 44} ${cx},${cy - 36}" fill="#f59e0b"/>
               <polygon points="${cx},${cy - 36} ${cx + 4},${cy - 46} ${cx + 14},${cy - 36}" fill="#f59e0b"/>
               <circle cx="${cx}" cy="${cy - 45}" r="3" fill="#ef4444"/>`;
    }
    if (accessories.includes('hat_basic')) {
      html += `<rect x="${cx - 18}" y="${cy - 32}" width="36" height="6" rx="3" fill="#1e293b"/>
               <rect x="${cx - 12}" y="${cy - 44}" width="24" height="14" rx="2" fill="#1e293b"/>`;
    }
    if (accessories.includes('hat_flower') && !accessories.includes('hat_wizard') && !accessories.includes('hat_crown')) {}
    
    if (accessories.includes('glasses_round')) {
      html += `<circle cx="${cx - 12}" cy="${cy - 18}" r="7" fill="none" stroke="#94a3b8" stroke-width="2"/>
               <circle cx="${cx + 12}" cy="${cy - 18}" r="7" fill="none" stroke="#94a3b8" stroke-width="2"/>
               <line x1="${cx - 5}" y1="${cy - 18}" x2="${cx + 5}" y2="${cy - 18}" stroke="#94a3b8" stroke-width="2"/>`;
    }
    if (accessories.includes('glasses_cool')) {
      html += `<rect x="${cx - 22}" y="${cy - 24}" width="18" height="10" rx="5" fill="#0f172a" opacity="0.85"/>
               <rect x="${cx + 4}" y="${cy - 24}" width="18" height="10" rx="5" fill="#0f172a" opacity="0.85"/>
               <line x1="${cx - 4}" y1="${cy - 19}" x2="${cx + 4}" y2="${cy - 19}" stroke="#94a3b8" stroke-width="1.5"/>`;
    }
    if (accessories.includes('bow_tie')) {
      html += `<polygon points="${cx},${cy - 2} ${cx - 10},${cy - 8} ${cx - 10},${cy + 4}" fill="#ef4444"/>
               <polygon points="${cx},${cy - 2} ${cx + 10},${cy - 8} ${cx + 10},${cy + 4}" fill="#ef4444"/>
               <circle cx="${cx}" cy="${cy - 2}" r="3" fill="#dc2626"/>`;
    }
    if (accessories.includes('scarf')) {
      html += `<rect x="${cx - 18}" y="${cy - 5}" width="36" height="8" rx="4" fill="#f97316" opacity="0.9"/>
               <rect x="${cx + 10}" y="${cy - 2}" width="8" height="18" rx="3" fill="#f97316" opacity="0.9"/>`;
    }
    if (accessories.includes('cape')) {
      html += `<path d="M${cx - 22},${cy} Q${cx - 14},${cy + 38} ${cx},${cy + 42} Q${cx + 14},${cy + 38} ${cx + 22},${cy}Z" fill="#7c3aed" opacity="0.85"/>`;
    }
    if (accessories.includes('eyes_hearts')) {
      html += `<text x="${cx - 16}" y="${cy - 14}" font-size="12" text-anchor="middle">❤️</text>
               <text x="${cx + 16}" y="${cy - 14}" font-size="12" text-anchor="middle">❤️</text>`;
    }
    if (this.isSleepy) {
      html += `<text x="${cx + 20}" y="${cy - 25}" font-size="10" fill="#94a3b8">z</text>
               <text x="${cx + 28}" y="${cy - 35}" font-size="14" fill="#94a3b8">z</text>
               <text x="${cx + 38}" y="${cy - 48}" font-size="18" fill="#94a3b8">Z</text>`;
    }
    return html;
  }

  private buildSvg(): string {
    const { cx, cy, c } = this;
    const size = this.size;
    let body = '';

    switch (this.phase) {
      case 'egg':
        body = `<ellipse cx="${cx}" cy="${cy + 5}" rx="22" ry="28" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="2"/>
                <ellipse cx="${cx}" cy="${cy - 5}" rx="12" ry="8" fill="rgba(99,102,241,0.15)"/>`;
        break;
      case 'tiny-tadpole':
        body = `<ellipse cx="${cx}" cy="${cy}" rx="16" ry="12" fill="${c}"/>
                <path d="M${cx + 16},${cy} Q${cx + 30},${cy + 8} ${cx + 28},${cy + 16}" fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round"/>`;
        break;
      case 'tadpole':
      case 'big-tadpole': {
        const sc = this.phase === 'big-tadpole' ? 1.15 : 1;
        body = `<g transform="scale(${sc}) translate(${cx * (1 - 1/sc)}, ${cy * (1 - 1/sc)})">
          <ellipse cx="${cx}" cy="${cy}" rx="20" ry="16" fill="${c}"/>
          <circle cx="${cx - 9}" cy="${cy - 10}" r="7" fill="white"/>
          <circle cx="${cx + 9}" cy="${cy - 10}" r="7" fill="white"/>
          <circle cx="${cx - 9}" cy="${cy - 10}" r="4" fill="#1e293b"/>
          <circle cx="${cx + 9}" cy="${cy - 10}" r="4" fill="#1e293b"/>
          <circle cx="${cx - 7}" cy="${cy - 12}" r="1.5" fill="white"/>
          <circle cx="${cx + 11}" cy="${cy - 12}" r="1.5" fill="white"/>
          <path d="M${cx + 20},${cy} Q${cx + 38},${cy + 10} ${cx + 34},${cy + 22}" fill="none" stroke="${c}" stroke-width="7" stroke-linecap="round"/>
          ${this.phase === 'big-tadpole' ? `
            <path d="M${cx + 14},${cy + 12} Q${cx + 20},${cy + 22} ${cx + 14},${cy + 28}" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round"/>
            <path d="M${cx - 14},${cy + 12} Q${cx - 20},${cy + 22} ${cx - 14},${cy + 28}" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round"/>` : ''}
        </g>`;
        break;
      }
      case 'tadpole-frog':
        body = `<ellipse cx="${cx}" cy="${cy + 2}" rx="22" ry="18" fill="${c}"/>
          <path d="M${cx + 22},${cy + 4} Q${cx + 32},${cy + 12} ${cx + 28},${cy + 20}" fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round"/>
          <circle cx="${cx - 10}" cy="${cy - 12}" r="8" fill="white"/>
          <circle cx="${cx + 10}" cy="${cy - 12}" r="8" fill="white"/>
          <circle cx="${cx - 10}" cy="${cy - 12}" r="5" fill="#1e293b"/>
          <circle cx="${cx + 10}" cy="${cy - 12}" r="5" fill="#1e293b"/>
          <path d="M${cx + 18},${cy + 14} Q${cx + 28},${cy + 24} ${cx + 22},${cy + 32}" fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round"/>
          <path d="M${cx - 18},${cy + 14} Q${cx - 28},${cy + 24} ${cx - 22},${cy + 32}" fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round"/>`;
        break;
      case 'froglet':
      case 'young-frog': {
        const ys = this.phase === 'young-frog' ? 1.1 : 1;
        body = `<g transform="scale(${ys}) translate(${cx * (1 - 1/ys)},${cy * (1 - 1/ys)})">
          <ellipse cx="${cx}" cy="${cy + 4}" rx="24" ry="20" fill="${c}"/>
          <ellipse cx="${cx}" cy="${cy + 8}" rx="14" ry="11" fill="rgba(255,255,255,0.35)"/>
          <circle cx="${cx - 12}" cy="${cy - 14}" r="9" fill="white"/>
          <circle cx="${cx + 12}" cy="${cy - 14}" r="9" fill="white"/>
          <circle cx="${cx - 12}" cy="${cy - 14}" r="5.5" fill="#1e293b"/>
          <circle cx="${cx + 12}" cy="${cy - 14}" r="5.5" fill="#1e293b"/>
          <circle cx="${cx - 10}" cy="${cy - 16}" r="2" fill="white"/>
          <circle cx="${cx + 14}" cy="${cy - 16}" r="2" fill="white"/>
          <path d="M${cx - 8},${cy + 4} Q${cx},${cy + 12} ${cx + 8},${cy + 4}" fill="none" stroke="#1e293b" stroke-width="2" stroke-linecap="round"/>
          <path d="M${cx - 22},${cy + 8} Q${cx - 34},${cy + 12} ${cx - 30},${cy + 22}" fill="none" stroke="${c}" stroke-width="6" stroke-linecap="round"/>
          <path d="M${cx + 22},${cy + 8} Q${cx + 34},${cy + 12} ${cx + 30},${cy + 22}" fill="none" stroke="${c}" stroke-width="6" stroke-linecap="round"/>
          <path d="M${cx - 16},${cy + 20} Q${cx - 28},${cy + 30} ${cx - 18},${cy + 38}" fill="none" stroke="${c}" stroke-width="6" stroke-linecap="round"/>
          <path d="M${cx + 16},${cy + 20} Q${cx + 28},${cy + 30} ${cx + 18},${cy + 38}" fill="none" stroke="${c}" stroke-width="6" stroke-linecap="round"/>
        </g>`;
        break;
      }
      default:
        // adult-frog, wise-frog, master-frog, legendary-frog, sensei-frog
        const opacity = this.phase === 'sensei-frog' ? ' opacity="0.9"' : '';
        body = `<g${opacity}>${this.buildFrogBody()}</g>`;
        if (this.phase === 'sensei-frog') {
          body += `<circle cx="${cx}" cy="${cy}" r="38" fill="none" stroke="rgba(251,191,36,0.4)" stroke-width="3"/>`;
        }
    }

    const accessories = this.buildAccessories();
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" class="drop-shadow-lg">
      ${body}
      ${accessories}
    </svg>`;
  }
}
