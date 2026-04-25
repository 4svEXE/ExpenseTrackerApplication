import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-frog-float-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Hidden on frog page itself -->
    <ng-container *ngIf="!isOnFrogPage">
      
      <!-- Half-peeking frog button -->
      <div class="frog-float-wrap" [class.expanded]="isExpanded()" [class.peeking]="!isExpanded()">
        
        <!-- The button body (slides in/out) -->
        <button
          class="frog-btn"
          (click)="handleClick()"
          (mouseenter)="expand()"
          aria-label="Відкрити жабу-тамагочі"
        >
          <!-- Frog SVG icon -->
          <div class="frog-icon-wrap">
            <svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" class="frog-svg">
              <!-- Body -->
              <ellipse cx="30" cy="36" rx="20" ry="17" fill="#4ade80"/>
              <!-- Belly -->
              <ellipse cx="30" cy="39" rx="12" ry="10" fill="rgba(255,255,255,0.35)"/>
              <!-- Head bump -->
              <ellipse cx="30" cy="22" rx="14" ry="10" fill="#4ade80"/>
              <!-- Left eye -->
              <ellipse cx="20" cy="16" rx="8" ry="8" fill="white"/>
              <circle cx="20" cy="16" r="5" fill="#1e293b"/>
              <circle cx="22" cy="14" r="2" fill="white"/>
              <!-- Right eye -->
              <ellipse cx="40" cy="16" rx="8" ry="8" fill="white"/>
              <circle cx="40" cy="16" r="5" fill="#1e293b"/>
              <circle cx="42" cy="14" r="2" fill="white"/>
              <!-- Smile -->
              <path d="M22 30 Q30 38 38 30" fill="none" stroke="#1e293b" stroke-width="2" stroke-linecap="round"/>
              <!-- Arms -->
              <path d="M12 38 Q4 42 6 50" fill="none" stroke="#4ade80" stroke-width="5" stroke-linecap="round"/>
              <path d="M48 38 Q56 42 54 50" fill="none" stroke="#4ade80" stroke-width="5" stroke-linecap="round"/>
            </svg>
          </div>

          <!-- Label (only visible when expanded) -->
          <span class="frog-label" *ngIf="isExpanded()">
            Мій ставок 🌿
          </span>
        </button>

        <!-- Peek tab (visible when collapsed — the half-shown part) -->
        <div class="frog-peek-tab" [class.hidden]="isExpanded()"></div>
      </div>
    </ng-container>
  `,
  styles: [`
    :host {
      display: block;
      position: fixed;
      bottom: 88px;
      right: 0;
      z-index: 900;
      pointer-events: none;
    }

    .frog-float-wrap {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      pointer-events: all;
      transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    /* Half-hidden state — slid to the right with only ~50% visible */
    .frog-float-wrap.peeking {
      transform: translateX(50%);
    }

    /* Fully expanded state */
    .frog-float-wrap.expanded {
      transform: translateX(0);
    }

    .frog-btn {
      display: flex;
      align-items: center;
      gap: 10px;
      background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
      border: 3px solid rgba(74, 222, 128, 0.5);
      border-radius: 9999px;
      padding: 10px 16px 10px 10px;
      cursor: pointer;
      box-shadow: -4px 4px 20px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(74,222,128,0.2);
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      white-space: nowrap;
      overflow: hidden;
    }

    .frog-btn:hover {
      box-shadow: -6px 6px 28px rgba(0, 0, 0, 0.35), 0 0 0 3px rgba(74,222,128,0.3);
    }

    .frog-btn:active {
      transform: scale(0.97);
    }

    .frog-icon-wrap {
      width: 44px;
      height: 44px;
      flex-shrink: 0;
      border-radius: 50%;
      background: rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.3s ease;
    }

    .frog-btn:hover .frog-icon-wrap {
      transform: scale(1.1) rotate(-5deg);
    }

    .frog-svg {
      width: 34px;
      height: 34px;
      filter: drop-shadow(0 2px 3px rgba(0,0,0,0.2));
    }

    .frog-label {
      color: white;
      font-weight: 900;
      font-size: 13px;
      letter-spacing: 0.03em;
      max-width: 110px;
      animation: fadeSlideIn 0.25s ease-out forwards;
    }

    @keyframes fadeSlideIn {
      from { opacity: 0; transform: translateX(8px); }
      to   { opacity: 1; transform: translateX(0); }
    }

    /* Tiny peeking tab affordance */
    .frog-peek-tab {
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 6px;
      height: 28px;
      background: rgba(74, 222, 128, 0.5);
      border-radius: 4px 0 0 4px;
    }

    .frog-peek-tab.hidden {
      opacity: 0;
    }
  `]
})
export class FrogFloatButtonComponent implements OnInit, OnDestroy {
  private router = inject(Router);

  isExpanded = signal(false);
  isOnFrogPage = false;

  private hideTimeout: any;
  private routerSub: any;

  ngOnInit() {
    // Track which page we're on
    this.routerSub = this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: any) => {
      const url = e.urlAfterRedirects || '';
      this.isOnFrogPage = url.includes('/frog') || 
                          url.includes('/wallets') || 
                          url.includes('/settings') || 
                          url.includes('/new-transaction');
    });

    // Auto-show briefly on first load after 2s then retract
    setTimeout(() => {
      this.expand(false);
      this.scheduleRetract(4000);
    }, 2000);
  }

  ngOnDestroy() {
    if (this.hideTimeout) clearTimeout(this.hideTimeout);
    if (this.routerSub) this.routerSub.unsubscribe();
  }

  expand(scheduleRetract = true) {
    if (this.hideTimeout) clearTimeout(this.hideTimeout);
    this.isExpanded.set(true);
    if (scheduleRetract) {
      this.scheduleRetract(3500);
    }
  }

  private scheduleRetract(ms: number) {
    this.hideTimeout = setTimeout(() => {
      this.isExpanded.set(false);
    }, ms);
  }

  handleClick() {
    if (!this.isExpanded()) {
      this.expand();
    } else {
      this.router.navigate(['/frog']);
    }
  }
}
