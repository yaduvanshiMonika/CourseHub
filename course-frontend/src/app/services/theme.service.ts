import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

/**
 * Global light/dark preference for public site + admin.
 * Persists under `coursehub-theme`; reads legacy `coursehub-admin-theme` once.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'coursehub-theme';
  private readonly legacyKey = 'coursehub-admin-theme';

  /** Emits whenever light mode toggles (including initial restore). */
  readonly light$ = new BehaviorSubject<boolean>(false);

  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    @Inject(DOCUMENT) private doc: Document
  ) {
    this.restore();
  }

  get isLight(): boolean {
    return this.light$.value;
  }

  toggle(): void {
    this.setLight(!this.isLight);
  }

  setLight(isLight: boolean): void {
    this.light$.next(isLight);
    this.applyToDocument();
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    try {
      localStorage.setItem(this.storageKey, isLight ? 'light' : 'dark');
    } catch {
      /* private mode */
    }
  }

  private restore(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.applyToDocument();
      return;
    }
    let mode: string | null = null;
    try {
      mode = localStorage.getItem(this.storageKey);
      if (mode == null) {
        const legacy = localStorage.getItem(this.legacyKey);
        if (legacy === 'light' || legacy === 'dark') {
          mode = legacy;
          localStorage.setItem(this.storageKey, legacy);
        }
      }
    } catch {
      mode = null;
    }
    this.light$.next(mode === 'light');
    this.applyToDocument();
  }

  private applyToDocument(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const root = this.doc.documentElement;
    const on = this.light$.value;
    root.classList.toggle('theme-light', on);
    root.classList.toggle('theme-dark', !on);
  }
}
